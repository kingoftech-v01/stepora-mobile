/**
 * GlassButton — Styled button with glass morphism variants.
 */
var React = require('react');
var { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet } = require('react-native');
var { COLORS, FONT_SIZES, FONT_WEIGHTS, RADIUS, SPACING } = require('../styles/theme');
var { BRAND } = require('../styles/colors');

var VARIANTS = {
  primary: {
    bg: BRAND.purple,
    text: '#fff',
    border: 'transparent',
  },
  secondary: {
    bg: 'rgba(255,255,255,0.06)',
    text: COLORS.text,
    border: COLORS.glassBorder,
  },
  ghost: {
    bg: 'transparent',
    text: COLORS.purple,
    border: 'transparent',
  },
  success: {
    bg: 'rgba(16,185,129,0.15)',
    text: BRAND.greenSolid,
    border: 'rgba(16,185,129,0.25)',
  },
  danger: {
    bg: 'rgba(239,68,68,0.15)',
    text: BRAND.redSolid,
    border: 'rgba(239,68,68,0.25)',
  },
};

var SIZES = {
  sm: { height: 34, fontSize: FONT_SIZES.sm, px: 12 },
  md: { height: 42, fontSize: FONT_SIZES.md, px: 16 },
  lg: { height: 50, fontSize: FONT_SIZES.lg, px: 20 },
};

var GlassButton = function (props) {
  var variant = VARIANTS[props.variant || 'primary'];
  var size = SIZES[props.size || 'md'];
  var disabled = props.disabled || props.loading;

  return React.createElement(
    TouchableOpacity,
    {
      onPress: disabled ? undefined : props.onPress,
      activeOpacity: 0.7,
      disabled: disabled,
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: props.accessibilityLabel || (typeof props.children === 'string' ? props.children : undefined),
      accessibilityHint: props.accessibilityHint,
      accessibilityState: { disabled: !!disabled, busy: !!props.loading },
      style: [
        styles.button,
        {
          backgroundColor: variant.bg,
          borderColor: variant.border,
          height: size.height,
          paddingHorizontal: size.px,
          opacity: disabled ? 0.5 : 1,
        },
        props.fullWidth && styles.fullWidth,
        props.style,
      ],
    },
    props.loading
      ? React.createElement(ActivityIndicator, {
          size: 'small',
          color: variant.text,
          accessibilityLabel: 'Loading',
        })
      : React.createElement(
          View,
          { style: styles.content },
          props.icon
            ? React.createElement(props.icon, {
                size: size.fontSize,
                color: variant.text,
                style: { marginRight: 6 },
              })
            : null,
          React.createElement(
            Text,
            {
              style: [
                styles.text,
                {
                  color: variant.text,
                  fontSize: size.fontSize,
                },
              ],
            },
            props.children,
          ),
        ),
  );
};

var styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
});

module.exports = GlassButton;
