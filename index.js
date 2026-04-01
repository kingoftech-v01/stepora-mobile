/**
 * @format
 * Stepora Mobile — Entry point.
 * Registers the app component and sets up FCM background message handler.
 */
var Sentry = require('@sentry/react-native');
var { AppRegistry } = require('react-native');
var { default: App } = require('./src/App');
var { name: appName } = require('./app.json');

// ─── Sentry error monitoring ────────────────────────────────────
// Replace the placeholder DSN with your real Sentry DSN.
// Set SENTRY_DSN in your .env or react-native-config.
Sentry.init({
  dsn: "https://ebad8b379ad54e7ac01cee807782ef90@o4511122325504000.ingest.us.sentry.io/4511122389794816",
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.1,
  enabled: !__DEV__,
});

// ─── Firebase background message handler ────────────────────────
// Must be registered at the top level before AppRegistry.
try {
  var messaging = require('@react-native-firebase/messaging').default;
  var { backgroundHandler } = require('./src/services/pushNotifications');
  messaging().setBackgroundMessageHandler(backgroundHandler);
} catch (e) {
  // Firebase not installed yet — skip background handler registration
}

AppRegistry.registerComponent(appName, function () {
  return App;
});
