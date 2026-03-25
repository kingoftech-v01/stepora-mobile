/**
 * useForgotPasswordScreen -- business logic for ForgotPassword (React Native).
 */
var { useState } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { apiPost } = require('../../../services/api');
var { AUTH } = require('../../../services/endpoints');
var { isValidEmail } = require('../../../utils/sanitize');

function useForgotPasswordScreen() {
  var navigation = useNavigation();
  var t = function (key) { return key; };
  var [email, setEmail] = useState('');
  var [sent, setSent] = useState(false);
  var [serverError, setServerError] = useState('');
  var [submitting, setSubmitting] = useState(false);

  var handleSend = function () {
    setServerError('');
    if (!isValidEmail(email)) {
      setServerError(t('auth.validEmailAddress'));
      return;
    }
    setSubmitting(true);
    apiPost(AUTH.PASSWORD_RESET, { email: email })
      .then(function () {
        setSent(true);
      })
      .catch(function (err) {
        setServerError(err.userMessage || err.message || t('auth.failedSendReset'));
      })
      .finally(function () {
        setSubmitting(false);
      });
  };

  return {
    navigation: navigation,
    t: t,
    email: email,
    setEmail: setEmail,
    sent: sent,
    serverError: serverError,
    submitting: submitting,
    handleSend: handleSend,
  };
}

module.exports = useForgotPasswordScreen;
