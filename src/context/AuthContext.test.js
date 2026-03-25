/**
 * Tests for src/context/AuthContext.jsx
 * Covers login, logout, token storage, auto-refresh, registration,
 * subscription checks, and session_expired events.
 */

var React = require('react');
var { renderHook, act, waitFor } = require('@testing-library/react-native');

// Mock the API module
var mockApiGet = jest.fn();
var mockApiPost = jest.fn();
var mockApiDelete = jest.fn();
var mockSetToken = jest.fn();
var mockGetToken = jest.fn(function () { return 'mock-token'; });
var mockClearAuth = jest.fn();
var mockInitToken = jest.fn(function () { return Promise.resolve('stored-token'); });
var mockRefreshAccessToken = jest.fn(function () { return Promise.resolve('refreshed-token'); });
var mockAddAuthEventListener = jest.fn(function () { return jest.fn(); });

jest.mock('../services/api', function () {
  return {
    apiGet: function () { return mockApiGet.apply(null, arguments); },
    apiPost: function () { return mockApiPost.apply(null, arguments); },
    apiDelete: function () { return mockApiDelete.apply(null, arguments); },
    setToken: function () { return mockSetToken.apply(null, arguments); },
    getToken: function () { return mockGetToken.apply(null, arguments); },
    clearAuth: function () { return mockClearAuth.apply(null, arguments); },
    initToken: function () { return mockInitToken.apply(null, arguments); },
    refreshAccessToken: function () { return mockRefreshAccessToken.apply(null, arguments); },
    addAuthEventListener: function () { return mockAddAuthEventListener.apply(null, arguments); },
  };
});

jest.mock('../services/endpoints', function () {
  return {
    AUTH: {
      LOGIN: '/api/auth/login/',
      LOGOUT: '/api/auth/logout/',
      REGISTER: '/api/auth/registration/',
      GOOGLE: '/api/auth/google/',
      APPLE: '/api/auth/apple/',
    },
    USERS: {
      ME: '/api/users/me/',
      COMPLETE_ONBOARDING: '/api/users/complete-onboarding/',
      CHANGE_EMAIL: '/api/users/change-email/',
      DELETE_ACCOUNT: '/api/users/delete-account/',
    },
  };
});

var { AuthProvider, useAuth } = require('./AuthContext');

var mockUser = {
  id: 1,
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  hasOnboarded: true,
  subscription: 'premium',
};

function wrapper(props) {
  return React.createElement(AuthProvider, null, props.children);
}

beforeEach(function () {
  jest.clearAllMocks();
  mockInitToken.mockImplementation(function () { return Promise.resolve('stored-token'); });
  mockApiGet.mockImplementation(function () { return Promise.resolve(mockUser); });
  mockRefreshAccessToken.mockImplementation(function () { return Promise.resolve('refreshed-token'); });
});

