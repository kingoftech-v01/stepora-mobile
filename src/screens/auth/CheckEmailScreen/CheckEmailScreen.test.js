/**
 * Tests for src/screens/auth/CheckEmailScreen/CheckEmailScreen.js
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { navigate: jest.fn() },
  t: function (key) { return key; },
  email: 'test@example.com',
  resending: false,
  resent: false,
  handleResend: jest.fn(),
};

jest.mock('./useCheckEmailScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../../styles/colors', function () {
  return { BRAND: { bgDeep: '#0F0A1E', purple: '#8B5CF6', redSolid: '#EF4444', greenSolid: '#10B981' } };
});

jest.mock('../../../styles/theme', function () {
  return {
    dark: {
      text: '#fff', textMuted: '#888', textTertiary: '#aaa',
      glassBg: '#111', glassBorder: '#222',
    },
  };
});

var CheckEmailScreen = require('./CheckEmailScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.resending = false;
  mockHookReturn.resent = false;
  mockHookReturn.email = 'test@example.com';
});

describe('CheckEmailScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(CheckEmailScreen));
    expect(getByText('auth.checkEmail')).toBeTruthy();
  });

  it('displays the user email', function () {
    var { getByText } = render(React.createElement(CheckEmailScreen));
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('renders resend button', function () {
    var { getByLabelText } = render(React.createElement(CheckEmailScreen));
    expect(getByLabelText('auth.resendEmail')).toBeTruthy();
  });

  it('calls handleResend on press', function () {
    var { getByLabelText } = render(React.createElement(CheckEmailScreen));
    fireEvent.press(getByLabelText('auth.resendEmail'));
    expect(mockHookReturn.handleResend).toHaveBeenCalled();
  });

  it('shows resent label after resend', function () {
    mockHookReturn.resent = true;
    var { getByLabelText } = render(React.createElement(CheckEmailScreen));
    expect(getByLabelText('auth.emailResent')).toBeTruthy();
  });

  it('renders go to login button', function () {
    var { getByLabelText } = render(React.createElement(CheckEmailScreen));
    expect(getByLabelText('auth.goToLogin')).toBeTruthy();
  });
});
