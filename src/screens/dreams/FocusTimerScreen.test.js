/**
 * Tests for src/screens/dreams/FocusTimerScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { goBack: jest.fn(), navigate: jest.fn() },
  selectedPreset: 'pomodoro',
  customMinutes: 25,
  timeLeft: 1500,
  isRunning: false,
  isPaused: false,
  isBreak: false,
  sessionsCompleted: 3,
  totalFocusTime: 4500,
  dreams: [],
  selectedDreamId: null,
  setSelectedDreamId: jest.fn(),
  selectedTaskId: null,
  setSelectedTaskId: jest.fn(),
  showDreamPicker: false,
  setShowDreamPicker: jest.fn(),
  sessionId: null,
  history: [],
  stats: {},
  selectPreset: jest.fn(),
  setCustomDuration: jest.fn(),
  startTimer: jest.fn(),
  pauseTimer: jest.fn(),
  resumeTimer: jest.fn(),
  resetTimer: jest.fn(),
  formatTimer: function (seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  },
  formatTotalTime: function () { return '75m'; },
  PRESET_DURATIONS: [
    { key: 'short', label: '15 min', work: 900, breakTime: 180 },
    { key: 'pomodoro', label: '25 min', work: 1500, breakTime: 300 },
    { key: 'long', label: '45 min', work: 2700, breakTime: 600 },
    { key: 'deep', label: '60 min', work: 3600, breakTime: 900 },
  ],
};

jest.mock('./useFocusTimerScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../components/OnboardingTooltip', function () {
  var React = require('react');
  return function () { return React.createElement(require('react-native').View, { testID: 'tooltip' }); };
});

jest.mock('../../config/onboardingTooltips', function () {
  return { getTooltipConfig: function () { return null; } };
});

jest.mock('../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6',
    },
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20 },
    RADIUS: { md: 14, lg: 16, full: 999 },
  };
});

jest.mock('../../styles/colors', function () {
  return {
    BRAND: { purple: '#8B5CF6', greenSolid: '#10B981' },
    catSolid: function () { return '#8B5CF6'; },
  };
});

var FocusTimerScreen = require('./FocusTimerScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.isRunning = false;
});

describe('FocusTimerScreen', function () {
  it('renders header without crash', function () {
    var { getByText } = render(React.createElement(FocusTimerScreen));
    expect(getByText('Focus Timer')).toBeTruthy();
  });

  it('shows session count', function () {
    var { getByLabelText } = render(React.createElement(FocusTimerScreen));
    expect(getByLabelText('3 sessions completed')).toBeTruthy();
  });

  it('renders timer display', function () {
    var { getByText } = render(React.createElement(FocusTimerScreen));
    expect(getByText('25:00')).toBeTruthy();
  });
});
