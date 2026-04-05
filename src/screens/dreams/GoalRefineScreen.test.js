/**
 * Tests for src/screens/dreams/GoalRefineScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockRef = { current: null };

var mockHookReturn = {
  navigation: { goBack: jest.fn() },
  goalId: 1,
  goalTitle: 'Learn Guitar',
  goalDescription: 'Master basics',
  dreamId: 1,
  messages: [
    { role: 'assistant', content: 'What specific goal would you like to refine?' },
  ],
  input: '',
  setInput: jest.fn(),
  isLoading: false,
  refinedGoal: null,
  milestones: null,
  isComplete: false,
  step: 0,
  isApplying: false,
  applied: false,
  error: null,
  flatListRef: mockRef,
  inputRef: mockRef,
  handleSend: jest.fn(),
  handleApply: jest.fn(),
  handleDone: jest.fn(),
  STEPS: ['Understanding', 'Clarifying', 'Refining', 'SMART Goal Ready'],
  SMART_CRITERIA: [
    { key: 'specific', label: 'Specific', icon: 'crosshair', color: '#8B5CF6' },
  ],
  scrollToBottom: jest.fn(),
};

jest.mock('./useGoalRefineScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../components/SubscriptionGate', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, null, props.children);
  };
});

jest.mock('../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6',
    },
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20 },
    RADIUS: { md: 14, lg: 16 },
  };
});

jest.mock('../../styles/colors', function () {
  return { BRAND: { purple: '#8B5CF6' } };
});

var GoalRefineScreen = require('./GoalRefineScreen');

describe('GoalRefineScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(GoalRefineScreen));
    expect(getByText('Refine with AI')).toBeTruthy();
  });

  it('renders back button', function () {
    var { getByLabelText } = render(React.createElement(GoalRefineScreen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
