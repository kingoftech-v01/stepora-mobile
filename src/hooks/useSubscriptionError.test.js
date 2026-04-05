/**
 * Tests for src/hooks/useSubscriptionError.js
 * Covers initial state, subscription_required event handling,
 * message composition, dismiss behavior, and edge cases.
 */

var React = require('react');
var { renderHook, act } = require('@testing-library/react-native');

// ─── Mock API addAuthEventListener ───────────────────────────────
var capturedListener = null;
var mockUnsubscribe = jest.fn();

jest.mock('../services/api', function () {
  return {
    addAuthEventListener: jest.fn(function (listener) {
      capturedListener = listener;
      return mockUnsubscribe;
    }),
  };
});

var useSubscriptionError = require('./useSubscriptionError');
var { addAuthEventListener } = require('../services/api');

beforeEach(function () {
  jest.clearAllMocks();
  capturedListener = null;
});

describe('useSubscriptionError', function () {
  describe('initial state', function () {
    it('starts with active = false', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      expect(result.current.active).toBe(false);
    });

    it('starts with empty requiredTier', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      expect(result.current.requiredTier).toBe('');
    });

    it('starts with empty featureName', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      expect(result.current.featureName).toBe('');
    });

    it('starts with empty message', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      expect(result.current.message).toBe('');
    });

    it('provides a dismiss function', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      expect(typeof result.current.dismiss).toBe('function');
    });
  });

  describe('event listener registration', function () {
    it('registers an auth event listener on mount', function () {
      renderHook(function () {
        return useSubscriptionError();
      });

      expect(addAuthEventListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('returns unsubscribe function for cleanup', function () {
      var { unmount } = renderHook(function () {
        return useSubscriptionError();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('subscription_required event', function () {
    it('activates error state when subscription_required received', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      act(function () {
        capturedListener({
          type: 'subscription_required',
          detail: { requiredTier: 'premium', featureName: 'AI Coaching' },
        });
      });

      expect(result.current.active).toBe(true);
      expect(result.current.requiredTier).toBe('premium');
      expect(result.current.featureName).toBe('AI Coaching');
    });

    it('composes message with feature name', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      act(function () {
        capturedListener({
          type: 'subscription_required',
          detail: { requiredTier: 'pro', featureName: 'Video Calls' },
        });
      });

      expect(result.current.message).toBe('Video Calls requires a Pro subscription.');
    });

    it('composes generic message when featureName is missing', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      act(function () {
        capturedListener({
          type: 'subscription_required',
          detail: { requiredTier: 'premium' },
        });
      });

      expect(result.current.message).toBe('This feature requires a Premium subscription.');
    });

    it('capitalizes tier name in message', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      act(function () {
        capturedListener({
          type: 'subscription_required',
          detail: { requiredTier: 'pro', featureName: '' },
        });
      });

      expect(result.current.message).toContain('Pro');
    });

    it('defaults requiredTier to premium when missing', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      act(function () {
        capturedListener({
          type: 'subscription_required',
          detail: {},
        });
      });

      expect(result.current.requiredTier).toBe('premium');
      expect(result.current.message).toContain('Premium');
    });

    it('handles missing detail object', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      act(function () {
        capturedListener({
          type: 'subscription_required',
        });
      });

      expect(result.current.active).toBe(true);
      expect(result.current.requiredTier).toBe('premium');
      expect(result.current.featureName).toBe('');
    });
  });

  describe('ignoring other events', function () {
    it('does not activate on session_expired events', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      act(function () {
        capturedListener({ type: 'session_expired' });
      });

      expect(result.current.active).toBe(false);
    });

    it('does not activate on unknown event types', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      act(function () {
        capturedListener({ type: 'some_other_event', detail: {} });
      });

      expect(result.current.active).toBe(false);
    });
  });

  describe('dismiss', function () {
    it('resets all state to initial values', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      // Activate
      act(function () {
        capturedListener({
          type: 'subscription_required',
          detail: { requiredTier: 'pro', featureName: 'AI Coach' },
        });
      });

      expect(result.current.active).toBe(true);

      // Dismiss
      act(function () {
        result.current.dismiss();
      });

      expect(result.current.active).toBe(false);
      expect(result.current.requiredTier).toBe('');
      expect(result.current.featureName).toBe('');
      expect(result.current.message).toBe('');
    });

    it('can be activated again after dismiss', function () {
      var { result } = renderHook(function () {
        return useSubscriptionError();
      });

      // Activate, dismiss, re-activate
      act(function () {
        capturedListener({
          type: 'subscription_required',
          detail: { requiredTier: 'premium', featureName: 'Feature A' },
        });
      });
      act(function () {
        result.current.dismiss();
      });
      act(function () {
        capturedListener({
          type: 'subscription_required',
          detail: { requiredTier: 'pro', featureName: 'Feature B' },
        });
      });

      expect(result.current.active).toBe(true);
      expect(result.current.featureName).toBe('Feature B');
      expect(result.current.requiredTier).toBe('pro');
    });
  });
});
