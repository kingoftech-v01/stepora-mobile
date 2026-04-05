/**
 * Tests for src/screens/dreams/CheckInScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { goBack: jest.fn(), navigate: jest.fn() },
  mounted: true,
  step: 'loading',
  checkin: null,
  questions: [],
  currentQ: 0,
  answers: {},
  cardAnim: true,
  result: null,
  handleSelectAnswer: jest.fn(),
  handleTextAnswer: jest.fn(),
  handleNext: jest.fn(),
  handleBack: jest.fn(),
  handleSubmit: jest.fn(),
  progress: 0,
  submitting: false,
  textValue: '',
  setTextValue: jest.fn(),
};

jest.mock('./useCheckInScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6', red: '#EF4444',
    },
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20 },
    RADIUS: { md: 14, lg: 16 },
  };
});

var CheckInScreen = require('./CheckInScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.step = 'loading';
});

describe('CheckInScreen', function () {
  it('renders header without crash', function () {
    var { getByText } = render(React.createElement(CheckInScreen));
    expect(getByText('Check-in')).toBeTruthy();
  });

  it('shows loading state', function () {
    var { getByText } = render(React.createElement(CheckInScreen));
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('shows error state', function () {
    mockHookReturn.step = 'error';
    var { getByText } = render(React.createElement(CheckInScreen));
    expect(getByText('Failed to load check-in')).toBeTruthy();
  });
});
