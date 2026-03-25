import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiGet,
  apiPost,
  apiDelete,
  setToken,
  getToken,
  clearAuth,
  initToken,
  refreshAccessToken,
  addAuthEventListener,
} from '../services/api';
import { AUTH, USERS } from '../services/endpoints';

var AuthContext = createContext(null);

// Subscription tier order for comparison
var TIER_ORDER = { free: 0, premium: 1, pro: 2 };

export function AuthProvider({ children }) {
  var [user, setUser] = useState(null);
  var [isLoading, setIsLoading] = useState(true);
  var [isAuthenticated, setIsAuthenticated] = useState(false);

  // ─── Fetch current user profile ───────────────────────────────
  var fetchUser = useCallback(function () {
    return apiGet(USERS.ME).then(function (data) {
      setUser(data);
      setIsAuthenticated(true);
      return data;
    });
  }, []);

  // ─── On mount: restore session ─────────────────────────────────
  useEffect(
    function () {
      var ignore = false;

      initToken()
        .then(function (token) {
          if (ignore) return;
          if (token) return fetchUser();
          throw new Error('No token');
        })
        .catch(function () {
          if (ignore) return;
          // Try refreshing with stored refresh token
          return refreshAccessToken().then(function () {
            if (ignore) return;
            return fetchUser();
          });
        })
        .catch(function () {
          if (ignore) return;
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(function () {
          if (!ignore) setIsLoading(false);
        });

      return function () {
        ignore = true;
      };
    },
    [fetchUser],
  );

  // ─── Listen for session_expired events from API layer ──────────
  useEffect(function () {
    var unsubscribe = addAuthEventListener(function (event) {
      if (event.type === 'session_expired') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    return unsubscribe;
  }, []);

  // ─── Login ────────────────────────────────────────────────────
  var login = useCallback(
    function (email, password) {
      return apiPost(AUTH.LOGIN, { email: email, password: password }).then(function (data) {
        // 2FA required
        if (data.tfaRequired) {
          return { tfaRequired: true, challengeToken: data.challengeToken };
        }
        var access = data.access || data.accessToken || data.key || data.token;
        if (!access) throw new Error('No token received');
        setToken(access, data.refresh);
        return fetchUser();
      });
    },
    [fetchUser],
  );

  // ─── Register ─────────────────────────────────────────────────
  var register = useCallback(
    function (email, password1, password2, displayName) {
      return apiPost(AUTH.REGISTER, {
        email: email,
        password1: password1,
        password2: password2,
        displayName: displayName,
      }).then(function (data) {
        if (!data) return { emailVerificationRequired: true };
        var access = data.access || data.accessToken || data.key || data.token;
        if (access) {
          setToken(access, data.refresh);
          return fetchUser();
        }
        return { emailVerificationRequired: true };
      });
    },
    [fetchUser],
  );

  // ─── Social login (Google / Apple) ────────────────────────────
  var socialLogin = useCallback(
    function (provider, accessToken) {
      var url = provider === 'apple' ? AUTH.APPLE : AUTH.GOOGLE;
      return apiPost(url, { accessToken: accessToken }).then(function (data) {
        var access = data.access || data.accessToken || data.key || data.token;
        if (!access) throw new Error('No token received');
        setToken(access, data.refresh);
        return fetchUser();
      });
    },
    [fetchUser],
  );

  // ─── Logout ───────────────────────────────────────────────────
  var logout = useCallback(function () {
    return apiPost(AUTH.LOGOUT)
      .catch(function () {
        /* ignore errors on logout */
      })
      .finally(function () {
        clearAuth();
        setUser(null);
        setIsAuthenticated(false);
        // Navigation to login is handled by the navigator checking isAuthenticated
      });
  }, []);

  // ─── Refresh user data ────────────────────────────────────────
  var refreshUser = useCallback(
    function () {
      return fetchUser().catch(function (err) {
        console.error('[Auth] user refresh failed:', err);
      });
    },
    [fetchUser],
  );

  // ─── Optimistic user update ───────────────────────────────────
  var updateUser = useCallback(function (partial) {
    setUser(function (prev) {
      if (!prev) return prev;
      return Object.assign({}, prev, partial);
    });
  }, []);

  // ─── Subscription check helpers ──────────────────────────────
  var subscriptionTier = (user && user.subscription ? user.subscription : 'free').toLowerCase();
  var isFreeTier = subscriptionTier === 'free';

  var hasSubscription = useCallback(
    function (requiredTier) {
      if (!user) return false;
      var userTier = (user.subscription || 'free').toLowerCase();
      return (TIER_ORDER[userTier] || 0) >= (TIER_ORDER[requiredTier] || 0);
    },
    [user],
  );

  // ─── Complete onboarding ──────────────────────────────────────
  var completeOnboarding = useCallback(function () {
    return apiPost(USERS.COMPLETE_ONBOARDING).then(function () {
      setUser(function (prev) {
        if (!prev) return prev;
        return Object.assign({}, prev, { hasOnboarded: true });
      });
    });
  }, []);

  // ─── Change email ─────────────────────────────────────────────
  var changeEmail = useCallback(function (newEmail, password) {
    return apiPost(USERS.CHANGE_EMAIL, { newEmail: newEmail, password: password });
  }, []);

  // ─── Delete account (GDPR) ────────────────────────────────────
  var deleteAccount = useCallback(function (password) {
    return apiDelete(USERS.DELETE_ACCOUNT, { body: { password: password } }).then(function () {
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    });
  }, []);

  // Expose the current auth token
  var token = isAuthenticated ? getToken() : null;

  var value = {
    user: user,
    token: token,
    isLoading: isLoading,
    isAuthenticated: isAuthenticated,
    login: login,
    register: register,
    socialLogin: socialLogin,
    logout: logout,
    refreshUser: refreshUser,
    updateUser: updateUser,
    hasSubscription: hasSubscription,
    subscriptionTier: subscriptionTier,
    isFreeTier: isFreeTier,
    completeOnboarding: completeOnboarding,
    changeEmail: changeEmail,
    deleteAccount: deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  var ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
