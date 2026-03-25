/**
 * @format
 * Stepora Mobile — Entry point.
 * Registers the app component and sets up FCM background message handler.
 */
var { AppRegistry } = require('react-native');
var { default: App } = require('./src/App');
var { name: appName } = require('./app.json');

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
