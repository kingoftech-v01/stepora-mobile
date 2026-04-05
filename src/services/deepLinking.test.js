/**
 * Tests for src/services/deepLinking.js
 * Covers linking config, buildDeepLink, buildUniversalLink, parseDeepLink,
 * and all route parsing branches.
 */

jest.mock('react-native', function () {
  return {
    Linking: {
      getInitialURL: jest.fn(function () { return Promise.resolve(null); }),
      addEventListener: jest.fn(function () {
        return { remove: jest.fn() };
      }),
    },
  };
});

var deepLinking = require('./deepLinking');

describe('constants', function () {
  it('exports URL_SCHEME', function () {
    expect(deepLinking.URL_SCHEME).toBe('com.stepora.app');
  });

  it('exports UNIVERSAL_DOMAIN', function () {
    expect(deepLinking.UNIVERSAL_DOMAIN).toBe('stepora.app');
  });
});

describe('linking config', function () {
  it('has correct prefixes', function () {
    var prefixes = deepLinking.linking.prefixes;
    expect(prefixes).toContain('com.stepora.app://');
    expect(prefixes).toContain('https://stepora.app');
    expect(prefixes).toContain('http://stepora.app');
  });

  it('has screen config for Home', function () {
    expect(deepLinking.linking.config.screens.Home).toBe('home');
  });

  it('has screen config for DreamDetail with param', function () {
    expect(deepLinking.linking.config.screens.DreamDetail).toBe('dream/:dreamId');
  });

  it('has screen config for ResetPassword with params', function () {
    expect(deepLinking.linking.config.screens.ResetPassword).toBe(
      'reset-password/:uid/:token',
    );
  });

  it('has screen config for Store', function () {
    expect(deepLinking.linking.config.screens.Store).toBe('store');
  });
});

describe('linking.getInitialURL', function () {
  it('returns URL from Linking.getInitialURL', async function () {
    var { Linking } = require('react-native');
    Linking.getInitialURL.mockResolvedValueOnce('com.stepora.app://dream/42');

    var url = await deepLinking.linking.getInitialURL();
    expect(url).toBe('com.stepora.app://dream/42');
  });

  it('returns null when no initial URL', async function () {
    var { Linking } = require('react-native');
    Linking.getInitialURL.mockResolvedValueOnce(null);

    var url = await deepLinking.linking.getInitialURL();
    expect(url).toBeNull();
  });
});

describe('linking.subscribe', function () {
  it('subscribes to URL events and returns cleanup function', function () {
    var { Linking } = require('react-native');
    var mockRemove = jest.fn();
    Linking.addEventListener.mockReturnValueOnce({ remove: mockRemove });

    var listener = jest.fn();
    var cleanup = deepLinking.linking.subscribe(listener);

    expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('buildDeepLink', function () {
  it('builds deep link with custom scheme', function () {
    expect(deepLinking.buildDeepLink('dream/42')).toBe('com.stepora.app://dream/42');
  });

  it('builds deep link for empty path', function () {
    expect(deepLinking.buildDeepLink('')).toBe('com.stepora.app://');
  });

  it('builds deep link for home', function () {
    expect(deepLinking.buildDeepLink('home')).toBe('com.stepora.app://home');
  });
});

describe('buildUniversalLink', function () {
  it('builds HTTPS universal link', function () {
    expect(deepLinking.buildUniversalLink('dream/42')).toBe(
      'https://stepora.app/dream/42',
    );
  });

  it('builds universal link for store path', function () {
    expect(deepLinking.buildUniversalLink('store/item/5')).toBe(
      'https://stepora.app/store/item/5',
    );
  });
});

describe('parseDeepLink', function () {
  it('returns null for null URL', function () {
    expect(deepLinking.parseDeepLink(null)).toBeNull();
  });

  it('returns null for empty string', function () {
    expect(deepLinking.parseDeepLink('')).toBeNull();
  });

  it('returns Home for scheme-only URL', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://')).toEqual({
      screen: 'Home',
    });
  });

  // ─── Dream routes ──────────────────────────────────────────────

  it('parses dream detail from custom scheme', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://dream/42')).toEqual({
      screen: 'DreamDetail',
      params: { dreamId: '42' },
    });
  });

  it('parses dreams list when no dream ID', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://dream')).toEqual({
      screen: 'Dreams',
    });
  });

  it('parses dream detail from universal link', function () {
    expect(deepLinking.parseDeepLink('https://stepora.app/dream/99')).toEqual({
      screen: 'DreamDetail',
      params: { dreamId: '99' },
    });
  });

  // ─── Store routes ─────────────────────────────────────────────

  it('parses store item detail', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://store/item-5')).toEqual({
      screen: 'StoreItemDetail',
      params: { itemId: 'item-5' },
    });
  });

  it('parses store without item ID', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://store')).toEqual({
      screen: 'Store',
    });
  });

  // ─── Subscription routes ──────────────────────────────────────

  it('parses subscription success', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://subscription/success')).toEqual({
      screen: 'SubscriptionSuccess',
    });
  });

  it('parses subscription without success', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://subscription')).toEqual({
      screen: 'Subscription',
    });
  });

  // ─── Notifications routes ─────────────────────────────────────

  it('parses notification settings', function () {
    expect(
      deepLinking.parseDeepLink('com.stepora.app://notifications/settings'),
    ).toEqual({
      screen: 'NotificationSettings',
    });
  });

  it('parses notifications without sub-path', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://notifications')).toEqual({
      screen: 'Notifications',
    });
  });

  // ─── User routes ──────────────────────────────────────────────

  it('parses user profile', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://user/abc123')).toEqual({
      screen: 'UserProfile',
      params: { userId: 'abc123' },
    });
  });

  it('parses user without ID falls to Social', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://user')).toEqual({
      screen: 'Social',
    });
  });

  // ─── Auth routes ──────────────────────────────────────────────

  it('parses verify-email', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://verify-email/key123')).toEqual({
      screen: 'VerifyEmail',
      params: { key: 'key123' },
    });
  });

  it('parses verify-email without key falls to Home', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://verify-email')).toEqual({
      screen: 'Home',
    });
  });

  it('parses reset-password with uid and token', function () {
    expect(
      deepLinking.parseDeepLink('com.stepora.app://reset-password/uid123/tok456'),
    ).toEqual({
      screen: 'ResetPassword',
      params: { uid: 'uid123', token: 'tok456' },
    });
  });

  it('parses reset-password without both params falls to Home', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://reset-password/uid123')).toEqual(
      { screen: 'Home' },
    );
  });

  it('parses reset-password without any params falls to Home', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://reset-password')).toEqual({
      screen: 'Home',
    });
  });

  // ─── Unknown routes ───────────────────────────────────────────

  it('returns Home for unknown route', function () {
    expect(deepLinking.parseDeepLink('com.stepora.app://unknown-page')).toEqual({
      screen: 'Home',
    });
  });

  // ─── HTTP scheme stripping ────────────────────────────────────

  it('strips http scheme', function () {
    expect(deepLinking.parseDeepLink('http://stepora.app/dream/7')).toEqual({
      screen: 'DreamDetail',
      params: { dreamId: '7' },
    });
  });
});
