/**
 * Tests for GoogleCalendarConnectScreen
 */
var React = require('react');
var { render } = require('@testing-library/react-native');

jest.mock('./useGoogleCalendarConnectScreen', function () {
  return function () {
    return {
      navigation: { goBack: jest.fn(), navigate: jest.fn() },
      connected: false, connecting: false, calendars: [], lastSync: null,
      statusQuery: { isLoading: false }, syncing: false, disconnecting: false,
      handleConnect: jest.fn(), handleSync: jest.fn(), handleDisconnect: jest.fn(),
      toggleCalendar: jest.fn(), BRAND: { purple: '#8B5CF6' }, adaptColor: function () { return '#8B5CF6'; },
    };
  };
});

jest.mock('../../theme/tokens', function () {
  return { COLORS: { bodyBg: '#000', glassBg: '#111', glassBorder: '#222', text: '#fff', textSecondary: '#ccc', textMuted: '#888', accent: '#8B5CF6' }, SPACING: { sm: 8, md: 12, lg: 16, xl: 20 }, RADIUS: { md: 14, lg: 16 } };
});
jest.mock('../../styles/colors', function () {
  return { BRAND: { purple: '#8B5CF6', greenSolid: '#10B981' } };
});

var Screen = require('./GoogleCalendarConnectScreen');

describe('GoogleCalendarConnectScreen', function () {
  it('renders without crash', function () {
    var { getByText } = render(React.createElement(Screen));
    // When not connected, header shows 'Connect Calendar'
    expect(getByText('Connect Calendar')).toBeTruthy();
  });
  it('has back button', function () {
    var { getByLabelText } = render(React.createElement(Screen));
    expect(getByLabelText('Go back')).toBeTruthy();
  });
});
