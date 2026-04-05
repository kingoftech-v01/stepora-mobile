/**
 * Tests for SharedCalendarViewScreen
 */
var React = require('react');
var { render } = require('@testing-library/react-native');

jest.mock('@react-navigation/native', function () {
  return {
    useNavigation: function () { return { navigate: jest.fn(), goBack: jest.fn() }; },
    useRoute: function () { return { params: { shareId: 1, userName: 'Alice' } }; },
  };
});
jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: function () { return { data: { events: [], sharedBy: { displayName: 'Alice' } }, isLoading: false }; },
    useQueryClient: function () { return { invalidateQueries: jest.fn() }; },
    useMutation: function () { return { mutate: jest.fn(), isPending: false }; },
  };
});
jest.mock('../../services/api', function () { return { apiGet: jest.fn(), apiPost: jest.fn(), apiPatch: jest.fn() }; });
jest.mock('../../services/endpoints', function () { return { CALENDAR: { SHARING: { DETAIL: function () { return '/api/'; }, EVENTS: function () { return '/api/'; } } } }; });
jest.mock('../../components/shared/Avatar', function () {
  var React = require('react');
  return function () { return React.createElement(require('react-native').View, { testID: 'avatar' }); };
});
jest.mock('../../theme/tokens', function () {
  return { COLORS: { bodyBg: '#000', glassBg: '#111', glassBorder: '#222', text: '#fff', textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6' }, SPACING: { sm: 8, md: 12, lg: 16, xl: 20 }, RADIUS: { md: 14, lg: 16, full: 999 }, CONTACT_COLORS: ['#8B5CF6'] };
});

var Screen = require('./SharedCalendarViewScreen');

describe('SharedCalendarViewScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(Screen));
    expect(getByText('Shared Calendar')).toBeTruthy();
  });
  it('has back button', function () {
    var { getByLabelText } = render(React.createElement(Screen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
