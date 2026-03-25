/**
 * Tests for src/screens/dreams/DreamDetailScreen.js
 * Covers loading, error, dream info, progress, milestones, goals/tasks,
 * obstacles, menu modal, add modal, and delete confirm.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock the hook ──────────────────────────────────────────────

var mockHookReturn = {
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
  },
  id: 1,
  dreamQuery: {
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  },
  DREAM: {
    id: 1,
    title: 'Learn Guitar',
    description: 'Master basic chords and play songs',
    category: 'hobbies',
    categoryLabel: 'Hobbies',
    status: 'active',
  },
  progress: 42,
  goals: [],
  MILESTONES: [],
  obstacles: [],
  doneTasks: 3,
  totalTasks: 8,
  expanded: {},
  showAllGoals: false,
  setShowAllGoals: jest.fn(),
  showAllMilestones: false,
  setShowAllMilestones: jest.fn(),
  pendingCheckin: null,
  menuItems: [
    { label: 'Edit', icon: 'edit-2', action: jest.fn() },
    { label: 'Share', icon: 'share', action: jest.fn() },
    { label: 'Delete', icon: 'trash-2', action: jest.fn(), danger: true },
  ],
  showDeleteConfirm: false,
  setShowDeleteConfirm: jest.fn(),
  deleteDreamMut: { mutate: jest.fn() },
  milestoneCompleteMut: { mutate: jest.fn() },
  resolveObstacleMut: { mutate: jest.fn() },
  taskCompleteMut: { mutate: jest.fn() },
  toggleExpand: jest.fn(),
  toggleTask: jest.fn(),
  newTitle: '',
  setNewTitle: jest.fn(),
  newDesc: '',
  setNewDesc: jest.fn(),
  handleAddGoal: jest.fn(),
  handleAddTask: jest.fn(),
  STATUS_COLORS: {
    active: '#5DE5A8',
    completed: '#8B5CF6',
    paused: '#FCD34D',
  },
};

jest.mock('./useDreamDetailScreen', function () {
  return function () {
    return mockHookReturn;
  };
});

// Mock OnboardingTooltip
jest.mock('../../components/OnboardingTooltip', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(
      require('react-native').View,
      { testID: 'tooltip-' + (props.id || 'none') },
    );
  };
});

// Mock tooltip config
jest.mock('../../config/onboardingTooltips', function () {
  return {
    getTooltipConfig: function () { return null; },
    getTooltipCount: function () { return 0; },
  };
});

var DreamDetailScreen = require('./DreamDetailScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.dreamQuery.isLoading = false;
  mockHookReturn.dreamQuery.isError = false;
  mockHookReturn.goals = [];
  mockHookReturn.MILESTONES = [];
  mockHookReturn.obstacles = [];
  mockHookReturn.pendingCheckin = null;
  mockHookReturn.showDeleteConfirm = false;
});

describe('DreamDetailScreen', function () {
  describe('loading state', function () {
    it('shows loading indicator when loading', function () {
      mockHookReturn.dreamQuery.isLoading = true;

      var { UNSAFE_getByType } = render(
        React.createElement(DreamDetailScreen),
      );

      var ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('error state', function () {
    it('shows error message', function () {
      mockHookReturn.dreamQuery.isError = true;

      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Failed to load dream')).toBeTruthy();
    });

    it('shows retry button', function () {
      mockHookReturn.dreamQuery.isError = true;

      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      fireEvent.press(getByText('Retry'));
      expect(mockHookReturn.dreamQuery.refetch).toHaveBeenCalled();
    });
  });

  describe('header', function () {
    it('renders dream title', function () {
      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Learn Guitar')).toBeTruthy();
    });

    it('navigates back on back press', function () {
      var { getByLabelText } = render(
        React.createElement(DreamDetailScreen),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(mockHookReturn.navigation.goBack).toHaveBeenCalled();
    });

    it('opens menu on more options press', function () {
      var { getByLabelText, getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      fireEvent.press(getByLabelText('More options'));
      // Menu modal should now be visible with items
      expect(getByText('Edit')).toBeTruthy();
      expect(getByText('Share')).toBeTruthy();
      expect(getByText('Delete')).toBeTruthy();
    });
  });

  describe('dream info card', function () {
    it('shows progress percentage', function () {
      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('42%')).toBeTruthy();
      expect(getByText('Complete')).toBeTruthy();
    });

    it('shows dream description', function () {
      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Master basic chords and play songs')).toBeTruthy();
    });

    it('shows status badge', function () {
      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Active')).toBeTruthy();
    });

    it('shows category badge', function () {
      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Hobbies')).toBeTruthy();
    });
  });

  describe('stats row', function () {
    it('renders stats (goals, tasks, milestones)', function () {
      mockHookReturn.goals = [{ id: 1 }, { id: 2 }];
      mockHookReturn.MILESTONES = [{ id: 1 }];
      mockHookReturn.doneTasks = 3;
      mockHookReturn.totalTasks = 8;

      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Goals')).toBeTruthy();
      expect(getByText('Tasks')).toBeTruthy();
      expect(getByText('Milestones')).toBeTruthy();
      expect(getByText('3/8')).toBeTruthy();
    });
  });

  describe('checkin banner', function () {
    it('does not render when no pending checkin', function () {
      mockHookReturn.pendingCheckin = null;

      var { queryByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(queryByText('Check-in Available')).toBeNull();
    });

    it('renders when pending checkin exists', function () {
      mockHookReturn.pendingCheckin = { id: 99 };

      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Check-in Available')).toBeTruthy();
    });
  });

  describe('milestones', function () {
    it('does not render when empty', function () {
      mockHookReturn.MILESTONES = [];

      var { queryByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(queryByText('Milestones')).toBeNull();
    });

    it('renders milestone items', function () {
      mockHookReturn.MILESTONES = [
        { id: 1, label: 'Learn basic chords', done: false, active: true },
        { id: 2, label: 'Play first song', done: false, active: false },
      ];

      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Learn basic chords')).toBeTruthy();
      expect(getByText('Play first song')).toBeTruthy();
    });
  });

  describe('goals and tasks', function () {
    it('renders goal cards', function () {
      mockHookReturn.goals = [
        { id: 1, title: 'Master C Major', completed: false, tasks: [] },
      ];

      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Master C Major')).toBeTruthy();
    });

    it('renders add goal button', function () {
      var { getByLabelText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByLabelText('Add goal')).toBeTruthy();
    });
  });

  describe('obstacles', function () {
    it('does not render when empty', function () {
      mockHookReturn.obstacles = [];

      var { queryByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(queryByText('Obstacles')).toBeNull();
    });

    it('renders obstacle cards', function () {
      mockHookReturn.obstacles = [
        { id: 1, title: 'No time to practice', description: 'Work is busy', status: 'active' },
      ];

      var { getByText } = render(
        React.createElement(DreamDetailScreen),
      );

      expect(getByText('Obstacles')).toBeTruthy();
      expect(getByText('No time to practice')).toBeTruthy();
    });
  });
});
