/**
 * useSubscriptionError — Hook that listens for subscription_required
 * events from the API layer and provides state for showing an inline
 * subscription gate message in any screen.
 *
 * Usage:
 *   var subErr = useSubscriptionError();
 *   // subErr.active      — boolean, true when a 403 subscription error has been received
 *   // subErr.requiredTier — string, e.g. 'premium'
 *   // subErr.featureName  — string, e.g. 'AI Coaching'
 *   // subErr.message      — string, user-facing message
 *   // subErr.dismiss()    — clears the error state
 */
var { useState, useEffect, useCallback } = require('react');
var { addAuthEventListener } = require('../services/api');

var useSubscriptionError = function () {
  var [state, setState] = useState({
    active: false,
    requiredTier: '',
    featureName: '',
    message: '',
  });

  useEffect(function () {
    var unsubscribe = addAuthEventListener(function (event) {
      if (event.type === 'subscription_required') {
        var detail = event.detail || {};
        var tierLabel = (detail.requiredTier || 'premium');
        tierLabel = tierLabel.charAt(0).toUpperCase() + tierLabel.slice(1);
        var msg = detail.featureName
          ? detail.featureName + ' requires a ' + tierLabel + ' subscription.'
          : 'This feature requires a ' + tierLabel + ' subscription.';

        setState({
          active: true,
          requiredTier: detail.requiredTier || 'premium',
          featureName: detail.featureName || '',
          message: msg,
        });
      }
    });
    return unsubscribe;
  }, []);

  var dismiss = useCallback(function () {
    setState({
      active: false,
      requiredTier: '',
      featureName: '',
      message: '',
    });
  }, []);

  return {
    active: state.active,
    requiredTier: state.requiredTier,
    featureName: state.featureName,
    message: state.message,
    dismiss: dismiss,
  };
};

module.exports = useSubscriptionError;
