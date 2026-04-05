var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./useAppVersionScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, mounted: true,
    appVersion: '1.0.0', buildNumber: '1', checking: false,
    updateAvailable: false, latestVersion: '1.0.0', changelog: [],
    loadingChangelog: false, error: null,
    infoItems: [{ label: 'Version', value: '1.0.0' }], systemInfo: [{ label: 'Version', value: '1.0.0' }],
    checkForUpdates: jest.fn(), handleRateApp: jest.fn(), handleReportBug: jest.fn(),
    handleFeedback: jest.fn(), handleUpdate: jest.fn(),
    adaptColor: function () { return '#8B5CF6'; }, BRAND: { purple: '#8B5CF6' },
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222' } }; });
var Screen = require('./AppVersionScreen');
describe('AppVersionScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('App Info')).toBeTruthy(); });
  it('shows version info', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('1.0.0')).toBeTruthy(); });
});
