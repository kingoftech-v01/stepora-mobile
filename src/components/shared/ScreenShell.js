/**
 * ScreenShell — Base screen wrapper with SafeAreaView and dark background.
 */
var React = require('react');
var { View, StyleSheet } = require('react-native');
var { useSafeAreaInsets } = require('react-native-safe-area-context');
var { COLORS } = require('../../theme/tokens');

var ScreenShell = function (props) {
  var children = props.children;
  var style = props.style;
  var insets = useSafeAreaInsets();

  return React.createElement(
    View,
    {
      style: [
        styles.container,
        { paddingTop: insets.top },
        style,
      ],
    },
    children,
  );
};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
});

module.exports = ScreenShell;
