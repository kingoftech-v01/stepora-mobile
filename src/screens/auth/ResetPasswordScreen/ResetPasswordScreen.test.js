/**
 * Tests for src/screens/auth/ResetPasswordScreen/ResetPasswordScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { navigate: jest.fn(), goBack: jest.fn() },
  t: function (key) { return key; },
  validating: false,
  tokenExpired: false,
  success: false,
  newPassword: '',
  setNewPassword: jest.fn(),
  confirmPassword: '',
  setConfirmPassword: jest.fn(),
  serverError: '',
  submitting: false,
  strength: { level: 0, color: '#ccc', key: 'auth.weak' },
  handleSubmit: jest.fn(),
};

jest.mock('./useResetPasswordScreen', function () {
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

var ResetPasswordScreen = require('./ResetPasswordScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.validating = false;
  mockHookReturn.tokenExpired = false;
  mockHookReturn.success = false;
  mockHookReturn.serverError = '';
  mockHookReturn.newPassword = '';
});

describe('ResetPasswordScreen', function () {
  it('renders the form without crash', function () {
    var { getByText } = render(React.createElement(ResetPasswordScreen));
    expect(getByText('auth.setNewPassword')).toBeTruthy();
  });

  it('renders password inputs', function () {
    var { getByLabelText } = render(React.createElement(ResetPasswordScreen));
    expect(getByLabelText('auth.newPassword')).toBeTruthy();
    expect(getByLabelText('auth.confirmPassword')).toBeTruthy();
  });

  it('shows loading state when validating', function () {
    mockHookReturn.validating = true;
    var { UNSAFE_getByType } = render(React.createElement(ResetPasswordScreen));
    var ActivityIndicator = require('react-native').ActivityIndicator;
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('shows expired link message', function () {
    mockHookReturn.tokenExpired = true;
    var { getByText } = render(React.createElement(ResetPasswordScreen));
    expect(getByText('auth.resetLinkExpired')).toBeTruthy();
  });

  it('shows success message', function () {
    mockHookReturn.success = true;
    var { getByText } = render(React.createElement(ResetPasswordScreen));
    expect(getByText('auth.passwordResetSuccess')).toBeTruthy();
  });

  it('shows server error when present', function () {
    mockHookReturn.serverError = 'Token invalid';
    var { getByText } = render(React.createElement(ResetPasswordScreen));
    expect(getByText('Token invalid')).toBeTruthy();
  });
});
