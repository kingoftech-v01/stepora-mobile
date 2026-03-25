/**
 * useCheckEmailScreen -- business logic for CheckEmail (React Native).
 * Synced with web app's useCheckEmailScreen.js.
 */
var { useState } = require('react');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { apiPost } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');

function useCheckEmailScreen() {
  var navigation = useNavigation();
  var route = useRoute();
  var t = function (key) { return key; };
  var email = (route.params && route.params.email) || '';
  var [resending, setResending] = useState(false);
  var [resent, setResent] = useState(false);
  var [error, setError] = useState('');

  var handleResend = function () {
    if (!email || resending) return;
    setResending(true);
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
  };

  return {
    navigation: navigation,
    t: t,
    email: email,
    resending: resending,
    resent: resent,
    error: error,
    handleResend: handleResend,
  };
}

module.exports = useCheckEmailScreen;
