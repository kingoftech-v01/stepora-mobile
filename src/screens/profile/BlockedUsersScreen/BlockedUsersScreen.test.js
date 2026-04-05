var React = require('react');
var { render } = require('@testing-library/react-native');
jest.mock('./useBlockedUsersScreen', function () {
  return function () { return {
    navigation: { goBack: jest.fn() }, t: function (k) { return k; }, loading: false,
    users: [], error: null, unblocking: null, confirmId: null,
    fetchBlocked: jest.fn(), handleUnblock: jest.fn(),
    getUserInitial: function () { return 'A'; }, getUserName: function () { return 'Alice'; },
    getBlockedDate: function () { return 'Jan 1'; }, getAvatarUrl: function () { return null; },
  }; };
});
jest.mock('../../../styles/colors', function () { return { BRAND: { bgDeep: '#000', purple: '#8B5CF6', redSolid: '#EF4444' } }; });
jest.mock('../../../styles/theme', function () { return { dark: { text: '#fff', textMuted: '#888', textTertiary: '#aaa', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222' } }; });
var Screen = require('./BlockedUsersScreen');
describe('BlockedUsersScreen', function () {
  it('renders without crash', function () { var { getByText } = render(React.createElement(Screen)); expect(getByText('Blocked Users')).toBeTruthy(); });
  it('has back button', function () { var { getByLabelText } = render(React.createElement(Screen)); expect(getByLabelText('Go back')).toBeTruthy(); });
});
