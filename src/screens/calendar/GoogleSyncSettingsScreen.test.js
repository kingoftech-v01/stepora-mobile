/**
 * Tests for GoogleSyncSettingsScreen
 */
var React = require('react');
var { render } = require('@testing-library/react-native');

jest.mock('./useGoogleSyncSettingsScreen', function () {
  return function () {
    return {
      navigation: { goBack: jest.fn() },
      syncDirection: 'both', syncTasks: true, syncEvents: true,
      syncedDreamIds: [], dreams: [], lastSyncAt: null, connected: true,
      dirty: false, allSelected: false, syncing: false, saving: false, loading: false,
      handleDirectionChange: jest.fn(), handleToggleTasks: jest.fn(), handleToggleEvents: jest.fn(),
      handleToggleDream: jest.fn(), handleSelectAll: jest.fn(), handleDeselectAll: jest.fn(),
      handleSave: jest.fn(), handleSync: jest.fn(),
    };
  };
});

jest.mock('../../theme/tokens', function () {
  return { COLORS: { bodyBg: '#000', glassBg: '#111', glassBorder: '#222', text: '#fff', textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6' }, SPACING: { sm: 8, md: 12, lg: 16, xl: 20 }, RADIUS: { md: 14, lg: 16 } };
});
jest.mock('../../styles/colors', function () { return { BRAND: { purple: '#8B5CF6', greenSolid: '#10B981' } }; });

var Screen = require('./GoogleSyncSettingsScreen');

describe('GoogleSyncSettingsScreen', function () {
  it('renders without crash', function () {
    var { getAllByText } = render(React.createElement(Screen));
    // 'Sync Settings' may appear in both header and section title
    expect(getAllByText('Sync Settings').length).toBeGreaterThanOrEqual(1);
  });
  it('has back button', function () {
    var { getByLabelText } = render(React.createElement(Screen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
