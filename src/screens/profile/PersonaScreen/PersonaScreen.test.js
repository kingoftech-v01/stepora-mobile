var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./usePersonaScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, mounted: true,
    form: {}, dirty: false, saving: false, loading: false, error: null,
    SECTIONS: [], handleChange: jest.fn(), handleSave: jest.fn(),
    completionPct: 50, ringR: 40, ringC: 251, ringOffset: 125,
    BRAND: { purple: '#8B5CF6' }, GRADIENTS: {}, adaptColor: function () { return '#8B5CF6'; },
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222' } }; });
var Screen = require('./PersonaScreen');
describe('PersonaScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('profile.persona')).toBeTruthy(); });
  it('has back button', function () { var { getByLabelText } = render(React.createElement(Screen)); expect(getByLabelText('common.back')).toBeTruthy(); });
});
