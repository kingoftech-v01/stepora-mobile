/**
 * GlassHeader — Glass morphism app bar for screen headers.
 */
var React = require('react');
var { View, Text, TouchableOpacity, StyleSheet } = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING } = require('../../theme/tokens');

var GlassHeader = function (props) {
  var title = props.title || '';
  var onBack = props.onBack;
  var rightActions = props.rightActions; // array of { icon, onPress, badge }
  var titleComponent = props.titleComponent;

  return React.createElement(
    View,
    { style: styles.header },
    // Left: back button
    onBack
      ? React.createElement(
          TouchableOpacity,
          {
            onPress: onBack,
            style: styles.iconBtn,
            hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Go back',
          },
          React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text }),
        )
      : React.createElement(View, { style: { width: 38 } }),

    // Center: title
    React.createElement(
      View,
      { style: styles.titleWrap },
      titleComponent ||
        React.createElement(
          Text,
          { style: styles.title, numberOfLines: 1, accessibilityRole: 'header' },
          title,
        ),
    ),

    // Right: action buttons
    React.createElement(
      View,
      { style: styles.rightWrap },
      rightActions
        ? rightActions.map(function (action, idx) {
            return React.createElement(
              TouchableOpacity,
              {
                key: idx,
                onPress: action.onPress,
                style: styles.iconBtn,
                hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: action.label || action.icon,
                accessibilityHint: action.hint,
              },
              React.createElement(Icon, {
                name: action.icon,
                size: 20,
                color: COLORS.text,
              }),
              action.badge
                ? React.createElement(
                    View,
                    { style: styles.badge, accessible: false },
                    React.createElement(
                      Text,
                      { style: styles.badgeText },
                      String(action.badge),
                    ),
                  )
                : null,
            );
          })
        : null,
    ),
  );
};

var styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassBg,
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  rightWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

module.exports = GlassHeader;
