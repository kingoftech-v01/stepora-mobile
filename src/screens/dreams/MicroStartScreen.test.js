/**
 * Tests for src/screens/dreams/MicroStartScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { goBack: jest.fn() },
  allMicros: [
    { id: 'micro-1', title: 'Write 3 goals for today', emoji: '\uD83D\uDCDD', category: 'planning', xp: 15, duration: 300 },
  ],
  userMicros: [],
  tasksQuery: { isLoading: false },
  activeMicro: null,
  timeLeft: 300,
  isRunning: false,
  isPaused: false,
  completedMicros: [],
  showReward: false,
  lastRewardXp: 0,
  totalXpEarned: 0,
  startMicro: jest.fn(),
  pauseTimer: jest.fn(),
  resumeTimer: jest.fn(),
  resetTimer: jest.fn(),
  handleComplete: jest.fn(),
  handleSkip: jest.fn(),
  formatTimer: function (seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  },
};

jest.mock('./useMicroStartScreen', function () {
  return function () { return mockHookReturn; };
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
  return { BRAND: { purple: '#8B5CF6', greenSolid: '#10B981' } };
});

var MicroStartScreen = require('./MicroStartScreen');

describe('MicroStartScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(MicroStartScreen));
    expect(getByText('Micro Start')).toBeTruthy();
  });

  it('renders back button', function () {
    var { getByLabelText } = render(React.createElement(MicroStartScreen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
