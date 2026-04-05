var { getDefaultConfig } = require('expo/metro-config');
var { mergeConfig } = require('@react-native/metro-config');

var expoConfig = getDefaultConfig(__dirname);

// Remove expo's custom serializer that causes "not valid JSON" error
// during EAS build's export:embed step
delete expoConfig.serializer;

module.exports = mergeConfig(expoConfig, {});
