/**
 * useResetPasswordScreen -- business logic for ResetPassword (React Native).
 * Deep link delivers uid~token via route params instead of useParams.
 */
var { useState, useEffect } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { apiPost } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');

function getPasswordStrength(password) {
  if (!password) return { level: 0, key: '', color: 'transparent' };
  var score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  if (score <= 1) return { level: 1, key: 'auth.passwordWeak', color: '#EF4444' };
  if (score <= 3) return { level: 2, key: 'auth.passwordMedium', color: '#FCD34D' };
  return { level: 3, key: 'auth.passwordStrong', color: '#10B981' };
}

function useResetPasswordScreen() {
  var navigation = useNavigation();
  var route = useRoute();
  var t = function (key) { return key; };
  var key = (route.params && route.params.key) || '';
  var parts = key.split('~');
  var uid = parts[0] || '';
  var token = parts.slice(1).join('~') || '';

  var [newPassword, setNewPassword] = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [serverError, setServerError] = useState('');
  var [submitting, setSubmitting] = useState(false);
  var [success, setSuccess] = useState(false);
  var [tokenExpired, setTokenExpired] = useState(false);
  var [validating, setValidating] = useState(true);

  var strength = getPasswordStrength(newPassword);

  useEffect(function () {
    if (!uid || !token) {
      setTokenExpired(true);
      setValidating(false);
      return;
    }
    apiPost(AUTH.PASSWORD_RESET_VALIDATE, { uid: uid, token: token })
      .then(function () {
        setValidating(false);
      })
      .catch(function () {
        setTokenExpired(true);
        setValidating(false);
      });
  }, [uid, token]);

  var handleSubmit = function () {
    setServerError('');
    if (strength.level < 2) {
      setServerError(t('auth.passwordTooWeakError'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setServerError(t('auth.passwordsDontMatch'));
      return;
    }
    setSubmitting(true);
    apiPost(AUTH.PASSWORD_RESET_CONFIRM, {
      uid: uid,
      token: token,
      new_password1: newPassword,
      new_password2: confirmPassword,
    })
      .then(function () {
        setSuccess(true);
      })
      .catch(function (err) {
        var msg = err.userMessage || err.message || '';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired'))
          setServerError(t('auth.resetLinkExpired'));
        else setServerError(msg || t('auth.failedResetPassword'));
      })
      .finally(function () {
        setSubmitting(false);
      });
  };

  return {
    navigation: navigation,
    t: t,
    newPassword: newPassword,
    setNewPassword: setNewPassword,
    confirmPassword: confirmPassword,
    setConfirmPassword: setConfirmPassword,
    serverError: serverError,
    submitting: submitting,
    success: success,
    tokenExpired: tokenExpired,
    validating: validating,
    strength: strength,
    handleSubmit: handleSubmit,
  };
}

module.exports = useResetPasswordScreen;
