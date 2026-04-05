/**
 * Tests for src/screens/auth/RegisterScreen/RegisterScreen.js
 */

var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { navigate: jest.fn(), goBack: jest.fn() },
  t: function (key) { return key; },
  displayName: '',
  setDisplayName: jest.fn(),
  email: '',
  setEmail: jest.fn(),
  password: '',
  setPassword: jest.fn(),
  showPassword: false,
  confirmPassword: '',
  setConfirmPassword: jest.fn(),
  showConfirm: false,
  agreedToTerms: false,
  setAgreedToTerms: jest.fn(),
  errors: {},
  serverError: '',
  submitting: false,
  strength: { level: 0, color: '#ccc', key: 'auth.weak' },
  handleRegister: jest.fn(),
  handleGoogleLogin: jest.fn(),
  handleAppleLogin: jest.fn(),
};

jest.mock('./useRegisterScreen', function () {
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

var RegisterScreen = require('./RegisterScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.serverError = '';
  mockHookReturn.errors = {};
  mockHookReturn.submitting = false;
  mockHookReturn.agreedToTerms = false;
  mockHookReturn.password = '';
});

describe('RegisterScreen', function () {
  it('renders without crash', function () {
    var { getAllByText } = render(React.createElement(RegisterScreen));
    // auth.createAccount appears as both title and button text
    expect(getAllByText('auth.createAccount').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all form inputs', function () {
    var { getByLabelText } = render(React.createElement(RegisterScreen));
    expect(getByLabelText('auth.displayName')).toBeTruthy();
    expect(getByLabelText('auth.email')).toBeTruthy();
    expect(getByLabelText('auth.password')).toBeTruthy();
    expect(getByLabelText('auth.confirmPassword')).toBeTruthy();
  });

  it('renders social login buttons', function () {
    var { getByLabelText } = render(React.createElement(RegisterScreen));
    expect(getByLabelText('Sign up with Google')).toBeTruthy();
    expect(getByLabelText('Sign up with Apple')).toBeTruthy();
  });

  it('shows server error when present', function () {
    mockHookReturn.serverError = 'Email already exists';
    var { getByText } = render(React.createElement(RegisterScreen));
    expect(getByText('Email already exists')).toBeTruthy();
  });

  it('shows field errors', function () {
    mockHookReturn.errors = { email: 'Invalid email format' };
    var { getByText } = render(React.createElement(RegisterScreen));
    expect(getByText('Invalid email format')).toBeTruthy();
  });

  it('shows password strength meter when password has content', function () {
    mockHookReturn.password = 'test123';
    mockHookReturn.strength = { level: 1, color: '#EF4444', key: 'auth.weak' };
    var { getByText } = render(React.createElement(RegisterScreen));
    expect(getByText('auth.weak')).toBeTruthy();
  });

  it('renders sign in link', function () {
    var { getByLabelText } = render(React.createElement(RegisterScreen));
    expect(getByLabelText('auth.signIn')).toBeTruthy();
  });
});
