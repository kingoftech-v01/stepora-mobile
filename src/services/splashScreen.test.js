/**
 * Tests for src/services/splashScreen.js
 * Covers hideSplash and showSplash, including idempotency
 * and graceful handling when the native module throws.
 */

jest.mock('../utils/logger', function () {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  };
});

// Override the setup mock to provide .default (splashScreen.js uses require(...).default)
var mockHide = jest.fn();
var mockShow = jest.fn();

jest.mock('react-native-splash-screen', function () {
  return {
    default: {
      hide: mockHide,
      show: mockShow,
    },
  };
});

describe('splashScreen', function () {
  var splashService;

  beforeEach(function () {
    jest.resetModules();
    jest.clearAllMocks();
    splashService = require('./splashScreen');
  });

  describe('hideSplash', function () {
    it('calls native hide', function () {
      splashService.hideSplash();
      expect(mockHide).toHaveBeenCalledTimes(1);
    });

    it('is idempotent - second call does not call native hide again', function () {
      splashService.hideSplash();
      splashService.hideSplash();
      // Only called once because _hidden flag prevents re-call
      expect(mockHide).toHaveBeenCalledTimes(1);
    });
  });

  describe('showSplash', function () {
    it('calls native show', function () {
      splashService.showSplash();
      expect(mockShow).toHaveBeenCalledTimes(1);
    });

    it('resets _hidden flag so hideSplash works again', function () {
      splashService.hideSplash(); // sets _hidden = true
      splashService.showSplash(); // resets _hidden = false
      splashService.hideSplash(); // should call hide again

      expect(mockHide).toHaveBeenCalledTimes(2);
    });
  });

  describe('when native module throws on hide', function () {
    it('handles throw gracefully', function () {
      jest.resetModules();
      jest.mock('react-native-splash-screen', function () {
        return {
          default: {
            hide: jest.fn(function () { throw new Error('native crash'); }),
            show: jest.fn(),
          },
        };
      });
      var ss = require('./splashScreen');
      expect(function () { ss.hideSplash(); }).not.toThrow();
    });
  });

  describe('when native module throws on show', function () {
    it('handles throw gracefully', function () {
      jest.resetModules();
      jest.mock('react-native-splash-screen', function () {
        return {
          default: {
            hide: jest.fn(),
            show: jest.fn(function () { throw new Error('native crash'); }),
          },
        };
      });
      var ss = require('./splashScreen');
      expect(function () { ss.showSplash(); }).not.toThrow();
    });
  });

  describe('when native module has no default', function () {
    it('hideSplash does not throw', function () {
      jest.resetModules();
      jest.mock('react-native-splash-screen', function () {
        return {};
      });
      var ss = require('./splashScreen');
      expect(function () { ss.hideSplash(); }).not.toThrow();
    });

    it('showSplash does not throw', function () {
      jest.resetModules();
      jest.mock('react-native-splash-screen', function () {
        return {};
      });
      var ss = require('./splashScreen');
      expect(function () { ss.showSplash(); }).not.toThrow();
    });
  });

  describe('exports', function () {
    it('exports hideSplash and showSplash functions', function () {
      expect(typeof splashService.hideSplash).toBe('function');
      expect(typeof splashService.showSplash).toBe('function');
    });
  });
});
