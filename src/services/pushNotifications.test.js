/**
 * Tests for src/services/pushNotifications.js
 * Covers requestPermission, getFCMToken, registerTokenWithBackend,
 * displayForegroundNotification, handleNotificationNavigation,
 * setupListeners, teardownListeners, and backgroundHandler.
 */

// ─── Mock dependencies ──────────────────────────────────────────

jest.mock('react-native', function () {
  return {
    Platform: { OS: 'android', Version: 33 },
    PermissionsAndroid: {
      request: jest.fn(function () {
        return Promise.resolve('granted');
      }),
      PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS' },
      RESULTS: { GRANTED: 'granted' },
    },
  };
});

jest.mock('../utils/logger', function () {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  };
});

// Mock endpoints to avoid require errors
jest.mock('./endpoints', function () {
  return {
    NOTIFICATIONS: { DEVICES: '/api/notifications/devices/' },
  };
});

// Shared mock instances — must be declared INSIDE jest.mock factories
// to comply with "no out-of-scope variable" rule. Instead, we access
// them by re-requiring the mock modules.

jest.mock('@react-native-firebase/messaging', function () {
  var instance = {
    requestPermission: jest.fn(function () { return Promise.resolve(1); }),
    getToken: jest.fn(function () { return Promise.resolve('mock-fcm-token-123'); }),
    onMessage: jest.fn(function () { return jest.fn(); }),
    onNotificationOpenedApp: jest.fn(function () { return jest.fn(); }),
    getInitialNotification: jest.fn(function () { return Promise.resolve(null); }),
    onTokenRefresh: jest.fn(),
  };
  var messaging = jest.fn(function () { return instance; });
  messaging._instance = instance;
  return {
    __esModule: true,
    default: messaging,
  };
});

jest.mock('@notifee/react-native', function () {
  return {
    __esModule: true,
    default: {
      createChannel: jest.fn(function () { return Promise.resolve('stepora-default'); }),
      displayNotification: jest.fn(function () { return Promise.resolve(); }),
    },
  };
});

var pushNotifications;
var messagingInstance;
var notifeeInstance;

beforeEach(function () {
  jest.clearAllMocks();

  // Get references to the mock instances
  var messagingMod = require('@react-native-firebase/messaging').default;
  messagingInstance = messagingMod._instance;
  // Reset individual mocks on the instance
  messagingInstance.requestPermission.mockImplementation(function () { return Promise.resolve(1); });
  messagingInstance.getToken.mockImplementation(function () { return Promise.resolve('mock-fcm-token-123'); });
  messagingInstance.onMessage.mockImplementation(function () { return jest.fn(); });
  messagingInstance.onNotificationOpenedApp.mockImplementation(function () { return jest.fn(); });
  messagingInstance.getInitialNotification.mockImplementation(function () { return Promise.resolve(null); });
  messagingInstance.onTokenRefresh.mockImplementation(jest.fn());

  notifeeInstance = require('@notifee/react-native').default;
  notifeeInstance.createChannel.mockImplementation(function () { return Promise.resolve('stepora-default'); });
  notifeeInstance.displayNotification.mockImplementation(function () { return Promise.resolve(); });

  // Re-require to reset internal module state (_messaging, _notifee, _navigationRef, etc.)
  jest.resetModules();
  pushNotifications = require('./pushNotifications');
});

describe('requestPermission', function () {
  it('requests Android 13+ POST_NOTIFICATIONS permission', async function () {
    var result = await pushNotifications.requestPermission();
    var rn = require('react-native');
    expect(rn.PermissionsAndroid.request).toHaveBeenCalledWith(
      'android.permission.POST_NOTIFICATIONS',
    );
    expect(result).toBe(true);
  });

  it('returns false when permission denied on Android', async function () {
    var rn = require('react-native');
    rn.PermissionsAndroid.request.mockResolvedValueOnce('denied');

    var result = await pushNotifications.requestPermission();
    expect(result).toBe(false);
  });

  it('returns false when permission request throws', async function () {
    var rn = require('react-native');
    rn.PermissionsAndroid.request.mockRejectedValueOnce(new Error('fail'));

    var result = await pushNotifications.requestPermission();
    expect(result).toBe(false);
  });
});

describe('getFCMToken', function () {
  it('returns FCM token from messaging', async function () {
    var token = await pushNotifications.getFCMToken();
    expect(token).toBe('mock-fcm-token-123');
  });

  it('returns null when getToken fails', async function () {
    var mi = require('@react-native-firebase/messaging').default._instance;
    mi.getToken.mockRejectedValueOnce(new Error('fail'));
    var token = await pushNotifications.getFCMToken();
    expect(token).toBeNull();
  });
});

