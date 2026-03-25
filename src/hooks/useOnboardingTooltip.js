/**
 * useOnboardingTooltip — Hook for managing first-visit tooltip visibility.
 * Uses AsyncStorage to persist which tooltips have been shown.
 */
var { useState, useEffect, useCallback } = require('react');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;

var STORAGE_PREFIX = 'onboarding_seen_';

var useOnboardingTooltip = function (id) {
  var [visible, setVisible] = useState(false);
  var [checked, setChecked] = useState(false);

  useEffect(function () {
    if (!id) return;

    var checkSeen = function () {
      AsyncStorage.getItem(STORAGE_PREFIX + id)
        .then(function (value) {
          if (value !== 'true') {
            setVisible(true);
          }
          setChecked(true);
        })
        .catch(function () {
          // On error, show tooltip anyway (first-time experience)
          setVisible(true);
          setChecked(true);
        });
    };

    checkSeen();
  }, [id]);

  var dismiss = useCallback(function () {
    setVisible(false);
    if (id) {
      AsyncStorage.setItem(STORAGE_PREFIX + id, 'true').catch(function () {
        // Silently ignore storage errors on dismiss
      });
    }
  }, [id]);

  var markSeen = useCallback(function () {
    setVisible(false);
    if (id) {
      AsyncStorage.setItem(STORAGE_PREFIX + id, 'true').catch(function () {
        // Silently ignore storage errors
      });
    }
  }, [id]);

  var reset = useCallback(function () {
    if (id) {
      AsyncStorage.removeItem(STORAGE_PREFIX + id).catch(function () {});
      setVisible(true);
    }
  }, [id]);

  return {
    visible: visible,
    checked: checked,
    dismiss: dismiss,
    markSeen: markSeen,
    reset: reset,
  };
};

/**
 * resetAllOnboardingTooltips — Utility to clear all onboarding tooltip state.
 * Useful for testing or when a user wants to re-see tooltips.
 */
var resetAllOnboardingTooltips = function () {
  return AsyncStorage.getAllKeys()
    .then(function (keys) {
      var onboardingKeys = keys.filter(function (k) {
        return k.indexOf(STORAGE_PREFIX) === 0;
      });
      if (onboardingKeys.length > 0) {
        return AsyncStorage.multiRemove(onboardingKeys);
      }
    })
    .catch(function () {});
};

module.exports = useOnboardingTooltip;
module.exports.resetAllOnboardingTooltips = resetAllOnboardingTooltips;
module.exports.STORAGE_PREFIX = STORAGE_PREFIX;
