/**
 * Tests for src/screens/auth/VerifyEmailScreen/VerifyEmailScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { navigate: jest.fn() },
  t: function (key) { return key; },
  status: 'verifying',
  errorMsg: '',
  handleContinue: jest.fn(),
};

jest.mock('./useVerifyEmailScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../../styles/colors', function () {
  return { BRAND: { bgDeep: '#0F0A1E', purple: '#8B5CF6', purpleLight: '#C4B5FD', redSolid: '#EF4444' } };
});

jest.mock('../../../styles/theme', function () {
  return {
    dark: {
      text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc',
      glassBg: '#111', glassBorder: '#222',
    },
  };
});

var VerifyEmailScreen = require('./VerifyEmailScreen');

beforeEach(function () {
  jest.clearAllMocks();
  mockHookReturn.status = 'verifying';
  mockHookReturn.errorMsg = '';
});

describe('VerifyEmailScreen', function () {
  it('renders verifying state with loading indicator', function () {
    var { getByText, getByLabelText } = render(React.createElement(VerifyEmailScreen));
    expect(getByText('auth.verifyingEmail')).toBeTruthy();
    expect(getByLabelText('Verifying email')).toBeTruthy();
  });

  it('renders success state', function () {
    mockHookReturn.status = 'success';
    var { getByText, getByLabelText } = render(React.createElement(VerifyEmailScreen));
    expect(getByText('auth.emailVerified')).toBeTruthy();
    expect(getByLabelText('auth.signIn')).toBeTruthy();
  });

  it('renders error state', function () {
    mockHookReturn.status = 'error';
    mockHookReturn.errorMsg = 'Token expired';
    var { getByText } = render(React.createElement(VerifyEmailScreen));
    expect(getByText('auth.verificationFailed')).toBeTruthy();
    expect(getByText('Token expired')).toBeTruthy();
  });
});
