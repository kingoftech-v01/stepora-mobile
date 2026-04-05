/**
 * Tests for src/components/shared/OfflineBanner.js
 */
var React = require('react');
var { render, fireEvent } = require('@testing-library/react-native');

// ─── Controllable network state ──────────────────────────────────
var mockNetwork = { isOnline: true, queueCount: 0 };

jest.mock('../../context/NetworkContext', function () {
  return {
    useNetwork: function () {
      return mockNetwork;
    },
  };
});

var OfflineBanner = require('./OfflineBanner').default;
var { OfflineDataBanner } = require('./OfflineBanner');

beforeEach(function () {
  mockNetwork.isOnline = true;
  mockNetwork.queueCount = 0;
});

describe('OfflineBanner', function () {
  it('renders nothing when online with no queue', function () {
    mockNetwork.isOnline = true;
    mockNetwork.queueCount = 0;
    var { toJSON } = render(React.createElement(OfflineBanner));
    expect(toJSON()).toBeNull();
  });

  it('shows offline message when not online', function () {
    mockNetwork.isOnline = false;
    mockNetwork.queueCount = 0;
    var { getByText } = render(React.createElement(OfflineBanner));
    expect(getByText('You are offline')).toBeTruthy();
  });

  it('shows offline message with pending changes count', function () {
    mockNetwork.isOnline = false;
    mockNetwork.queueCount = 3;
    var { getByText } = render(React.createElement(OfflineBanner));
    expect(getByText(/You are offline/)).toBeTruthy();
    expect(getByText(/3 changes pending/)).toBeTruthy();
  });

  it('shows syncing message when online with pending queue', function () {
    mockNetwork.isOnline = true;
    mockNetwork.queueCount = 2;
    var { getByText } = render(React.createElement(OfflineBanner));
    expect(getByText(/Syncing 2 changes/)).toBeTruthy();
  });

  it('uses singular form for 1 change', function () {
    mockNetwork.isOnline = true;
    mockNetwork.queueCount = 1;
    var { getByText } = render(React.createElement(OfflineBanner));
    expect(getByText(/Syncing 1 change\.\.\./)).toBeTruthy();
  });
});

describe('OfflineDataBanner', function () {
  it('renders cached data message', function () {
    var { getByText } = render(React.createElement(OfflineDataBanner));
    expect(getByText('Showing cached data')).toBeTruthy();
  });

  it('can be dismissed', function () {
    var { getByText, queryByText, getByLabelText } = render(React.createElement(OfflineDataBanner));
    expect(getByText('Showing cached data')).toBeTruthy();
    fireEvent.press(getByLabelText('Dismiss cached data banner'));
    expect(queryByText('Showing cached data')).toBeNull();
  });

  it('renders dismiss button', function () {
    var { getByLabelText } = render(React.createElement(OfflineDataBanner));
    expect(getByLabelText('Dismiss cached data banner')).toBeTruthy();
  });
});
