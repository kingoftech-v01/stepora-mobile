/**
 * Stepora Mobile — Biometric Authentication Service
 * Wraps react-native-biometrics for fingerprint/face unlock.
 *
 * Use cases:
 * - App lock (require biometric on app open)
 * - Confirm sensitive actions (delete account, change password)
 * - Quick login (biometric + stored refresh token)
 *
 * SECURITY LIMITATION [V-245]: Current implementation uses simplePrompt()
 * which is event-based (boolean success/failure), NOT cryptographic.
 * The biometric check is a local UI gate only — it does not produce a
 * cryptographic proof that the server can verify. An attacker with Frida
 * or similar runtime hooking tools can bypass simplePrompt().
 *
 * TODO [V-245]: Migrate to cryptographic biometric authentication:
 * 1. On biometric enrollment, call createKeys() to generate a keypair
 *    bound to the device's secure enclave / TEE.
 * 2. Send the public key to the server and associate it with the user.
 * 3. On each biometric auth, call createSignature(payload) where payload
 *    is a server-provided nonce/challenge.
 * 4. Send the signed payload to the server for verification.
 * This ensures the server has cryptographic proof of biometric success.
 * The createKeys() and createSignature() methods already exist below
 * but are currently unused by the authenticate() flow.
 */
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var logger = require('../utils/logger');

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
      logger.warn('[Biometrics] react-native-biometrics not installed');
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
