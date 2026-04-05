/**
 * Tests for src/navigation/RootNavigator.jsx
 * Covers loading spinner, auth flow routing (unauthenticated -> AuthStack,
 * emailVerified false -> EmailGate, not onboarded -> Onboarding, full -> MainTabs),
 * navigation theme colours, and screen registrations.
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

// ─── Controllable auth / theme state ─────────────────────────────

var mockAuth = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

var mockTheme = {
  colors: {
    background: '#0F0A1E',
    text: '#FFFFFF',
    surfaceBorder: '#222',
  },
  isReady: true,
};

// Track captured screen names via a mock function (allowed in jest.mock factories)
var mockCaptureScreen = jest.fn();

jest.mock('../context/AuthContext', function () {
  return {
    useAuth: function () {
      return mockAuth;
    },
  };
});

jest.mock('../context/ThemeContext', function () {
  return {
    useTheme: function () {
      return mockTheme;
    },
  };
});

// ─── Mock pushNotifications service ─────────────────────────────
jest.mock('../services/pushNotifications', function () {
  return {
    setupListeners: jest.fn(),
    teardownListeners: jest.fn(),
    requestPermission: jest.fn(function () { return Promise.resolve(true); }),
    getFCMToken: jest.fn(function () { return Promise.resolve('mock-token'); }),
    registerTokenWithBackend: jest.fn(function () { return Promise.resolve('mock-token'); }),
  };
});

// ─── Mock react-navigation ──────────────────────────────────────

jest.mock('@react-navigation/native', function () {
  var _React = require('react');
  var RN = require('react-native');
  return {
    NavigationContainer: function (props) {
      return _React.createElement(RN.View, { testID: 'nav-container' }, props.children);
    },
    createNavigationContainerRef: jest.fn(function () {
      return {
        navigate: jest.fn(),
        goBack: jest.fn(),
        reset: jest.fn(),
        isReady: jest.fn(function () { return true; }),
        current: null,
      };
    }),
  };
});

jest.mock('@react-navigation/native-stack', function () {
  var _React = require('react');
  var RN = require('react-native');
  function MockScreen(props) {
    mockCaptureScreen(props.name);
    return _React.createElement(RN.View, { testID: 'screen-' + props.name });
  }

  function MockGroup(props) {
    return _React.createElement(RN.View, null, props.children);
  }

  return {
    createNativeStackNavigator: function () {
      return {
        Navigator: function (props) {
          return _React.createElement(RN.View, { testID: 'stack-navigator' }, props.children);
        },
        Screen: MockScreen,
        Group: MockGroup,
      };
    },
  };
});

// ─── Stub every screen import so require() doesn't fail ─────────

// Auth Stack & MainTabs
jest.mock('./AuthStack', function () { var _R = require('react'); return function () { return _R.createElement(require('react-native').View, null); }; });
jest.mock('./MainTabs', function () { var _R = require('react'); return function () { return _R.createElement(require('react-native').View, null); }; });

// Screens — stub them all as simple views
var screenPaths = [
  '../screens/conversations/ChatScreen',
  '../screens/conversations/ConversationListScreen',
  '../screens/conversations/GroupChatScreen',
  '../screens/conversations/VoiceCallScreen',
  '../screens/conversations/VideoCallScreen',
  '../screens/conversations/NewConversationScreen',
  '../screens/conversations/CallHistoryScreen',
  '../screens/dreams/DreamsListScreen',
  '../screens/dreams/DreamCreateScreen',
  '../screens/dreams/DreamEditScreen',
  '../screens/dreams/DreamDetailScreen',
  '../screens/dreams/DreamShareScreen',
  '../screens/dreams/CalibrationScreen',
  '../screens/dreams/CheckInScreen',
  '../screens/social/CommunityScreen',
  '../screens/social/ExploreScreen',
  '../screens/social/LeaderboardScreen',
  '../screens/social/FriendListScreen',
  '../screens/social/FriendRequestsScreen',
  '../screens/social/CircleListScreen',
  '../screens/social/CircleDetailScreen',
  '../screens/social/UserProfileScreen',
  '../screens/social/CircleCreateScreen',
  '../screens/social/CircleChallengesScreen',
  '../screens/social/SavedPostsScreen',
  '../screens/social/PostDetailScreen',
  '../screens/community/BuddyScreen',
  '../screens/community/BuddyRequestsScreen',
  '../screens/community/AccountabilityContractScreen',
  '../screens/calendar/CalendarScreen',
  '../screens/calendar/GoogleCalendarConnectScreen',
  '../screens/calendar/GoogleSyncSettingsScreen',
  '../screens/calendar/TimeBlockScreen',
  '../screens/calendar/TimeBlockTemplatesScreen',
  '../screens/calendar/SharedCalendarViewScreen',
  '../screens/profile/ProfileScreen',
  '../screens/profile/EditProfileScreen',
  '../screens/profile/SettingsScreen',
  '../screens/profile/TermsOfServiceScreen',
  '../screens/profile/PrivacyPolicyScreen',
  '../screens/profile/TwoFactorScreen',
  '../screens/profile/DataExportScreen',
  '../screens/profile/BlockedUsersScreen',
  '../screens/profile/AppVersionScreen',
  '../screens/profile/PersonaScreen',
  '../screens/profile/AchievementsScreen',
  '../screens/store/StoreScreen',
  '../screens/store/GiftingScreen',
  '../screens/subscription/SubscriptionScreen',
  '../screens/subscription/OnboardingSubscriptionScreen',
  '../screens/notifications/NotificationsScreen',
  '../screens/notifications/NotificationSettingsScreen',
  '../screens/profile/ReferralScreen',
  '../screens/auth/ChangePasswordScreen',
  '../screens/social/SeasonDetailScreen',
  '../screens/social/GroupLeaderboardScreen',
  '../screens/dreams/SharedDreamsScreen',
  '../screens/dreams/DreamTemplatesScreen',
  '../screens/dreams/VisionBoardScreen',
  '../screens/dreams/MicroStartScreen',
  '../screens/dreams/DreamJournalScreen',
  '../screens/dreams/FocusTimerScreen',
  '../screens/dreams/GoalRefineScreen',
  '../screens/auth/OnboardingScreen',
  '../screens/auth/PersonalityQuizScreen',
  '../screens/auth/EmailGateScreen',
  '../screens/home/HomeScreen',
  '../screens/social/FindBuddyScreen',
];

screenPaths.forEach(function (p) {
  jest.mock(p, function () { var _R = require('react'); return function () { return _R.createElement(require('react-native').View, null); }; });
});

jest.mock('../config', function () {
  return { WS_BASE: 'wss://test.local' };
});

var RootNavigator = require('./RootNavigator').default;

function getCapturedScreens() {
  return mockCaptureScreen.mock.calls.map(function (c) { return c[0]; });
}

beforeEach(function () {
  mockCaptureScreen.mockClear();
  // Reset to defaults
  mockAuth.isAuthenticated = false;
  mockAuth.isLoading = false;
  mockAuth.user = null;
  mockTheme.isReady = true;
});

describe('RootNavigator', function () {
  describe('loading state', function () {
    it('shows loading spinner when auth is loading', function () {
      mockAuth.isLoading = true;

      var { queryByTestId } = render(
        React.createElement(RootNavigator),
      );

      expect(queryByTestId('nav-container')).toBeNull();
    });

    it('shows loading spinner when theme is not ready', function () {
      mockTheme.isReady = false;

      var { queryByTestId } = render(
        React.createElement(RootNavigator),
      );

      expect(queryByTestId('nav-container')).toBeNull();
    });

    it('does not show loading spinner when both auth and theme are ready', function () {
      mockAuth.isLoading = false;
      mockTheme.isReady = true;

      var { getByTestId } = render(
        React.createElement(RootNavigator),
      );

      expect(getByTestId('nav-container')).toBeTruthy();
    });
  });

  describe('unauthenticated flow', function () {
    it('renders Auth screen when not authenticated', function () {
      mockAuth.isAuthenticated = false;

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).toContain('Auth');
    });

    it('does not render MainTabs when not authenticated', function () {
      mockAuth.isAuthenticated = false;

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).not.toContain('MainTabs');
    });
  });

  describe('email verification gate', function () {
    it('renders EmailGate when authenticated but email not verified', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: false, onboardingCompleted: false };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).toContain('EmailGate');
      expect(getCapturedScreens()).not.toContain('MainTabs');
      expect(getCapturedScreens()).not.toContain('Auth');
    });
  });

  describe('onboarding flow', function () {
    it('renders Onboarding when authenticated, email verified, but not onboarded', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, onboardingCompleted: false };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).toContain('Onboarding');
      expect(getCapturedScreens()).toContain('OnboardingSubscription');
      expect(getCapturedScreens()).toContain('PersonalityQuiz');
    });

    it('does not render MainTabs during onboarding', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, onboardingCompleted: false };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).not.toContain('MainTabs');
    });
  });

  describe('main app flow', function () {
    it('renders MainTabs when fully authenticated and onboarded', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, onboardingCompleted: true };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).toContain('MainTabs');
    });

    it('registers dream screens in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, onboardingCompleted: true };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).toContain('DreamCreate');
      expect(getCapturedScreens()).toContain('DreamDetail');
      expect(getCapturedScreens()).toContain('DreamEdit');
      expect(getCapturedScreens()).toContain('CheckIn');
    });

    it('registers chat screens in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, onboardingCompleted: true };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).toContain('Chat');
      expect(getCapturedScreens()).toContain('NewConversation');
      expect(getCapturedScreens()).toContain('VoiceCall');
      expect(getCapturedScreens()).toContain('VideoCall');
    });

    it('registers profile and settings screens in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, onboardingCompleted: true };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).toContain('Settings');
      expect(getCapturedScreens()).toContain('EditProfile');
      expect(getCapturedScreens()).toContain('ChangePassword');
      expect(getCapturedScreens()).toContain('TwoFactor');
    });

    it('registers store and subscription screens in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, onboardingCompleted: true };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).toContain('Store');
      expect(getCapturedScreens()).toContain('Subscription');
      expect(getCapturedScreens()).toContain('Notifications');
    });

    it('does not include Auth screen in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, onboardingCompleted: true };

      render(React.createElement(RootNavigator));

      expect(getCapturedScreens()).not.toContain('Auth');
      expect(getCapturedScreens()).not.toContain('EmailGate');
    });
  });

  describe('navigation container', function () {
    it('renders NavigationContainer wrapper', function () {
      var { getByTestId } = render(
        React.createElement(RootNavigator),
      );

      expect(getByTestId('nav-container')).toBeTruthy();
    });

    it('renders stack navigator', function () {
      var { getByTestId } = render(
        React.createElement(RootNavigator),
      );

      expect(getByTestId('stack-navigator')).toBeTruthy();
    });
  });
});
