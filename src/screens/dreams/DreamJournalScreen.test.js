/**
 * Tests for src/screens/dreams/DreamJournalScreen.js
 */

var React = require('react');
var { render } = require('@testing-library/react-native');

var mockHookReturn = {
  navigation: { goBack: jest.fn(), navigate: jest.fn() },
  journalQuery: { isLoading: false, isError: false, data: [] },
  entries: [],
  groupedEntries: [],
  MOOD_OPTIONS: [
    { key: 'happy', emoji: '\uD83D\uDE0A', label: 'Happy' },
    { key: 'neutral', emoji: '\uD83D\uDE10', label: 'Neutral' },
  ],
  MOOD_COLORS: { happy: '#22C55E', neutral: '#6366F1' },
  formatTime: function () { return '2:30 PM'; },
  openEditEntry: jest.fn(),
  handleDelete: jest.fn(),
  handlePickImage: jest.fn(),
  showForm: false,
  setShowForm: jest.fn(),
  formMood: '',
  setFormMood: jest.fn(),
  formText: '',
  setFormText: jest.fn(),
  formImageUri: null,
  editingId: null,
  openNewEntry: jest.fn(),
  handleSubmit: jest.fn(),
  resetForm: jest.fn(),
  createMut: { isPending: false },
  updateMut: { isPending: false },
  deleteMut: { isPending: false },
  formatDate: function () { return 'Mar 15'; },
};

jest.mock('./useDreamJournalScreen', function () {
  return function () { return mockHookReturn; };
});

jest.mock('../../theme/tokens', function () {
  return {
    COLORS: {
      bodyBg: '#0F0A1E', glassBg: '#111', glassBorder: '#222', text: '#fff',
      textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6',
    },
    SPACING: { sm: 8, md: 12, lg: 16, xl: 20 },
    RADIUS: { md: 14, lg: 16, full: 999 },
  };
});

jest.mock('../../styles/colors', function () {
  return { BRAND: { purple: '#8B5CF6', greenSolid: '#10B981' } };
});

var DreamJournalScreen = require('./DreamJournalScreen');

describe('DreamJournalScreen', function () {
  it('renders header without crash', function () {
    var { getByText } = render(React.createElement(DreamJournalScreen));
    expect(getByText('Dream Journal')).toBeTruthy();
  });

  it('renders back button', function () {
    var { getByLabelText } = render(React.createElement(DreamJournalScreen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
