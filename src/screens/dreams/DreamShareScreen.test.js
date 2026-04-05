/**
 * Tests for src/screens/dreams/DreamShareScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { goBack: jest.fn() },
  mounted: true,
  sharedInf: { items: [], isLoading: false, hasNextPage: false, fetchNextPage: jest.fn() },
  dreams: [],
  BRAND: { purple: '#8B5CF6' },
  adaptColor: function () { return '#8B5CF6'; },
};

jest.mock('./useSharedDreamsScreen', function () {
  return function () { return mockHookReturn; };
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
  return { BRAND: { purple: '#8B5CF6' } };
});

var DreamShareScreen = require('./DreamShareScreen');

describe('DreamShareScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(DreamShareScreen));
    expect(getByText('Shared Dreams')).toBeTruthy();
  });

  it('renders subtitle', function () {
    var { getByText } = render(React.createElement(DreamShareScreen));
    expect(getByText('Dreams shared with you')).toBeTruthy();
  });

  it('renders back button', function () {
    var { getByLabelText } = render(React.createElement(DreamShareScreen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
