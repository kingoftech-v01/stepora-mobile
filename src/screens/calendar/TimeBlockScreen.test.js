/**
 * Tests for TimeBlockScreen
 */
var React = require('react');
var { render } = require('@testing-library/react-native');

jest.mock('./useTimeBlocksScreen', function () {
  return function () {
    return {
      navigation: { goBack: jest.fn() }, mounted: true,
      showModal: false, setShowModal: jest.fn(), editingBlock: null,
      confirmDelete: null, setConfirmDelete: jest.fn(),
      formTitle: '', setFormTitle: jest.fn(), formBlockType: 'focus', setFormBlockType: jest.fn(),
      formDayOfWeek: 0, setFormDayOfWeek: jest.fn(), formStartTime: '09:00', setFormStartTime: jest.fn(),
      formEndTime: '10:00', setFormEndTime: jest.fn(), formDreamId: null, setFormDreamId: jest.fn(),
      formColor: '#8B5CF6', setFormColor: jest.fn(),
      blocksQuery: { isLoading: false, isError: false }, timeBlocks: [],
      calEventsQuery: { isLoading: false }, calEvents: [], eventsByDay: {},
      dreamsQuery: { isLoading: false }, dreams: [],
      createMut: { isPending: false }, updateMut: { isPending: false }, deleteMut: { isPending: false },
      openAddModal: jest.fn(), openEditModal: jest.fn(), handleSave: jest.fn(), handleDelete: jest.fn(),
      handleSubmit: jest.fn(), resetFormAndClose: jest.fn(),
      DAY_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      BLOCK_TYPE_OPTIONS: [
        { value: 'work', key: 'calendar.blockTypeWork' },
        { value: 'personal', key: 'calendar.blockTypePersonal' },
        { value: 'family', key: 'calendar.blockTypeFamily' },
        { value: 'exercise', key: 'calendar.blockTypeExercise' },
        { value: 'blocked', key: 'calendar.blockTypeBlocked' },
      ],
      DAY_OF_WEEK_OPTIONS: [
        { value: 0, key: 'calendar.dayMon' },
        { value: 1, key: 'calendar.dayTue' },
        { value: 2, key: 'calendar.dayWed' },
        { value: 3, key: 'calendar.dayThu' },
        { value: 4, key: 'calendar.dayFri' },
        { value: 5, key: 'calendar.daySat' },
        { value: 6, key: 'calendar.daySun' },
      ],
      BLOCK_COLOR_KEYS: [
        { value: '#8B5CF6', key: 'colors.purple' },
        { value: '#3B82F6', key: 'colors.blue' },
      ],
      BLOCK_TYPE_META: { focus: { label: 'Focus', color: '#8B5CF6', icon: 'target' } },
      formatTime12: function (t) { return t; },
      formatTimeDisplay: function (t) { return t; },
    };
  };
});

jest.mock('../../theme/tokens', function () {
  return { COLORS: { bodyBg: '#000', glassBg: '#111', glassBorder: '#222', text: '#fff', textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6' }, SPACING: { sm: 8, md: 12, lg: 16, xl: 20 }, RADIUS: { md: 14, lg: 16 } };
});
jest.mock('../../styles/colors', function () { return { BRAND: { purple: '#8B5CF6' } }; });

var Screen = require('./TimeBlockScreen');

describe('TimeBlockScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(Screen));
    expect(getByText('Time Blocks')).toBeTruthy();
  });
  it('has add button', function () {
    var { getAllByLabelText } = render(React.createElement(Screen));
    // Header + empty state both have 'Add time block' buttons
    expect(getAllByLabelText('Add time block').length).toBeGreaterThanOrEqual(1);
  });
});
