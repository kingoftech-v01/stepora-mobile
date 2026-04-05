var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./useTwoFactorScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, loading: false,
    enabled: false, step: 'status', setStep: jest.fn(), qrUri: '', secretKey: '',
    totpCode: '', setTotpCode: jest.fn(), backupCodes: [], password: '', setPassword: jest.fn(),
    error: '', setError: jest.fn(), submitting: false, copiedSecret: false, copiedBackup: false,
    fetchStatus: jest.fn(), handleStartSetup: jest.fn(), handleVerify: jest.fn(),
    handleViewBackupCodes: jest.fn(), handleDisable: jest.fn(),
    handleCopySecret: jest.fn(), handleCopyBackupCodes: jest.fn(),
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6', redSolid: '#EF4444', greenSolid: '#10B981' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222', surface: '#333', inputBorder: '#444' } }; });
var Screen = require('./TwoFactorScreen');
describe('TwoFactorScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('Two-Factor Authentication')).toBeTruthy(); });
  it('has back button', function () { var { getByLabelText } = render(React.createElement(Screen)); expect(getByLabelText('Go back')).toBeTruthy(); });
});
