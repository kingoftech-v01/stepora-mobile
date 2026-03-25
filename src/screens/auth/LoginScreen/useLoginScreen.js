/**
 * useLoginScreen -- shared business logic for the Login screen (React Native).
 * Adapted from the web app's useLoginScreen.js.
 * Uses AuthContext for login/socialLogin (same as web), React Navigation,
 * and AsyncStorage-based token management.
 */
var { useState } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiPost, setToken } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');
var { isValidEmail } = require('../../../utils/sanitize');
var { useAuth } = require('../../../context/AuthContext');
var Config = require('../../../config').default || {};

function useLoginScreen() {
  var navigation = useNavigation();
  var { login, socialLogin, refreshUser } = useAuth();
  // Placeholder t() until I18nContext is wired up
  var t = function (key) { return key; };
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [showPassword, setShowPassword] = useState(false);
  var [errors, setErrors] = useState({});
  var [serverError, setServerError] = useState('');
  var [submitting, setSubmitting] = useState(false);
  var [loginCooldown, setLoginCooldown] = useState(false);
  var [tfaRequired, setTfaRequired] = useState(false);
  var [tfaChallengeToken, setTfaChallengeToken] = useState('');
  var [tfaCode, setTfaCode] = useState('');

  var handleSignIn = function () {
    var errs = {};
    if (!isValidEmail(email)) errs.email = t('auth.validEmail');
    if (!password) errs.password = t('auth.passwordRequired');
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    login(email, password)
      .then(function (result) {
        if (result && result.tfaRequired) {
          setTfaRequired(true);
          setTfaChallengeToken(result.challengeToken || '');
          setSubmitting(false);
          return;
        }
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      })
      .catch(function (err) {
        if (err.fieldErrors) {
          setErrors(err.fieldErrors);
        }
        var msg = err.userMessage || err.message || '';
        if (
          msg.toLowerCase().includes('not verified') ||
          msg.toLowerCase().includes('e-mail is not verified')
        ) {
          navigation.navigate('CheckEmail', { email: email });
          return;
        }
        setServerError(msg || t('auth.loginFailed'));
        setLoginCooldown(true);
        setTimeout(function () {
          setLoginCooldown(false);
        }, 2000);
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

  var handleTfaVerify = function () {
    if (!tfaCode.trim()) {
      setServerError(t('auth.tfaCodeRequired'));
      return;
    }
    setSubmitting(true);
    setServerError('');
    apiPost(AUTH.TFA_CHALLENGE, {
      challengeToken: tfaChallengeToken,
      code: tfaCode.trim(),
    })
      .then(function (data) {
        var access = data.access || data.accessToken;
        if (!access) throw new Error('No token received');
        setToken(access, data.refresh || data.refreshToken);
        return refreshUser();
      })
      .then(function () {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      })
      .catch(function (err) {
        setServerError(err.userMessage || err.message || t('auth.tfaInvalid'));
      })
      .finally(function () {
        setSubmitting(false);
      });
  };

  var resetTfa = function () {
    setTfaRequired(false);
    setTfaChallengeToken('');
    setTfaCode('');
    setServerError('');
  };

  // Feature flags — hide social buttons when not configured
  var googleConfigured = !!(Config.GOOGLE_CLIENT_ID && Config.USE_GOOGLE_AUTH === 'true');
  var appleConfigured = !!Config.APPLE_CLIENT_ID;

  return {
    navigation: navigation,
    t: t,
    email: email,
    setEmail: setEmail,
    password: password,
    setPassword: setPassword,
    showPassword: showPassword,
    setShowPassword: setShowPassword,
    errors: errors,
    serverError: serverError,
    submitting: submitting,
    loginCooldown: loginCooldown,
    tfaRequired: tfaRequired,
    tfaCode: tfaCode,
    setTfaCode: setTfaCode,
    handleSignIn: handleSignIn,
    handleGoogleLogin: handleGoogleLogin,
    handleAppleLogin: handleAppleLogin,
    googleConfigured: googleConfigured,
    appleConfigured: appleConfigured,
    handleTfaVerify: handleTfaVerify,
    resetTfa: resetTfa,
  };
}

module.exports = useLoginScreen;
