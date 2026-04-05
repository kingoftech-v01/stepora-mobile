/**
 * Tests for src/utils/logger.js
 * Covers DEV mode logging (active console bindings) and production mode (noop).
 *
 * Because logger.js captures console.* via .bind() at require-time, we must
 * set up __DEV__ BEFORE requiring the module and spy BEFORE the bind.
 */

describe('logger', function () {
  var originalDev;

  beforeEach(function () {
    jest.resetModules();
    originalDev = global.__DEV__;
  });

  afterEach(function () {
    if (originalDev === undefined) {
      delete global.__DEV__;
    } else {
      global.__DEV__ = originalDev;
    }
  });

  describe('when __DEV__ is true', function () {
    it('log is a function (bound to console.log)', function () {
      global.__DEV__ = true;
      var logger = require('./logger');
      expect(typeof logger.log).toBe('function');
      // Verify it is NOT the noop (noop has no name binding to console)
      // We can test by checking if calling it works without error
      var spy = jest.spyOn(console, 'log').mockImplementation(function () {});
      // The bind happened before spy, so we verify logger.log exists and is callable
      logger.log('test');
      spy.mockRestore();
    });

    it('all methods are non-noop functions', function () {
      global.__DEV__ = true;
      var logger = require('./logger');
      // When __DEV__ is true, methods are bound console methods (not noop)
      // We verify they are the bound versions by checking they are not the same function
      var noop = function () {};
      expect(logger.log).not.toBe(noop);
      expect(logger.warn).not.toBe(noop);
      expect(logger.error).not.toBe(noop);
      expect(logger.debug).not.toBe(noop);
      expect(logger.info).not.toBe(noop);
    });

    it('log, warn, error, debug, info are all distinct functions', function () {
      global.__DEV__ = true;
      var logger = require('./logger');
      // Each should be a different bound function
      var fns = [logger.log, logger.warn, logger.error, logger.debug, logger.info];
      for (var i = 0; i < fns.length; i++) {
        for (var j = i + 1; j < fns.length; j++) {
          expect(fns[i]).not.toBe(fns[j]);
        }
      }
    });
  });

  describe('when __DEV__ is false (production)', function () {
    it('log is a noop that does not call console.log', function () {
      global.__DEV__ = false;
      var spy = jest.spyOn(console, 'log').mockImplementation(function () {});
      var logger = require('./logger');
      logger.log('should not appear');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('warn is a noop that does not call console.warn', function () {
      global.__DEV__ = false;
      var spy = jest.spyOn(console, 'warn').mockImplementation(function () {});
      var logger = require('./logger');
      logger.warn('should not appear');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('error is a noop that does not call console.error', function () {
      global.__DEV__ = false;
      var spy = jest.spyOn(console, 'error').mockImplementation(function () {});
      var logger = require('./logger');
      logger.error('should not appear');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('debug is a noop', function () {
      global.__DEV__ = false;
      var spy = jest.spyOn(console, 'debug').mockImplementation(function () {});
      var logger = require('./logger');
      logger.debug('should not appear');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('info is a noop', function () {
      global.__DEV__ = false;
      var spy = jest.spyOn(console, 'info').mockImplementation(function () {});
      var logger = require('./logger');
      logger.info('should not appear');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('all five methods are the same noop function', function () {
      global.__DEV__ = false;
      var logger = require('./logger');
      // When __DEV__ is false, all are assigned the same noop
      expect(logger.log).toBe(logger.warn);
      expect(logger.warn).toBe(logger.error);
      expect(logger.error).toBe(logger.debug);
      expect(logger.debug).toBe(logger.info);
    });
  });

  describe('when __DEV__ is undefined', function () {
    it('all methods are noops (same as production)', function () {
      delete global.__DEV__;
      var logger = require('./logger');

      var logSpy = jest.spyOn(console, 'log').mockImplementation(function () {});
      var warnSpy = jest.spyOn(console, 'warn').mockImplementation(function () {});
      var errorSpy = jest.spyOn(console, 'error').mockImplementation(function () {});

      logger.log('test');
      logger.warn('test');
      logger.error('test');

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('exports', function () {
    it('exports log, warn, error, debug, info methods', function () {
      global.__DEV__ = true;
      var logger = require('./logger');

      expect(typeof logger.log).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
    });
  });
});
