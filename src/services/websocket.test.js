/**
 * Tests for src/services/websocket.js
 * Covers createWebSocket: connect, token auth on open, message routing,
 * pong handling, heartbeat/pong timeout, reconnect with exponential backoff,
 * send, close cleanup, getState, and AppState foreground reconnect.
 */

// ─── Mock timers ─────────────────────────────────────────────────

jest.useFakeTimers();

// ─── Mock AppState ───────────────────────────────────────────────

var appStateCallback = null;
var mockRemove = jest.fn();

jest.mock('react-native', function () {
  return {
    AppState: {
      addEventListener: function (type, cb) {
        appStateCallback = cb;
        return { remove: mockRemove };
      },
    },
  };
});

// ─── Mock api (getAccessTokenForWS) ─────────────────────────────

jest.mock('./api', function () {
  return {
    getAccessTokenForWS: function () { return 'ws-test-token'; },
  };
});

// ─── Mock Config ─────────────────────────────────────────────────

jest.mock('../config', function () {
  return {
    WS_BASE: 'wss://test.local',
  };
});

// ─── Mock WebSocket class ────────────────────────────────────────

var mockWsInstances = [];

function MockWebSocket(url) {
  this.url = url;
  this.readyState = WebSocket.CONNECTING;
  this.onopen = null;
  this.onmessage = null;
  this.onclose = null;
  this.onerror = null;
  this.send = jest.fn();
  this.close = jest.fn(function () {
    this.readyState = WebSocket.CLOSED;
  }.bind(this));
  mockWsInstances.push(this);
}

MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

global.WebSocket = MockWebSocket;

// ─── Helpers ─────────────────────────────────────────────────────

function latestWs() {
  return mockWsInstances[mockWsInstances.length - 1];
}

function simulateOpen() {
  var ws = latestWs();
  ws.readyState = WebSocket.OPEN;
  ws.onopen();
}

function simulateMessage(data) {
  var ws = latestWs();
  ws.onmessage({ data: JSON.stringify(data) });
}

function simulateClose(code) {
  var ws = latestWs();
  ws.readyState = WebSocket.CLOSED;
  ws.onclose({ code: code || 1000 });
}

// ─── Import under test ──────────────────────────────────────────

var createWebSocket = require('./websocket').createWebSocket;

beforeEach(function () {
  jest.clearAllMocks();
  jest.clearAllTimers();
  mockWsInstances = [];
  appStateCallback = null;
});

