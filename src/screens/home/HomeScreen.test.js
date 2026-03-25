/**
 * Tests for src/screens/home/HomeScreen.js
 * Covers loading state, greeting display, streak/XP, quick actions,
 * tasks rendering, dreams rendering, events rendering, and navigation.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock the hook ──────────────────────────────────────────────

var mockHookReturn = {
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
  },
  isLoading: false,
  isError: false,
  refreshing: false,
  onRefresh: jest.fn(),
  greeting: 'Good morning, Test User',
  displayName: 'Test User',
  user: { id: 1, displayName: 'Test User' },
  streak: 5,
  xp: 1250,
  level: 12,
  dreams: [],
  tasks: [],
  events: [],
  completedTasks: 0,
  totalTasks: 0,
  goToDreamCreate: jest.fn(),
  goToCheckIn: jest.fn(),
  goToFocusTimer: jest.fn(),
  goToDreamDetail: jest.fn(),
  goToNotifications: jest.fn(),
};

jest.mock('./useHomeScreen', function () {
  return function () {
    return mockHookReturn;
  };
});

// Mock StreakWidget
jest.mock('../../components/StreakWidget', function () {
  var React = require('react');
  return function () {
    return React.createElement(require('react-native').View, { testID: 'streak-widget' });
  };
});

// Mock OnboardingTooltip
jest.mock('../../components/OnboardingTooltip', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(
      require('react-native').View,
      { testID: 'onboarding-tooltip-' + props.id },
    );
  };
});

// Mock tooltip config
jest.mock('../../config/onboardingTooltips', function () {
  return {
    getTooltipConfig: function () {
      return { id: 'home_greeting', message: 'Welcome!', position: 'bottom', target: 'header' };
    },
  };
});

var HomeScreen = require('./HomeScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.isLoading = false;
  mockHookReturn.isError = false;
  mockHookReturn.dreams = [];
  mockHookReturn.tasks = [];
  mockHookReturn.events = [];
  mockHookReturn.completedTasks = 0;
  mockHookReturn.totalTasks = 0;
});

describe('HomeScreen', function () {
  describe('loading state', function () {
    it('shows loading indicator when loading', function () {
      mockHookReturn.isLoading = true;
      mockHookReturn.refreshing = false;

      var { UNSAFE_getByType } = render(
        React.createElement(HomeScreen),
      );

      var ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('greeting', function () {
    it('renders greeting text', function () {
      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('Good morning, Test User')).toBeTruthy();
    });

    it('shows task progress when tasks exist', function () {
      mockHookReturn.totalTasks = 5;
      mockHookReturn.completedTasks = 2;

      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('2/5 tasks done today')).toBeTruthy();
    });

    it('shows ready message when no tasks', function () {
      mockHookReturn.totalTasks = 0;
      mockHookReturn.completedTasks = 0;

      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('Ready to make progress?')).toBeTruthy();
    });
  });

  describe('quick actions', function () {
    it('renders quick action buttons', function () {
      var { getByLabelText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByLabelText('New Dream')).toBeTruthy();
      expect(getByLabelText('Check In')).toBeTruthy();
      expect(getByLabelText('Focus Timer')).toBeTruthy();
    });

    it('calls goToDreamCreate on New Dream press', function () {
      var { getByLabelText } = render(
        React.createElement(HomeScreen),
      );

      fireEvent.press(getByLabelText('New Dream'));
      expect(mockHookReturn.goToDreamCreate).toHaveBeenCalled();
    });

    it('calls goToFocusTimer on Focus Timer press', function () {
      var { getByLabelText } = render(
        React.createElement(HomeScreen),
      );

      fireEvent.press(getByLabelText('Focus Timer'));
      expect(mockHookReturn.goToFocusTimer).toHaveBeenCalled();
    });
  });

  describe('notifications', function () {
    it('navigates to notifications on bell press', function () {
      var { getByLabelText } = render(
        React.createElement(HomeScreen),
      );

      fireEvent.press(getByLabelText('Notifications'));
      expect(mockHookReturn.goToNotifications).toHaveBeenCalled();
    });
  });

  describe('tasks section', function () {
    it('shows empty state when no tasks', function () {
      mockHookReturn.tasks = [];

      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('No tasks scheduled for today')).toBeTruthy();
    });

    it('renders task items', function () {
      mockHookReturn.tasks = [
        { id: 1, title: 'Learn React', isCompleted: false, dreamTitle: 'Code', estimatedMinutes: 30 },
        { id: 2, title: 'Exercise', isCompleted: true, dreamTitle: 'Health', estimatedMinutes: 45 },
      ];
      mockHookReturn.completedTasks = 1;
      mockHookReturn.totalTasks = 2;

      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('Learn React')).toBeTruthy();
      expect(getByText('Exercise')).toBeTruthy();
      expect(getByText('30 min')).toBeTruthy();
      expect(getByText('45 min')).toBeTruthy();
    });

    it('displays task count badge', function () {
      mockHookReturn.tasks = [
        { id: 1, title: 'Task A', isCompleted: true },
      ];
      mockHookReturn.completedTasks = 1;
      mockHookReturn.totalTasks = 1;

      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('1/1')).toBeTruthy();
    });
  });

  describe('dreams section', function () {
    it('shows empty state with create button when no dreams', function () {
      mockHookReturn.dreams = [];

      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('Create Your First Dream')).toBeTruthy();
    });

    it('renders dream cards with progress', function () {
      mockHookReturn.dreams = [
        { id: 1, title: 'Learn Guitar', category: 'hobbies', progressPercentage: 35 },
        { id: 2, title: 'Run Marathon', category: 'health', progressPercentage: 70, emoji: '\uD83C\uDFC3' },
      ];

      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('Learn Guitar')).toBeTruthy();
      expect(getByText('35%')).toBeTruthy();
      expect(getByText('70%')).toBeTruthy();
    });

    it('navigates to dream detail on card press', function () {
      mockHookReturn.dreams = [
        { id: 42, title: 'Learn Guitar', category: 'hobbies', progressPercentage: 35 },
      ];

      var { getByLabelText } = render(
        React.createElement(HomeScreen),
      );

      fireEvent.press(getByLabelText('Learn Guitar, 35% complete'));
      expect(mockHookReturn.goToDreamDetail).toHaveBeenCalledWith(42);
    });
  });

  describe('events section', function () {
    it('does not render events section when empty', function () {
      mockHookReturn.events = [];

      var { queryByText } = render(
        React.createElement(HomeScreen),
      );

      expect(queryByText('Upcoming Events')).toBeNull();
    });

    it('renders events when present', function () {
      mockHookReturn.events = [
        { id: 1, title: 'Team Meeting', startTime: '2026-03-15T14:00:00Z', location: 'Office' },
      ];

      var { getByText } = render(
        React.createElement(HomeScreen),
      );

      expect(getByText('Upcoming Events')).toBeTruthy();
      expect(getByText('Team Meeting')).toBeTruthy();
      expect(getByText('Office')).toBeTruthy();
    });
  });

  describe('streak widget', function () {
    it('renders StreakWidget component', function () {
      var { getByTestId } = render(
        React.createElement(HomeScreen),
      );

      expect(getByTestId('streak-widget')).toBeTruthy();
    });
  });

  describe('onboarding tooltip', function () {
    it('renders onboarding tooltip', function () {
      var { getByTestId } = render(
        React.createElement(HomeScreen),
      );

      expect(getByTestId('onboarding-tooltip-home_greeting')).toBeTruthy();
    });
  });
});
