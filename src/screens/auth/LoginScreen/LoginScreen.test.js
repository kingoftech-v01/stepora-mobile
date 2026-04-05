/**
 * Tests for src/screens/auth/LoginScreen/LoginScreen.js
 * Covers login form rendering, TFA view, social login buttons, error display.
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Mock the hook ──────────────────────────────────────────────

var mockHookReturn = {
  navigation: { navigate: jest.fn(), goBack: jest.fn() },
  t: function (key) { return key; },
  email: '',
  setEmail: jest.fn(),
  password: '',
  setPassword: jest.fn(),
  showPassword: false,
  setShowPassword: jest.fn(),
  serverError: '',
  submitting: false,
  loginCooldown: false,
  tfaRequired: false,
  tfaCode: '',
  setTfaCode: jest.fn(),
  handleSignIn: jest.fn(),
  handleTfaVerify: jest.fn(),
  resetTfa: jest.fn(),
  handleGoogleLogin: jest.fn(),
  handleAppleLogin: jest.fn(),
};

jest.mock('./useLoginScreen', function () {
  return function () {
    return mockHookReturn;
  };
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

var LoginScreen = require('./LoginScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.tfaRequired = false;
  mockHookReturn.serverError = '';
  mockHookReturn.submitting = false;
  mockHookReturn.loginCooldown = false;
  mockHookReturn.email = '';
  mockHookReturn.password = '';
});

describe('LoginScreen', function () {
  describe('login form', function () {
    it('renders without crash', function () {
      var { getByText } = render(React.createElement(LoginScreen));
      expect(getByText('auth.welcomeBack')).toBeTruthy();
    });

    it('renders email and password inputs', function () {
      var { getByLabelText } = render(React.createElement(LoginScreen));
      expect(getByLabelText('auth.email')).toBeTruthy();
      expect(getByLabelText('auth.password')).toBeTruthy();
    });

    it('renders sign in button', function () {
      var { getByLabelText } = render(React.createElement(LoginScreen));
      expect(getByLabelText('auth.signIn')).toBeTruthy();
    });

    it('renders social login buttons', function () {
      var { getByLabelText } = render(React.createElement(LoginScreen));
      expect(getByLabelText('Sign in with Google')).toBeTruthy();
      expect(getByLabelText('Sign in with Apple')).toBeTruthy();
    });

    it('renders forgot password link', function () {
      var { getByLabelText } = render(React.createElement(LoginScreen));
      expect(getByLabelText('auth.forgotPassword')).toBeTruthy();
    });

    it('calls handleSignIn on button press', function () {
      var { getByLabelText } = render(React.createElement(LoginScreen));
      fireEvent.press(getByLabelText('auth.signIn'));
      expect(mockHookReturn.handleSignIn).toHaveBeenCalled();
    });

    it('shows server error when present', function () {
      mockHookReturn.serverError = 'Invalid credentials';
      var { getByText } = render(React.createElement(LoginScreen));
      expect(getByText('Invalid credentials')).toBeTruthy();
    });

    it('renders Stepora logo', function () {
      var { getByLabelText } = render(React.createElement(LoginScreen));
      expect(getByLabelText('Stepora logo')).toBeTruthy();
    });
  });

  describe('TFA view', function () {
    it('shows TFA form when tfaRequired is true', function () {
      mockHookReturn.tfaRequired = true;
      var { getByText, getByLabelText } = render(React.createElement(LoginScreen));
      expect(getByText('auth.twoFactorTitle')).toBeTruthy();
      expect(getByLabelText('auth.enterCode')).toBeTruthy();
    });

    it('calls handleTfaVerify on verify press', function () {
      mockHookReturn.tfaRequired = true;
      var { getByLabelText } = render(React.createElement(LoginScreen));
      fireEvent.press(getByLabelText('auth.verify'));
      expect(mockHookReturn.handleTfaVerify).toHaveBeenCalled();
    });

    it('renders back to login link in TFA mode', function () {
      mockHookReturn.tfaRequired = true;
      var { getByLabelText } = render(React.createElement(LoginScreen));
      fireEvent.press(getByLabelText('auth.backToLogin'));
      expect(mockHookReturn.resetTfa).toHaveBeenCalled();
    });
  });
});
