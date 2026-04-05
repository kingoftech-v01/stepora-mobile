var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./usePrivacyPolicyScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, mounted: true,
    SECTIONS: [{ title: 'Data Collection', content: 'We collect...' }],
    adaptColor: function () { return '#8B5CF6'; },
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222' } }; });
var Screen = require('./PrivacyPolicyScreen');
describe('PrivacyPolicyScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('Privacy Policy')).toBeTruthy(); });
  it('has back button', function () { var { getByLabelText } = render(React.createElement(Screen)); expect(getByLabelText('Go back')).toBeTruthy(); });
});
