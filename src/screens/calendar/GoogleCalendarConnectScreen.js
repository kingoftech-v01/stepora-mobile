/**
 * GoogleCalendarConnectScreen — Connect, manage, and sync Google Calendar.
 * Shows connection status, calendar list with toggles, sync/disconnect buttons.
 */
var React = require('react');
var {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useGoogleCalendarConnectScreen = require('./useGoogleCalendarConnectScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var GoogleCalendarConnectScreen = function () {
  var h = useGoogleCalendarConnectScreen();

  var header = React.createElement(View, { style: styles.header },
    React.createElement(TouchableOpacity, {
      style: styles.headerBtn,
      onPress: function () { h.navigation.goBack(); },
      accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back',
    },
      React.createElement(Icon, { name: 'arrow-left', size: 20, color: COLORS.text })
    ),
    React.createElement(Text, { style: styles.headerTitle },
      h.connected ? 'Google Calendar' : 'Connect Calendar'
    ),
    React.createElement(View, { style: { width: 36 } })
  );

  // Icon section
  var iconSection = React.createElement(View, { style: styles.iconSection },
    React.createElement(View, { style: styles.iconBox },
      React.createElement(Icon, { name: 'calendar', size: 36, color: BRAND.blueLight })
    ),
    React.createElement(Text, { style: styles.sectionTitle },
      h.connected ? 'Calendar Connected' : 'Sync Calendar'
    ),
    React.createElement(Text, { style: styles.sectionDesc },
      h.connected
        ? 'Your Google Calendar is linked. Manage your calendars below.'
        : 'Sync your tasks and events with Google Calendar.'
    )
  );

  // Not connected view
  var notConnectedView = React.createElement(View, null,
    // Feature list
    React.createElement(View, { style: styles.card },
      ['Sync deadlines automatically', 'See tasks in your calendar', 'Get smart reminders'].map(
        function (text, i) {
          var colors = [BRAND.purple, BRAND.greenSolid, BRAND.orange];
          return React.createElement(View, {
            key: i,
            style: [styles.featureRow, i < 2 && styles.featureRowBorder],
          },
            React.createElement(View, {
              style: [styles.featureIcon, { backgroundColor: colors[i] + '15' }],
            },
              React.createElement(Icon, { name: 'check', size: 14, color: colors[i] })
            ),
            React.createElement(Text, { style: styles.featureText }, text)
          );
        }
      )
    ),
    // Connect button
    React.createElement(TouchableOpacity, {
      style: [styles.primaryBtn, h.connecting && { opacity: 0.6 }],
      onPress: h.handleConnect,
      disabled: h.connecting,
      activeOpacity: 0.7,
      accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Connect with Google', accessibilityState: { disabled: h.connecting },
    },
      h.connecting
        ? React.createElement(ActivityIndicator, { size: 'small', color: '#fff' })
        : React.createElement(View, { style: styles.btnRow },
            React.createElement(Icon, { name: 'link', size: 18, color: '#fff' }),
            React.createElement(Text, { style: styles.primaryBtnText }, 'Connect with Google')
          )
    )
  );

  // Connected view
  var connectedView = React.createElement(View, null,
    // Account card
    React.createElement(View, { style: styles.accountCard },
      React.createElement(View, { style: styles.accountAvatar },
        React.createElement(Text, { style: styles.accountAvatarText },
          ((h.statusQuery.data && h.statusQuery.data.email) || 'G')[0].toUpperCase()
        )
      ),
      React.createElement(View, { style: { flex: 1 } },
        React.createElement(Text, { style: styles.accountEmail },
          (h.statusQuery.data && h.statusQuery.data.email) || 'Google Account'
        ),
        React.createElement(View, { style: styles.connectedBadge },
          React.createElement(Icon, { name: 'check', size: 12, color: BRAND.green }),
          React.createElement(Text, { style: styles.connectedText }, 'Connected')
        )
      )
    ),
    // Calendar list
    h.calendars.length > 0
      ? React.createElement(View, { style: styles.card },
          React.createElement(View, { style: styles.cardHeader },
            React.createElement(Text, { style: styles.cardHeaderText }, 'Sync Calendars')
          ),
          h.calendars.map(function (cal, i) {
            return React.createElement(View, {
              key: cal.id,
              style: [styles.calRow, i < h.calendars.length - 1 && styles.calRowBorder],
            },
              React.createElement(View, {
                style: [styles.calDot, { backgroundColor: cal.color }],
              }),
              React.createElement(Text, { style: styles.calName }, cal.name),
              React.createElement(Switch, {
                value: cal.enabled,
                onValueChange: function () { h.toggleCalendar(cal.id); },
                trackColor: { false: 'rgba(255,255,255,0.1)', true: cal.color || BRAND.purple },
                thumbColor: '#fff',
                accessibilityLabel: 'Sync ' + cal.name, accessibilityRole: 'switch', accessibilityState: { checked: cal.enabled },
              })
            );
          })
        )
      : null,
    // Sync button
    React.createElement(TouchableOpacity, {
      style: [styles.secondaryBtn, h.syncing && { opacity: 0.6 }],
      onPress: h.handleSync,
      disabled: h.syncing,
      activeOpacity: 0.7,
      accessible: true, accessibilityRole: 'button', accessibilityLabel: h.syncing ? 'Syncing' : 'Sync Now', accessibilityState: { disabled: h.syncing },
    },
      React.createElement(View, { style: styles.btnRow },
        React.createElement(Icon, { name: 'refresh-cw', size: 16, color: COLORS.accent }),
        React.createElement(Text, { style: styles.secondaryBtnText },
          h.syncing ? 'Syncing...' : 'Sync Now'
        )
      )
    ),
    // Last sync
    h.lastSync
      ? React.createElement(Text, { style: styles.lastSyncText },
          'Last synced ' + h.lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        )
      : null,
    // Disconnect button
    React.createElement(TouchableOpacity, {
      style: [styles.dangerBtn, h.disconnecting && { opacity: 0.6 }],
      onPress: h.handleDisconnect,
      disabled: h.disconnecting,
      activeOpacity: 0.7,
      accessible: true, accessibilityRole: 'button', accessibilityLabel: h.disconnecting ? 'Disconnecting' : 'Disconnect Google Calendar', accessibilityState: { disabled: h.disconnecting },
    },
      React.createElement(View, { style: styles.btnRow },
        React.createElement(Icon, { name: 'log-out', size: 16, color: '#EF4444' }),
        React.createElement(Text, { style: styles.dangerBtnText },
          h.disconnecting ? 'Disconnecting...' : 'Disconnect'
        )
      )
    )
  );

  return React.createElement(SafeAreaView, { style: styles.container },
    header,
    React.createElement(ScrollView, {
      contentContainerStyle: styles.scroll,
      keyboardShouldPersistTaps: 'handled',
    },
      iconSection,
      h.connected ? connectedView : notConnectedView
    )
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
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
  iconSection: { alignItems: 'center', marginBottom: 28 },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  sectionDesc: {
    fontSize: 13, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 20, maxWidth: 280,
  },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    marginBottom: 12, overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder,
  },
  cardHeaderText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 18,
  },
  featureRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  featureIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  primaryBtn: {
    backgroundColor: BRAND.purple, borderRadius: RADIUS.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: 16,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 8 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  accountCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: 16, marginBottom: 12,
  },
  accountAvatar: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center',
  },
  accountAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  accountEmail: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  connectedText: { fontSize: 12, fontWeight: '500', color: BRAND.green },
  calRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 18,
  },
  calRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  calDot: { width: 10, height: 10, borderRadius: 5 },
  calName: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.text },
  secondaryBtn: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 8,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.accent, marginLeft: 8 },
  lastSyncText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 },
  dangerBtn: {
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    paddingVertical: 14, alignItems: 'center',
  },
  dangerBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444', marginLeft: 8 },
});

module.exports = GoogleCalendarConnectScreen;
