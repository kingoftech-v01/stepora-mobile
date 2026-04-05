/**
 * Tests for src/components/SubscriptionBanner.js
 */
var React = require('react');
var { render, fireEvent, waitFor } = require('@testing-library/react-native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;

// ─── Controllable auth state ──────────────────────────────────
var mockAuth = {
  user: null,
};

jest.mock('../context/AuthContext', function () {
  return {
    useAuth: function () {
      return mockAuth;
    },
  };
});

var SubscriptionBanner = require('./SubscriptionBanner');

beforeEach(function () {
  mockAuth.user = null;
  AsyncStorage._reset();
  AsyncStorage.getItem.mockClear();
  AsyncStorage.setItem.mockClear();
});

describe('SubscriptionBanner', function () {
  it('renders nothing when user is null', function () {
    mockAuth.user = null;
    var { toJSON } = render(React.createElement(SubscriptionBanner));
    expect(toJSON()).toBeNull();
  });

  it('renders nothing for paid subscription user', function () {
    mockAuth.user = { subscription: 'premium' };
    var { toJSON } = render(React.createElement(SubscriptionBanner));
    expect(toJSON()).toBeNull();
  });

  it('renders banner for free user', async function () {
    mockAuth.user = { subscription: 'free' };
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    var { findByText } = render(React.createElement(SubscriptionBanner));
    var text = await findByText(/Free plan/);
    expect(text).toBeTruthy();
  });

  it('renders custom message', async function () {
    mockAuth.user = { subscription: 'free' };
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    var { findByText } = render(React.createElement(SubscriptionBanner, {
      message: 'Custom upgrade message',
    }));
    var text = await findByText('Custom upgrade message');
    expect(text).toBeTruthy();
  });

  it('dismisses when X button is pressed', async function () {
    mockAuth.user = { subscription: 'free' };
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    var { findByLabelText, queryByRole } = render(React.createElement(SubscriptionBanner));
    var btn = await findByLabelText('Dismiss banner');
    fireEvent.press(btn);
    await waitFor(function () {
      expect(queryByRole('alert')).toBeNull();
    });
  });

  it('saves dismiss timestamp to AsyncStorage', async function () {
    mockAuth.user = { subscription: 'free' };
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    var { findByLabelText } = render(React.createElement(SubscriptionBanner));
    var btn = await findByLabelText('Dismiss banner');
    fireEvent.press(btn);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('stays hidden if recently dismissed (within 3 days)', async function () {
    mockAuth.user = { subscription: 'free' };
    // Dismissed 1 hour ago
    var recentTimestamp = String(Date.now() - 60 * 60 * 1000);
    AsyncStorage.getItem.mockResolvedValueOnce(recentTimestamp);
    var { toJSON } = render(React.createElement(SubscriptionBanner));
    // Wait for async effect to resolve
    await waitFor(function () {
      expect(toJSON()).toBeNull();
    });
  });

  it('has alert accessibility role', async function () {
    mockAuth.user = { subscription: 'free' };
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    var { findByRole } = render(React.createElement(SubscriptionBanner));
    var alert = await findByRole('alert');
    expect(alert).toBeTruthy();
  });
});
