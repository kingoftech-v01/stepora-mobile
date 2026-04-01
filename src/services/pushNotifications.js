/**
 * Stepora Mobile — Push Notification Service
 * Handles FCM token registration, foreground/background notifications,
 * and deep link routing from notification taps.
 *
 * Dependencies:
 *   @react-native-firebase/app
 *   @react-native-firebase/messaging
 *   @notifee/react-native (for foreground display)
 */
var { Platform } = require('react-native');
var logger = require('../utils/logger');

var _messaging = null;
var _notifee = null;
var _navigationRef = null;

// ─── Lazy loaders (avoid crash if libs not installed yet) ────────

var getMessaging = function () {
  if (!_messaging) {
    try {
      _messaging = require('@react-native-firebase/messaging').default;
    } catch (e) {
      logger.warn('[Push] @react-native-firebase/messaging not installed');
      return null;
    }
  }
  return _messaging;
};

var getNotifee = function () {
  if (!_notifee) {
    try {
      _notifee = require('@notifee/react-native').default;
    } catch (e) {
      logger.warn('[Push] @notifee/react-native not installed');
      return null;
    }
  }
  return _notifee;
};

// ─── Permission & Token ─────────────────────────────────────────

var requestPermission = function () {
  var messaging = getMessaging();
  if (!messaging) return Promise.resolve(false);

  if (Platform.OS === 'ios') {
    return messaging()
      .requestPermission()
      .then(function (authStatus) {
        var enabled =
          authStatus === 1 || // AuthorizationStatus.AUTHORIZED
          authStatus === 2;   // AuthorizationStatus.PROVISIONAL
        return enabled;
      })
      .catch(function () {
        return false;
      });
  }

  // Android 13+ runtime permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    var PermissionsAndroid = require('react-native').PermissionsAndroid;
    return PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    )
      .then(function (result) {
        return result === PermissionsAndroid.RESULTS.GRANTED;
      })
      .catch(function () {
        return false;
      });
  }

  return Promise.resolve(true);
};

var getFCMToken = function () {
  var messaging = getMessaging();
  if (!messaging) return Promise.resolve(null);

  return messaging()
    .getToken()
    .catch(function (err) {
      logger.error('[Push] Failed to get FCM token:', err);
      return null;
    });
};

// ─── Register token with backend ────────────────────────────────

var registerTokenWithBackend = function (apiPost) {
  var DEVICES_URL;
  try {
    DEVICES_URL = require('./endpoints').NOTIFICATIONS.DEVICES;
  } catch (e) {
    DEVICES_URL = '/api/notifications/devices/';
  }
  return getFCMToken().then(function (token) {
    if (!token) return null;

    return apiPost(DEVICES_URL, {
      fcm_token: token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    })
      .then(function () {
        logger.log('[Push] Token registered with backend');
        return token;
      })
      .catch(function (err) {
        logger.error('[Push] Failed to register token:', err);
        return token;
      });
  });
};

// ─── Foreground notification display ────────────────────────────

var displayForegroundNotification = function (remoteMessage) {
  var notifee = getNotifee();
  if (!notifee) return Promise.resolve();

  var notification = remoteMessage.notification || {};
  var data = remoteMessage.data || {};

  return notifee
    .createChannel({
      id: 'stepora-default',
      name: 'Stepora Notifications',
      importance: 4, // HIGH
      vibration: true,
      sound: 'default',
    })
    .then(function (channelId) {
      return notifee.displayNotification({
        title: notification.title || 'Stepora',
        body: notification.body || '',
        data: data,
        android: {
          channelId: channelId,
          smallIcon: 'ic_notification',
          color: '#8B5CF6',
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'default',
        },
      });
    })
    .catch(function (err) {
      logger.error('[Push] Failed to display foreground notification:', err);
    });
};

// ─── Deep link routing from notification tap ────────────────────

