/**
 * useChangePasswordScreen -- business logic for ChangePassword (React Native).
 * Synced with web app's useChangePasswordScreen.js.
 * Added show/hide toggles for all three password fields.
 */
var { useState } = require('react');
var { useNavigation } = require('@react-navigation/native');
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

function useChangePasswordScreen() {
  var navigation = useNavigation();
  var t = function (key) { return key; };
  var [currentPassword, setCurrentPassword] = useState('');
  var [newPassword, setNewPassword] = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [showCurrent, setShowCurrent] = useState(false);
  var [showNew, setShowNew] = useState(false);
  var [showConfirm, setShowConfirm] = useState(false);
  var [showToast, setShowToast] = useState(false);
  var [serverError, setServerError] = useState('');
  var [submitting, setSubmitting] = useState(false);

  var strength = getPasswordStrength(newPassword);

  var handleUpdate = function () {
    setServerError('');
    if (!currentPassword) {
      setServerError(t('auth.currentPasswordRequired'));
      return;
    }
    if (strength.level < 2) {
      setServerError(t('auth.passwordTooWeak'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setServerError(t('auth.passwordsDontMatch'));
      return;
    }
    setSubmitting(true);
    apiPost(AUTH.PASSWORD_CHANGE, {
      old_password: currentPassword,
      new_password1: newPassword,
      new_password2: confirmPassword,
    })
      .then(function () {
        setShowToast(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(function () {
          setShowToast(false);
        }, 3000);
      })
      .catch(function (err) {
        if (err.fieldErrors) {
          var msg =
            err.fieldErrors.oldPassword ||
            err.fieldErrors.newPassword1 ||
            err.fieldErrors.newPassword2 ||
            '';
          setServerError(msg || err.userMessage || err.message || t('auth.failedUpdatePassword'));
        } else {
          setServerError(err.userMessage || err.message || t('auth.failedUpdatePassword'));
        }
      })
      .finally(function () {
        setSubmitting(false);
      });
  };

  return {
    navigation: navigation,
    t: t,
    currentPassword: currentPassword,
    setCurrentPassword: setCurrentPassword,
    newPassword: newPassword,
    setNewPassword: setNewPassword,
    confirmPassword: confirmPassword,
    setConfirmPassword: setConfirmPassword,
    showCurrent: showCurrent,
    setShowCurrent: setShowCurrent,
    showNew: showNew,
    setShowNew: setShowNew,
    showConfirm: showConfirm,
    setShowConfirm: setShowConfirm,
    showToast: showToast,
    serverError: serverError,
    submitting: submitting,
    strength: strength,
    handleUpdate: handleUpdate,
  };
}

module.exports = useChangePasswordScreen;
