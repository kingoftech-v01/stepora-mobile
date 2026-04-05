/**
 * Tests for src/screens/dreams/DreamTemplatesScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { goBack: jest.fn(), navigate: jest.fn() },
  activeCategory: 'all',
  setActiveCategory: jest.fn(),
  searchQuery: '',
  setSearchQuery: jest.fn(),
  templatesQuery: { isLoading: false, isError: false },
  templates: [],
  featured: [],
  selectedTemplate: null,
  openPreview: jest.fn(),
  closePreview: jest.fn(),
  handleUseTemplate: jest.fn(),
  useTemplateMut: { isPending: false },
  CATEGORY_TABS: [{ key: 'all', label: 'All' }, { key: 'career', label: 'Career' }],
  CAT_EMOJIS: { career: '\uD83D\uDCBC' },
  catSolid: function () { return '#8B5CF6'; },
  CATEGORIES: {},
  DIFFICULTY_CONFIG: {},
};

jest.mock('./useDreamTemplatesScreen', function () {
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

var DreamTemplatesScreen = require('./DreamTemplatesScreen');

describe('DreamTemplatesScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(DreamTemplatesScreen));
    expect(getByText('Dream Templates')).toBeTruthy();
  });

  it('renders back button', function () {
    var { getByLabelText } = render(React.createElement(DreamTemplatesScreen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
