/**
 * useEmailGateScreen — Business logic for the email verification gate.
 * Adapted from the web app's useEmailGateScreen.js.
 * Auto-polls for verification status, allows resending verification email.
 */
var { useState, useEffect, useRef, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiPost } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');

var POLL_INTERVAL = 5000;

function useEmailGateScreen(authContext) {
  var navigation = useNavigation();
  var t = function (key) { return key; };

  // AuthContext values passed as prop (since require may cause issues)
  var user = authContext && authContext.user;
  var refreshUser = authContext && authContext.refreshUser;
  var logout = authContext && authContext.logout;
  var isAuthenticated = authContext && authContext.isAuthenticated;

  var [resending, setResending] = useState(false);
  var [resent, setResent] = useState(false);
  var [error, setError] = useState('');
  var pollRef = useRef(null);

  var email = (user && user.email) || '';

  // ─── Auto-poll for verification ───────────────────────
  useEffect(function () {
    if (refreshUser) {
      pollRef.current = setInterval(function () {
        refreshUser();
      }, POLL_INTERVAL);
    }
    return function () {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshUser]);

  // ─── Redirect when verified ───────────────────────────
  useEffect(function () {
    if (user && user.emailVerified) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [user, navigation]);

  // ─── Resend verification email ────────────────────────
  var handleResend = useCallback(function () {
    if (!email || resending) return;
    setResending(true);
    setResent(false);
    setError('');
    apiPost(AUTH.RESEND_EMAIL, { email: email })
      .then(function () {
        setResent(true);
      })
      .catch(function (err) {
        setError(err.userMessage || err.message || 'Failed to resend email');
      })
      .finally(function () {
        setResending(false);
      });
  }, [email, resending]);

  // ─── Manual check ─────────────────────────────────────
  var handleCheckNow = useCallback(function () {
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  // ─── Logout ───────────────────────────────────────────
  var handleLogout = useCallback(function () {
    if (logout) logout();
  }, [logout]);

  return {
    navigation: navigation,
    t: t,
    email: email,
    resending: resending,
    resent: resent,
    error: error,
    handleResend: handleResend,
    handleCheckNow: handleCheckNow,
    handleLogout: handleLogout,
  };
}

module.exports = useEmailGateScreen;
