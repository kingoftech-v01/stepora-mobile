/**
 * useVerifyEmailScreen -- business logic for VerifyEmail (React Native).
 * Synced with web app's useVerifyEmailScreen.js.
 * If user is authenticated when verifying, refreshes user data.
 */
var { useState, useEffect } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { apiPost } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');
var { useAuth } = require('../../../context/AuthContext');

function useVerifyEmailScreen() {
  var navigation = useNavigation();
  var route = useRoute();
  var { isAuthenticated, refreshUser } = useAuth();
  var t = function (key) { return key; };
  var key = (route.params && route.params.key) || '';
  var [status, setStatus] = useState('verifying');
  var [errorMsg, setErrorMsg] = useState('');

  useEffect(function () {
    if (!key) {
      setStatus('error');
      setErrorMsg(t('auth.invalidVerificationLink'));
      return;
    }
    apiPost(AUTH.VERIFY_EMAIL, { key: key })
      .then(function () {
        setStatus('success');
        // If the user is already logged in, refresh their data
        // so emailVerified is updated without requiring re-login
        if (isAuthenticated && refreshUser) refreshUser();
      })
      .catch(function (err) {
        setStatus('error');
        setErrorMsg(
          (err && err.userMessage) || (err && err.message) || t('auth.verificationFailed'),
        );
      });
  }, [key]);

  var handleContinue = function () {
    if (isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  return {
    navigation: navigation,
    t: t,
    isAuthenticated: isAuthenticated,
    status: status,
    errorMsg: errorMsg,
    handleContinue: handleContinue,
  };
}

module.exports = useVerifyEmailScreen;
