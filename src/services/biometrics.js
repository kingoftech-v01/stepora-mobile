/**
 * Stepora Mobile — Biometric Authentication Service
 * Wraps react-native-biometrics for fingerprint/face unlock.
 *
 * Use cases:
 * - App lock (require biometric on app open)
 * - Confirm sensitive actions (delete account, change password)
 * - Quick login (biometric + stored refresh token)
 */
var AsyncStorage = require('@react-native-async-storage/async-storage').default;

var _biometrics = null;

var BIOMETRIC_KEYS = {
  ENABLED: 'dp-biometric-enabled',
  APP_LOCK: 'dp-biometric-app-lock',
};

// ─── Lazy loader ────────────────────────────────────────────────

var getBiometrics = function () {
  if (!_biometrics) {
    try {
      var ReactNativeBiometrics = require('react-native-biometrics').default;
      _biometrics = new ReactNativeBiometrics({
        allowDeviceCredentials: true,
      });
    } catch (e) {
      console.warn('[Biometrics] react-native-biometrics not installed');
      return null;
    }
  }
  return _biometrics;
};

// ─── Check availability ─────────────────────────────────────────

var checkBiometricAvailability = function () {
  var bio = getBiometrics();
  if (!bio) {
    return Promise.resolve({
      available: false,
      biometryType: null,
    });
  }

  return bio
    .isSensorAvailable()
    .then(function (result) {
      return {
        available: result.available,
        biometryType: result.biometryType || null,
        // biometryType: 'FaceID' | 'TouchID' | 'Biometrics' (Android)
      };
    })
    .catch(function () {
      return { available: false, biometryType: null };
    });
};

// ─── Prompt for biometric authentication ────────────────────────

var authenticate = function (promptMessage) {
  var bio = getBiometrics();
  if (!bio) return Promise.resolve({ success: false, error: 'Not available' });

  return bio
    .simplePrompt({
      promptMessage: promptMessage || 'Verify your identity',
      cancelButtonText: 'Cancel',
    })
    .then(function (result) {
      return {
        success: result.success,
        error: result.error || null,
      };
    })
    .catch(function (err) {
      return {
        success: false,
        error: err.message || 'Authentication failed',
      };
    });
};

// ─── Create biometric key pair (for signed auth) ────────────────

var createKeys = function () {
  var bio = getBiometrics();
  if (!bio) return Promise.reject(new Error('Biometrics not available'));

  return bio.createKeys().then(function (result) {
    return { publicKey: result.publicKey };
  });
};

// ─── Sign with biometric ────────────────────────────────────────

var createSignature = function (payload, promptMessage) {
  var bio = getBiometrics();
  if (!bio) return Promise.reject(new Error('Biometrics not available'));

  return bio
    .createSignature({
      promptMessage: promptMessage || 'Sign in with biometrics',
      payload: payload,
    })
    .then(function (result) {
      if (result.success) {
        return { success: true, signature: result.signature };
      }
      return { success: false, error: result.error };
    });
};

// ─── Settings persistence ───────────────────────────────────────

var isBiometricEnabled = function () {
  return AsyncStorage.getItem(BIOMETRIC_KEYS.ENABLED)
    .then(function (val) {
      return val === 'true';
    })
    .catch(function () {
      return false;
    });
};

var setBiometricEnabled = function (enabled) {
  return AsyncStorage.setItem(BIOMETRIC_KEYS.ENABLED, enabled ? 'true' : 'false');
};

var isAppLockEnabled = function () {
  return AsyncStorage.getItem(BIOMETRIC_KEYS.APP_LOCK)
    .then(function (val) {
      return val === 'true';
    })
    .catch(function () {
      return false;
    });
};

var setAppLockEnabled = function (enabled) {
  return AsyncStorage.setItem(BIOMETRIC_KEYS.APP_LOCK, enabled ? 'true' : 'false');
};

module.exports = {
  checkBiometricAvailability: checkBiometricAvailability,
  authenticate: authenticate,
  createKeys: createKeys,
  createSignature: createSignature,
  isBiometricEnabled: isBiometricEnabled,
  setBiometricEnabled: setBiometricEnabled,
  isAppLockEnabled: isAppLockEnabled,
  setAppLockEnabled: setAppLockEnabled,
  BIOMETRIC_KEYS: BIOMETRIC_KEYS,
};
