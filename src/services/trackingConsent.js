/**
 * trackingConsent — Request App Tracking Transparency permission (iOS 14.5+).
 *
 * Must be called BEFORE initializing AdMob so that the SDK knows whether the
 * user has authorized tracking.  On Android this is a no-op that immediately
 * resolves with 'authorized'.
 *
 * Possible return values (iOS):
 *   'authorized'     — user granted tracking permission
 *   'denied'         — user denied tracking permission
 *   'not-determined' — prompt has not been shown yet (should not happen after request)
 *   'restricted'     — tracking is restricted (e.g. parental controls)
 *   'unavailable'    — library not installed or not iOS
 */

var { Platform } = require('react-native');
var logger = require('../utils/logger');

/**
 * Request ATT permission from the user.
 * @returns {Promise<string>} The tracking authorization status.
 */
function requestTrackingPermission() {
  // ATT only applies to iOS
  if (Platform.OS !== 'ios') {
    return Promise.resolve('authorized');
  }

  try {
    var TrackingTransparency = require('react-native-tracking-transparency');
    var getTrackingStatus = TrackingTransparency.getTrackingStatus;
    var requestTracking = TrackingTransparency.requestTrackingPermission;

    // First check current status — avoid re-prompting if already determined
    return getTrackingStatus()
      .then(function (currentStatus) {
        if (currentStatus === 'not-determined') {
          // Show the ATT dialog
          return requestTracking();
        }
        // Already determined — return current status
        return currentStatus;
      })
      .then(function (status) {
        logger.log('[ATT] Tracking permission status:', status);
        return status;
      })
      .catch(function (err) {
        logger.warn('[ATT] Failed to request tracking permission:', err);
        return 'denied';
      });
  } catch (e) {
    logger.warn('[ATT] react-native-tracking-transparency not installed — skipping.');
    return Promise.resolve('unavailable');
  }
}

/**
 * Check the current tracking authorization status without prompting.
 * @returns {Promise<string>} The current tracking status.
 */
function getTrackingPermissionStatus() {
  if (Platform.OS !== 'ios') {
    return Promise.resolve('authorized');
  }

  try {
    var TrackingTransparency = require('react-native-tracking-transparency');
    return TrackingTransparency.getTrackingStatus()
      .catch(function () {
        return 'unavailable';
      });
  } catch (e) {
    return Promise.resolve('unavailable');
  }
}

module.exports = {
  requestTrackingPermission: requestTrackingPermission,
  getTrackingPermissionStatus: getTrackingPermissionStatus,
};
