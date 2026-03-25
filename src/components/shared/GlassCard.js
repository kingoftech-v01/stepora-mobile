/**
 * GlassCard — Glass morphism card container for React Native.
 * Synced with components/GlassCard.js — supports padding, mb, borderRadius props.
 */
var React = require('react');
var { View, StyleSheet } = require('react-native');
var { COLORS, RADIUS, SPACING } = require('../../theme/tokens');
var { SHADOWS } = require('../../styles/theme');

var GlassCard = function (props) {
  var padding = props.padding != null ? props.padding : SPACING.lg;
  var marginBottom = props.mb != null ? props.mb : SPACING.md;
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
    ...SHADOWS.soft,
  },
});

module.exports = GlassCard;