var ROUTE_MAP = {
  dream_progress: function (data) {
    return { screen: 'DreamDetail', params: { dreamId: data.dream_id || data.dreamId } };
  },
  friend_request: function () {
    return { screen: 'Friends' };
  },
  achievement: function () {
    return { screen: 'Achievements' };
  },
  buddy: function () {
    return { screen: 'Buddy' };
  },
  reminder: function (data) {
    return { screen: 'DreamDetail', params: { dreamId: data.dream_id || data.dreamId } };
  },
  social: function () {
    return { screen: 'Social' };
  },
  system: function () {
    return { screen: 'Notifications' };
  },
  weekly_report: function () {
    return { screen: 'Stats' };
  },
  subscription: function () {
    return { screen: 'Subscription' };
  },
  store: function () {
    return { screen: 'Store' };
  },
};

var handleNotificationNavigation = function (remoteMessage) {
  if (!remoteMessage || !_navigationRef) return;

  var data = remoteMessage.data || {};
  var type = data.type || data.notification_type || 'system';
  var routeBuilder = ROUTE_MAP[type];

  if (routeBuilder) {
    var route = routeBuilder(data);
    try {
      _navigationRef.navigate(route.screen, route.params || {});
    } catch (e) {
      logger.warn('[Push] Navigation failed:', e);
    }
  }
};

// ─── Setup listeners ────────────────────────────────────────────

var _unsubscribeOnMessage = null;
var _unsubscribeOnNotifOpen = null;

var setupListeners = function (navigationRef) {
  _navigationRef = navigationRef;
  var messaging = getMessaging();
  if (!messaging) return;

  // Foreground messages
  _unsubscribeOnMessage = messaging().onMessage(function (remoteMessage) {
    displayForegroundNotification(remoteMessage);
  });

  // Background/quit notification opened
  _unsubscribeOnNotifOpen = messaging().onNotificationOpenedApp(function (remoteMessage) {
    handleNotificationNavigation(remoteMessage);
  });

  // App opened from quit state via notification
  messaging()
    .getInitialNotification()
    .then(function (remoteMessage) {
      if (remoteMessage) {
        // Small delay to let navigation mount
        setTimeout(function () {
          handleNotificationNavigation(remoteMessage);
        }, 1000);
      }
    });

  // Token refresh — re-register new token with backend
  messaging().onTokenRefresh(function (newToken) {
    logger.log('[Push] Token refreshed:', newToken.substring(0, 20) + '...');
    var apiPost;
    try {
      apiPost = require('./api').apiPost;
    } catch (e) {
      logger.warn('[Push] Cannot import apiPost for token refresh');
      return;
    }
    var DEVICES_URL;
    try {
      DEVICES_URL = require('./endpoints').NOTIFICATIONS.DEVICES;
    } catch (e) {
      DEVICES_URL = '/api/notifications/devices/';
    }
    apiPost(DEVICES_URL, {
      fcm_token: newToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    })
      .then(function () {
        logger.log('[Push] Refreshed token registered with backend');
      })
      .catch(function (err) {
        logger.error('[Push] Failed to register refreshed token:', err);
      });
  });
};

var teardownListeners = function () {
  if (_unsubscribeOnMessage) {
    _unsubscribeOnMessage();
    _unsubscribeOnMessage = null;
  }
  if (_unsubscribeOnNotifOpen) {
    _unsubscribeOnNotifOpen();
    _unsubscribeOnNotifOpen = null;
  }
};

// ─── Background message handler (must be top-level) ─────────────
// Call this in index.js: messaging().setBackgroundMessageHandler(backgroundHandler)

var backgroundHandler = function (remoteMessage) {
  logger.log('[Push] Background message:', remoteMessage.messageId);
  return Promise.resolve();
};

module.exports = {
  requestPermission: requestPermission,
  getFCMToken: getFCMToken,
  registerTokenWithBackend: registerTokenWithBackend,
  displayForegroundNotification: displayForegroundNotification,
  handleNotificationNavigation: handleNotificationNavigation,
  setupListeners: setupListeners,
  teardownListeners: teardownListeners,
  backgroundHandler: backgroundHandler,
};
