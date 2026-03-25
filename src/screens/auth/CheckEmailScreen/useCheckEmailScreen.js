/**
 * useCheckEmailScreen -- business logic for CheckEmail (React Native).
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

  var handleResend = function () {
    if (!email || resending) return;
    setResending(true);
    apiPost(AUTH.RESEND_EMAIL, { email: email })
      .then(function () {
        setResent(true);
      })
      .catch(function () {})
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
    handleResend: handleResend,
  };
}

module.exports = useCheckEmailScreen;
