/**
 * GlassCard — Glass morphism card component for React Native.
 * Dark translucent background with subtle border glow.
 */
var React = require('react');
var { View, StyleSheet } = require('react-native');
var { COLORS, RADIUS, SHADOWS, SPACING } = require('../styles/theme');

var GlassCard = function (props) {
  var padding = props.padding != null ? props.padding : SPACING.lg;
  var marginBottom = props.mb || 0;
  var borderRadius = (props.style && props.style.borderRadius) || RADIUS.xl;

  return React.createElement(
    View,
    {
      accessible: props.accessible,
      accessibilityRole: props.accessibilityRole,
      accessibilityLabel: props.accessibilityLabel,
      style: [
        styles.card,
        {
          padding: padding,
          marginBottom: marginBottom,
          borderRadius: borderRadius,
        },
        props.style,
      ],
    },
    props.children,
  );
};

var styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
});

module.exports = GlassCard;