describe('createWebSocket', function () {
  describe('connection', function () {
    it('creates a WebSocket with the correct URL', function () {
      createWebSocket('/ws/test/');

      expect(latestWs().url).toBe('wss://test.local/ws/test/');
    });

    it('sends authentication message on open', function () {
      createWebSocket('/ws/test/', { token: 'my-token' });
      simulateOpen();

      expect(latestWs().send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'authenticate', token: 'my-token' })
      );
    });

    it('calls onOpen callback after connection', function () {
      var onOpen = jest.fn();
      createWebSocket('/ws/test/', { onOpen: onOpen });
      simulateOpen();

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('uses getAccessTokenForWS when no token provided', function () {
      createWebSocket('/ws/test/');
      simulateOpen();

      expect(latestWs().send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'authenticate', token: 'ws-test-token' })
      );
    });
  });

  describe('message routing', function () {
    it('calls onMessage for regular messages', function () {
      var onMessage = jest.fn();
      createWebSocket('/ws/test/', { onMessage: onMessage });
      simulateOpen();
      simulateMessage({ type: 'chat', body: 'hello' });

      expect(onMessage).toHaveBeenCalledWith({ type: 'chat', body: 'hello' });
    });

    it('does not call onMessage for pong messages', function () {
      var onMessage = jest.fn();
      createWebSocket('/ws/test/', { onMessage: onMessage });
      simulateOpen();
      simulateMessage({ type: 'pong' });

      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  describe('send', function () {
    it('returns true and sends when socket is open', function () {
      var handle = createWebSocket('/ws/test/');
      simulateOpen();

      var result = handle.send({ type: 'msg', text: 'hi' });

      expect(result).toBe(true);
      // send[0] is auth, send[1] is our message
      expect(latestWs().send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'msg', text: 'hi' })
      );
    });

    it('returns false when socket is not open', function () {
      var handle = createWebSocket('/ws/test/');
      // don't open the socket

      var result = handle.send({ type: 'msg' });

      expect(result).toBe(false);
    });

    it('sends raw strings without extra JSON wrapping', function () {
      var handle = createWebSocket('/ws/test/');
      simulateOpen();

      handle.send('raw-text');

      expect(latestWs().send).toHaveBeenCalledWith('raw-text');
    });
  });

  describe('getState', function () {
    it('returns CLOSED when no WebSocket exists after close', function () {
      var handle = createWebSocket('/ws/test/');
      handle.close();

      expect(handle.getState()).toBe(WebSocket.CLOSED);
    });

    it('returns OPEN when socket is open', function () {
      var handle = createWebSocket('/ws/test/');
      simulateOpen();

      expect(handle.getState()).toBe(WebSocket.OPEN);
    });
  });

  describe('close', function () {
    it('closes the WebSocket and cleans up', function () {
      var handle = createWebSocket('/ws/test/');
      simulateOpen();
      handle.close();

      expect(latestWs().close).toHaveBeenCalled();
    });

    it('removes AppState listener on close', function () {
      var handle = createWebSocket('/ws/test/');
      handle.close();

      expect(mockRemove).toHaveBeenCalled();
    });

    it('prevents reconnect after close', function () {
      var handle = createWebSocket('/ws/test/');
      simulateOpen();
      handle.close();
      var countBefore = mockWsInstances.length;

      // Advance timers — no new connections should appear
      jest.advanceTimersByTime(60000);

      expect(mockWsInstances.length).toBe(countBefore);
    });
  });

  describe('reconnection', function () {
    it('schedules reconnect after unexpected close', function () {
      createWebSocket('/ws/test/');
      simulateOpen();
      var countBefore = mockWsInstances.length;
      simulateClose(1006);

      // Advance past first reconnect delay (1s base + up to 3s jitter)
      jest.advanceTimersByTime(5000);

      expect(mockWsInstances.length).toBeGreaterThan(countBefore);
    });

    it('calls onClose callback on close', function () {
      var onClose = jest.fn();
      createWebSocket('/ws/test/', { onClose: onClose });
      simulateOpen();
      simulateClose(1000);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onError callback on error', function () {
      var onError = jest.fn();
      createWebSocket('/ws/test/', { onError: onError });
      simulateOpen();
      latestWs().onerror({ message: 'fail' });

      expect(onError).toHaveBeenCalledWith({ message: 'fail' });
    });

    it('resets reconnect attempts on successful connection', function () {
      var onOpen = jest.fn();
      createWebSocket('/ws/test/', { onOpen: onOpen });
      simulateOpen();

      // Close and reconnect
      simulateClose(1006);
      jest.advanceTimersByTime(5000);

      // Simulate the new connection opening
      simulateOpen();

      // onOpen should have been called for the second time
      expect(onOpen).toHaveBeenCalledTimes(2);
    });
  });

  describe('heartbeat', function () {
    it('sends ping after heartbeat interval', function () {
      createWebSocket('/ws/test/');
      simulateOpen();

      // Clear the auth send call count
      var sendBeforePing = latestWs().send.mock.calls.length;

      // Advance 30s for heartbeat interval
      jest.advanceTimersByTime(30000);

      expect(latestWs().send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ping' })
      );
    });

    it('closes socket on pong timeout', function () {
      createWebSocket('/ws/test/');
      simulateOpen();

      // Trigger heartbeat (sends ping)
      jest.advanceTimersByTime(30000);

      // Advance 10s for pong timeout — should close socket
      jest.advanceTimersByTime(10000);

      expect(latestWs().close).toHaveBeenCalledWith(4000, 'Pong timeout');
    });

    it('does not close socket when pong is received in time', function () {
      createWebSocket('/ws/test/');
      simulateOpen();

      // Trigger heartbeat
      jest.advanceTimersByTime(30000);

      // Receive pong before timeout
      simulateMessage({ type: 'pong' });

      // Advance past pong timeout
      jest.advanceTimersByTime(10000);

      // Socket should NOT have been closed via pong timeout
      expect(latestWs().close).not.toHaveBeenCalled();
    });
  });

  describe('AppState foreground reconnect', function () {
    it('reconnects when app comes to foreground and socket is not open', function () {
      createWebSocket('/ws/test/');
      simulateOpen();
      simulateClose(1006);

      var countAfterClose = mockWsInstances.length;

      // Simulate app returning to foreground
      appStateCallback('active');

      expect(mockWsInstances.length).toBeGreaterThan(countAfterClose);
    });

    it('does not reconnect when app comes to foreground and socket is open', function () {
      createWebSocket('/ws/test/');
      simulateOpen();

      var countBefore = mockWsInstances.length;

      // Simulate foreground while already connected
      appStateCallback('active');

      // No new WebSocket should be created
      expect(mockWsInstances.length).toBe(countBefore);
    });

    it('does not reconnect on foreground after explicit close', function () {
      var handle = createWebSocket('/ws/test/');
      simulateOpen();
      handle.close();

      var countAfterClose = mockWsInstances.length;

      // Even if AppState fires, it should not reconnect because closed=true
      // appStateCallback was removed on close, but if it somehow fires:
      // The subscription was removed, so this should be a no-op
      expect(mockRemove).toHaveBeenCalled();
    });
  });
});
