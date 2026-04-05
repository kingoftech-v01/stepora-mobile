/**
 * Tests for src/screens/dreams/CalibrationScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { goBack: jest.fn() },
  id: 1,
  mounted: true,
  currentQ: 0,
  questions: [{ id: 1, text: 'What experience?', type: 'choice', options: ['Beginner', 'Intermediate'] }],
  question: { id: 1, text: 'What experience?', type: 'choice', options: ['Beginner', 'Intermediate'] },
  progress: 33,
  answers: {},
  selectedOption: null,
  textValue: '',
  setTextValue: jest.fn(),
  completed: false,
  cardAnim: true,
  loadingQuestions: false,
  waitingForGeneration: false,
  submittingAnswer: false,
  generatingPlan: false,
  planResult: null,
  planError: null,
  calibrationCount: 0,
  planMessage: '',
  canProceed: false,
  handleSelect: jest.fn(),
  handleNext: jest.fn(),
  handleSkip: jest.fn(),
  handleCalibrationComplete: jest.fn(),
  BRAND: { purple: '#8B5CF6' },
  GRADIENTS: {},
  adaptColor: function () { return '#8B5CF6'; },
};

jest.mock('./useCalibrationScreen', function () {
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

var CalibrationScreen = require('./CalibrationScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.loadingQuestions = false;
});

describe('CalibrationScreen', function () {
  it('renders header without crash', function () {
    var { getByText } = render(React.createElement(CalibrationScreen));
    expect(getByText('Calibration')).toBeTruthy();
  });

  it('shows loading state', function () {
    mockHookReturn.loadingQuestions = true;
    var { UNSAFE_getByType } = render(React.createElement(CalibrationScreen));
    var ActivityIndicator = require('react-native').ActivityIndicator;
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders progress bar', function () {
    var { getByLabelText } = render(React.createElement(CalibrationScreen));
    expect(getByLabelText(/Calibration progress/)).toBeTruthy();
  });
});
