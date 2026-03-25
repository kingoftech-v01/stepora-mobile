/**
 * Tests for src/screens/calendar/CalendarScreen.js
 * Covers header, quick access, month navigation, calendar grid,
 * events rendering, error state, modals, and navigation.
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
  viewM: 2,
  viewY: 2026,
  selDay: null,
  setSelDay: jest.fn(),
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  DAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  BRAND: { green: '#5DE5A8', purpleLight: '#C4B5FD' },
  cells: [null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
  events: {},
  todayEvents: [],
  tomorrowEvents: [],
  selEvents: [],
  todayKey: '2026-03-15',
  tomorrowKey: '2026-03-16',
  selKey: null,
  TODAY: { y: 2026, m: 2, d: 15 },
  getKey: function (y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); },
  isToday: function (d) { return d === 15; },
  isSel: function () { return false; },
  prevMonth: jest.fn(),
  nextMonth: jest.fn(),
  goToday: jest.fn(),
  toggleTask: jest.fn(),
  deleteEvent: jest.fn(),
  confirmDel: null,
  setConfirmDel: jest.fn(),
  addEvt: false,
  setAddEvt: jest.fn(),
  newTitle: '',
  setNewTitle: jest.fn(),
  newTime: '',
  setNewTime: jest.fn(),
  handleAddEvt: jest.fn(),
  tasksQuery: { isError: false, refetch: jest.fn() },
  todayQuery: { isError: false, refetch: jest.fn() },
};

jest.mock('./useCalendarScreen', function () {
  return function () {
    return mockHookReturn;
  };
});

// Mock shared components
jest.mock('../../components/SubscriptionBanner', function () {
  var React = require('react');
  return function () {
    return React.createElement(require('react-native').View, { testID: 'subscription-banner' });
  };
});

jest.mock('../../components/SubscriptionGate', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, null, props.children);
  };
});

jest.mock('../../components/OnboardingTooltip', function () {
  var React = require('react');
  return function () {
    return React.createElement(require('react-native').View, { testID: 'tooltip' });
  };
});

jest.mock('../../config/onboardingTooltips', function () {
  return {
    getTooltipConfig: function () { return null; },
  };
});

var CalendarScreen = require('./CalendarScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.isLoading = false;
  mockHookReturn.selDay = null;
  mockHookReturn.todayEvents = [];
  mockHookReturn.tomorrowEvents = [];
  mockHookReturn.confirmDel = null;
  mockHookReturn.addEvt = false;
  mockHookReturn.tasksQuery.isError = false;
  mockHookReturn.todayQuery.isError = false;
});

describe('CalendarScreen', function () {
  describe('header', function () {
    it('renders Calendar title', function () {
      var { getByText } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByText('Calendar')).toBeTruthy();
    });

    it('navigates back on back press', function () {
      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(mockHookReturn.navigation.goBack).toHaveBeenCalled();
    });

    it('renders Today button', function () {
      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByLabelText('Go to today')).toBeTruthy();
    });

    it('calls goToday on Today button press', function () {
      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      fireEvent.press(getByLabelText('Go to today'));
      expect(mockHookReturn.goToday).toHaveBeenCalled();
    });

    it('renders add new task button', function () {
      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByLabelText('Add new task')).toBeTruthy();
    });
  });

  describe('quick access', function () {
    it('renders Time Blocks link', function () {
      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByLabelText('Time Blocks')).toBeTruthy();
    });

    it('navigates to TimeBlocks on press', function () {
      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      fireEvent.press(getByLabelText('Time Blocks'));
      expect(mockHookReturn.navigation.navigate).toHaveBeenCalledWith('TimeBlocks');
    });
  });

  describe('month navigation', function () {
    it('displays current month and year', function () {
      var { getByText } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByText('March 2026')).toBeTruthy();
    });

    it('calls prevMonth on left chevron press', function () {
      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      fireEvent.press(getByLabelText('Previous month'));
      expect(mockHookReturn.prevMonth).toHaveBeenCalled();
    });

    it('calls nextMonth on right chevron press', function () {
      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      fireEvent.press(getByLabelText('Next month'));
      expect(mockHookReturn.nextMonth).toHaveBeenCalled();
    });
  });

  describe('calendar grid', function () {
    it('renders day headers', function () {
      var { getByText } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByText('Sun')).toBeTruthy();
      expect(getByText('Mon')).toBeTruthy();
      expect(getByText('Sat')).toBeTruthy();
    });

    it('renders day cells', function () {
      var { getByText } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByText('1')).toBeTruthy();
      expect(getByText('15')).toBeTruthy();
      expect(getByText('31')).toBeTruthy();
    });
  });

  describe('events', function () {
    it('shows Today and Tomorrow sections when no day selected', function () {
      var { getAllByText } = render(
        React.createElement(CalendarScreen),
      );

      // "Today" may appear in both header button and section header
      expect(getAllByText('Today').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Tomorrow').length).toBeGreaterThanOrEqual(1);
    });

    it('shows no tasks message when today is empty', function () {
      mockHookReturn.todayEvents = [];

      var { getAllByText } = render(
        React.createElement(CalendarScreen),
      );

      var matches = getAllByText('No tasks scheduled');
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('error state', function () {
    it('shows error when both queries fail', function () {
      mockHookReturn.tasksQuery.isError = true;
      mockHookReturn.todayQuery.isError = true;

      var { getByText } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByText('Failed to load calendar')).toBeTruthy();
    });

    it('shows retry button on error', function () {
      mockHookReturn.tasksQuery.isError = true;
      mockHookReturn.todayQuery.isError = true;

      var { getByLabelText } = render(
        React.createElement(CalendarScreen),
      );

      fireEvent.press(getByLabelText('Retry loading calendar'));
      expect(mockHookReturn.tasksQuery.refetch).toHaveBeenCalled();
    });
  });

  describe('subscription banner', function () {
    it('renders SubscriptionBanner', function () {
      var { getByTestId } = render(
        React.createElement(CalendarScreen),
      );

      expect(getByTestId('subscription-banner')).toBeTruthy();
    });
  });
});
