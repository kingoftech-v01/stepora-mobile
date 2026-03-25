/**
 * useVerifyEmailScreen -- business logic for VerifyEmail (React Native).
 */
var { useState, useEffect } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { apiPost } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');

function useVerifyEmailScreen() {
  var navigation = useNavigation();
  var route = useRoute();
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
      })
      .catch(function (err) {
        setStatus('error');
        setErrorMsg(
          (err && err.userMessage) || (err && err.message) || t('auth.verificationFailed'),
        );
      });
  }, [key]);

  var handleContinue = function () {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return {
    navigation: navigation,
    t: t,
    status: status,
    errorMsg: errorMsg,
    handleContinue: handleContinue,
  };
}

module.exports = useVerifyEmailScreen;
