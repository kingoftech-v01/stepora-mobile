/* eslint-disable no-undef */
/**
 * Jest setup file for Stepora Mobile.
 * Mocks for native modules, AsyncStorage, navigation, etc.
 */

// ─── Global fetch mock ──────────────────────────────────────────
require('jest-fetch-mock').enableMocks();

// ─── AsyncStorage mock ──────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', function () {
  var store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(function (key) {
        return Promise.resolve(store[key] || null);
      }),
      setItem: jest.fn(function (key, value) {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn(function (key) {
        delete store[key];
        return Promise.resolve();
      }),
      multiRemove: jest.fn(function (keys) {
        keys.forEach(function (k) { delete store[k]; });
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(function () {
        return Promise.resolve(Object.keys(store));
      }),
      clear: jest.fn(function () {
        store = {};
        return Promise.resolve();
      }),
      // Expose for test cleanup
      _store: store,
      _reset: function () {
        for (var key in store) {
          delete store[key];
        }
      },
    },
  };
});

// ─── React Navigation mock ──────────────────────────────────────
var mockNavigate = jest.fn();
var mockGoBack = jest.fn();
var mockReset = jest.fn();

jest.mock('@react-navigation/native', function () {
  return {
    useNavigation: jest.fn(function () {
      return {
        navigate: mockNavigate,
        goBack: mockGoBack,
        reset: mockReset,
        setOptions: jest.fn(),
        addListener: jest.fn(function () { return jest.fn(); }),
      };
    }),
    useRoute: jest.fn(function () {
      return { params: {} };
    }),
    useFocusEffect: jest.fn(function (cb) { cb(); }),
    useIsFocused: jest.fn(function () { return true; }),
    NavigationContainer: function (props) {
      var React = require('react');
      return React.createElement('View', null, props.children);
    },
    createNavigationContainerRef: jest.fn(),
  };
});

jest.mock('@react-navigation/native-stack', function () {
  return {
    createNativeStackNavigator: jest.fn(function () {
      return {
        Navigator: function (props) {
          var React = require('react');
          return React.createElement('View', null, props.children);
        },
        Screen: function () {
          return null;
        },
        Group: function (props) {
          var React = require('react');
          return React.createElement('View', null, props.children);
        },
      };
    }),
  };
});

jest.mock('@react-navigation/bottom-tabs', function () {
  return {
    createBottomTabNavigator: jest.fn(function () {
      return {
        Navigator: function (props) {
          var React = require('react');
          return React.createElement('View', null, props.children);
        },
        Screen: function () {
          return null;
        },
      };
    }),
  };
});

// ─── React Native Vector Icons mock ──────────────────────────────
jest.mock('react-native-vector-icons/Feather', function () {
  var React = require('react');
  return {
    default: function (props) {
      return React.createElement('Text', { testID: 'icon-' + props.name }, props.name);
    },
  };
});

// ─── Safe Area Context mock ─────────────────────────────────────
jest.mock('react-native-safe-area-context', function () {
  var React = require('react');
  return {
    SafeAreaView: function (props) {
      return React.createElement('View', props, props.children);
    },
    SafeAreaProvider: function (props) {
      return React.createElement('View', null, props.children);
    },
    useSafeAreaInsets: jest.fn(function () {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }),
  };
});

// ─── React Native Reanimated mock ───────────────────────────────
jest.mock('react-native-reanimated', function () {
  return {
    default: {
      call: jest.fn(),
      createAnimatedComponent: function (component) { return component; },
      Value: jest.fn(),
    },
    useSharedValue: jest.fn(function () { return { value: 0 }; }),
    useAnimatedStyle: jest.fn(function () { return {}; }),
    withTiming: jest.fn(function (val) { return val; }),
  };
});

// ─── React Native Gesture Handler mock ──────────────────────────
jest.mock('react-native-gesture-handler', function () {
  var React = require('react');
  return {
    GestureHandlerRootView: function (props) {
      return React.createElement('View', null, props.children);
    },
    PanGestureHandler: 'View',
    State: {},
  };
});

// ─── React Native Splash Screen mock ────────────────────────────
jest.mock('react-native-splash-screen', function () {
  return {
    hide: jest.fn(),
    show: jest.fn(),
  };
});

