// ─── Stepora Mobile Configuration ────────────────────────────────
// Central configuration for the React Native app.
//
// Security (audit 1043): Do NOT hardcode production URLs or API keys.
// Use react-native-config or .env files so each build targets the right
// environment. The defaults below point to production; override them
// for dev/staging builds via STEPORA_API_BASE and STEPORA_WS_BASE env vars.

// Try to load react-native-config (optional dependency)
var _RNConfig;
try {
  _RNConfig = require('react-native-config').default || {};
} catch (_e) {
  _RNConfig = {};
}

var Config = {
  // API base URL — must point to the backend server
  // Override via STEPORA_API_BASE in .env for dev/staging builds
  API_BASE: _RNConfig.STEPORA_API_BASE || 'https://api.stepora.app',

  // WebSocket base URL
  // Override via STEPORA_WS_BASE in .env for dev/staging builds
  WS_BASE: _RNConfig.STEPORA_WS_BASE || 'wss://api.stepora.app',

  // Agora App ID for voice/video calls
  // Override via AGORA_APP_ID in .env for different environments
  AGORA_APP_ID: _RNConfig.AGORA_APP_ID || 'b67aeb35dbff4cb8a70278fb8e3edf46',

  // App version — displayed in settings
  APP_VERSION: '1.0.0',

  // Build number
  BUILD_NUMBER: '1',
};

export default Config;
