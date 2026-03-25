/**
 * Tests for src/hooks/useOnboardingTooltip.js
 * Validates AsyncStorage persistence, visibility state, dismiss/reset behavior.
 */

var React = require('react');
var { renderHook, act, waitFor } = require('@testing-library/react-native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var useOnboardingTooltip = require('./useOnboardingTooltip');
var { resetAllOnboardingTooltips, STORAGE_PREFIX } = require('./useOnboardingTooltip');

beforeEach(function () {
  AsyncStorage._reset();
  jest.clearAllMocks();
});

describe('useOnboardingTooltip', function () {
  describe('initial state', function () {
    it('shows tooltip for unseen ID', async function () {
      AsyncStorage.getItem.mockResolvedValue(null);

      var { result } = renderHook(function () {
        return useOnboardingTooltip('test_tooltip');
      });

      await waitFor(function () {
        expect(result.current.checked).toBe(true);
      });

      expect(result.current.visible).toBe(true);
    });

    it('hides tooltip for previously seen ID', async function () {
      AsyncStorage.getItem.mockResolvedValue('true');

      var { result } = renderHook(function () {
        return useOnboardingTooltip('test_tooltip');
      });

      await waitFor(function () {
        expect(result.current.checked).toBe(true);
      });

      expect(result.current.visible).toBe(false);
    });

    it('does not check storage when id is falsy', function () {
      var { result } = renderHook(function () {
        return useOnboardingTooltip(null);
      });

      expect(result.current.visible).toBe(false);
      expect(result.current.checked).toBe(false);
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('shows tooltip on storage error (fail-open)', async function () {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage crash'));

      var { result } = renderHook(function () {
        return useOnboardingTooltip('test_tooltip');
      });

      await waitFor(function () {
        expect(result.current.checked).toBe(true);
      });

      expect(result.current.visible).toBe(true);
    });
  });

  describe('dismiss', function () {
    it('sets visible to false and persists to storage', async function () {
      AsyncStorage.getItem.mockResolvedValue(null);

      var { result } = renderHook(function () {
        return useOnboardingTooltip('dismiss_test');
      });

      await waitFor(function () {
        expect(result.current.visible).toBe(true);
      });

      act(function () {
        result.current.dismiss();
      });

      expect(result.current.visible).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_PREFIX + 'dismiss_test',
        'true',
      );
    });

    it('does not call setItem when id is falsy', async function () {
      var { result } = renderHook(function () {
        return useOnboardingTooltip(null);
      });

      act(function () {
        result.current.dismiss();
      });

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('markSeen', function () {
    it('behaves same as dismiss: hides and persists', async function () {
      AsyncStorage.getItem.mockResolvedValue(null);

      var { result } = renderHook(function () {
        return useOnboardingTooltip('mark_test');
      });

      await waitFor(function () {
        expect(result.current.visible).toBe(true);
      });

      act(function () {
        result.current.markSeen();
      });

      expect(result.current.visible).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_PREFIX + 'mark_test',
        'true',
      );
    });
  });

  describe('reset', function () {
    it('removes storage key and sets visible back to true', async function () {
      AsyncStorage.getItem.mockResolvedValue('true');

      var { result } = renderHook(function () {
        return useOnboardingTooltip('reset_test');
      });

      await waitFor(function () {
        expect(result.current.checked).toBe(true);
      });

      expect(result.current.visible).toBe(false);

      act(function () {
        result.current.reset();
      });

      expect(result.current.visible).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        STORAGE_PREFIX + 'reset_test',
      );
    });

    it('does nothing when id is falsy', function () {
      var { result } = renderHook(function () {
        return useOnboardingTooltip(null);
      });

      act(function () {
        result.current.reset();
      });

      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('storage key format', function () {
    it('uses the correct prefix', function () {
      expect(STORAGE_PREFIX).toBe('onboarding_seen_');
    });

    it('reads the correctly prefixed key', async function () {
      AsyncStorage.getItem.mockResolvedValue(null);

      renderHook(function () {
        return useOnboardingTooltip('my_tooltip');
      });

      await waitFor(function () {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('onboarding_seen_my_tooltip');
      });
    });
  });
});

describe('resetAllOnboardingTooltips', function () {
  it('removes only onboarding keys from storage', async function () {
    AsyncStorage.getAllKeys.mockResolvedValue([
      'onboarding_seen_tip1',
      'onboarding_seen_tip2',
      'dp-access-token',
      'other-key',
    ]);

    await resetAllOnboardingTooltips();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      'onboarding_seen_tip1',
      'onboarding_seen_tip2',
    ]);
  });

  it('handles empty keys gracefully', async function () {
    AsyncStorage.getAllKeys.mockResolvedValue([]);

    await resetAllOnboardingTooltips();

    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
  });

  it('handles storage errors gracefully', async function () {
    AsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'));

    // Should not throw
    await resetAllOnboardingTooltips();
  });
});
