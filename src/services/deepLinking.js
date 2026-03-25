/**
 * Stepora Mobile — Deep Linking Configuration
 * Supports both custom URL scheme (com.stepora.app://) and
 * universal links (stepora.app).
 *
 * Used with React Navigation's linking config.
 */
var { Linking } = require('react-native');

var URL_SCHEME = 'com.stepora.app';
var UNIVERSAL_DOMAIN = 'stepora.app';

// ─── React Navigation linking config ────────────────────────────

var linking = {
  prefixes: [
    URL_SCHEME + '://',
    'https://' + UNIVERSAL_DOMAIN,
    'http://' + UNIVERSAL_DOMAIN,
  ],

  config: {
    screens: {
      // Main tabs
      Home: 'home',
      Dreams: 'dreams',
      Calendar: 'calendar',
      Social: 'social',
      Profile: 'profile',

      // Store
      Store: 'store',
      StoreItemDetail: 'store/item/:itemId',

      // Subscription
      Subscription: 'subscription',
      SubscriptionSuccess: 'subscription/success',

      // Notifications
      Notifications: 'notifications',
      NotificationSettings: 'notifications/settings',

      // Dreams
      DreamDetail: 'dream/:dreamId',
      DreamCreate: 'dream/create',

      // Auth deep links
      VerifyEmail: 'verify-email/:key',
      ResetPassword: 'reset-password/:uid/:token',

      // Friends / Social
      Friends: 'friends',
      UserProfile: 'user/:userId',

      // Buddy
      Buddy: 'buddy',

      // Stats
      Stats: 'stats',
      Achievements: 'achievements',
    },
  },

  // Custom getInitialURL for handling both URL types
  getInitialURL: function () {
    return Linking.getInitialURL().then(function (url) {
      if (url) return url;
      return null;
    });
  },

  // Subscribe to incoming links
  subscribe: function (listener) {
    var subscription = Linking.addEventListener('url', function (event) {
      listener(event.url);
    });
    return function () {
      subscription.remove();
    };
  },
};

// ─── URL builder helpers ────────────────────────────────────────

var buildDeepLink = function (path) {
  return URL_SCHEME + '://' + path;
};

var buildUniversalLink = function (path) {
  return 'https://' + UNIVERSAL_DOMAIN + '/' + path;
};

// ─── Parse incoming URL ─────────────────────────────────────────

var parseDeepLink = function (url) {
  if (!url) return null;

  // Remove scheme prefix
  var path = url
    .replace(URL_SCHEME + '://', '')
    .replace('https://' + UNIVERSAL_DOMAIN + '/', '')
    .replace('http://' + UNIVERSAL_DOMAIN + '/', '');

  // Parse route segments
  var segments = path.split('/').filter(Boolean);

  if (segments.length === 0) return { screen: 'Home' };

  var route = segments[0];

  switch (route) {
    case 'dream':
      return segments[1]
        ? { screen: 'DreamDetail', params: { dreamId: segments[1] } }
        : { screen: 'Dreams' };
    case 'store':
      return segments[1]
        ? { screen: 'StoreItemDetail', params: { itemId: segments[1] } }
        : { screen: 'Store' };
    case 'subscription':
      if (segments[1] === 'success') return { screen: 'SubscriptionSuccess' };
      return { screen: 'Subscription' };
    case 'notifications':
      if (segments[1] === 'settings') return { screen: 'NotificationSettings' };
      return { screen: 'Notifications' };
    case 'user':
      return segments[1]
        ? { screen: 'UserProfile', params: { userId: segments[1] } }
        : { screen: 'Social' };
    case 'verify-email':
      return segments[1]
        ? { screen: 'VerifyEmail', params: { key: segments[1] } }
        : { screen: 'Home' };
    case 'reset-password':
      return segments[1] && segments[2]
        ? { screen: 'ResetPassword', params: { uid: segments[1], token: segments[2] } }
        : { screen: 'Home' };
    default:
      return { screen: 'Home' };
  }
};

module.exports = {
  linking: linking,
  buildDeepLink: buildDeepLink,
  buildUniversalLink: buildUniversalLink,
  parseDeepLink: parseDeepLink,
  URL_SCHEME: URL_SCHEME,
  UNIVERSAL_DOMAIN: UNIVERSAL_DOMAIN,
};
