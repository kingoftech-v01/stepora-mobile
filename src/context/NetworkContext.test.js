/**
 * Tests for src/context/NetworkContext.jsx
 * Covers provider rendering, online/offline detection, queue count updates,
 * offline queue flush on reconnect, AppState foreground checks, and cleanup.
 */

var React = require('react');
var { renderHook, act, waitFor } = require('@testing-library/react-native');

// ─── Mocks ───────────────────────────────────────────────────────

var mockFlushOfflineQueue = jest.fn(function () { return Promise.resolve(); });
var mockGetOfflineQueueCount = jest.fn(function () { return Promise.resolve(0); });

jest.mock('../services/api', function () {
  return {
    flushOfflineQueue: function () { return mockFlushOfflineQueue.apply(null, arguments); },
    getOfflineQueueCount: function () { return mockGetOfflineQueueCount.apply(null, arguments); },
  };
});

jest.mock('../config', function () {
  return {
    __esModule: true,
    default: { API_BASE: 'https://test-api.example.com', WS_BASE: 'wss://test-api.example.com' },
  };
});

// Capture AppState listener
var mockAppStateListeners = [];
var mockAppStateRemove = jest.fn();
jest.mock('react-native', function () {
  return {
    AppState: {
      addEventListener: jest.fn(function (type, handler) {
        mockAppStateListeners.push(handler);
        return { remove: mockAppStateRemove };
      }),
    },
  };
});

var { NetworkProvider, useNetwork } = require('./NetworkContext');

function wrapper(props) {
  return React.createElement(NetworkProvider, null, props.children);
}

beforeEach(function () {
  jest.clearAllMocks();
  mockAppStateListeners = [];
  fetch.resetMocks();
  mockGetOfflineQueueCount.mockImplementation(function () { return Promise.resolve(0); });
  mockFlushOfflineQueue.mockImplementation(function () { return Promise.resolve(); });
});

describe('NetworkContext', function () {
  describe('provider and hook', function () {
    it('renders children and provides default context values', function () {
      // Using useNetwork without a provider should return the default context value
      var { result } = renderHook(function () { return useNetwork(); });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.queueCount).toBe(0);
    });

    it('provider provides isOnline and queueCount', async function () {
      fetch.mockResponse('');

      var { result } = renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current).toBeDefined();
      });

      expect(typeof result.current.isOnline).toBe('boolean');
      expect(typeof result.current.queueCount).toBe('number');
    });
  });

  describe('connectivity checks', function () {
    it('sets isOnline to true when fetch succeeds', async function () {
      fetch.mockResponse('');

      var { result } = renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isOnline).toBe(true);
      });
    });

    it('sets isOnline to false when fetch fails', async function () {
      fetch.mockReject(new Error('Network error'));

      var { result } = renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('sends HEAD request to health endpoint', async function () {
      fetch.mockResponse('');

      renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(fetch).toHaveBeenCalled();
      });

      expect(fetch.mock.calls[0][0]).toBe('https://test-api.example.com/api/health/');
      expect(fetch.mock.calls[0][1].method).toBe('HEAD');
    });

    it('uses no-store cache for connectivity check', async function () {
      fetch.mockResponse('');

      renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(fetch).toHaveBeenCalled();
      });

      expect(fetch.mock.calls[0][1].cache).toBe('no-store');
    });
  });

  describe('queue count', function () {
    it('updates queue count from getOfflineQueueCount', async function () {
      fetch.mockResponse('');
      mockGetOfflineQueueCount.mockImplementation(function () { return Promise.resolve(5); });

      var { result } = renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.queueCount).toBe(5);
      });
    });

    it('handles getOfflineQueueCount errors gracefully', async function () {
      fetch.mockResponse('');
      mockGetOfflineQueueCount.mockImplementation(function () {
        return Promise.reject(new Error('Storage error'));
      });

      var { result } = renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      // Should not crash; queueCount stays at 0
      await waitFor(function () {
        expect(result.current.isOnline).toBe(true);
      });

      expect(result.current.queueCount).toBe(0);
    });
  });

  describe('offline queue flush on reconnect', function () {
    it('flushes offline queue when transitioning from offline to online', async function () {
      // Start offline
      fetch.mockReject(new Error('Network error'));

      var { result } = renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isOnline).toBe(false);
      });

      // Now come back online
      fetch.mockResponse('');
      mockFlushOfflineQueue.mockClear();

      // Trigger an AppState active event to trigger a new check
      await act(async function () {
        mockAppStateListeners.forEach(function (listener) { listener('active'); });
        // Wait for promises to resolve
        await new Promise(function (resolve) { setTimeout(resolve, 100); });
      });

      await waitFor(function () {
        expect(result.current.isOnline).toBe(true);
      });

      expect(mockFlushOfflineQueue).toHaveBeenCalled();
    });

    it('does not flush when staying online', async function () {
      fetch.mockResponse('');

      renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(fetch).toHaveBeenCalled();
      });

      mockFlushOfflineQueue.mockClear();

      // Trigger another check while online
      await act(async function () {
        mockAppStateListeners.forEach(function (listener) { listener('active'); });
        await new Promise(function (resolve) { setTimeout(resolve, 100); });
      });

      // flushOfflineQueue should NOT be called since we were never offline
      expect(mockFlushOfflineQueue).not.toHaveBeenCalled();
    });
  });

  describe('AppState listener', function () {
    it('registers AppState change listener on mount', async function () {
      fetch.mockResponse('');
      var { AppState } = require('react-native');

      renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      });
    });

    it('checks connectivity when app becomes active', async function () {
      fetch.mockResponse('');

      renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(fetch).toHaveBeenCalled();
      });

      var callCountBefore = fetch.mock.calls.length;

      await act(async function () {
        mockAppStateListeners.forEach(function (listener) { listener('active'); });
        await new Promise(function (resolve) { setTimeout(resolve, 100); });
      });

      expect(fetch.mock.calls.length).toBeGreaterThan(callCountBefore);
    });

    it('does not check connectivity when app goes to background', async function () {
      fetch.mockResponse('');

      renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(fetch).toHaveBeenCalled();
      });

      var callCountBefore = fetch.mock.calls.length;

      act(function () {
        mockAppStateListeners.forEach(function (listener) { listener('background'); });
      });

      // Should not have made additional fetch calls for 'background' state
      expect(fetch.mock.calls.length).toBe(callCountBefore);
    });
  });

  describe('cleanup', function () {
    it('removes AppState listener on unmount', async function () {
      fetch.mockResponse('');

      var { unmount } = renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(fetch).toHaveBeenCalled();
      });

      unmount();

      expect(mockAppStateRemove).toHaveBeenCalled();
    });

    it('clears interval on unmount', async function () {
      fetch.mockResponse('');
      var clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      var { unmount } = renderHook(function () { return useNetwork(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(fetch).toHaveBeenCalled();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});
