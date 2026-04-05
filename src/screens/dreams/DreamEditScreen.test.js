/**
 * Tests for src/screens/dreams/DreamEditScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

jest.mock('@react-navigation/native', function () {
  return {
    useNavigation: function () { return { navigate: jest.fn(), goBack: jest.fn() }; },
    useRoute: function () { return { params: { id: 1 } }; },
  };
});

jest.mock('@tanstack/react-query', function () {
  return {
    useQuery: function () {
      return {
        data: { id: 1, title: 'Learn Piano', description: 'Master basics', category: 'hobbies', targetDate: '2026-06-01' },
        isLoading: false,
        isError: false,
      };
    },
    useQueryClient: function () { return { invalidateQueries: jest.fn() }; },
  };
});

jest.mock('../../services/api', function () {
  return {
    apiGet: jest.fn(function () { return Promise.resolve({}); }),
    apiPatch: jest.fn(function () { return Promise.resolve({}); }),
  };
});

jest.mock('../../services/endpoints', function () {
  return {
    DREAMS: {
      DETAIL: function (id) { return '/api/v1/dreams/' + id + '/'; },
    },
  };
});

jest.mock('../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6',
    },
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20 },
    RADIUS: { md: 14, lg: 16 },
  };
});

jest.mock('../../styles/colors', function () {
  return {
    catSolid: function () { return '#8B5CF6'; },
    BRAND: { purple: '#8B5CF6', greenSolid: '#10B981' },
  };
});

var DreamEditScreen = require('./DreamEditScreen');

describe('DreamEditScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(DreamEditScreen));
    expect(getByText('Edit Dream')).toBeTruthy();
  });

  it('renders category options', function () {
    var { getByText } = render(React.createElement(DreamEditScreen));
    expect(getByText('Career')).toBeTruthy();
    expect(getByText('Health')).toBeTruthy();
  });
});
