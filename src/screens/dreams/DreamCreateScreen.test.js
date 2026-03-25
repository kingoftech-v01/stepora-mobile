/**
 * Tests for src/screens/dreams/DreamCreateScreen.js
 * Covers form rendering, 3-step wizard, validation, category grid,
 * timeframe selection, AI auto-categorize, and navigation.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock the hook ──────────────────────────────────────────────

var mockHookReturn = {
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
    reset: jest.fn(),
  },
  navigateBack: jest.fn(),
  step: 0,
  setStep: jest.fn(),
  STEPS: ['Details', 'Category', 'Timeframe'],
  progressPercent: 33,
  title: '',
  setTitle: jest.fn(),
  description: '',
  setDescription: jest.fn(),
  category: null,
  setCategory: jest.fn(),
  timeframe: null,
  setTimeframe: jest.fn(),
  customDate: null,
  showCustom: false,
  setShowCustom: jest.fn(),
  calMonth: 2,
  calYear: 2026,
  touched: { 0: false, 1: false, 2: false },
  submitting: false,
  serverError: '',
  aiLoading: false,
  aiSuggestion: null,
  selectedTags: {},
  aiError: '',
  CATEGORIES: [
    { id: 'career', label: 'Career', icon: 'briefcase', color: '#8B5CF6' },
    { id: 'health', label: 'Health', icon: 'heart', color: '#10B981' },
    { id: 'finance', label: 'Finance', icon: 'dollar-sign', color: '#FCD34D' },
    { id: 'hobbies', label: 'Hobbies', icon: 'edit-3', color: '#EC4899' },
    { id: 'personal', label: 'Growth', icon: 'trending-up', color: '#6366F1' },
    { id: 'relationships', label: 'Social', icon: 'users', color: '#14B8A6' },
  ],
  TIMEFRAMES: [
    { id: '1m', label: '1 Month' },
    { id: '3m', label: '3 Months' },
    { id: '6m', label: '6 Months' },
    { id: '1y', label: '1 Year' },
  ],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  DAYS_LABELS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  canNext: function () { return false; },
  getValidationMessage: function () { return null; },
  handleNext: jest.fn(),
  handleAutoCategorize: jest.fn(),
  handleApplyAiCategory: jest.fn(),
  handleToggleTag: jest.fn(),
  getCalendarCells: function () { return []; },
  isSelectedDate: function () { return false; },
  isTodayDate: function () { return false; },
  isPastDate: function () { return false; },
  handleCalPrev: jest.fn(),
  handleCalNext: jest.fn(),
  handleSelectDate: jest.fn(),
};

jest.mock('./useDreamCreateScreen', function () {
  return function () {
    return mockHookReturn;
  };
});

// Mock SubscriptionGate
jest.mock('../../components/SubscriptionGate', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, null, props.children);
  };
});

var DreamCreateScreen = require('./DreamCreateScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.step = 0;
  mockHookReturn.title = '';
  mockHookReturn.description = '';
  mockHookReturn.category = null;
  mockHookReturn.timeframe = null;
  mockHookReturn.submitting = false;
  mockHookReturn.aiLoading = false;
  mockHookReturn.aiSuggestion = null;
  mockHookReturn.aiError = '';
  mockHookReturn.serverError = '';
  mockHookReturn.touched = { 0: false, 1: false, 2: false };
  mockHookReturn.canNext = function () { return false; };
});

describe('DreamCreateScreen', function () {
  describe('header', function () {
    it('renders Create Dream title', function () {
      var { getByText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByText('Create Dream')).toBeTruthy();
    });

    it('navigates back on back button press at step 0', function () {
      mockHookReturn.step = 0;

      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      fireEvent.press(getByLabelText('Go back'));
      expect(mockHookReturn.navigateBack).toHaveBeenCalled();
    });

    it('goes to previous step on back button at step > 0', function () {
      mockHookReturn.step = 1;

      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      fireEvent.press(getByLabelText('Previous step'));
      expect(mockHookReturn.setStep).toHaveBeenCalledWith(0);
    });
  });

  describe('step 0 - Details', function () {
    it('renders step title', function () {
      var { getByText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByText("What's Your Dream?")).toBeTruthy();
      expect(getByText('Describe your dream in detail')).toBeTruthy();
    });

    it('renders title and description inputs', function () {
      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByLabelText('Dream Title')).toBeTruthy();
      expect(getByLabelText('Dream Description')).toBeTruthy();
    });

    it('renders AI Auto-Categorize button', function () {
      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByLabelText('AI Auto-Categorize')).toBeTruthy();
    });

    it('shows AI error when present', function () {
      mockHookReturn.aiError = 'AI categorization failed';

      var { getByText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByText('AI categorization failed')).toBeTruthy();
    });
  });

  describe('step 1 - Category', function () {
    it('renders category grid', function () {
      mockHookReturn.step = 1;

      var { getByText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByText('Choose a Category')).toBeTruthy();
      expect(getByText('Career')).toBeTruthy();
      expect(getByText('Health')).toBeTruthy();
      expect(getByText('Finance')).toBeTruthy();
      expect(getByText('Hobbies')).toBeTruthy();
      expect(getByText('Growth')).toBeTruthy();
      expect(getByText('Social')).toBeTruthy();
    });

    it('calls setCategory when category is pressed', function () {
      mockHookReturn.step = 1;

      var { getByText } = render(
        React.createElement(DreamCreateScreen),
      );

      fireEvent.press(getByText('Career'));
      expect(mockHookReturn.setCategory).toHaveBeenCalledWith('career');
    });
  });

  describe('step 2 - Timeframe', function () {
    it('renders timeframe pills', function () {
      mockHookReturn.step = 2;

      var { getByText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByText('Set Your Timeframe')).toBeTruthy();
      expect(getByText('1 Month')).toBeTruthy();
      expect(getByText('3 Months')).toBeTruthy();
      expect(getByText('6 Months')).toBeTruthy();
      expect(getByText('1 Year')).toBeTruthy();
    });

    it('renders custom date picker toggle', function () {
      mockHookReturn.step = 2;

      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByLabelText('Pick a custom date')).toBeTruthy();
    });

    it('shows Create Dream button on last step', function () {
      mockHookReturn.step = 2;

      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByLabelText('Create Dream')).toBeTruthy();
    });
  });

  describe('navigation buttons', function () {
    it('renders Next button on step 0', function () {
      mockHookReturn.step = 0;

      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByLabelText('Next step')).toBeTruthy();
    });

    it('renders Back and Next on step 1', function () {
      mockHookReturn.step = 1;

      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByLabelText('Back')).toBeTruthy();
      expect(getByLabelText('Next step')).toBeTruthy();
    });

    it('calls handleNext on next press', function () {
      // Enable the next button for this test
      var origCanNext = mockHookReturn.canNext;
      mockHookReturn.canNext = function () { return true; };

      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      fireEvent.press(getByLabelText('Next step'));
      expect(mockHookReturn.handleNext).toHaveBeenCalled();

      mockHookReturn.canNext = origCanNext;
    });
  });

  describe('validation', function () {
    it('shows validation message when touched and invalid', function () {
      mockHookReturn.touched = { 0: true, 1: false, 2: false };
      mockHookReturn.getValidationMessage = function () { return 'Enter a dream title'; };

      var { getByText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByText('Enter a dream title')).toBeTruthy();
    });
  });

  describe('server error', function () {
    it('shows server error on step 2', function () {
      mockHookReturn.step = 2;
      mockHookReturn.serverError = 'Failed to create dream';

      var { getByText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByText('Failed to create dream')).toBeTruthy();
    });
  });

  describe('progress bar', function () {
    it('renders progress bar with accessibility', function () {
      var { getByLabelText } = render(
        React.createElement(DreamCreateScreen),
      );

      expect(getByLabelText('Step 1 of 3')).toBeTruthy();
    });
  });
});
