/**
 * Tests for src/screens/dreams/SharedDreamsScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockNavigate = jest.fn();
var mockGoBack = jest.fn();
jest.mock('@react-navigation/native', function () {
  return {
    useNavigation: function () { return { navigate: mockNavigate, goBack: mockGoBack }; },
  };
});

jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: function () { return { data: [], isLoading: false }; },
    useQueryClient: function () { return { invalidateQueries: jest.fn() }; },
  };
});

jest.mock('../../hooks/useInfiniteList', function () {
  return function () {
    return { items: [], isLoading: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn(function () { return Promise.resolve(); }) };
  };
});

jest.mock('../../services/api', function () {
  return { apiGet: jest.fn(function () { return Promise.resolve([]); }) };
});

jest.mock('../../services/endpoints', function () {
  return { DREAMS: { SHARED_WITH_ME: '/api/v1/dreams/shared/' } };
});

jest.mock('../../styles/colors', function () {
  return {
    BRAND: { purple: '#8B5CF6' },
    CATEGORIES: {},
  };
});

jest.mock('../../styles/theme', function () {
  return { dark: { text: '#fff', textMuted: '#888', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222' } };
});

jest.mock('../../styles/tokens', function () {
  return {
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
    FONT_SIZES: { sm: 13, md: 15, lg: 17, xl: 20 },
    FONT_WEIGHTS: { medium: '500', semibold: '600', bold: '700' },
    RADIUS: { md: 14, lg: 16 },
  };
});

jest.mock('../../theme/tokens', function () {
  return {
    COLORS: { text: '#fff', textMuted: '#888', textSecondary: '#ccc', glassBg: '#111', glassBorder: '#222', accent: '#8B5CF6' },
    CONTACT_COLORS: ['#8B5CF6', '#10B981', '#EC4899'],
  };
});

jest.mock('../../components/GlassCard', function () {
  var React = require('react');
  return function (props) { return React.createElement(require('react-native').View, null, props.children); };
});

jest.mock('../../components/PillTabs', function () {
  var React = require('react');
  return function (props) {
    return React.createElement(require('react-native').View, { testID: 'pill-tabs' },
      props.tabs.map(function (tab) {
        return React.createElement(require('react-native').Text, { key: tab.key }, tab.label);
      })
    );
  };
});

jest.mock('../../components/ScreenHeader', function () {
  var React = require('react');
  return {
    ScreenHeader: function (props) {
      return React.createElement(require('react-native').View, { testID: 'screen-header' },
        React.createElement(require('react-native').Text, null, props.title),
        props.left
      );
    },
    BackButton: function (props) {
      return React.createElement(require('react-native').TouchableOpacity, {
        onPress: props.onPress, accessibilityLabel: 'Go back',
      });
    },
  };
});

jest.mock('../../components/shared/Avatar', function () {
  var React = require('react');
  return function () { return React.createElement(require('react-native').View, { testID: 'avatar' }); };
});

var SharedDreamsScreen = require('./SharedDreamsScreen');

describe('SharedDreamsScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(SharedDreamsScreen));
    expect(getByText('Shared Dreams')).toBeTruthy();
  });

  it('renders filter tabs', function () {
    var { getByText } = render(React.createElement(SharedDreamsScreen));
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('Circles')).toBeTruthy();
  });
});
