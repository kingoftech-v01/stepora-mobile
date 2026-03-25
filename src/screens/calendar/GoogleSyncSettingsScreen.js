/**
 * GoogleSyncSettingsScreen — Configure sync direction, what to sync, per-dream toggles.
 * Shows connected status, direction selector, toggle rows, dream list, and save button.
 */
var React = require('react');
var {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useGoogleSyncSettingsScreen = require('./useGoogleSyncSettingsScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var DIRECTION_OPTIONS = [
  { value: 'both', label: 'Both ways' },
  { value: 'push_only', label: 'Push only' },
  { value: 'pull_only', label: 'Pull only' },
];

var DIRECTION_DESCS = {
  both: 'Events sync in both directions between Stepora and Google Calendar.',
  push_only: "Only push Stepora events to Google Calendar. Google changes won't sync back.",
  pull_only: "Only pull events from Google Calendar into Stepora. Local changes won't push.",
};

var GoogleSyncSettingsScreen = function () {
  var h = useGoogleSyncSettingsScreen();

  var header = React.createElement(View, { style: styles.header },
    React.createElement(TouchableOpacity, {
      style: styles.headerBtn,
      onPress: function () { h.navigation.goBack(); },
      accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back',
    },
      React.createElement(Icon, { name: 'arrow-left', size: 20, color: COLORS.text })
    ),
    React.createElement(Text, { style: styles.headerTitle }, 'Sync Settings'),
    React.createElement(View, { style: { width: 36 } })
  );

  // Icon section
  var iconSection = React.createElement(View, { style: styles.iconSection },
    React.createElement(View, { style: styles.iconBox },
      React.createElement(Icon, { name: 'settings', size: 32, color: BRAND.blueLight })
    ),
    React.createElement(Text, { style: styles.sectionTitle },
      h.connected ? 'Sync Settings' : 'Google Calendar'
    ),
    React.createElement(Text, { style: styles.sectionDesc },
      h.connected
        ? 'Choose what syncs with Google Calendar'
        : 'Connect your Google Calendar to configure sync'
    )
  );

  if (h.loading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      header,
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  // Not connected
  if (!h.connected) {
    return React.createElement(SafeAreaView, { style: styles.container },
      header,
      React.createElement(ScrollView, { contentContainerStyle: styles.scroll },
        iconSection,
        React.createElement(View, { style: styles.card },
          React.createElement(View, { style: { alignItems: 'center', padding: 16 } },
            React.createElement(Icon, { name: 'calendar', size: 40, color: COLORS.textMuted, style: { marginBottom: 12 } }),
            React.createElement(Text, { style: styles.notConnectedText },
              'You need to connect your Google Calendar before configuring sync settings.'
            ),
            React.createElement(TouchableOpacity, {
              style: styles.googleBtn,
              onPress: function () { h.navigation.navigate('GoogleCalendarConnect'); },
              activeOpacity: 0.7,
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Connect Google Calendar',
            },
              React.createElement(Text, { style: styles.googleBtnText }, 'Connect Google Calendar')
            )
          )
        )
      )
    );
  }

  // Connected view
  return React.createElement(SafeAreaView, { style: styles.container },
    header,
    React.createElement(ScrollView, { contentContainerStyle: styles.scroll },
      iconSection,
      // Status card
      React.createElement(View, { style: styles.statusCard },
        React.createElement(View, { style: styles.statusAvatar },
          React.createElement(Icon, { name: 'calendar', size: 18, color: '#fff' })
        ),
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: styles.statusLabel }, 'Google Calendar'),
          React.createElement(View, { style: styles.connectedBadge },
            React.createElement(Icon, { name: 'check', size: 11, color: BRAND.green }),
            React.createElement(Text, { style: styles.connectedText }, 'Connected')
          )
        ),
        React.createElement(TouchableOpacity, {
          style: styles.manageBtn,
          onPress: function () { h.navigation.navigate('GoogleCalendarConnect'); },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Manage Google Calendar connection',
        },
          React.createElement(Text, { style: styles.manageBtnText }, 'Manage')
        )
      ),
      // Sync direction
      React.createElement(View, { style: styles.card },
        React.createElement(View, { style: styles.cardHeaderPad },
          React.createElement(Text, { style: styles.sectionLabel }, 'SYNC DIRECTION')
        ),
        React.createElement(View, { style: styles.directionRow },
          DIRECTION_OPTIONS.map(function (opt) {
            var active = h.syncDirection === opt.value;
            return React.createElement(TouchableOpacity, {
              key: opt.value,
              style: [styles.directionOpt, active && styles.directionOptActive],
              onPress: function () { h.handleDirectionChange(opt.value); },
              activeOpacity: 0.7,
              accessible: true, accessibilityRole: 'button', accessibilityLabel: opt.label + ' sync direction', accessibilityState: { selected: active },
            },
              React.createElement(Text, {
                style: [styles.directionText, active && styles.directionTextActive],
              }, opt.label)
            );
          })
        ),
        React.createElement(View, { style: styles.directionDescWrap },
          React.createElement(Text, { style: styles.directionDesc }, DIRECTION_DESCS[h.syncDirection])
        )
      ),
      // What to sync
      React.createElement(View, { style: styles.card },
        React.createElement(View, { style: styles.cardHeaderPad },
          React.createElement(Text, { style: styles.sectionLabel }, 'WHAT TO SYNC')
        ),
        // Tasks toggle
        React.createElement(View, { style: [styles.toggleRow, { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder }] },
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, { style: styles.toggleLabel }, 'Dream tasks'),
            React.createElement(Text, { style: styles.toggleDesc }, 'Sync tasks from your dreams as calendar events')
          ),
          React.createElement(Switch, {
            value: h.syncTasks,
            onValueChange: h.handleToggleTasks,
            trackColor: { false: 'rgba(255,255,255,0.1)', true: BRAND.purple },
            thumbColor: '#fff',
            accessibilityLabel: 'Sync dream tasks', accessibilityRole: 'switch', accessibilityState: { checked: h.syncTasks },
          })
        ),
        // Events toggle
        React.createElement(View, { style: styles.toggleRow },
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, { style: styles.toggleLabel }, 'Calendar events'),
            React.createElement(Text, { style: styles.toggleDesc }, 'Sync standalone calendar events')
          ),
          React.createElement(Switch, {
            value: h.syncEvents,
            onValueChange: h.handleToggleEvents,
            trackColor: { false: 'rgba(255,255,255,0.1)', true: BRAND.blueLight },
            thumbColor: '#fff',
            accessibilityLabel: 'Sync calendar events', accessibilityRole: 'switch', accessibilityState: { checked: h.syncEvents },
          })
        )
      ),
      // Dreams to sync
      h.syncTasks && h.dreams.length > 0
        ? React.createElement(View, { style: styles.card },
            React.createElement(View, { style: [styles.cardHeaderPad, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }] },
              React.createElement(Text, { style: styles.sectionLabel }, 'DREAMS TO SYNC'),
              React.createElement(View, { style: { flexDirection: 'row', gap: 8 } },
                React.createElement(TouchableOpacity, { onPress: h.handleSelectAll, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Select all dreams' },
                  React.createElement(Text, {
                    style: [styles.selBtn, h.allSelected && { color: COLORS.accent }],
                  }, 'Select All')
                ),
                React.createElement(TouchableOpacity, { onPress: h.handleDeselectAll, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Deselect all dreams' },
                  React.createElement(Text, { style: styles.selBtn }, 'Deselect All')
                )
              )
            ),
            h.dreams.map(function (dream, i) {
              var synced = h.isDreamSynced(dream.id);
              return React.createElement(View, {
                key: dream.id,
                style: [styles.dreamRow, i < h.dreams.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder }],
              },
                React.createElement(View, {
                  style: [styles.dreamDot, { backgroundColor: dream.color || BRAND.purple }],
                }),
                React.createElement(Text, {
                  style: [styles.dreamName, !synced && { color: COLORS.textMuted }],
                  numberOfLines: 1,
                }, dream.title),
                React.createElement(Switch, {
                  value: synced,
                  onValueChange: function () { h.handleToggleDream(dream.id); },
                  trackColor: { false: 'rgba(255,255,255,0.1)', true: dream.color || BRAND.purple },
                  thumbColor: '#fff',
                  accessibilityLabel: 'Sync ' + dream.title, accessibilityRole: 'switch', accessibilityState: { checked: synced },
                })
              );
            })
          )
        : null,
      // Last sync card
      React.createElement(View, { style: styles.syncCard },
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: styles.syncLabel }, 'Last synced'),
          React.createElement(Text, { style: styles.syncTime },
            h.lastSyncAt
              ? h.lastSyncAt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Never synced'
          )
        ),
        React.createElement(TouchableOpacity, {
          style: [styles.syncNowBtn, h.syncing && { opacity: 0.7 }],
          onPress: h.handleSyncNow,
          disabled: h.syncing,
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: h.syncing ? 'Syncing' : 'Sync Now', accessibilityState: { disabled: h.syncing },
        },
          React.createElement(Icon, { name: 'refresh-cw', size: 14, color: COLORS.accent }),
          React.createElement(Text, { style: styles.syncNowText },
            h.syncing ? 'Syncing...' : 'Sync Now'
          )
        )
      ),
      // Save button
      React.createElement(TouchableOpacity, {
        style: [
          styles.saveBtn,
          h.dirty ? styles.saveBtnActive : styles.saveBtnInactive,
          (h.saving || !h.dirty) && { opacity: 0.7 },
        ],
        onPress: h.handleSave,
        disabled: h.saving || !h.dirty,
        activeOpacity: 0.7,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: h.dirty ? 'Save Settings' : 'Settings Saved', accessibilityState: { disabled: h.saving || !h.dirty },
      },
        h.saving
          ? React.createElement(View, { style: styles.btnRow },
              React.createElement(ActivityIndicator, { size: 'small', color: '#fff' }),
              React.createElement(Text, { style: styles.saveBtnText }, ' Saving...')
            )
          : React.createElement(View, { style: styles.btnRow },
              React.createElement(Icon, { name: 'check', size: 16, color: h.dirty ? '#fff' : COLORS.textMuted }),
              React.createElement(Text, {
                style: [styles.saveBtnText, !h.dirty && { color: COLORS.textMuted }],
              }, h.dirty ? ' Save Settings' : ' Settings Saved')
            )
      )
    )
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, gap: 8,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  iconSection: { alignItems: 'center', marginBottom: 24 },
  iconBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 12, overflow: 'hidden',
  },
  cardHeaderPad: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 8 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  notConnectedText: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 16,
  },
  googleBtn: {
    paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12,
    backgroundColor: '#4285F4',
  },
  googleBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder, padding: 14, marginBottom: 12,
  },
  statusAvatar: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center',
  },
  statusLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  connectedText: { fontSize: 12, fontWeight: '500', color: BRAND.green },
  manageBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  manageBtnText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  directionRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingBottom: 12 },
  directionOpt: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  directionOptActive: { backgroundColor: COLORS.glassBg },
  directionText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  directionTextActive: { fontWeight: '600', color: COLORS.accent },
  directionDescWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  directionDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  toggleDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  selBtn: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  dreamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 16,
  },
  dreamDot: { width: 10, height: 10, borderRadius: 5 },
  dreamName: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.text },
  syncCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder, padding: 16, marginBottom: 12,
  },
  syncLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  syncTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  syncNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: COLORS.glassBg,
  },
  syncNowText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnActive: { backgroundColor: BRAND.purple },
  saveBtnInactive: { backgroundColor: COLORS.glassBg },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

module.exports = GoogleSyncSettingsScreen;
