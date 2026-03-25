/**
 * useEmailGateScreen — Business logic for the email verification gate.
 * Adapted from the web app's useEmailGateScreen.js.
 * Auto-polls for verification status, allows resending verification email.
 * Now uses useAuth() hook directly instead of prop injection.
 */
var { useState, useEffect, useRef, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiPost } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');
var { useAuth } = require('../../../context/AuthContext');

var POLL_INTERVAL = 5000;

function useEmailGateScreen() {
  var navigation = useNavigation();
  var t = function (key) { return key; };

  var { user, refreshUser, logout, isAuthenticated } = useAuth();

  var [resending, setResending] = useState(false);
  var [resent, setResent] = useState(false);
  var [error, setError] = useState('');
  var pollRef = useRef(null);

  var email = (user && user.email) || '';

  // ─── Redirect to login if not authenticated ──────────
  useEffect(function () {
    if (!isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [isAuthenticated, navigation]);

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
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
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
        setError(err.userMessage || err.message || t('auth.resendFailed'));
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
    logout: logout,
  };
}

module.exports = useEmailGateScreen;
