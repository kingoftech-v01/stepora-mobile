/**
 * Stepora Mobile — Splash Screen Service
 * Wraps react-native-splash-screen for controlled dismissal.
 *
 * The splash screen stays visible until:
 * 1. Token check completes
 * 2. Initial navigation is resolved
 * 3. First screen is rendered
 */

var _splashScreen = null;

var getSplashScreen = function () {
  if (!_splashScreen) {
    try {
      _splashScreen = require('react-native-splash-screen').default;
    } catch (e) {
      console.warn('[Splash] react-native-splash-screen not installed');
      return null;
    }
  }
  return _splashScreen;
};

/**
 * Hide the splash screen.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
var _hidden = false;

var hideSplash = function () {
  if (_hidden) return;
  _hidden = true;

  var splash = getSplashScreen();
  if (splash) {
    try {
      splash.hide();
    } catch (e) {
      console.warn('[Splash] Failed to hide:', e);
    }
  }
};

/**
 * Show the splash screen (used when locking the app for biometric auth).
 */
var showSplash = function () {
  _hidden = false;
  var splash = getSplashScreen();
  if (splash) {
    try {
      splash.show();
    } catch (e) {
      console.warn('[Splash] Failed to show:', e);
    }
  }
};

module.exports = {
  hideSplash: hideSplash,
  showSplash: showSplash,
};