describe('AuthContext', function () {
  describe('useAuth outside provider', function () {
    it('throws error when used outside AuthProvider', function () {
      // Suppress console.error for this test
      var spy = jest.spyOn(console, 'error').mockImplementation(function () {});

      expect(function () {
        renderHook(function () { return useAuth(); });
      }).toThrow('useAuth must be used within AuthProvider');

      spy.mockRestore();
    });
  });

  describe('initialization', function () {
    it('starts in loading state', function () {
      // Make initToken never resolve
      mockInitToken.mockReturnValue(new Promise(function () {}));

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('restores session from stored token', async function () {
      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('falls back to token refresh when no stored token', async function () {
      mockInitToken.mockResolvedValue('');
      mockRefreshAccessToken.mockResolvedValue('refreshed');

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockRefreshAccessToken).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets not authenticated when both token and refresh fail', async function () {
      mockInitToken.mockResolvedValue('');
      mockRefreshAccessToken.mockRejectedValue(new Error('No refresh'));

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', function () {
    it('calls API, sets token, and fetches user on success', async function () {
      mockApiPost.mockResolvedValue({
        access: 'new-access',
        refresh: 'new-refresh',
      });

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async function () {
        await result.current.login('user@test.com', 'password');
      });

      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/auth/login/',
        { email: 'user@test.com', password: 'password' },
      );
      expect(mockSetToken).toHaveBeenCalledWith('new-access', 'new-refresh');
    });

    it('returns 2FA challenge when required', async function () {
      mockApiPost.mockResolvedValue({
        tfaRequired: true,
        challengeToken: 'challenge-xyz',
      });

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      var loginResult;
      await act(async function () {
        loginResult = await result.current.login('user@test.com', 'password');
      });

      expect(loginResult).toEqual({
        tfaRequired: true,
        challengeToken: 'challenge-xyz',
      });
    });

    it('throws when no access token received', async function () {
      mockApiPost.mockResolvedValue({});

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async function () {
          await result.current.login('user@test.com', 'password');
        }),
      ).rejects.toThrow('No token received');
    });
  });

  describe('register', function () {
    it('stores token and fetches user after successful registration', async function () {
      mockApiPost.mockResolvedValue({
        access: 'reg-access',
        refresh: 'reg-refresh',
      });

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async function () {
        await result.current.register('user@test.com', 'pass1', 'pass1', 'Test');
      });

      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/auth/registration/',
        {
          email: 'user@test.com',
          password1: 'pass1',
          password2: 'pass1',
          displayName: 'Test',
        },
      );
      expect(mockSetToken).toHaveBeenCalledWith('reg-access', 'reg-refresh');
    });

    it('returns emailVerificationRequired when no data returned', async function () {
      mockApiPost.mockResolvedValue(null);

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      var regResult;
      await act(async function () {
        regResult = await result.current.register('user@test.com', 'p', 'p', 'T');
      });

      expect(regResult).toEqual({ emailVerificationRequired: true });
    });
  });

  describe('logout', function () {
    it('calls API logout, clears auth, and resets state', async function () {
      mockApiPost.mockResolvedValue(undefined);

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async function () {
        await result.current.logout();
      });

      expect(mockApiPost).toHaveBeenCalledWith('/api/auth/logout/');
      expect(mockClearAuth).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('still clears auth even if API logout fails', async function () {
      mockApiPost.mockRejectedValue(new Error('Network error'));

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async function () {
        await result.current.logout();
      });

      expect(mockClearAuth).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('updateUser', function () {
    it('optimistically updates user fields', async function () {
      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.user).not.toBeNull();
      });

      act(function () {
        result.current.updateUser({ displayName: 'New Name' });
      });

      expect(result.current.user.displayName).toBe('New Name');
      // Original fields preserved
      expect(result.current.user.email).toBe('test@example.com');
    });
  });

  describe('subscription checks', function () {
    it('returns correct subscriptionTier', async function () {
      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.subscriptionTier).toBe('premium');
      expect(result.current.isFreeTier).toBe(false);
    });

    it('hasSubscription returns true for same or lower tier', async function () {
      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.hasSubscription('free')).toBe(true);
      expect(result.current.hasSubscription('premium')).toBe(true);
      expect(result.current.hasSubscription('pro')).toBe(false);
    });

    it('defaults to free when user has no subscription', async function () {
      mockApiGet.mockResolvedValue({
        ...mockUser,
        subscription: null,
      });

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.subscriptionTier).toBe('free');
      expect(result.current.isFreeTier).toBe(true);
    });
  });

  describe('completeOnboarding', function () {
    it('calls API and updates user state', async function () {
      mockApiPost.mockResolvedValue({});

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.user).not.toBeNull();
      });

      await act(async function () {
        await result.current.completeOnboarding();
      });

      expect(mockApiPost).toHaveBeenCalledWith('/api/users/complete-onboarding/');
      expect(result.current.user.hasOnboarded).toBe(true);
    });
  });

  describe('session_expired listener', function () {
    it('registers auth event listener on mount', async function () {
      renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(mockAddAuthEventListener).toHaveBeenCalled();
      });
    });

    it('clears user on session_expired event', async function () {
      var capturedListener = null;
      mockAddAuthEventListener.mockImplementation(function (listener) {
        capturedListener = listener;
        return jest.fn();
      });

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Simulate session_expired event
      act(function () {
        if (capturedListener) {
          capturedListener({ type: 'session_expired' });
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('deleteAccount', function () {
    it('calls API and clears auth', async function () {
      mockApiDelete.mockResolvedValue(undefined);

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async function () {
        await result.current.deleteAccount('my-password');
      });

      expect(mockApiDelete).toHaveBeenCalledWith(
        '/api/users/delete-account/',
        { body: { password: 'my-password' } },
      );
      expect(mockClearAuth).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('changeEmail', function () {
    it('calls API with new email and password', async function () {
      mockApiPost.mockResolvedValue({ success: true });

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async function () {
        await result.current.changeEmail('new@test.com', 'password');
      });

      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/users/change-email/',
        { newEmail: 'new@test.com', password: 'password' },
      );
    });
  });

  describe('token exposure', function () {
    it('exposes token when authenticated', async function () {
      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.token).toBe('mock-token');
    });

    it('returns null token when not authenticated', async function () {
      mockInitToken.mockResolvedValue('');
      mockRefreshAccessToken.mockRejectedValue(new Error('fail'));

      var { result } = renderHook(function () { return useAuth(); }, { wrapper: wrapper });

      await waitFor(function () {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.token).toBeNull();
    });
  });
});
