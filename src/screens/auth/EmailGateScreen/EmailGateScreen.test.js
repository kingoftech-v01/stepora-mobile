/**
 * Tests for src/screens/auth/EmailGateScreen/EmailGateScreen.js
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

var mockHookReturn = {
  email: 'user@test.com',
  error: '',
  resending: false,
  resent: false,
  handleCheckNow: jest.fn(),
  handleResend: jest.fn(),
  handleLogout: jest.fn(),
};

jest.mock('./useEmailGateScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textTertiary: '#aaa', textMuted: '#888', red: '#EF4444',
    },
    SPACING: { xl: 20 },
    RADIUS: { xl: 20, md: 14 },
  };
});

jest.mock('../../../styles/colors', function () {
  return { BRAND: { purple: '#8B5CF6', purpleLight: '#C4B5FD', greenSolid: '#10B981' } };
});

var EmailGateScreen = require('./EmailGateScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.error = '';
  mockHookReturn.resending = false;
  mockHookReturn.resent = false;
});

describe('EmailGateScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(EmailGateScreen));
    expect(getByText('Verify Your Email')).toBeTruthy();
  });

  it('displays user email', function () {
    var { getByText } = render(React.createElement(EmailGateScreen));
    expect(getByText('user@test.com')).toBeTruthy();
  });

  it('renders I have Verified button', function () {
    var { getByLabelText } = render(React.createElement(EmailGateScreen));
    expect(getByLabelText("I've Verified My Email")).toBeTruthy();
  });

  it('calls handleCheckNow on verify press', function () {
    var { getByLabelText } = render(React.createElement(EmailGateScreen));
    fireEvent.press(getByLabelText("I've Verified My Email"));
    expect(mockHookReturn.handleCheckNow).toHaveBeenCalled();
  });

  it('renders logout button', function () {
    var { getByLabelText } = render(React.createElement(EmailGateScreen));
    expect(getByLabelText('Logout and Try Again')).toBeTruthy();
  });

  it('shows error when present', function () {
    mockHookReturn.error = 'Verification failed';
    var { getByText } = render(React.createElement(EmailGateScreen));
    expect(getByText('Verification failed')).toBeTruthy();
  });
});
