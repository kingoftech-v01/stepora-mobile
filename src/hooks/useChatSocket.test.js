/**
 * Tests for src/hooks/useChatSocket.js
 * Covers WebSocket creation, connection state, message dispatch,
 * typing events, sendMessage, sendTyping, cleanup, and edge cases.
 */

var React = require('react');
var { renderHook, act } = require('@testing-library/react-native');

// ─── Mock WebSocket service ──────────────────────────────────────
var mockWsSend = jest.fn(function () { return true; });
var mockWsClose = jest.fn();
var capturedWsOpts = null;

jest.mock('../services/websocket', function () {
  return {
    createWebSocket: jest.fn(function (path, opts) {
      capturedWsOpts = opts;
      return {
        send: mockWsSend,
        close: mockWsClose,
      };
    }),
  };
});

var useChatSocket = require('./useChatSocket');
var { createWebSocket } = require('../services/websocket');

beforeEach(function () {
  jest.clearAllMocks();
  capturedWsOpts = null;
});

describe('useChatSocket', function () {
  describe('initialization', function () {
    it('creates WebSocket when path and token are provided', function () {
      renderHook(function () {
        return useChatSocket('/ws/chat/123/', 'my-token');
      });

      expect(createWebSocket).toHaveBeenCalledWith(
        '/ws/chat/123/',
        expect.objectContaining({ token: 'my-token' }),
      );
    });

    it('does not create WebSocket when token is empty', function () {
      renderHook(function () {
        return useChatSocket('/ws/chat/123/', '');
      });

      expect(createWebSocket).not.toHaveBeenCalled();
    });

    it('does not create WebSocket when path is empty', function () {
      renderHook(function () {
        return useChatSocket('', 'my-token');
      });

      expect(createWebSocket).not.toHaveBeenCalled();
    });

    it('does not create WebSocket when both are null', function () {
      renderHook(function () {
        return useChatSocket(null, null);
      });

      expect(createWebSocket).not.toHaveBeenCalled();
    });

    it('starts with connected = false', function () {
      var { result } = renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok');
      });

      // connected starts false; only true after onOpen
      expect(result.current.connected).toBe(false);
    });
  });

  describe('connection state', function () {
    it('sets connected to true on WebSocket open', function () {
      var { result } = renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok');
      });

      act(function () {
        capturedWsOpts.onOpen();
      });

      expect(result.current.connected).toBe(true);
    });

    it('sets connected to false on WebSocket close', function () {
      var { result } = renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok');
      });

      act(function () {
        capturedWsOpts.onOpen();
      });
      expect(result.current.connected).toBe(true);

      act(function () {
        capturedWsOpts.onClose();
      });
      expect(result.current.connected).toBe(false);
    });
  });

  describe('message handling', function () {
    it('calls onMessage callback for chat_message type', function () {
      var onMessage = jest.fn();
      renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok', { onMessage: onMessage });
      });

      var data = { type: 'chat_message', content: 'Hello' };
      act(function () {
        capturedWsOpts.onMessage(data);
      });

      expect(onMessage).toHaveBeenCalledWith(data);
    });

    it('calls onMessage callback for message type', function () {
      var onMessage = jest.fn();
      renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok', { onMessage: onMessage });
      });

      var data = { type: 'message', content: 'Hi' };
      act(function () {
        capturedWsOpts.onMessage(data);
      });

      expect(onMessage).toHaveBeenCalledWith(data);
    });

    it('calls onTyping callback for typing events', function () {
      var onTyping = jest.fn();
      renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok', { onTyping: onTyping });
      });

      var data = { type: 'typing', userId: 42 };
      act(function () {
        capturedWsOpts.onMessage(data);
      });

      expect(onTyping).toHaveBeenCalledWith(data);
    });

    it('ignores unknown message types', function () {
      var onMessage = jest.fn();
      var onTyping = jest.fn();
      renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok', { onMessage: onMessage, onTyping: onTyping });
      });

      act(function () {
        capturedWsOpts.onMessage({ type: 'presence_update', userId: 1 });
      });

      expect(onMessage).not.toHaveBeenCalled();
      expect(onTyping).not.toHaveBeenCalled();
    });

    it('handles null data gracefully', function () {
      var onMessage = jest.fn();
      renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok', { onMessage: onMessage });
      });

      act(function () {
        capturedWsOpts.onMessage(null);
      });

      expect(onMessage).not.toHaveBeenCalled();
    });

    it('handles missing callbacks gracefully', function () {
      renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok');
      });

      // Should not throw when no callbacks provided
      act(function () {
        capturedWsOpts.onMessage({ type: 'chat_message', content: 'test' });
        capturedWsOpts.onMessage({ type: 'typing' });
      });
    });
  });

  describe('sendMessage', function () {
    it('sends chat_message with content via WebSocket', function () {
      var { result } = renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok');
      });

      result.current.sendMessage('Hello world');

      expect(mockWsSend).toHaveBeenCalledWith({
        type: 'chat_message',
        content: 'Hello world',
      });
    });

    it('returns false when WebSocket is not connected', function () {
      var { result } = renderHook(function () {
        return useChatSocket(null, null);
      });

      var sent = result.current.sendMessage('test');
      expect(sent).toBe(false);
    });
  });

  describe('sendTyping', function () {
    it('sends typing event via WebSocket', function () {
      var { result } = renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok');
      });

      result.current.sendTyping();

      expect(mockWsSend).toHaveBeenCalledWith({ type: 'typing' });
    });

    it('does nothing when WebSocket is not connected', function () {
      var { result } = renderHook(function () {
        return useChatSocket(null, null);
      });

      result.current.sendTyping();

      expect(mockWsSend).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', function () {
    it('closes WebSocket on unmount', function () {
      var { unmount } = renderHook(function () {
        return useChatSocket('/ws/chat/1/', 'tok');
      });

      unmount();

      expect(mockWsClose).toHaveBeenCalled();
    });

    it('closes and recreates WebSocket when path changes', function () {
      var { rerender } = renderHook(
        function (props) {
          return useChatSocket(props.path, props.token);
        },
        { initialProps: { path: '/ws/chat/1/', token: 'tok' } },
      );

      expect(createWebSocket).toHaveBeenCalledTimes(1);

      rerender({ path: '/ws/chat/2/', token: 'tok' });

      expect(mockWsClose).toHaveBeenCalled();
      expect(createWebSocket).toHaveBeenCalledTimes(2);
      expect(createWebSocket).toHaveBeenLastCalledWith(
        '/ws/chat/2/',
        expect.any(Object),
      );
    });

    it('closes and recreates WebSocket when token changes', function () {
      var { rerender } = renderHook(
        function (props) {
          return useChatSocket(props.path, props.token);
        },
        { initialProps: { path: '/ws/chat/1/', token: 'tok1' } },
      );

      rerender({ path: '/ws/chat/1/', token: 'tok2' });

      expect(mockWsClose).toHaveBeenCalled();
      expect(createWebSocket).toHaveBeenCalledTimes(2);
    });
  });
});
