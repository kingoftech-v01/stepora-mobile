/**
 * AppVersionScreen -- React Native.
 * App info, version, changelog, update check, and quick links.
 */
var React = require('react');
var {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var useAppVersionScreen = require('./useAppVersionScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

/* ─── Quick Action Tile ──────────────────────────────────── */
function ActionTile(props) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={props.onPress} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel={props.label}>
      <View style={[styles.actionIconWrap, { backgroundColor: (props.color || BRAND.purple) + '15' }]}>
        <Text style={styles.actionEmoji}>{props.emoji}</Text>
      </View>
      <Text style={styles.actionLabel}>{props.label}</Text>
      <Text style={styles.actionChevron}>{'>'}</Text>
    </TouchableOpacity>
  );
}

/* ─── System Info Row ─────────────────────────────────────── */
function InfoRow(props) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{props.label}</Text>
      <Text style={styles.infoValue}>{props.value}</Text>
    </View>
  );
}

/* ─── Changelog Entry ─────────────────────────────────────── */
function ChangelogEntry(props) {
  var entry = props.entry;
  return (
    <View style={styles.changelogEntry}>
      <View style={styles.changelogHeader}>
        <View style={styles.versionBadge}>
          <Text style={styles.versionBadgeText}>v{entry.version}</Text>
        </View>
        <Text style={styles.changelogDate}>{entry.date || ''}</Text>
      </View>
      <Text style={styles.changelogTitle}>{entry.title || 'Update'}</Text>
      {entry.notes && entry.notes.length > 0 ? (
        <View style={styles.notesList}>
          {entry.notes.map(function (note, i) {
            return (
              <View key={i} style={styles.noteItem}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */
function AppVersionScreen() {
  var h = useAppVersionScreen();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>{'<-'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">App Info</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* App Logo / Version Card */}
        <View style={styles.heroCard}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.appName}>Stepora</Text>
          <Text style={styles.versionLabel}>Version {h.appVersion} (Build {h.buildNumber})</Text>

          {/* Update status */}
          {h.updateAvailable ? (
            <View style={styles.updateBanner}>
              <Text style={styles.updateText}>
                New version available: {h.latestVersion}
              </Text>
              <TouchableOpacity
                style={styles.updateBtn}
                onPress={h.handleUpdate}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={'Update to version ' + h.latestVersion}
              >
                <Text style={styles.updateBtnText}>Update Now</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Check for updates */}
        <TouchableOpacity
          style={[styles.checkBtn, h.checking && styles.btnDisabled]}
          onPress={h.checkForUpdates}
          disabled={h.checking}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Check for Updates"
          accessibilityState={{ disabled: !!h.checking, busy: !!h.checking }}
        >
          {h.checking ? (
            <View style={styles.checkRow}>
              <ActivityIndicator color={BRAND.purple} size="small" />
              <Text style={[styles.checkBtnText, { marginLeft: 8 }]}>Checking...</Text>
            </View>
          ) : (
            <Text style={styles.checkBtnText}>Check for Updates</Text>
          )}
        </TouchableOpacity>

        {/* Error */}
        {h.error ? (
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Text style={styles.errorText}>{h.error}</Text>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ActionTile emoji="⭐" label="Rate App" color="#FCD34D" onPress={h.handleRateApp} />
          <ActionTile emoji="🐛" label="Report a Bug" color="#EF4444" onPress={h.handleReportBug} />
          <ActionTile emoji="💬" label="Send Feedback" color="#3B82F6" onPress={h.handleFeedback} />
        </View>

        {/* System Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>System Information</Text>
          {h.systemInfo.map(function (info) {
            return <InfoRow key={info.label} label={info.label} value={info.value} />;
          })}
        </View>

        {/* Changelog */}
        <View style={styles.changelogSection}>
          <Text style={styles.sectionTitle}>Release Notes</Text>

          {h.loadingChangelog ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={BRAND.purple} size="small" />
            </View>
          ) : h.changelog.length === 0 ? (
            <View style={styles.emptyChangelog}>
              <Text style={styles.emptyText}>No release notes available</Text>
            </View>
          ) : (
            h.changelog.map(function (entry, index) {
              return <ChangelogEntry key={entry.version || index} entry={entry} />;
            })
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>Made with care by the Stepora team</Text>
          <Text style={styles.footerCopyright}>Stepora {new Date().getFullYear()}. All rights reserved.</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },

  // Hero card
  heroCard: {
    backgroundColor: dark.glassBg, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 24, alignItems: 'center', marginBottom: 12,
  },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 2, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: BRAND.purpleLight },
  appName: { fontSize: 22, fontWeight: '800', color: dark.text, marginBottom: 4 },
  versionLabel: { fontSize: 13, color: dark.textTertiary },

  // Update banner
  updateBanner: {
    marginTop: 14, backgroundColor: 'rgba(93,229,168,0.1)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(93,229,168,0.2)',
    padding: 14, alignItems: 'center', width: '100%',
  },
  updateText: { fontSize: 13, fontWeight: '600', color: '#5DE5A8', marginBottom: 8 },
  updateBtn: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#10B981',
  },
  updateBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Check button
  checkBtn: {
    height: 48, borderRadius: 14, backgroundColor: dark.glassBg,
    borderWidth: 1, borderColor: dark.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  checkBtnText: { fontSize: 14, fontWeight: '600', color: BRAND.purple },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  errorText: { fontSize: 13, color: BRAND.redSolid },

  // Card
  card: {
    backgroundColor: dark.glassBg, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 20, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: dark.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },

  // Action tiles
  actionTile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: dark.divider,
  },
  actionIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionEmoji: { fontSize: 16 },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: dark.text },
  actionChevron: { fontSize: 18, color: dark.textMuted, fontWeight: '500' },

  // System info rows
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: dark.divider,
  },
  infoLabel: { fontSize: 13, color: dark.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: dark.text },

  // Changelog
  changelogSection: { marginBottom: 16 },
  loadingWrap: { alignItems: 'center', paddingVertical: 20 },
  emptyChangelog: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 13, color: dark.textMuted },
  changelogEntry: {
    backgroundColor: dark.glassBg, borderRadius: 16,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 16, marginBottom: 10,
  },
  changelogHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  versionBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  versionBadgeText: { fontSize: 11, fontWeight: '700', color: BRAND.purple },
  changelogDate: { fontSize: 12, color: dark.textMuted },
  changelogTitle: { fontSize: 15, fontWeight: '600', color: dark.text, marginBottom: 8 },
  notesList: { marginTop: 4 },
  noteItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  noteDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: BRAND.purple, marginTop: 6 },
  noteText: { flex: 1, fontSize: 13, color: dark.textPrimary, lineHeight: 18 },

  // Footer
  footerWrap: { alignItems: 'center', paddingVertical: 16 },
  footerText: { fontSize: 12, color: dark.textMuted, marginBottom: 4 },
  footerCopyright: { fontSize: 11, color: dark.textMuted },
});

module.exports = AppVersionScreen;
