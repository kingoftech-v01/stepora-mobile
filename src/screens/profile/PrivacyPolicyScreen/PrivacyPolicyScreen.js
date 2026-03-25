/**
 * PrivacyPolicyScreen -- React Native.
 * Ported from PrivacyPolicyMobile.jsx (web app).
 */
var React = require('react');
var { View, Text, ScrollView, TouchableOpacity, StyleSheet } = require('react-native');
var usePrivacyPolicyScreen = require('./usePrivacyPolicyScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function PrivacyPolicyScreen() {
  var h = usePrivacyPolicyScreen();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>{'<-'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Last Updated Badge */}
      <View style={styles.updatedBadge}>
        <View style={styles.shieldDot} />
        <Text style={styles.updatedText}>Last updated: March 2026</Text>
      </View>

      {/* Sections */}
      {h.SECTIONS.map(function (s, i) {
        return (
          <View key={i} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionText}>{s.text}</Text>
          </View>
        );
      })}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },
  updatedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(20,184,166,0.08)',
    borderWidth: 1, borderColor: 'rgba(20,184,166,0.15)',
    marginBottom: 16,
  },
  shieldDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.tealLight },
  updatedText: { fontSize: 12, color: dark.textSecondary },
  sectionCard: {
    backgroundColor: dark.glassBg, borderRadius: 16,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 18, marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: dark.text, marginBottom: 8 },
  sectionText: { fontSize: 13, color: dark.textTertiary, lineHeight: 22 },
});

module.exports = PrivacyPolicyScreen;
