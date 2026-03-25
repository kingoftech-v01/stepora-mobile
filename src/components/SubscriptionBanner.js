/**
 * SubscriptionBanner — Subtle, dismissable banner shown at the top of
 * relevant screens for free-tier users.
 *
 * Usage:
 *   <SubscriptionBanner />
 *
 * - Dismisses when the user taps the X button.
 * - Stays dismissed for 3 days (saved in AsyncStorage).
 * - Shows nothing if the user already has a paid subscription.
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
var { View, Text, TouchableOpacity, StyleSheet } = require('react-native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var Icon = require('react-native-vector-icons/Feather').default;
var { useAuth } = require('../context/AuthContext');
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');

var DISMISS_KEY = 'dp-sub-banner-dismissed';
var DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

var SubscriptionBanner = function (props) {
  var message = props.message || "You're on the Free plan. Some features are limited.";
  var style = props.style || null;

  var auth = useAuth();
  var [visible, setVisible] = useState(false);

  // Check if banner should be visible
  useEffect(function () {
    // Only show for free users
    if (!auth.user) return;
    var userTier = (auth.user.subscription || 'free').toLowerCase();
    if (userTier !== 'free') {
      setVisible(false);
      return;
    }

    // Check dismiss timestamp in AsyncStorage
    AsyncStorage.getItem(DISMISS_KEY)
      .then(function (val) {
        if (!val) {
          setVisible(true);
          return;
        }
        var dismissedAt = parseInt(val, 10);
        if (isNaN(dismissedAt)) {
          setVisible(true);
          return;
        }
        var elapsed = Date.now() - dismissedAt;
        if (elapsed >= DISMISS_DURATION_MS) {
          // TTL expired, show again
          AsyncStorage.removeItem(DISMISS_KEY).catch(function () {});
          setVisible(true);
        } else {
          setVisible(false);
        }
      })
      .catch(function () {
        setVisible(true);
      });
  }, [auth.user]);

  var handleDismiss = useCallback(function () {
    setVisible(false);
    AsyncStorage.setItem(DISMISS_KEY, String(Date.now())).catch(function () {});
  }, []);

  if (!visible) return null;

  return React.createElement(
    View,
    {
      style: [styles.banner, style],
      accessible: true,
      accessibilityRole: 'alert',
      accessibilityLabel: message,
    },
    React.createElement(
      View,
      { style: styles.content, accessible: false },
      React.createElement(Icon, { name: 'info', size: 14, color: BRAND.purpleLight }),
      React.createElement(
        Text,
        { style: styles.text },
        message,
      ),
    ),
    React.createElement(
      TouchableOpacity,
      {
        style: styles.closeBtn,
        onPress: handleDismiss,
        hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Dismiss banner',
      },
      React.createElement(Icon, { name: 'x', size: 14, color: COLORS.textMuted }),
    ),
  );
};

var styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

module.exports = SubscriptionBanner;
