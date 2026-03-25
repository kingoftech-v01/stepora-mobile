/**
 * useLoginScreen -- shared business logic for the Login screen (React Native).
 * Adapted from the web app's useLoginScreen.js.
 * Replaces: useNavigate -> navigation.navigate, window/sessionStorage -> AsyncStorage,
 * import.meta.env -> Config, no popup-based OAuth (uses Linking).
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiPost, setTokens } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');
var { isValidEmail } = require('../../../utils/sanitize');

function useLoginScreen() {
  var navigation = useNavigation();
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
    apiPost(AUTH.LOGIN, { email: email, password: password })
      .then(function (data) {
        if (data && data.tfaRequired) {
          setTfaRequired(true);
          setTfaChallengeToken(data.challengeToken || '');
          setSubmitting(false);
          return;
        }
        var access = data.access || data.accessToken || '';
        var refresh = data.refresh || data.refreshToken || '';
        return setTokens(access, refresh).then(function () {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        });
      })
      .catch(function (err) {
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
    setServerError('Google login not yet configured for native.');
  };

  var handleAppleLogin = function () {
    // TODO: Implement native Apple Sign-In (@invertase/react-native-apple-authentication)
    setServerError('Apple login not yet configured for native.');
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
        return setTokens(access, data.refresh || data.refreshToken).then(function () {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        });
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
    handleTfaVerify: handleTfaVerify,
    resetTfa: resetTfa,
  };
}

module.exports = useLoginScreen;
