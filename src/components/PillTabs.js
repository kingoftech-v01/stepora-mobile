/**
 * PillTabs — Horizontal scrollable tab bar with pill-shaped selection.
 */
var React = require('react');
var { View, Text, TouchableOpacity, ScrollView, StyleSheet } = require('react-native');
var { COLORS, FONT_SIZES, FONT_WEIGHTS, RADIUS, SPACING } = require('../styles/theme');
var { BRAND } = require('../styles/colors');

var PillTabs = function (props) {
  var tabs = props.tabs || [];
  var active = props.active;
  var onChange = props.onChange;
  var scrollable = props.scrollable !== false;

  var content = tabs.map(function (tab) {
    var isActive = tab.key === active;

    return React.createElement(
      TouchableOpacity,
      {
        key: tab.key,
        onPress: function () {
          onChange(tab.key);
        },
        activeOpacity: 0.7,
        accessible: true,
        accessibilityRole: 'tab',
        accessibilityLabel: tab.label + (tab.count != null && tab.count > 0 ? ', ' + tab.count + ' new' : ''),
        accessibilityState: { selected: isActive },
        style: [
          styles.tab,
          isActive && styles.tabActive,
        ],
      },
      tab.icon
        ? React.createElement(tab.icon, {
            size: 14,
            color: isActive ? '#fff' : COLORS.textMuted,
            style: { marginRight: 4 },
          })
        : null,
      React.createElement(
        Text,
        {
          style: [
            styles.tabText,
            isActive && styles.tabTextActive,
          ],
        },
        tab.label,
      ),
      tab.count != null && tab.count > 0
        ? React.createElement(
            View,
            { style: styles.badge },
            React.createElement(
              Text,
              { style: styles.badgeText },
              tab.count > 99 ? '99+' : String(tab.count),
            ),
          )
        : null,
    );
  });

  if (scrollable) {
    return React.createElement(
      ScrollView,
      {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: [styles.container, props.style],
      },
      content,
    );
  }

  return React.createElement(
    View,
    { style: [styles.container, styles.wrapped, props.style] },
    content,
  );
};

var styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  wrapped: {
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tabActive: {
    backgroundColor: BRAND.purple,
    borderColor: BRAND.purple,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: FONT_WEIGHTS.semibold,
  },
  badge: {
    marginLeft: 6,
    backgroundColor: BRAND.redSolid,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#fff',
  },
});

module.exports = PillTabs;
