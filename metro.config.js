var { getDefaultConfig } = require('expo/metro-config');

var defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'mjs',
  'cjs',
];

module.exports = defaultConfig;
