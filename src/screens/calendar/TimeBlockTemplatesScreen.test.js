/**
 * Tests for TimeBlockTemplatesScreen
 */
var React = require('react');
var { render } = require('@testing-library/react-native');

jest.mock('./useTimeBlockTemplatesScreen', function () {
  return function () {
    return {
      navigation: { goBack: jest.fn() }, mounted: true,
      showSaveModal: false, setShowSaveModal: jest.fn(),
      showApplyConfirm: null, setShowApplyConfirm: jest.fn(),
      showDeleteConfirm: null, setShowDeleteConfirm: jest.fn(),
      saveName: '', setSaveName: jest.fn(), saveDescription: '', setSaveDescription: jest.fn(),
      templatesQuery: { isLoading: false }, allTemplates: [], presets: [], userTemplates: [],
      applyMut: { isPending: false }, saveMut: { isPending: false }, deleteMut: { isPending: false },
      closeSaveModal: jest.fn(), handleSave: jest.fn(),
      DAY_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      BLOCK_TYPE_META: { focus: { label: 'Focus', color: '#8B5CF6', icon: 'target' }, blocked: { label: 'Blocked', color: '#EF4444', icon: 'x' } },
      formatTime12: function (t) { return t; },
    };
  };
});

jest.mock('../../theme/tokens', function () {
  return { COLORS: { bodyBg: '#000', glassBg: '#111', glassBorder: '#222', text: '#fff', textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6' }, SPACING: { sm: 8, md: 12, lg: 16, xl: 20 }, RADIUS: { md: 14, lg: 16 } };
});
jest.mock('../../styles/colors', function () { return { BRAND: { purple: '#8B5CF6' } }; });

var Screen = require('./TimeBlockTemplatesScreen');

describe('TimeBlockTemplatesScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(Screen));
    expect(getByText('Templates')).toBeTruthy();
  });
  it('has back button', function () {
    var { getByLabelText } = render(React.createElement(Screen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
