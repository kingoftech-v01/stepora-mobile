/**
 * Tests for src/navigation/RootNavigator.jsx
 * Covers loading spinner, auth flow routing (unauthenticated → AuthStack,
 * emailVerified false → EmailGate, not onboarded → Onboarding, full → MainTabs),
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

// ─── Mock react-navigation ──────────────────────────────────────

var capturedScreens = [];

jest.mock('@react-navigation/native', function () {
  var RN = require('react-native');
  return {
    NavigationContainer: function (props) {
      return React.createElement(RN.View, { testID: 'nav-container' }, props.children);
    },
  };
});

jest.mock('@react-navigation/native-stack', function () {
  var RN = require('react-native');
  function MockScreen(props) {
    capturedScreens.push(props.name);
    return React.createElement(RN.View, { testID: 'screen-' + props.name });
  }

  function MockGroup(props) {
    return React.createElement(RN.View, null, props.children);
  }

  return {
    createNativeStackNavigator: function () {
      return {
        Navigator: function (props) {
          return React.createElement(RN.View, { testID: 'stack-navigator' }, props.children);
        },
        Screen: MockScreen,
        Group: MockGroup,
      };
    },
  };
});

// ─── Stub every screen import so require() doesn't fail ─────────

var stubScreen = function () {
  return React.createElement(require('react-native').View, null);
};

// Auth Stack & MainTabs
jest.mock('./AuthStack', function () { return stubScreen; });
jest.mock('./MainTabs', function () { return stubScreen; });

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
  jest.mock(p, function () { return stubScreen; });
});

jest.mock('../config', function () {
  return { WS_BASE: 'wss://test.local' };
});

var RootNavigator = require('./RootNavigator').default;

beforeEach(function () {
  capturedScreens = [];
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

      var { getByTestId, queryByTestId } = render(
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

      expect(capturedScreens).toContain('Auth');
    });

    it('does not render MainTabs when not authenticated', function () {
      mockAuth.isAuthenticated = false;

      render(React.createElement(RootNavigator));

      expect(capturedScreens).not.toContain('MainTabs');
    });
  });

  describe('email verification gate', function () {
    it('renders EmailGate when authenticated but email not verified', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: false, hasOnboarded: false };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).toContain('EmailGate');
      expect(capturedScreens).not.toContain('MainTabs');
      expect(capturedScreens).not.toContain('Auth');
    });
  });

  describe('onboarding flow', function () {
    it('renders Onboarding when authenticated, email verified, but not onboarded', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, hasOnboarded: false };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).toContain('Onboarding');
      expect(capturedScreens).toContain('OnboardingSubscription');
      expect(capturedScreens).toContain('PersonalityQuiz');
    });

    it('does not render MainTabs during onboarding', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, hasOnboarded: false };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).not.toContain('MainTabs');
    });
  });

  describe('main app flow', function () {
    it('renders MainTabs when fully authenticated and onboarded', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, hasOnboarded: true };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).toContain('MainTabs');
    });

    it('registers dream screens in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, hasOnboarded: true };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).toContain('DreamCreate');
      expect(capturedScreens).toContain('DreamDetail');
      expect(capturedScreens).toContain('DreamEdit');
      expect(capturedScreens).toContain('CheckIn');
    });

    it('registers chat screens in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, hasOnboarded: true };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).toContain('Chat');
      expect(capturedScreens).toContain('NewConversation');
      expect(capturedScreens).toContain('VoiceCall');
      expect(capturedScreens).toContain('VideoCall');
    });

    it('registers profile and settings screens in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, hasOnboarded: true };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).toContain('Settings');
      expect(capturedScreens).toContain('EditProfile');
      expect(capturedScreens).toContain('ChangePassword');
      expect(capturedScreens).toContain('TwoFactor');
    });

    it('registers store and subscription screens in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, hasOnboarded: true };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).toContain('Store');
      expect(capturedScreens).toContain('Subscription');
      expect(capturedScreens).toContain('Notifications');
    });

    it('does not include Auth screen in main flow', function () {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { emailVerified: true, hasOnboarded: true };

      render(React.createElement(RootNavigator));

      expect(capturedScreens).not.toContain('Auth');
      expect(capturedScreens).not.toContain('EmailGate');
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
