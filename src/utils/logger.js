// ─── Production-safe Logger ─────────────────────────────────────────
// All console output is suppressed in production builds.
// React Native sets __DEV__ = false for release builds automatically.
//
// Usage:
//   var logger = require('../utils/logger');
//   logger.log('[Tag] message', data);
//   logger.warn('[Tag] warning', data);
//   logger.error('[Tag] error', data);

var noop = function () {};

var logger = {
  log: typeof __DEV__ !== 'undefined' && __DEV__ ? console.log.bind(console) : noop,
  warn: typeof __DEV__ !== 'undefined' && __DEV__ ? console.warn.bind(console) : noop,
  error: typeof __DEV__ !== 'undefined' && __DEV__ ? console.error.bind(console) : noop,
  debug: typeof __DEV__ !== 'undefined' && __DEV__ ? console.debug.bind(console) : noop,
  info: typeof __DEV__ !== 'undefined' && __DEV__ ? console.info.bind(console) : noop,
};

module.exports = logger;
