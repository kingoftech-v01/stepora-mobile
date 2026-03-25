/**
 * Centralized feature flags for Stepora Mobile.
 * Mirrors the web app's config/featureFlags.js.
 *
 * On mobile, flags are read from react-native-config (env vars)
 * or hardcoded when no env mechanism is available.
 */

var FEATURES = {
  GOOGLE_AUTH: false,
  GOOGLE_CALENDAR: false,
  SEARCH: false,
  MESSAGES: false,
};

function isEnabled(feature) {
  return !!FEATURES[feature];
}

module.exports = {
  FEATURES: FEATURES,
  isEnabled: isEnabled,
};
