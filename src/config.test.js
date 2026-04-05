/**
 * Tests for src/config.js
 * Covers default configuration values and react-native-config override behavior.
 *
 * react-native-config is not installed in the test environment, so we use
 * jest.mock with { virtual: true } to simulate it.
 */

describe('Config', function () {
  beforeEach(function () {
    jest.resetModules();
  });

  describe('default values (react-native-config not installed)', function () {
    beforeEach(function () {
      // Simulate react-native-config not being installed (the try/catch in config.js handles this)
      jest.mock('react-native-config', function () {
        throw new Error('Module not found');
      }, { virtual: true });
    });

    it('has correct default API_BASE', function () {
      var Config = require('./config').default;
      expect(Config.API_BASE).toBe('https://api.stepora.app');
    });

    it('has correct default WS_BASE', function () {
      var Config = require('./config').default;
      expect(Config.WS_BASE).toBe('wss://api.stepora.app');
    });

    it('has AGORA_APP_ID', function () {
      var Config = require('./config').default;
      expect(Config.AGORA_APP_ID).toBe('b67aeb35dbff4cb8a70278fb8e3edf46');
    });

    it('has APP_VERSION', function () {
      var Config = require('./config').default;
      expect(Config.APP_VERSION).toBe('1.0.0');
    });

    it('has BUILD_NUMBER', function () {
      var Config = require('./config').default;
      expect(Config.BUILD_NUMBER).toBe('1');
    });
  });

  describe('with react-native-config providing env overrides', function () {
    it('uses STEPORA_API_BASE from env', function () {
      jest.mock('react-native-config', function () {
        return {
          default: {
            STEPORA_API_BASE: 'https://dev-api.stepora.app',
            STEPORA_WS_BASE: 'wss://dev-api.stepora.app',
          },
        };
      }, { virtual: true });
      var Config = require('./config').default;
      expect(Config.API_BASE).toBe('https://dev-api.stepora.app');
    });

    it('uses STEPORA_WS_BASE from env', function () {
      jest.mock('react-native-config', function () {
        return {
          default: {
            STEPORA_WS_BASE: 'wss://staging.stepora.app',
          },
        };
      }, { virtual: true });
      var Config = require('./config').default;
      expect(Config.WS_BASE).toBe('wss://staging.stepora.app');
    });

    it('uses AGORA_APP_ID from env', function () {
      jest.mock('react-native-config', function () {
        return {
          default: {
            AGORA_APP_ID: 'custom-agora-id',
          },
        };
      }, { virtual: true });
      var Config = require('./config').default;
      expect(Config.AGORA_APP_ID).toBe('custom-agora-id');
    });

    it('falls back to defaults when env vars are empty', function () {
      jest.mock('react-native-config', function () {
        return { default: {} };
      }, { virtual: true });
      var Config = require('./config').default;
      expect(Config.API_BASE).toBe('https://api.stepora.app');
      expect(Config.WS_BASE).toBe('wss://api.stepora.app');
    });
  });

  describe('with react-native-config returning null default', function () {
    it('falls back to defaults', function () {
      jest.mock('react-native-config', function () {
        return { default: null };
      }, { virtual: true });
      var Config = require('./config').default;
      expect(Config.API_BASE).toBe('https://api.stepora.app');
      expect(Config.WS_BASE).toBe('wss://api.stepora.app');
    });
  });
});
