/**
 * Tests for src/screens/profile/ProfileScreen/ProfileScreen.js
 * Covers loading, error, avatar, level, stats, menu items,
 * premium badge, sign out, and navigation.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock the hook ──────────────────────────────────────────────

var mockHookReturn = {
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
  },
  isLoadingData: false,
  isErrorData: false,
  errorMessage: 'Failed to load profile',
  retryAll: jest.fn(),
  displayName: 'Test User',
  email: 'test@example.com',
  level: 12,
  xp: 1250,
  xpToNext: 50,
  lvlProgress: 0.75,
  streak: 5,
  isPremium: false,
  subscriptionLabel: 'Free',
  userStats: { totalTasksCompleted: 42 },
  notifUnread: 3,
  MENU: [
    { key: 'achievements', label: 'Achievements', route: 'Achievements', color: '#FCD34D', isNotif: false },
    { key: 'referral', label: 'Referral', route: 'Referral', color: '#10B981', isNotif: false },
    { key: 'subscription', label: 'Subscription', route: 'Subscription', color: '#8B5CF6', isNotif: false },
    { key: 'store', label: 'Store', route: 'Store', color: '#14B8A6', isNotif: false },
    { key: 'notifications', label: 'Notifications', route: 'NotificationSettings', color: '#3B82F6', isNotif: true },
    { key: 'persona', label: 'Persona', route: 'Persona', color: '#EC4899', isNotif: false },
    { key: 'settings', label: 'Settings', route: 'Settings', color: '#6366F1', isNotif: false },
    { key: 'help', label: 'Help & Support', route: 'TermsOfService', color: '#9CA3AF', isNotif: false },
  ],
  handleSignOut: jest.fn(),
};

jest.mock('./useProfileScreen', function () {
  return function () {
    return mockHookReturn;
  };
});

// Mock CalendarHeatmap
jest.mock('../../../components/CalendarHeatmap', function () {
  var React = require('react');
  return function () {
    return React.createElement(require('react-native').View, { testID: 'calendar-heatmap' });
  };
});

// Mock OnboardingTooltip
jest.mock('../../../components/OnboardingTooltip', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'tooltip-' + (props.id || 'none') });
  };
});

jest.mock('../../../config/onboardingTooltips', function () {
  return {
    getTooltipConfig: function () { return null; },
  };
});

var ProfileScreen = require('./ProfileScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.isLoadingData = false;
  mockHookReturn.isErrorData = false;
  mockHookReturn.isPremium = false;
});

describe('ProfileScreen', function () {
  describe('loading state', function () {
    it('shows loading indicator', function () {
      mockHookReturn.isLoadingData = true;

      var { UNSAFE_getByType } = render(
        React.createElement(ProfileScreen),
      );

      var ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('error state', function () {
    it('shows error message', function () {
      mockHookReturn.isErrorData = true;

      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('Failed to load profile')).toBeTruthy();
    });

    it('shows retry button', function () {
      mockHookReturn.isErrorData = true;

      var { getByLabelText } = render(
        React.createElement(ProfileScreen),
      );

      fireEvent.press(getByLabelText('Retry loading profile'));
      expect(mockHookReturn.retryAll).toHaveBeenCalled();
    });
  });

  describe('header', function () {
    it('renders Profile title', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('Profile')).toBeTruthy();
    });

    it('navigates back on back press', function () {
      var { getByLabelText } = render(
        React.createElement(ProfileScreen),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(mockHookReturn.navigation.goBack).toHaveBeenCalled();
    });

    it('navigates to settings', function () {
      var { getByLabelText } = render(
        React.createElement(ProfileScreen),
      );

      fireEvent.press(getByLabelText('Settings'));
      expect(mockHookReturn.navigation.navigate).toHaveBeenCalledWith('Settings');
    });
  });

  describe('avatar and info', function () {
    it('renders user display name', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('Test User')).toBeTruthy();
    });

    it('renders user email', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('test@example.com')).toBeTruthy();
    });

    it('renders avatar initial', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('T')).toBeTruthy();
    });

    it('renders level badge', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('Lv12')).toBeTruthy();
    });
  });

  describe('premium badge', function () {
    it('does not show premium badge when not premium', function () {
      mockHookReturn.isPremium = false;

      var { queryByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(queryByText(/Premium/)).toBeNull();
    });

    it('shows premium badge when premium', function () {
      mockHookReturn.isPremium = true;
      mockHookReturn.subscriptionLabel = 'Premium';

      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText(/Premium/)).toBeTruthy();
    });
  });

  describe('stats', function () {
    it('renders XP value', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('1,250 XP')).toBeTruthy();
    });

    it('renders streak value', function () {
      var { getByLabelText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByLabelText('5 day streak')).toBeTruthy();
    });

    it('renders tasks completed', function () {
      var { getByLabelText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByLabelText('42 tasks completed')).toBeTruthy();
    });
  });

  describe('menu items', function () {
    it('renders all menu items', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('Achievements')).toBeTruthy();
      expect(getByText('Store')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
    });

    it('navigates on menu item press', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      fireEvent.press(getByText('Achievements'));
      expect(mockHookReturn.navigation.navigate).toHaveBeenCalledWith('Achievements');
    });

    it('shows unread badge on notifications item', function () {
      var { getByText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByText('3')).toBeTruthy();
    });
  });

  describe('sign out', function () {
    it('renders sign out button', function () {
      var { getByLabelText } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByLabelText('Sign Out')).toBeTruthy();
    });

    it('calls handleSignOut on press', function () {
      var { getByLabelText } = render(
        React.createElement(ProfileScreen),
      );

      fireEvent.press(getByLabelText('Sign Out'));
      expect(mockHookReturn.handleSignOut).toHaveBeenCalled();
    });
  });

  describe('calendar heatmap', function () {
    it('renders CalendarHeatmap component', function () {
      var { getByTestId } = render(
        React.createElement(ProfileScreen),
      );

      expect(getByTestId('calendar-heatmap')).toBeTruthy();
    });
  });
});
