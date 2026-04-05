/**
 * Tests for BuddyScreen
 */
var React = require('react');
var { render } = require('@testing-library/react-native');

jest.mock('@react-navigation/native', function () {
  return { useNavigation: function () { return { navigate: jest.fn(), goBack: jest.fn() }; } };
});
jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: function () { return { data: null, isLoading: false }; },
    useQueryClient: function () { return { invalidateQueries: jest.fn() }; },
    useMutation: function () { return { mutate: jest.fn(), isPending: false }; },
  };
});
jest.mock('../../services/api', function () { return { apiGet: jest.fn(), apiPost: jest.fn() }; });
jest.mock('../../services/endpoints', function () { return { BUDDIES: { MY_BUDDY: '/api/', SEARCH: '/api/', REQUESTS: '/api/', REQUEST: jest.fn(), ACCEPT: jest.fn(), DECLINE: jest.fn(), REMOVE: jest.fn() } }; });
jest.mock('../../components/shared/ScreenShell', function () {
  var React = require('react'); return function (p) { return React.createElement(require('react-native').View, null, p.children); };
});
jest.mock('../../components/shared/GlassHeader', function () {
  var React = require('react'); return function (p) { return React.createElement(require('react-native').View, null, React.createElement(require('react-native').Text, null, p.title)); };
});
jest.mock('../../components/shared/GlassCard', function () {
  var React = require('react'); return function (p) { return React.createElement(require('react-native').View, null, p.children); };
});
jest.mock('../../components/shared/Avatar', function () {
  var React = require('react'); return function () { return React.createElement(require('react-native').View, { testID: 'avatar' }); };
});
jest.mock('../../theme/tokens', function () {
  return { COLORS: { bodyBg: '#000', glassBg: '#111', glassBorder: '#222', text: '#fff', textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6' }, SPACING: { sm: 8, md: 12, lg: 16, xl: 20 }, RADIUS: { md: 14, lg: 16, full: 999 }, CONTACT_COLORS: ['#8B5CF6'] };
});

var Screen = require('./BuddyScreen');

describe('BuddyScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(Screen));
    expect(getByText('Buddy')).toBeTruthy();
  });
  it('renders screen shell', function () {
    render(React.createElement(Screen));
  });
});
