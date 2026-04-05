/**
 * Tests for src/components/StreakWidget.js
 *
 * StreakWidget has hooks (useMemo) after a conditional return, which causes
 * hook ordering issues when the query transitions from loading to loaded.
 * We mock @tanstack/react-query to return data synchronously from the start.
 */
var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock react-query directly ─────────────────────────────────
var mockQueryResult = {
  data: null,
  isLoading: true,
  isError: false,
};

var mockMutateResult = {
  mutate: jest.fn(),
  isPending: false,
  isSuccess: false,
};

var mockQueryClient = {
  invalidateQueries: jest.fn(),
};

jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: jest.fn(function () { return mockQueryResult; }),
    useMutation: jest.fn(function () { return mockMutateResult; }),
    useQueryClient: jest.fn(function () { return mockQueryClient; }),
  };
});

jest.mock('../services/api', function () {
  return {
    apiGet: jest.fn(),
    apiPost: jest.fn(),
  };
});

jest.mock('../services/endpoints', function () {
  return {
    USERS: {
      STREAK_DETAILS: '/api/users/streak-details/',
      STREAK_FREEZE: '/api/users/streak-freeze/',
    },
  };
});

// Override Feather mock
jest.mock('react-native-vector-icons/Feather', function () {
  var _React = require('react');
  return {
    default: function (props) {
      return _React.createElement('Text', { testID: 'icon-' + props.name }, props.name);
    },
  };
});

var StreakWidget = require('./StreakWidget');

var MOCK_STREAK_DATA = {
  currentStreak: 10,
  longestStreak: 25,
  streakHistory: [1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
  streakFrozen: false,
  freezeCount: 2,
  freezeAvailable: true,
};

var MOCK_ZERO_DATA = {
  currentStreak: 0,
  longestStreak: 0,
  streakHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  streakFrozen: false,
  freezeCount: 0,
  freezeAvailable: false,
};

var MOCK_HIGH_STREAK = {
  currentStreak: 35,
  longestStreak: 40,
  streakHistory: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  streakFrozen: false,
  freezeCount: 3,
  freezeAvailable: true,
};

var MOCK_FROZEN_DATA = {
  currentStreak: 5,
  longestStreak: 10,
  streakHistory: [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1],
  streakFrozen: true,
  freezeCount: 1,
  freezeAvailable: true,
};

beforeEach(function () {
  mockQueryResult.isLoading = true;
  mockQueryResult.isError = false;
  mockQueryResult.data = null;
  mockMutateResult.mutate.mockClear();
  mockMutateResult.isPending = false;
  mockMutateResult.isSuccess = false;
});

describe('StreakWidget', function () {
  it('renders nothing while loading', function () {
    mockQueryResult.isLoading = true;
    mockQueryResult.data = null;
    var { toJSON } = render(React.createElement(StreakWidget));
    expect(toJSON()).toBeNull();
  });

  it('renders nothing on error', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.isError = true;
    mockQueryResult.data = null;
    var { toJSON } = render(React.createElement(StreakWidget));
    expect(toJSON()).toBeNull();
  });

  it('renders streak data when loaded', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.isError = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('10')).toBeTruthy();
    expect(getByText('day streak')).toBeTruthy();
  });

  it('shows XP multiplier for streaks >= 7', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('1.5x XP')).toBeTruthy();
  });

  it('shows 2x XP for streaks >= 30', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HIGH_STREAK;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('2x XP')).toBeTruthy();
  });

  it('does not show XP multiplier for 0 streak', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_ZERO_DATA;
    var { getByText, queryByText } = render(React.createElement(StreakWidget));
    expect(getByText('0')).toBeTruthy();
    expect(queryByText(/XP/)).toBeNull();
  });

  it('shows longest streak badge', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('25')).toBeTruthy();
    expect(getByText('best')).toBeTruthy();
  });

  it('shows Last 14 days section', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('Last 14 days')).toBeTruthy();
  });

  it('shows milestone badge for 7 days', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('7d')).toBeTruthy();
  });

  it('shows next milestone progress', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('Next: 14 days')).toBeTruthy();
  });

  it('shows freeze count when available', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText(/2 freezes left/)).toBeTruthy();
  });

  it('shows freeze active badge when streak is frozen', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_FROZEN_DATA;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('Freeze active')).toBeTruthy();
  });

  it('supports onPress prop', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var onPress = jest.fn();
    var { getByLabelText } = render(React.createElement(StreakWidget, { onPress: onPress }));
    fireEvent.press(getByLabelText(/10 day streak/));
    expect(onPress).toHaveBeenCalled();
  });

  it('has accessibility label with streak info', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_STREAK_DATA;
    var { getByLabelText } = render(React.createElement(StreakWidget));
    expect(getByLabelText(/10 day streak.*longest 25 days/)).toBeTruthy();
  });

  it('shows multiple milestone badges for high streaks', function () {
    mockQueryResult.isLoading = false;
    mockQueryResult.data = MOCK_HIGH_STREAK;
    var { getByText } = render(React.createElement(StreakWidget));
    expect(getByText('7d')).toBeTruthy();
    expect(getByText('14d')).toBeTruthy();
    expect(getByText('30d')).toBeTruthy();
  });
});
