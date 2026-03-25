/**
 * useRegisterScreen -- shared business logic for Register (React Native).
 * Adapted from the web app's useRegisterScreen.js.
 * Uses AuthContext.register for consistent auth flow (same as web).
 */
var { useState } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { isValidEmail, sanitizeText } = require('../../../utils/sanitize');
var { useAuth } = require('../../../context/AuthContext');
var Config = require('../../../config').default || {};

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

function useRegisterScreen() {
  var navigation = useNavigation();
  var { register, socialLogin } = useAuth();
  var t = function (key) { return key; };
  var [displayName, setDisplayName] = useState('');
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [showPassword, setShowPassword] = useState(false);
  var [showConfirm, setShowConfirm] = useState(false);
  var [agreedToTerms, setAgreedToTerms] = useState(false);
  var [errors, setErrors] = useState({});
  var [serverError, setServerError] = useState('');
  var [submitting, setSubmitting] = useState(false);

  var strength = getPasswordStrength(password);

  var handleRegister = function () {
    var errs = {};
    if (!sanitizeText(displayName, 50)) errs.name = t('auth.nameRequired');
    if (!isValidEmail(email)) errs.email = t('auth.validEmail');
    if (strength.level < 2) errs.password = t('auth.passwordTooWeakError');
    if (password !== confirmPassword) errs.confirm = t('auth.passwordsDontMatch');
    if (!agreedToTerms) errs.terms = t('auth.termsRequired');
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    register(email, password, confirmPassword, sanitizeText(displayName, 50))
      .then(function (data) {
        // If email verification is required, navigate to CheckEmail
        if (data && data.emailVerificationRequired) {
          navigation.navigate('CheckEmail', { email: email });
        } else {
          // Registration succeeded with auto-login — go to onboarding
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        }
      })
      .catch(function (err) {
        if (err.fieldErrors) setErrors(err.fieldErrors);
        var msg = err.userMessage || err.message || '';
        if (err.status === 500) msg = t('auth.serverError');
        else if (
          msg.toLowerCase().includes('unique') ||
          msg.toLowerCase().includes('already exists')
        )
          msg = t('auth.accountExists');
        else if (!msg) msg = t('auth.registrationFailed');
        setServerError(msg);
      })
      .finally(function () {
        setSubmitting(false);
      });
  };

  var handleGoogleLogin = function () {
    // TODO: Implement native Google Sign-In (react-native-google-signin)
    setServerError(t('auth.googleNotConfigured'));
  };

  var handleAppleLogin = function () {
    // TODO: Implement native Apple Sign-In (@invertase/react-native-apple-authentication)
    setServerError(t('auth.appleNotConfigured'));
  };

  // Feature flags — hide social buttons when not configured
  var googleConfigured = !!(Config.GOOGLE_CLIENT_ID && Config.USE_GOOGLE_AUTH === 'true');
  var appleConfigured = !!Config.APPLE_CLIENT_ID;

  return {
    navigation: navigation,
    t: t,
    displayName: displayName,
    setDisplayName: setDisplayName,
    email: email,
    setEmail: setEmail,
    password: password,
    setPassword: setPassword,
    confirmPassword: confirmPassword,
    setConfirmPassword: setConfirmPassword,
    showPassword: showPassword,
    setShowPassword: setShowPassword,
    showConfirm: showConfirm,
    setShowConfirm: setShowConfirm,
    agreedToTerms: agreedToTerms,
    setAgreedToTerms: setAgreedToTerms,
    errors: errors,
    serverError: serverError,
    submitting: submitting,
    strength: strength,
    handleRegister: handleRegister,
    handleGoogleLogin: handleGoogleLogin,
    handleAppleLogin: handleAppleLogin,
    googleConfigured: googleConfigured,
    appleConfigured: appleConfigured,
  };
}

module.exports = useRegisterScreen;
