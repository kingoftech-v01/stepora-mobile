/**
 * Tests for src/screens/auth/PersonalityQuizScreen/PersonalityQuizScreen.js
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

var mockHookReturn = {
  currentQ: 0,
  totalQuestions: 5,
  progress: 20,
  loading: false,
  showResult: false,
  answers: {},
  question: {
    question: 'How do you approach new challenges?',
    options: [
      { text: 'Dive right in', icon: 'zap' },
      { text: 'Research first', icon: 'book' },
      { text: 'Ask for help', icon: 'users' },
    ],
  },
  cfg: {
    title: 'Visionary',
    icon: 'star',
    color: '#8B5CF6',
    description: 'Creative thinker',
    traits: ['Innovative', 'Bold'],
  },
  result: null,
  error: '',
  handleAnswer: jest.fn(),
  handleContinue: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('./usePersonalityQuizScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textSecondary: '#ccc', textMuted: '#888', red: '#EF4444',
    },
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20 },
    RADIUS: { md: 14, lg: 16 },
  };
});

jest.mock('../../../styles/colors', function () {
  return { BRAND: { purple: '#8B5CF6' } };
});

var PersonalityQuizScreen = require('./PersonalityQuizScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.loading = false;
  mockHookReturn.showResult = false;
  mockHookReturn.currentQ = 0;
  mockHookReturn.error = '';
});

describe('PersonalityQuizScreen', function () {
  it('renders question screen without crash', function () {
    var { getByText } = render(React.createElement(PersonalityQuizScreen));
    expect(getByText('How do you approach new challenges?')).toBeTruthy();
  });

  it('renders question options', function () {
    var { getByText } = render(React.createElement(PersonalityQuizScreen));
    expect(getByText('Dive right in')).toBeTruthy();
    expect(getByText('Research first')).toBeTruthy();
    expect(getByText('Ask for help')).toBeTruthy();
  });

  it('shows progress label', function () {
    var { getByText } = render(React.createElement(PersonalityQuizScreen));
    expect(getByText('Question 1 of 5')).toBeTruthy();
  });

  it('shows loading state during analysis', function () {
    mockHookReturn.loading = true;
    var { getByText } = render(React.createElement(PersonalityQuizScreen));
    expect(getByText('Analyzing your personality...')).toBeTruthy();
  });

  it('shows result screen', function () {
    mockHookReturn.showResult = true;
    var { getByText, getByLabelText } = render(React.createElement(PersonalityQuizScreen));
    expect(getByText('Visionary')).toBeTruthy();
    expect(getByText('Your Key Traits')).toBeTruthy();
    expect(getByLabelText('Start Your Journey')).toBeTruthy();
  });

  it('shows error when present', function () {
    mockHookReturn.error = 'Quiz failed';
    var { getByText } = render(React.createElement(PersonalityQuizScreen));
    expect(getByText('Quiz failed')).toBeTruthy();
  });
});
