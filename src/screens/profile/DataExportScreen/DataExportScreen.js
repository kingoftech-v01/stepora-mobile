/**
 * DataExportScreen -- React Native.
 * GDPR data export: request, view history, download.
 */
var React = require('react');
var {
  View, Text, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var useDataExportScreen = require('./useDataExportScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

/* ─── Data Category Item ─────────────────────────────────── */
function CategoryItem(props) {
  return (
    <View style={styles.catItem}>
      <View style={styles.catDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.catLabel}>{props.label}</Text>
        <Text style={styles.catDesc}>{props.desc}</Text>
      </View>
    </View>
  );
}

/* ─── Export History Item ─────────────────────────────────── */
function ExportItem(props) {
  var h = props.hook;
  var item = props.item;
  var status = item.status || 'pending';
  var statusLabel = h.getStatusLabel(status);
  var statusColor = h.getStatusColor(status);
  var isReady = statusLabel === 'Ready';

  return (
    <View style={styles.exportItem}>
      <View style={styles.exportLeft}>
        <View style={[styles.exportStatusDot, { backgroundColor: statusColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.exportTitle}>
            Data Export{item.format ? ' (' + item.format.toUpperCase() + ')' : ''}
          </Text>
          <Text style={styles.exportDate}>
            {h.formatDate(item.createdAt || item.requestedAt || item.created_at)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {isReady ? (
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={function () { h.handleDownload(item); }}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={'Download data export' + (item.format ? ', ' + item.format.toUpperCase() + ' format' : '')}
        >
          <Text style={styles.downloadBtnText}>Download</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */
function DataExportScreen() {
  var h = useDataExportScreen();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>{'<-'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Data Export</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Error */}
        {h.error ? (
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Text style={styles.errorText}>{h.error}</Text>
          </View>
        ) : null}

        {/* Success */}
        {h.successMsg ? (
          <View style={styles.successBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.successText}>{h.successMsg}</Text>
          </View>
        ) : null}

        {/* GDPR Info Card */}
        <View style={styles.card}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoEmoji}>📦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Your Data, Your Rights</Text>
              <Text style={styles.infoDesc}>
                Under GDPR, you have the right to receive a copy of all personal data we hold about you.
                Your export will be prepared as a downloadable file.
              </Text>
            </View>
          </View>
        </View>

        {/* Data Categories Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data Included</Text>
          {h.DATA_CATEGORIES.map(function (cat) {
            return (
              <CategoryItem key={cat.key} label={cat.label} desc={cat.desc} />
            );
          })}
        </View>

        {/* Request Export Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, h.requesting && styles.btnDisabled]}
          onPress={h.handleRequestExport}
          disabled={h.requesting}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Request Data Export"
          accessibilityState={{ disabled: !!h.requesting, busy: !!h.requesting }}
        >
          {h.requesting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>Requesting...</Text>
            </View>
          ) : (
            <Text style={styles.primaryBtnText}>Request Data Export</Text>
          )}
        </TouchableOpacity>

        {/* Export History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Export History</Text>

          {h.loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={BRAND.purple} size="small" />
              <Text style={styles.loadingText}>Loading exports...</Text>
            </View>
          ) : h.exports.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No exports yet</Text>
              <Text style={styles.emptySub}>Request your first data export above</Text>
            </View>
          ) : (
            h.exports.map(function (item, index) {
              return (
                <ExportItem key={item.id || index} item={item} hook={h} />
              );
            })
          )}
        </View>

        {/* Footer info */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Processing Time</Text>
          <Text style={styles.footerText}>
            Exports typically take a few minutes to prepare. You will receive a notification when your export is ready to download.
            Export files are available for 7 days after creation.
          </Text>
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

  // Alerts
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: BRAND.redSolid, lineHeight: 19 },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  successText: { fontSize: 13, color: BRAND.greenSolid, lineHeight: 19 },

  // Card
  card: {
    backgroundColor: dark.glassBg, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 20, marginBottom: 12,
  },

  // Info header
  infoHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  infoEmoji: { fontSize: 28, marginTop: 2 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: dark.text, marginBottom: 6 },
  infoDesc: { fontSize: 13, color: dark.textTertiary, lineHeight: 19 },

  // Section title
  sectionTitle: { fontSize: 14, fontWeight: '700', color: dark.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Data category items
  catItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  catDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.purple, marginTop: 5 },
  catLabel: { fontSize: 14, fontWeight: '600', color: dark.text },
  catDesc: { fontSize: 12, color: dark.textTertiary, marginTop: 1 },

  // Primary button
  primaryBtn: {
    height: 52, borderRadius: 14, backgroundColor: BRAND.purple,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },

  // History section
  historySection: { marginBottom: 16 },

  // Loading
  loadingWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  loadingText: { fontSize: 13, color: dark.textMuted },

  // Empty state
  emptyWrap: {
    alignItems: 'center', paddingVertical: 30, backgroundColor: dark.glassBg,
    borderRadius: 16, borderWidth: 1, borderColor: dark.glassBorder,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: dark.textSecondary },
  emptySub: { fontSize: 13, color: dark.textMuted, marginTop: 4 },

  // Export items
  exportItem: {
    backgroundColor: dark.glassBg, borderRadius: 14,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 14, marginBottom: 8,
  },
  exportLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportStatusDot: { width: 10, height: 10, borderRadius: 5 },
  exportTitle: { fontSize: 14, fontWeight: '500', color: dark.text },
  exportDate: { fontSize: 12, color: dark.textTertiary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  downloadBtn: {
    height: 38, borderRadius: 10, backgroundColor: 'rgba(93,229,168,0.12)',
    borderWidth: 1, borderColor: 'rgba(93,229,168,0.2)',
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  downloadBtnText: { fontSize: 13, fontWeight: '600', color: '#5DE5A8' },

  // Footer
  footerCard: {
    backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.12)', padding: 16,
  },
  footerTitle: { fontSize: 13, fontWeight: '600', color: dark.textSecondary, marginBottom: 6 },
  footerText: { fontSize: 12, color: dark.textTertiary, lineHeight: 18 },
});

module.exports = DataExportScreen;