describe('registerTokenWithBackend', function () {
  it('registers FCM token via apiPost', async function () {
    var mockApiPost = jest.fn(function () { return Promise.resolve(); });
    var token = await pushNotifications.registerTokenWithBackend(mockApiPost);

    expect(mockApiPost).toHaveBeenCalledWith('/api/notifications/devices/', {
      fcm_token: 'mock-fcm-token-123',
      platform: 'android',
    });
    expect(token).toBe('mock-fcm-token-123');
  });

  it('returns token even when apiPost fails', async function () {
    var mockApiPost = jest.fn(function () {
      return Promise.reject(new Error('server error'));
    });
    var token = await pushNotifications.registerTokenWithBackend(mockApiPost);
    expect(token).toBe('mock-fcm-token-123');
  });

  it('returns null when no FCM token available', async function () {
    var mi = require('@react-native-firebase/messaging').default._instance;
    mi.getToken.mockResolvedValueOnce(null);

    var mockApiPost = jest.fn();
    var result = await pushNotifications.registerTokenWithBackend(mockApiPost);
    expect(result).toBeNull();
    expect(mockApiPost).not.toHaveBeenCalled();
  });
});

describe('displayForegroundNotification', function () {
  it('creates channel and displays notification', async function () {
    var ni = require('@notifee/react-native').default;
    await pushNotifications.displayForegroundNotification({
      notification: { title: 'Test', body: 'Hello' },
      data: { type: 'dream_progress', dream_id: '42' },
    });

    expect(ni.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'stepora-default',
        name: 'Stepora Notifications',
      }),
    );
    expect(ni.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test',
        body: 'Hello',
      }),
    );
  });

  it('uses defaults when notification fields are missing', async function () {
    var ni = require('@notifee/react-native').default;
    await pushNotifications.displayForegroundNotification({});

    expect(ni.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Stepora',
        body: '',
      }),
    );
  });

  it('handles notifee display error gracefully', async function () {
    var ni = require('@notifee/react-native').default;
    ni.createChannel.mockRejectedValueOnce(new Error('channel fail'));

    // Should not throw
    await pushNotifications.displayForegroundNotification({
      notification: { title: 'X' },
    });
  });
});

describe('handleNotificationNavigation', function () {
  it('navigates to DreamDetail for dream_progress type', function () {
    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);

    pushNotifications.handleNotificationNavigation({
      data: { type: 'dream_progress', dream_id: '99' },
    });

    expect(mockNav.navigate).toHaveBeenCalledWith('DreamDetail', { dreamId: '99' });
  });

  it('navigates to Friends for friend_request type', function () {
    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);

    pushNotifications.handleNotificationNavigation({
      data: { type: 'friend_request' },
    });

    expect(mockNav.navigate).toHaveBeenCalledWith('Friends', {});
  });

  it('navigates to Notifications for system type', function () {
    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);

    pushNotifications.handleNotificationNavigation({
      data: { type: 'system' },
    });

    expect(mockNav.navigate).toHaveBeenCalledWith('Notifications', {});
  });

  it('navigates to Stats for weekly_report type', function () {
    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);

    pushNotifications.handleNotificationNavigation({
      data: { type: 'weekly_report' },
    });

    expect(mockNav.navigate).toHaveBeenCalledWith('Stats', {});
  });

  it('defaults to system type when type is missing', function () {
    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);

    pushNotifications.handleNotificationNavigation({ data: {} });

    expect(mockNav.navigate).toHaveBeenCalledWith('Notifications', {});
  });

  it('does nothing when remoteMessage is null', function () {
    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);

    pushNotifications.handleNotificationNavigation(null);
    expect(mockNav.navigate).not.toHaveBeenCalled();
  });

  it('handles unknown notification type gracefully', function () {
    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);

    pushNotifications.handleNotificationNavigation({
      data: { type: 'unknown_type_xyz' },
    });

    expect(mockNav.navigate).not.toHaveBeenCalled();
  });
});

describe('setupListeners / teardownListeners', function () {
  it('sets up onMessage and onNotificationOpenedApp listeners', function () {
    var mi = require('@react-native-firebase/messaging').default._instance;
    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);

    expect(mi.onMessage).toHaveBeenCalled();
    expect(mi.onNotificationOpenedApp).toHaveBeenCalled();
    expect(mi.getInitialNotification).toHaveBeenCalled();
    expect(mi.onTokenRefresh).toHaveBeenCalled();
  });

  it('teardownListeners calls unsubscribe functions', function () {
    var mi = require('@react-native-firebase/messaging').default._instance;
    var unsubMsg = jest.fn();
    var unsubNotifOpen = jest.fn();
    mi.onMessage.mockReturnValue(unsubMsg);
    mi.onNotificationOpenedApp.mockReturnValue(unsubNotifOpen);

    var mockNav = { navigate: jest.fn() };
    pushNotifications.setupListeners(mockNav);
    pushNotifications.teardownListeners();

    expect(unsubMsg).toHaveBeenCalled();
    expect(unsubNotifOpen).toHaveBeenCalled();
  });

  it('teardownListeners is safe to call without setup', function () {
    pushNotifications.teardownListeners();
  });
});

describe('backgroundHandler', function () {
  it('resolves immediately', async function () {
    var result = await pushNotifications.backgroundHandler({
      messageId: 'msg-123',
    });
    expect(result).toBeUndefined();
  });
});