// ─── Firebase mock ──────────────────────────────────────────────
jest.mock('@react-native-firebase/app', function () {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('@react-native-firebase/messaging', function () {
  return {
    __esModule: true,
    default: jest.fn(function () {
      return {
        getToken: jest.fn(function () { return Promise.resolve('mock-fcm-token'); }),
        onMessage: jest.fn(function () { return jest.fn(); }),
        setBackgroundMessageHandler: jest.fn(),
        requestPermission: jest.fn(function () { return Promise.resolve(1); }),
      };
    }),
  };
});

// ─── Toast mock ─────────────────────────────────────────────────
jest.mock('react-native-toast-message', function () {
  return {
    __esModule: true,
    default: {
      show: jest.fn(),
      hide: jest.fn(),
    },
  };
});

// ─── Linear Gradient mock ───────────────────────────────────────
jest.mock('react-native-linear-gradient', function () {
  var React = require('react');
  return {
    __esModule: true,
    default: function (props) {
      return React.createElement('View', props, props.children);
    },
  };
});

// ─── Blur mock ──────────────────────────────────────────────────
jest.mock('@react-native-community/blur', function () {
  var React = require('react');
  return {
    BlurView: function (props) {
      return React.createElement('View', props, props.children);
    },
  };
});

// ─── React Native Biometrics mock ───────────────────────────────
jest.mock('react-native-biometrics', function () {
  return jest.fn(function () {
    return {
      isSensorAvailable: jest.fn(function () {
        return Promise.resolve({ biometryType: 'FaceID', available: true });
      }),
      simplePrompt: jest.fn(function () {
        return Promise.resolve({ success: true });
      }),
    };
  });
});

// ─── Tracking Transparency mock ─────────────────────────────────
jest.mock('react-native-tracking-transparency', function () {
  return {
    getTrackingStatus: jest.fn(function () {
      return Promise.resolve('not-determined');
    }),
    requestTrackingPermission: jest.fn(function () {
      return Promise.resolve('authorized');
    }),
  };
});

// ─── Google Mobile Ads / AdsConsent mock ────────────────────────
jest.mock('react-native-google-mobile-ads', function () {
  return {
    __esModule: true,
    default: jest.fn(function () {
      return {
        initialize: jest.fn(function () {
          return Promise.resolve([]);
        }),
      };
    }),
    AdsConsent: {
      requestInfoUpdate: jest.fn(function () {
        return Promise.resolve({ status: 'OBTAINED', isConsentFormAvailable: false });
      }),
      showForm: jest.fn(function () {
        return Promise.resolve({ status: 'OBTAINED' });
      }),
      showPrivacyOptionsForm: jest.fn(function () {
        return Promise.resolve({ status: 'OBTAINED' });
      }),
      loadAndShowConsentFormIfRequired: jest.fn(function () {
        return Promise.resolve({ status: 'OBTAINED' });
      }),
      getConsentInfo: jest.fn(function () {
        return Promise.resolve({ status: 'OBTAINED', isConsentFormAvailable: false });
      }),
      gatherConsent: jest.fn(function () {
        return Promise.resolve({ status: 'OBTAINED', isConsentFormAvailable: false });
      }),
      reset: jest.fn(),
      getTCString: jest.fn(function () {
        return Promise.resolve('');
      }),
      getGdprApplies: jest.fn(function () {
        return Promise.resolve(false);
      }),
      getPurposeConsents: jest.fn(function () {
        return Promise.resolve('');
      }),
      getPurposeLegitimateInterests: jest.fn(function () {
        return Promise.resolve('');
      }),
    },
  };
});

// ─── SVG mock ───────────────────────────────────────────────────
jest.mock('react-native-svg', function () {
  var React = require('react');
  return {
    Svg: function (props) { return React.createElement('View', props); },
    Circle: function (props) { return React.createElement('View', props); },
    Rect: function (props) { return React.createElement('View', props); },
    Path: function (props) { return React.createElement('View', props); },
    Line: function (props) { return React.createElement('View', props); },
    G: function (props) { return React.createElement('View', props, props.children); },
    Text: function (props) { return React.createElement('View', props); },
    default: function (props) { return React.createElement('View', props, props.children); },
  };
});

// ─── Expose navigation mocks for tests ──────────────────────────
global.__mockNavigate = mockNavigate;
global.__mockGoBack = mockGoBack;
global.__mockReset = mockReset;

// ─── Suppress noisy warnings in tests ───────────────────────────
var originalWarn = console.warn;
console.warn = function () {
  var args = Array.prototype.slice.call(arguments);
  var msg = args[0];
  if (typeof msg === 'string' && (
    msg.includes('Animated') ||
    msg.includes('NativeModule') ||
    msg.includes('ViewPropTypes')
  )) {
    return;
  }
  originalWarn.apply(console, args);
};
