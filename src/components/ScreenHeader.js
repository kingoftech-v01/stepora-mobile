/**
 * ScreenHeader — Glass morphism app bar for React Native screens.
 */
var React = require('react');
var { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } = require('react-native');
var { useSafeAreaInsets } = require('react-native-safe-area-context');
var { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } = require('../styles/theme');

var ScreenHeader = function (props) {
  var insets = useSafeAreaInsets();
  var topPadding = Platform.OS === 'ios' ? insets.top : (StatusBar.currentHeight || 0);

  return React.createElement(
    View,
    {
      style: [
        styles.header,
        { paddingTop: topPadding + 8 },
        props.style,
      ],
    },
    React.createElement(
      View,
      { style: styles.row },
      // Left slot
      React.createElement(
        View,
        { style: styles.side },
        props.left || null,
      ),
      // Title
      React.createElement(
        Text,
        {
          style: styles.title,
          numberOfLines: 1,
          accessibilityRole: 'header',
        },
        props.title || '',
      ),
      // Right slot
      React.createElement(
        View,
        { style: [styles.side, styles.rightSide] },
        props.right || null,
      ),
    ),
  );
};

var BackButton = function (props) {
  var Icon;
  try {
    Icon = require('react-native-vector-icons/Feather');
  } catch (e) {
    return React.createElement(
      TouchableOpacity,
      {
        onPress: props.onPress,
        style: styles.iconButton,
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Go back',
      },
      React.createElement(Text, { style: { color: '#fff', fontSize: 18 }, accessible: false }, '<'),
    );
  }

  return React.createElement(
    TouchableOpacity,
    {
      onPress: props.onPress,
      activeOpacity: 0.7,
      style: styles.iconButton,
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: 'Go back',
    },
    React.createElement(Icon, {
      name: 'arrow-left',
      size: 22,
      color: COLORS.text,
    }),
  );
};

var HeaderIconButton = function (props) {
  return React.createElement(
    TouchableOpacity,
    {
      onPress: props.onPress,
      activeOpacity: 0.7,
      style: styles.iconButton,
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: props.label,
      accessibilityHint: props.hint,
    },
    props.children,
  );
};

var styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(3,1,10,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    paddingBottom: 12,
    paddingHorizontal: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

module.exports = {
  ScreenHeader: ScreenHeader,
  BackButton: BackButton,
  HeaderIconButton: HeaderIconButton,
};
