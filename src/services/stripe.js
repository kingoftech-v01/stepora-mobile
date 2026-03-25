/**
 * Stepora Mobile — Stripe Service (DISABLED)
 *
 * In-app payments have been removed for Apple/Google Play Store compliance.
 * Subscription management is handled via the web platform.
 *
 * This file is kept as a no-op stub so any lingering imports do not crash.
 * All exported functions are safe no-ops.
 */

var initializeStripe = function () {
  return Promise.resolve(false);
};

var presentPaymentSheet = function () {
  return Promise.reject(new Error('In-app payments are not available'));
};

var confirmSetupIntent = function () {
  return Promise.reject(new Error('In-app payments are not available'));
};

var handleURLCallback = function () {
  return false;
};

var getStripeProvider = function () {
  return null;
};

module.exports = {
  initializeStripe: initializeStripe,
  presentPaymentSheet: presentPaymentSheet,
  confirmSetupIntent: confirmSetupIntent,
  handleURLCallback: handleURLCallback,
  getStripeProvider: getStripeProvider,
  PUBLISHABLE_KEY: '',
};
