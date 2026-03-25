/**
 * GlassCard — Glass morphism card container for React Native.
 */
var React = require('react');
var { View, StyleSheet } = require('react-native');
var { COLORS, RADIUS, SPACING } = require('../../theme/tokens');

var GlassCard = function (props) {
  var style = props.style;
  var children = props.children;

  return React.createElement(
    View,
    {
      accessible: props.accessible,
      accessibilityRole: props.accessibilityRole,
      accessibilityLabel: props.accessibilityLabel,
      style: [styles.card, style],
    },
    children,
  );
};

var styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
});

module.exports = GlassCard;
