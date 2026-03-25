/**
 * NotificationSettingsScreen — Notification preferences management.
 * Allows users to toggle push notification categories,
 * manage biometric app lock, and configure quiet hours.
 *
 * Backend keys (snake_case, auto-transformed to camelCase by API client):
 *   push_enabled, email_enabled, sound_enabled, dream_reminders,
 *   goal_deadlines, buddy_messages, circle_updates, league_updates,
 *   social_activity, ai_suggestions, streak_reminders, weekly_summary
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
var { apiGet, apiPut } = require('../../services/api');
var { USERS } = require('../../services/endpoints');
var pushService = require('../../services/pushNotifications');
var { BRAND } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var GlassButton = require('../../components/GlassButton');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');

// ─── Notification Categories ────────────────────────────────────
// Keys match backend allowed_keys (camelCase — auto-transformed to snake_case)
var CATEGORIES = [
  { key: 'dreamReminders', label: 'Dream Reminders', desc: 'Check-in and milestone reminders', emoji: '\uD83C\uDFAF' },
  { key: 'goalDeadlines', label: 'Goal Deadlines', desc: 'Upcoming goal deadline alerts', emoji: '\u23F0' },
  { key: 'buddyMessages', label: 'Buddy Messages', desc: 'Messages from your accountability buddies', emoji: '\uD83D\uDCAC' },
  { key: 'circleUpdates', label: 'Circle Updates', desc: 'New posts and activity in your circles', emoji: '\uD83D\uDC65' },
  { key: 'leagueUpdates', label: 'League Updates', desc: 'Rank changes and season results', emoji: '\uD83C\uDFC6' },
  { key: 'socialActivity', label: 'Social Activity', desc: 'Likes, comments, and mentions', emoji: '\u2764\uFE0F' },
  { key: 'aiSuggestions', label: 'AI Suggestions', desc: 'Smart coaching tips and insights', emoji: '\u2728' },
  { key: 'streakReminders', label: 'Streak Reminders', desc: 'Daily streak protection alerts', emoji: '\uD83D\uDD25' },
  { key: 'weeklySummary', label: 'Weekly Summary', desc: 'Your weekly progress report', emoji: '\uD83D\uDCCA' },
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
  // Backend expects PUT (not PATCH)

  var updateMut = useMutation({
    mutationFn: function (data) {
      return apiPut(USERS.NOTIFICATION_PREFS, data);
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
              pushEnabled ? 'Enabled \u2014 receiving push notifications' : 'Tap to enable push notifications',
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

      // Email notifications toggle
      React.createElement(
        GlassCard,
        { padding: 16, mb: 20 },
        React.createElement(
          View,
          { style: styles.settingRow },
          React.createElement(
            Text,
            { style: { fontSize: 24, marginRight: 12 } },
            '\u2709\uFE0F',
          ),
          React.createElement(
            View,
            { style: { flex: 1 } },
            React.createElement(
              Text,
              { style: styles.settingTitle },
              'Email Notifications',
            ),
            React.createElement(
              Text,
              { style: styles.settingDesc },
              'Receive email updates and summaries',
            ),
          ),
          React.createElement(Switch, {
            value: prefs.emailEnabled !== false,
            onValueChange: function () {
              togglePref('emailEnabled', prefs.emailEnabled !== false);
            },
            trackColor: { false: theme.surface, true: BRAND.purple + '60' },
            thumbColor: prefs.emailEnabled !== false ? BRAND.purple : theme.textMuted,
            accessible: true, accessibilityRole: 'switch', accessibilityLabel: 'Email notifications', accessibilityState: { checked: prefs.emailEnabled !== false },
          }),
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

      // Sound toggle
      React.createElement(
        Text,
        { style: [styles.sectionTitle, { marginTop: 20 }] },
        'Sound & Alerts',
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
            '\uD83D\uDD0A',
          ),
          React.createElement(
            View,
            { style: { flex: 1 } },
            React.createElement(
              Text,
              { style: styles.settingTitle },
              'Notification Sounds',
            ),
            React.createElement(
              Text,
              { style: styles.settingDesc },
              'Play sound with notifications',
            ),
          ),
          React.createElement(Switch, {
            value: prefs.soundEnabled !== false,
            onValueChange: function () {
              togglePref('soundEnabled', prefs.soundEnabled !== false);
            },
            trackColor: { false: theme.surface, true: BRAND.purple + '60' },
            thumbColor: prefs.soundEnabled !== false ? BRAND.purple : theme.textMuted,
            accessible: true, accessibilityRole: 'switch', accessibilityLabel: 'Notification sounds', accessibilityState: { checked: prefs.soundEnabled !== false },
          }),
        ),
      ),

      React.createElement(View, { style: { height: 40 } }),
    ),
  );
};

// ─── Styles ─────────────────────────────────────────────────────

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
