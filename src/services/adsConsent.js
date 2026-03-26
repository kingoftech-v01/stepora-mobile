/**
 * adsConsent — Google UMP (User Messaging Platform) for GDPR compliance.
 *
 * Shows a consent dialog to EU users before serving personalized ads.
 * Uses the AdsConsent API from react-native-google-mobile-ads which wraps
 * Google's UMP SDK.
 *
 * Must be called after ATT (on iOS) but before loading any ads.
 * If the UMP SDK is not available or consent gathering fails, the app
 * falls back to non-personalized ads gracefully.
 */

var logger = require('../utils/logger');

var _consentGathered = false;

/**
 * Gather GDPR consent via Google UMP.
 *
 * This function:
 *  1. Calls requestInfoUpdate() to check if consent is needed (EU user).
 *  2. If consent is required, shows the Google consent form.
 *  3. Returns the consent info object with the current status.
 *
 * Safe to call multiple times — subsequent calls after the first successful
 * gathering return the cached consent info.
 *
 * @param {object} [options] Optional AdsConsent options (e.g. debugGeography, testDeviceIdentifiers).
 * @returns {Promise<object|null>} The consent info, or null if UMP is unavailable.
 */
function gatherGDPRConsent(options) {
  if (_consentGathered) {
    return _getConsentInfo();
  }

  try {
    var AdsConsent = require('react-native-google-mobile-ads').AdsConsent;

    if (!AdsConsent) {
      logger.warn('[UMP] AdsConsent not available in react-native-google-mobile-ads.');
      return Promise.resolve(null);
    }

    // gatherConsent calls requestInfoUpdate + loadAndShowConsentFormIfRequired
    return AdsConsent.gatherConsent(options || {})
      .then(function (consentInfo) {
        _consentGathered = true;
        logger.log('[UMP] Consent gathered:', consentInfo);
        return consentInfo;
      })
      .catch(function (err) {
        logger.warn('[UMP] Consent gathering failed — falling back to non-personalized ads:', err);
        _consentGathered = true; // Don't re-prompt on failure
        return null;
      });
  } catch (e) {
    logger.warn('[UMP] react-native-google-mobile-ads not installed — skipping GDPR consent.');
    return Promise.resolve(null);
  }
}

/**
 * Get the current consent info without showing any form.
 * @returns {Promise<object|null>} The consent info, or null if unavailable.
 */
function _getConsentInfo() {
  try {
    var AdsConsent = require('react-native-google-mobile-ads').AdsConsent;
    return AdsConsent.getConsentInfo()
      .catch(function () {
        return null;
      });
  } catch (e) {
    return Promise.resolve(null);
  }
}

/**
 * Show the privacy options form (allows users to change consent after initial prompt).
 * Useful for a "Privacy Settings" button in the app's settings screen.
 * @returns {Promise<object|null>} The updated consent info, or null if unavailable.
 */
function showPrivacyOptions() {
  try {
    var AdsConsent = require('react-native-google-mobile-ads').AdsConsent;

    if (!AdsConsent) {
      return Promise.resolve(null);
    }

    return AdsConsent.showPrivacyOptionsForm()
      .then(function (consentInfo) {
        logger.log('[UMP] Privacy options updated:', consentInfo);
        return consentInfo;
      })
      .catch(function (err) {
        logger.warn('[UMP] Failed to show privacy options form:', err);
        return null;
      });
  } catch (e) {
    logger.warn('[UMP] react-native-google-mobile-ads not installed — cannot show privacy options.');
    return Promise.resolve(null);
  }
}

/**
 * Reset consent info. Useful for testing or when user requests data deletion.
 * After calling this, gatherGDPRConsent() will re-prompt the user.
 */
function resetConsent() {
  _consentGathered = false;

  try {
    var AdsConsent = require('react-native-google-mobile-ads').AdsConsent;
    if (AdsConsent) {
      AdsConsent.reset();
    }
  } catch (e) {
    // Module not installed — nothing to reset
  }
}

module.exports = {
  gatherGDPRConsent: gatherGDPRConsent,
  showPrivacyOptions: showPrivacyOptions,
  resetConsent: resetConsent,
};
