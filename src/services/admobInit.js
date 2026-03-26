/**
 * admobInit — Initializes Google Mobile Ads SDK.
 *
 * Call initAdMob() once at app startup (before rendering any ad components).
 * The SDK must be initialized before any ad requests can be made.
 *
 * This module is a no-op if `react-native-google-mobile-ads` is not installed
 * or if AdMob is disabled in adConfig.
 */

var AD_CONFIG = require('./adConfig');
var logger = require('../utils/logger');

var _initialized = false;

/**
 * Initialize the Google Mobile Ads SDK.
 * Safe to call multiple times — subsequent calls are no-ops.
 * @returns {Promise<void>}
 */
function initAdMob() {
  if (_initialized) {
    return Promise.resolve();
  }

  if (!AD_CONFIG.admobEnabled) {
    logger.log('[AdMob] Disabled in adConfig — skipping initialization.');
    return Promise.resolve();
  }

  try {
    var mobileAds = require('react-native-google-mobile-ads').default;

    return mobileAds()
      .initialize()
      .then(function (adapterStatuses) {
        _initialized = true;
        logger.log('[AdMob] Initialized successfully:', adapterStatuses);
      })
      .catch(function (err) {
        logger.warn('[AdMob] Initialization failed:', err);
      });
  } catch (e) {
    logger.warn('[AdMob] react-native-google-mobile-ads not installed — skipping initialization.');
    return Promise.resolve();
  }
}

module.exports = { initAdMob: initAdMob };
