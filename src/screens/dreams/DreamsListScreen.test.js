/**
 * Tests for src/screens/dreams/DreamsListScreen.js
 * Validates rendering of dreams, empty state, error state, loading,
 * and navigation interactions.
 */

var React = require('react');
var { render, fireEvent, waitFor } = require('@testing-library/react-native');

// ─── Mock the hook ──────────────────────────────────────────────

var mockHookReturn = {
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
  },
  activeFilter: 'all',
  setActiveFilter: jest.fn(),
  searchQuery: '',
  setSearchQuery: jest.fn(),
  dreamsInf: {
    isLoading: false,
    isError: false,
    loadingMore: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    items: [],
  },
  dreams: [],
  filtered: [],
  filters: [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'paused', label: 'Paused' },
  ],
  CAT_ICONS: {
    career: 'briefcase',
    hobbies: 'edit-3',
    health: 'heart',
    finance: 'dollar-sign',
    personal: 'cpu',
    relationships: 'users',
  },
  STATUS_CFG: {
    active: { icon: 'target', color: '#5DE5A8' },
    completed: { icon: 'check-circle', color: '#8B5CF6' },
    paused: { icon: 'pause-circle', color: '#FCD34D' },
    archived: { icon: 'archive', color: '#9CA3AF' },
  },
  CATEGORIES: {
    career: { label: 'Career' },
    health: { label: 'Health' },
  },
  catSolid: function () { return '#8B5CF6'; },
  BRAND: {},
};

jest.mock('./useDreamsListScreen', function () {
  return function () {
    return mockHookReturn;
  };
});

// Mock SubscriptionBanner
jest.mock('../../components/SubscriptionBanner', function () {
  var React = require('react');
  return function () {
    return React.createElement(require('react-native').View, { testID: 'subscription-banner' });
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
      return { id: 'dreams_list_create', message: 'Create your first dream!', position: 'bottom', target: 'addBtn' };
    },
  };
});

var DreamsListScreen = require('./DreamsListScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.dreamsInf.isLoading = false;
  mockHookReturn.dreamsInf.isError = false;
  mockHookReturn.filtered = [];
  mockHookReturn.activeFilter = 'all';
});

describe('DreamsListScreen', function () {
  describe('loading state', function () {
    it('shows loading indicator when loading', function () {
      mockHookReturn.dreamsInf.isLoading = true;

      var { UNSAFE_getByType } = render(
        React.createElement(DreamsListScreen),
      );

      var ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('still shows header during loading', function () {
      mockHookReturn.dreamsInf.isLoading = true;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('My Dreams')).toBeTruthy();
    });
  });

  describe('error state', function () {
    it('shows error message', function () {
      mockHookReturn.dreamsInf.isError = true;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('Failed to load dreams')).toBeTruthy();
    });

    it('shows retry button', function () {
      mockHookReturn.dreamsInf.isError = true;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('Retry')).toBeTruthy();
    });

    it('calls refetch on retry press', function () {
      mockHookReturn.dreamsInf.isError = true;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      fireEvent.press(getByText('Retry'));
      expect(mockHookReturn.dreamsInf.refetch).toHaveBeenCalled();
    });

    it('has alert accessibility role on error text', function () {
      mockHookReturn.dreamsInf.isError = true;

      var { getByRole } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByRole('alert')).toBeTruthy();
    });
  });

  describe('empty state', function () {
    it('shows empty message when no dreams and filter is all', function () {
      mockHookReturn.filtered = [];
      mockHookReturn.activeFilter = 'all';

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('No dreams yet. Create your first dream!')).toBeTruthy();
    });

    it('shows filtered empty message when filter is applied', function () {
      mockHookReturn.filtered = [];
      mockHookReturn.activeFilter = 'completed';

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('No dreams with this status.')).toBeTruthy();
    });
  });

  describe('dreams list', function () {
    var mockDreams = [
      {
        id: 1,
        title: 'Learn Guitar',
        category: 'hobbies',
        status: 'active',
        progressPercentage: 35,
        goalsCount: 5,
        completedGoalsCount: 2,
        xpEarned: 150,
        emoji: null,
        targetDate: null,
      },
      {
        id: 2,
        title: 'Run Marathon',
        category: 'health',
        categoryLabel: 'Health',
        status: 'active',
        progressPercentage: 70,
        goalsCount: 10,
        completedGoalsCount: 7,
        xpEarned: 300,
        emoji: '🏃',
        targetDate: '2026-12-31',
      },
    ];

    it('renders dream cards', function () {
      mockHookReturn.filtered = mockDreams;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('Learn Guitar')).toBeTruthy();
      expect(getByText('Run Marathon')).toBeTruthy();
    });

    it('displays progress percentages', function () {
      mockHookReturn.filtered = mockDreams;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('35%')).toBeTruthy();
      expect(getByText('70%')).toBeTruthy();
    });

    it('displays goal counts', function () {
      mockHookReturn.filtered = mockDreams;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('2/5 goals')).toBeTruthy();
      expect(getByText('7/10 goals')).toBeTruthy();
    });

    it('displays XP earned', function () {
      mockHookReturn.filtered = mockDreams;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('+150 XP')).toBeTruthy();
      expect(getByText('+300 XP')).toBeTruthy();
    });

    it('displays emoji when present', function () {
      mockHookReturn.filtered = mockDreams;

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('🏃')).toBeTruthy();
    });

    it('navigates to DreamDetail on card press', function () {
      mockHookReturn.filtered = [mockDreams[0]];

      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      fireEvent.press(getByText('Learn Guitar'));
      expect(mockHookReturn.navigation.navigate).toHaveBeenCalledWith(
        'DreamDetail',
        { id: 1 },
      );
    });
  });

  describe('header', function () {
    it('renders title', function () {
      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('My Dreams')).toBeTruthy();
    });

    it('navigates back on back button press', function () {
      var { getByLabelText } = render(
        React.createElement(DreamsListScreen),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(mockHookReturn.navigation.goBack).toHaveBeenCalled();
    });

    it('navigates to DreamCreate on add button press', function () {
      var { getByLabelText } = render(
        React.createElement(DreamsListScreen),
      );

      fireEvent.press(getByLabelText('Create new dream'));
      expect(mockHookReturn.navigation.navigate).toHaveBeenCalledWith('DreamCreate');
    });
  });

  describe('search', function () {
    it('renders search input', function () {
      var { getByLabelText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByLabelText('Search dreams')).toBeTruthy();
    });
  });

  describe('filters', function () {
    it('renders filter pills', function () {
      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Active')).toBeTruthy();
      expect(getByText('Completed')).toBeTruthy();
      expect(getByText('Paused')).toBeTruthy();
    });

    it('calls setActiveFilter when filter pill is pressed', function () {
      var { getByText } = render(
        React.createElement(DreamsListScreen),
      );

      fireEvent.press(getByText('Active'));
      expect(mockHookReturn.setActiveFilter).toHaveBeenCalledWith('active');
    });
  });

  describe('onboarding tooltip', function () {
    it('renders onboarding tooltip', function () {
      var { getByTestId } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByTestId('onboarding-tooltip-dreams_list_create')).toBeTruthy();
    });
  });

  describe('subscription banner', function () {
    it('renders SubscriptionBanner component', function () {
      var { getByTestId } = render(
        React.createElement(DreamsListScreen),
      );

      expect(getByTestId('subscription-banner')).toBeTruthy();
    });
  });
});
