/**
 * ScreenShell — Base screen wrapper with SafeAreaView and dark background.
 *
 * Props:
 *   children      — Screen content
 *   style         — Additional styles
 *   edges         — Array of safe area edges to apply: 'top' | 'bottom' | 'left' | 'right'
 *                   Default: ['top'] (only top safe area)
 *   statusBarBg   — Optional background color behind the status bar area
 */
var React = require('react');
var { View, StyleSheet, StatusBar, Platform } = require('react-native');
var { useSafeAreaInsets } = require('react-native-safe-area-context');
var { COLORS } = require('../../theme/tokens');

var ScreenShell = function (props) {
  var children = props.children;
  var style = props.style;
  var edges = props.edges || ['top'];
  var insets = useSafeAreaInsets();

  var paddingStyle = {};
  if (edges.indexOf('top') !== -1) paddingStyle.paddingTop = insets.top;
  if (edges.indexOf('bottom') !== -1) paddingStyle.paddingBottom = insets.bottom;
  if (edges.indexOf('left') !== -1) paddingStyle.paddingLeft = insets.left;
  if (edges.indexOf('right') !== -1) paddingStyle.paddingRight = insets.right;

  return React.createElement(
    View,
    {
      style: [
        styles.container,
        paddingStyle,
        style,
      ],
    },
    Platform.OS === 'android'
      ? React.createElement(StatusBar, {
          backgroundColor: 'transparent',
          translucent: true,
          barStyle: 'light-content',
        })
      : null,
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
