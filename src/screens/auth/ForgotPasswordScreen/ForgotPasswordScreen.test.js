/**
 * Tests for src/screens/auth/ForgotPasswordScreen/ForgotPasswordScreen.js
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { navigate: jest.fn(), goBack: jest.fn() },
  t: function (key) { return key; },
  email: '',
  setEmail: jest.fn(),
  serverError: '',
  submitting: false,
  sent: false,
  handleSend: jest.fn(),
};

jest.mock('./useForgotPasswordScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../../styles/colors', function () {
  return { BRAND: { bgDeep: '#0F0A1E', purple: '#8B5CF6', redSolid: '#EF4444' } };
});

jest.mock('../../../styles/theme', function () {
  return {
    dark: {
      text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc',
      glassBg: '#111', glassBorder: '#222', surface: '#333', inputBorder: '#444',
    },
  };
});

var ForgotPasswordScreen = require('./ForgotPasswordScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.sent = false;
  mockHookReturn.serverError = '';
  mockHookReturn.submitting = false;
});

describe('ForgotPasswordScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(ForgotPasswordScreen));
    expect(getByText('auth.resetPassword')).toBeTruthy();
  });

  it('renders email input and send button', function () {
    var { getByLabelText } = render(React.createElement(ForgotPasswordScreen));
    expect(getByLabelText('auth.emailAddress')).toBeTruthy();
    expect(getByLabelText('auth.sendResetLink')).toBeTruthy();
  });

  it('calls handleSend on button press', function () {
    var { getByLabelText } = render(React.createElement(ForgotPasswordScreen));
    fireEvent.press(getByLabelText('auth.sendResetLink'));
    expect(mockHookReturn.handleSend).toHaveBeenCalled();
  });

  it('shows success view when email is sent', function () {
    mockHookReturn.sent = true;
    var { getByText } = render(React.createElement(ForgotPasswordScreen));
    expect(getByText('auth.emailSent')).toBeTruthy();
    expect(getByText('auth.emailSentDesc')).toBeTruthy();
  });

  it('shows server error when present', function () {
    mockHookReturn.serverError = 'User not found';
    var { getByText } = render(React.createElement(ForgotPasswordScreen));
    expect(getByText('User not found')).toBeTruthy();
  });

  it('renders back button', function () {
    var { getByLabelText } = render(React.createElement(ForgotPasswordScreen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
