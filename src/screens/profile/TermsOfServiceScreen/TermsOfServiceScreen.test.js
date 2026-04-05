var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./useTermsOfServiceScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, mounted: true,
    SECTIONS: [{ title: 'Terms', content: 'By using...' }],
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222' } }; });
var Screen = require('./TermsOfServiceScreen');
describe('TermsOfServiceScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('Terms of Service')).toBeTruthy(); });
  it('has back button', function () { var { getByLabelText } = render(React.createElement(Screen)); expect(getByLabelText('Go back')).toBeTruthy(); });
});
