/**
 * Tests for src/hooks/useSocialFeedSocket.js
 * Covers WebSocket creation, query invalidation on new posts,
 * onNewPost callback, cleanup, and edge cases.
 */

var React = require('react');
var { renderHook, act } = require('@testing-library/react-native');
var { QueryClient, QueryClientProvider } = require('@tanstack/react-query');

// ─── Mock WebSocket service ──────────────────────────────────────
var mockWsClose = jest.fn();
var capturedWsOpts = null;

jest.mock('../services/websocket', function () {
  return {
    createWebSocket: jest.fn(function (path, opts) {
      capturedWsOpts = opts;
      return {
        send: jest.fn(),
        close: mockWsClose,
      };
    }),
  };
});

var useSocialFeedSocket = require('./useSocialFeedSocket');
var { createWebSocket } = require('../services/websocket');

var queryClient;

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function wrapper(props) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      props.children,
    );
  };
}

beforeEach(function () {
  jest.clearAllMocks();
  capturedWsOpts = null;
});

describe('useSocialFeedSocket', function () {
  describe('initialization', function () {
    it('creates WebSocket to /ws/social-feed/ when token provided', function () {
      renderHook(
        function () { return useSocialFeedSocket('my-token'); },
        { wrapper: createWrapper() },
      );

      expect(createWebSocket).toHaveBeenCalledWith(
        '/ws/social-feed/',
        expect.objectContaining({ token: 'my-token' }),
      );
    });

    it('does not create WebSocket when token is falsy', function () {
      renderHook(
        function () { return useSocialFeedSocket(null); },
        { wrapper: createWrapper() },
      );

      expect(createWebSocket).not.toHaveBeenCalled();
    });

    it('does not create WebSocket when token is empty string', function () {
      renderHook(
        function () { return useSocialFeedSocket(''); },
        { wrapper: createWrapper() },
      );

      expect(createWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('message handling', function () {
    it('invalidates social-posts-feed query on new_post event', function () {
      var wrapper = createWrapper();
      var invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(
        function () { return useSocialFeedSocket('tok'); },
        { wrapper: wrapper },
      );

      act(function () {
        capturedWsOpts.onMessage({ type: 'new_post', data: { id: 1 } });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['social-posts-feed'] });
    });

    it('invalidates social-posts-feed query on post_created event', function () {
      var wrapper = createWrapper();
      var invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(
        function () { return useSocialFeedSocket('tok'); },
        { wrapper: wrapper },
      );

      act(function () {
        capturedWsOpts.onMessage({ type: 'post_created', data: { id: 2 } });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['social-posts-feed'] });
    });

    it('calls onNewPost callback when provided', function () {
      var onNewPost = jest.fn();
      renderHook(
        function () { return useSocialFeedSocket('tok', { onNewPost: onNewPost }); },
        { wrapper: createWrapper() },
      );

      var data = { type: 'new_post', data: { id: 3, text: 'Hello' } };
      act(function () {
        capturedWsOpts.onMessage(data);
      });

      expect(onNewPost).toHaveBeenCalledWith(data);
    });

    it('does not call onNewPost for unrelated message types', function () {
      var onNewPost = jest.fn();
      renderHook(
        function () { return useSocialFeedSocket('tok', { onNewPost: onNewPost }); },
        { wrapper: createWrapper() },
      );

      act(function () {
        capturedWsOpts.onMessage({ type: 'like', postId: 1 });
      });

      expect(onNewPost).not.toHaveBeenCalled();
    });

    it('does not invalidate queries for unrelated message types', function () {
      var wrapper = createWrapper();
      var invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(
        function () { return useSocialFeedSocket('tok'); },
        { wrapper: wrapper },
      );

      act(function () {
        capturedWsOpts.onMessage({ type: 'comment', postId: 1 });
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('handles missing onNewPost callback gracefully', function () {
      renderHook(
        function () { return useSocialFeedSocket('tok'); },
        { wrapper: createWrapper() },
      );

      // Should not throw when onNewPost is not provided
      act(function () {
        capturedWsOpts.onMessage({ type: 'new_post', data: {} });
      });
    });
  });

  describe('cleanup', function () {
    it('closes WebSocket on unmount', function () {
      var { unmount } = renderHook(
        function () { return useSocialFeedSocket('tok'); },
        { wrapper: createWrapper() },
      );

      unmount();

      expect(mockWsClose).toHaveBeenCalled();
    });

    it('closes and recreates WebSocket when token changes', function () {
      var wrapper = createWrapper();
      var { rerender } = renderHook(
        function (props) { return useSocialFeedSocket(props.token); },
        { initialProps: { token: 'tok1' }, wrapper: wrapper },
      );

      expect(createWebSocket).toHaveBeenCalledTimes(1);

      rerender({ token: 'tok2' });

      expect(mockWsClose).toHaveBeenCalled();
      expect(createWebSocket).toHaveBeenCalledTimes(2);
    });
  });
});
