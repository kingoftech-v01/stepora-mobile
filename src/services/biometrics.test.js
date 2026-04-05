/**
 * Tests for src/services/biometrics.js
 * Covers checkBiometricAvailability, authenticate, createKeys, createSignature,
 * isBiometricEnabled, setBiometricEnabled, isAppLockEnabled, setAppLockEnabled.
 *
 * biometrics.js uses require('react-native-biometrics').default to get the class.
 * We provide a controllable mock that returns per-test configurable instances.
 */

var mockIsSensorAvailable = jest.fn(function () {
  return Promise.resolve({ biometryType: 'FaceID', available: true });
});
var mockSimplePrompt = jest.fn(function () {
  return Promise.resolve({ success: true });
});
var mockCreateKeys = jest.fn(function () {
  return Promise.resolve({ publicKey: 'pk-abc123' });
});
var mockCreateSignature = jest.fn(function () {
  return Promise.resolve({ success: true, signature: 'sig-xyz' });
});

jest.mock('react-native-biometrics', function () {
  var MockBiometrics = jest.fn(function () {
    return {
      isSensorAvailable: mockIsSensorAvailable,
      simplePrompt: mockSimplePrompt,
      createKeys: mockCreateKeys,
      createSignature: mockCreateSignature,
    };
  });
  return { __esModule: true, default: MockBiometrics };
});

jest.mock('../utils/logger', function () {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  };
});

var AsyncStorage;
var biometrics;

beforeEach(function () {
  jest.clearAllMocks();

  // Reset mock implementations to defaults
  mockIsSensorAvailable.mockImplementation(function () {
    return Promise.resolve({ biometryType: 'FaceID', available: true });
  });
  mockSimplePrompt.mockImplementation(function () {
    return Promise.resolve({ success: true });
  });
  mockCreateKeys.mockImplementation(function () {
    return Promise.resolve({ publicKey: 'pk-abc123' });
  });
  mockCreateSignature.mockImplementation(function () {
    return Promise.resolve({ success: true, signature: 'sig-xyz' });
  });

  // Re-require after clearing so we get fresh module instances that share the same mocks
  jest.resetModules();
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  AsyncStorage._reset();
  biometrics = require('./biometrics');
});

describe('BIOMETRIC_KEYS', function () {
  it('exports BIOMETRIC_KEYS constants', function () {
    expect(biometrics.BIOMETRIC_KEYS.ENABLED).toBe('dp-biometric-enabled');
    expect(biometrics.BIOMETRIC_KEYS.APP_LOCK).toBe('dp-biometric-app-lock');
  });
});

describe('checkBiometricAvailability', function () {
  it('returns availability info from sensor', async function () {
    var result = await biometrics.checkBiometricAvailability();
    expect(result).toEqual({
      available: true,
      biometryType: 'FaceID',
    });
  });

  it('returns not available when isSensorAvailable rejects', async function () {
    mockIsSensorAvailable.mockRejectedValueOnce(new Error('sensor error'));
    var result = await biometrics.checkBiometricAvailability();
    expect(result).toEqual({ available: false, biometryType: null });
  });

  it('returns not available when sensor reports unavailable', async function () {
    mockIsSensorAvailable.mockResolvedValueOnce({ available: false, biometryType: null });
    var result = await biometrics.checkBiometricAvailability();
    expect(result).toEqual({ available: false, biometryType: null });
  });

  it('returns null biometryType when result has no biometryType', async function () {
    mockIsSensorAvailable.mockResolvedValueOnce({ available: true });
    var result = await biometrics.checkBiometricAvailability();
    expect(result).toEqual({ available: true, biometryType: null });
  });
});

describe('authenticate', function () {
  it('returns success from simplePrompt', async function () {
    var result = await biometrics.authenticate('Test prompt');
    expect(result).toEqual({ success: true, error: null });
  });

  it('uses default prompt message', async function () {
    var result = await biometrics.authenticate();
    expect(result.success).toBe(true);
  });

  it('returns failure when simplePrompt rejects', async function () {
    mockSimplePrompt.mockRejectedValueOnce(new Error('User cancelled'));
    var result = await biometrics.authenticate('Verify');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User cancelled');
  });

  it('returns error info when simplePrompt returns error', async function () {
    mockSimplePrompt.mockResolvedValueOnce({ success: false, error: 'Sensor unavailable' });
    var result = await biometrics.authenticate();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Sensor unavailable');
  });

  it('returns generic error message when reject has no message', async function () {
    mockSimplePrompt.mockRejectedValueOnce({});
    var result = await biometrics.authenticate();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication failed');
  });
});

describe('createKeys', function () {
  it('returns publicKey on success', async function () {
    var result = await biometrics.createKeys();
    expect(result).toEqual({ publicKey: 'pk-abc123' });
  });

  it('propagates errors from createKeys', async function () {
    mockCreateKeys.mockRejectedValueOnce(new Error('Key generation failed'));
    await expect(biometrics.createKeys()).rejects.toThrow('Key generation failed');
  });
});

describe('createSignature', function () {
  it('returns success with signature', async function () {
    var result = await biometrics.createSignature('payload-data', 'Sign in');
    expect(result).toEqual({ success: true, signature: 'sig-xyz' });
  });

  it('returns failure when signature creation fails', async function () {
    mockCreateSignature.mockResolvedValueOnce({
      success: false,
      error: 'user cancelled',
    });
    var result = await biometrics.createSignature('payload');
    expect(result).toEqual({ success: false, error: 'user cancelled' });
  });

  it('uses default prompt message', async function () {
    var result = await biometrics.createSignature('payload');
    expect(mockCreateSignature).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: 'Sign in with biometrics',
        payload: 'payload',
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe('isBiometricEnabled', function () {
  it('returns true when stored value is "true"', async function () {
    AsyncStorage.getItem.mockResolvedValueOnce('true');
    var result = await biometrics.isBiometricEnabled();
    expect(result).toBe(true);
  });

  it('returns false when stored value is "false"', async function () {
    AsyncStorage.getItem.mockResolvedValueOnce('false');
    var result = await biometrics.isBiometricEnabled();
    expect(result).toBe(false);
  });

  it('returns false when no stored value', async function () {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    var result = await biometrics.isBiometricEnabled();
    expect(result).toBe(false);
  });

  it('returns false on storage error', async function () {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('storage fail'));
    var result = await biometrics.isBiometricEnabled();
    expect(result).toBe(false);
  });
});

describe('setBiometricEnabled', function () {
  it('stores "true" when enabled', async function () {
    await biometrics.setBiometricEnabled(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('dp-biometric-enabled', 'true');
  });

  it('stores "false" when disabled', async function () {
    await biometrics.setBiometricEnabled(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('dp-biometric-enabled', 'false');
  });
});

describe('isAppLockEnabled', function () {
  it('returns true when stored value is "true"', async function () {
    AsyncStorage.getItem.mockResolvedValueOnce('true');
    var result = await biometrics.isAppLockEnabled();
    expect(result).toBe(true);
  });

  it('returns false when no stored value', async function () {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    var result = await biometrics.isAppLockEnabled();
    expect(result).toBe(false);
  });

  it('returns false on storage error', async function () {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('fail'));
    var result = await biometrics.isAppLockEnabled();
    expect(result).toBe(false);
  });
});

describe('setAppLockEnabled', function () {
  it('stores "true" when enabled', async function () {
    await biometrics.setAppLockEnabled(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('dp-biometric-app-lock', 'true');
  });

  it('stores "false" when disabled', async function () {
    await biometrics.setAppLockEnabled(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('dp-biometric-app-lock', 'false');
  });
});
