/**
 * Tests for src/screens/auth/OnboardingScreen/OnboardingScreen.js
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

var mockHookReturn = {
  step: 1,
  totalSteps: 5,
  displayName: '',
  setDisplayName: jest.fn(),
  avatarUri: null,
  handlePickAvatar: jest.fn(),
  handleTakePhoto: jest.fn(),
  selectedInterests: [],
  toggleInterest: jest.fn(),
  INTEREST_OPTIONS: [
    { key: 'career', label: 'Career', emoji: '\uD83D\uDCBC' },
    { key: 'health', label: 'Health', emoji: '\u2764\uFE0F' },
  ],
  notifGranted: null,
  handleRequestNotifications: jest.fn(),
  error: '',
  submitting: false,
  goNext: jest.fn(),
  goBack: jest.fn(),
  skipStep: jest.fn(),
};

jest.mock('./useOnboardingScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textSecondary: '#ccc', textMuted: '#888', textTertiary: '#aaa', red: '#EF4444',
    },
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20 },
    RADIUS: { md: 14, lg: 16, full: 999 },
  };
});

jest.mock('../../../styles/colors', function () {
  return { BRAND: { purple: '#8B5CF6', greenSolid: '#10B981', yellow: '#FCD34D' } };
});

jest.mock('../../../styles/theme', function () {
  return { dark: { text: '#fff', textMuted: '#888' } };
});

var OnboardingScreen = require('./OnboardingScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.step = 1;
  mockHookReturn.error = '';
  mockHookReturn.submitting = false;
  mockHookReturn.selectedInterests = [];
  mockHookReturn.notifGranted = null;
});

describe('OnboardingScreen', function () {
  it('renders step 1 without crash', function () {
    var { getByText } = render(React.createElement(OnboardingScreen));
    expect(getByText('Welcome to Stepora!')).toBeTruthy();
  });

  it('renders step indicator', function () {
    var { getByLabelText } = render(React.createElement(OnboardingScreen));
    expect(getByLabelText('Step 1 of 5')).toBeTruthy();
  });

  it('renders name input on step 1', function () {
    var { getByLabelText } = render(React.createElement(OnboardingScreen));
    expect(getByLabelText('Your name')).toBeTruthy();
  });

  it('renders step 2 avatar upload', function () {
    mockHookReturn.step = 2;
    var { getByText, getByLabelText } = render(React.createElement(OnboardingScreen));
    expect(getByText('Add a Profile Photo')).toBeTruthy();
    expect(getByLabelText('Choose photo from gallery')).toBeTruthy();
    expect(getByLabelText('Take photo with camera')).toBeTruthy();
  });

  it('renders step 3 interests', function () {
    mockHookReturn.step = 3;
    var { getByText } = render(React.createElement(OnboardingScreen));
    expect(getByText('What are you into?')).toBeTruthy();
    expect(getByText('Career')).toBeTruthy();
    expect(getByText('Health')).toBeTruthy();
  });

  it('renders step 4 notifications', function () {
    mockHookReturn.step = 4;
    var { getByText, getByLabelText } = render(React.createElement(OnboardingScreen));
    expect(getByText('Stay on Track')).toBeTruthy();
    expect(getByLabelText('Enable Notifications')).toBeTruthy();
  });

  it('renders step 5 personality quiz intro', function () {
    mockHookReturn.step = 5;
    var { getByText } = render(React.createElement(OnboardingScreen));
    expect(getByText('Discover Your Dreamer Type')).toBeTruthy();
  });

  it('shows error when present', function () {
    mockHookReturn.error = 'Name required';
    var { getByText } = render(React.createElement(OnboardingScreen));
    expect(getByText('Name required')).toBeTruthy();
  });
});
