// ─── Stepora Mobile Configuration ────────────────────────────────
// Central configuration for the React Native app.
// In production, these could be loaded from react-native-config or env files.

var Config = {
  // API base URL — must point to the backend server
  // Development: use your local machine IP or tunnel URL
  // Production: https://api.stepora.app
  API_BASE: 'https://api.stepora.app',

  // WebSocket base URL
  // Development: ws://your-ip:8000
  // Production: wss://api.stepora.app
  WS_BASE: 'wss://api.stepora.app',

  // App version — displayed in settings
  APP_VERSION: '1.0.0',

  // Build number
  BUILD_NUMBER: '1',
};

export default Config;
