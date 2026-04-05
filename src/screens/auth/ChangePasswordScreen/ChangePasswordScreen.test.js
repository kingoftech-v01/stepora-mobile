/**
 * Tests for src/screens/auth/ChangePasswordScreen/ChangePasswordScreen.js
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { navigate: jest.fn(), goBack: jest.fn() },
  t: function (key) { return key; },
  currentPassword: '',
  setCurrentPassword: jest.fn(),
  newPassword: '',
  setNewPassword: jest.fn(),
  confirmPassword: '',
  setConfirmPassword: jest.fn(),
  serverError: '',
  submitting: false,
  showToast: false,
  strength: { level: 0, color: '#ccc', key: 'auth.weak' },
  handleUpdate: jest.fn(),
};

jest.mock('./useChangePasswordScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../../styles/colors', function () {
  return { BRAND: { bgDeep: '#0F0A1E', purple: '#8B5CF6', redSolid: '#EF4444', greenSolid: '#10B981' } };
});

jest.mock('../../../styles/theme', function () {
  return {
    dark: {
      text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc',
      glassBg: '#111', glassBorder: '#222', surface: '#333', inputBorder: '#444',
    },
  };
});

var ChangePasswordScreen = require('./ChangePasswordScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.serverError = '';
  mockHookReturn.submitting = false;
  mockHookReturn.showToast = false;
  mockHookReturn.newPassword = '';
  mockHookReturn.confirmPassword = '';
});

describe('ChangePasswordScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(ChangePasswordScreen));
    expect(getByText('auth.changePassword')).toBeTruthy();
  });

  it('renders all password inputs', function () {
    var { getByLabelText } = render(React.createElement(ChangePasswordScreen));
    expect(getByLabelText('auth.currentPassword')).toBeTruthy();
    expect(getByLabelText('auth.newPassword')).toBeTruthy();
    expect(getByLabelText('auth.confirmNewPassword')).toBeTruthy();
  });

  it('renders update button', function () {
    var { getByLabelText } = render(React.createElement(ChangePasswordScreen));
    expect(getByLabelText('auth.updatePassword')).toBeTruthy();
  });

  it('shows server error', function () {
    mockHookReturn.serverError = 'Current password is wrong';
    var { getByText } = render(React.createElement(ChangePasswordScreen));
    expect(getByText('Current password is wrong')).toBeTruthy();
  });

  it('shows password tips', function () {
    var { getByText } = render(React.createElement(ChangePasswordScreen));
    expect(getByText('auth.passwordTips:')).toBeTruthy();
  });

  it('shows success toast', function () {
    mockHookReturn.showToast = true;
    var { getByText } = render(React.createElement(ChangePasswordScreen));
    // The toast contains the text
    expect(getByText(/auth\.passwordUpdated/)).toBeTruthy();
  });
});
