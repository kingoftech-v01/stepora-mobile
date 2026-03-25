/**
 * NotificationSettingsScreen — Notification preferences management.
 * Allows users to toggle push notification categories,
 * manage biometric app lock, and configure quiet hours.
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
var {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  RefreshControl,
  Alert,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPatch } = require('../../services/api');
var { USERS } = require('../../services/endpoints');
var pushService = require('../../services/pushNotifications');
var { BRAND } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var GlassButton = require('../../components/GlassButton');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');

// ─── Notification Categories ────────────────────────────────────

var CATEGORIES = [
  { key: 'dreamProgress', label: 'Dream Progress', desc: 'Updates on your dream milestones', emoji: '\uD83C\uDFAF' },
  { key: 'friendRequests', label: 'Friend Requests', desc: 'New friend and buddy requests', emoji: '\uD83D\uDC65' },
  { key: 'achievements', label: 'Achievements', desc: 'Badge unlocks and streaks', emoji: '\u2B50' },
  { key: 'reminders', label: 'Reminders', desc: 'Check-in and task reminders', emoji: '\u23F0' },
  { key: 'social', label: 'Social Activity', desc: 'Likes, comments, and mentions', emoji: '\uD83D\uDCAC' },
  { key: 'weeklyReport', label: 'Weekly Report', desc: 'Your progress summary', emoji: '\uD83D\uDCCA' },
  { key: 'promotions', label: 'Promotions', desc: 'Special offers and new features', emoji: '\uD83C\uDF81' },
];

// ─── Screen ─────────────────────────────────────────────────────

var NotificationSettingsScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [refreshing, setRefreshing] = useState(false);
  var [pushEnabled, setPushEnabled] = useState(false);

  // Check push permission on mount
  useEffect(function () {
    pushService.requestPermission().then(function (granted) {
      setPushEnabled(granted);
    });
  }, []);

  // ─── Query ──────────────────────────────────────────────────

  var prefsQuery = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: function () {
      return apiGet(USERS.NOTIFICATION_PREFS);
    },
  });

  var prefs = prefsQuery.data || {};

  // ─── Mutation ─────────────────────────────────────────────────

  var updateMut = useMutation({
    mutationFn: function (data) {
      return apiPatch(USERS.NOTIFICATION_PREFS, data);
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs'] });
    },
  });

  var togglePref = function (key, currentValue) {
    var payload = {};
    payload[key] = !currentValue;
    updateMut.mutate(payload);
  };

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    prefsQuery.refetch().finally(function () {
      setRefreshing(false);
    });
  }, []);

  var handleEnablePush = function () {
    pushService.requestPermission().then(function (granted) {
      setPushEnabled(granted);
      if (granted) {
        var { apiPost } = require('../../services/api');
        pushService.registerTokenWithBackend(apiPost);
      } else {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive push notifications.',
        );
      }
    });
  };

  // ─── Render ─────────────────────────────────────────────────

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(ScreenHeader, {
      title: 'Notification Settings',
      left: React.createElement(BackButton, {
        onPress: function () {
          navigation.goBack();
        },
      }),
    }),

    React.createElement(
      ScrollView,
      {
        style: styles.scroll,
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        refreshControl: React.createElement(RefreshControl, {
          refreshing: refreshing,
          onRefresh: onRefresh,
          tintColor: BRAND.purple,
        }),
      },

      // Push notifications master toggle
      React.createElement(
        GlassCard,
        { padding: 16, mb: 20 },
        React.createElement(
          View,
          { style: styles.settingRow },
          React.createElement(
            View,
            { style: { flex: 1 } },
            React.createElement(
              Text,
              { style: styles.settingTitle },
              '\uD83D\uDD14 Push Notifications',
            ),
            React.createElement(
              Text,
              { style: styles.settingDesc },
              pushEnabled ? 'Enabled — receiving push notifications' : 'Tap to enable push notifications',
            ),
          ),
          pushEnabled
            ? React.createElement(
                View,
                { style: styles.enabledBadge },
                React.createElement(
                  Text,
                  { style: styles.enabledText },
                  'ON',
                ),
              )
            : React.createElement(
                GlassButton,
                {
                  variant: 'primary',
                  size: 'sm',
                  onPress: handleEnablePush,
                },
                'Enable',
              ),
        ),
      ),

      // Category toggles
      React.createElement(
        Text,
        { style: styles.sectionTitle },
        'Categories',
      ),
      CATEGORIES.map(function (cat) {
        var isEnabled = prefs[cat.key] !== false; // default true

        return React.createElement(
          GlassCard,
          { key: cat.key, padding: 16, mb: 10 },
          React.createElement(
            View,
            { style: styles.settingRow },
            React.createElement(
              Text,
              { style: { fontSize: 24, marginRight: 12 } },
              cat.emoji,
            ),
            React.createElement(
              View,
              { style: { flex: 1 } },
              React.createElement(
                Text,
                { style: styles.settingTitle },
                cat.label,
              ),
              React.createElement(
                Text,
                { style: styles.settingDesc },
                cat.desc,
              ),
            ),
            React.createElement(Switch, {
              value: isEnabled,
              onValueChange: function () {
                togglePref(cat.key, isEnabled);
              },
              trackColor: { false: theme.surface, true: BRAND.purple + '60' },
              thumbColor: isEnabled ? BRAND.purple : theme.textMuted,
              accessible: true, accessibilityRole: 'switch', accessibilityLabel: cat.label + ' notifications', accessibilityState: { checked: isEnabled },
            }),
          ),
        );
      }),

      // Quiet hours section
      React.createElement(
        Text,
        { style: [styles.sectionTitle, { marginTop: 20 }] },
        'Quiet Hours',
      ),
      React.createElement(
        GlassCard,
        { padding: 16, mb: 10 },
        React.createElement(
          View,
          { style: styles.settingRow },
          React.createElement(
            Text,
            { style: { fontSize: 24, marginRight: 12 } },
            '\uD83C\uDF19',
          ),
          React.createElement(
            View,
            { style: { flex: 1 } },
            React.createElement(
              Text,
              { style: styles.settingTitle },
              'Do Not Disturb',
            ),
            React.createElement(
              Text,
              { style: styles.settingDesc },
              'Mute notifications during sleep hours',
            ),
          ),
          React.createElement(Switch, {
            value: prefs.quietHoursEnabled || false,
            onValueChange: function () {
              togglePref('quietHoursEnabled', prefs.quietHoursEnabled || false);
            },
            trackColor: { false: theme.surface, true: BRAND.purple + '60' },
            thumbColor: prefs.quietHoursEnabled ? BRAND.purple : theme.textMuted,
            accessible: true, accessibilityRole: 'switch', accessibilityLabel: 'Do not disturb quiet hours', accessibilityState: { checked: prefs.quietHoursEnabled || false },
          }),
        ),
      ),

      React.createElement(View, { style: { height: 40 } }),
    ),
  );
};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
  },
  enabledBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: BRAND.greenSolid + '1A',
  },
  enabledText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.bold,
    color: BRAND.greenSolid,
  },
});

module.exports = NotificationSettingsScreen;
