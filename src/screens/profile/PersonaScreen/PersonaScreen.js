/**
 * PersonaScreen -- React Native.
 * Profile persona fields: occupation, schedule, abilities, motivation.
 * Synced with web app's PersonaMobile.jsx.
 */
var React = require('react');
var {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var usePersonaScreen = require('./usePersonaScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function PersonaScreen() {
  var h = usePersonaScreen();

  if (h.loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator color={BRAND.purple} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel={h.t('common.back')}>
            <Text style={styles.backText}>{'<-'} {h.t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">{h.t('profile.persona')}</Text>
          <View style={{ width: 60, alignItems: 'flex-end' }}>
            {h.dirty && !h.saving ? (
              <Text style={styles.unsavedText}>{h.t('common.unsaved') || 'Unsaved'}</Text>
            ) : h.saving ? (
              <ActivityIndicator color={BRAND.greenSolid} size="small" />
            ) : null}
          </View>
        </View>

        {/* Error */}
        {h.error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{h.error}</Text>
          </View>
        ) : null}

        {/* Completion ring */}
        <View style={styles.completionCard}>
          <View style={styles.completionRing}>
            <Text style={styles.completionPct}>{h.completionPct}%</Text>
          </View>
          <View style={styles.completionInfo}>
            <Text style={styles.completionTitle}>{h.t('persona.profileCompletion') || 'Profile Completion'}</Text>
            <Text style={styles.completionDesc}>
              {h.t('persona.fillFieldsHint') || 'Fill in your details to help the AI coach personalize your experience.'}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: h.completionPct + '%' }]} />
        </View>

        {/* Sections */}
        {h.SECTIONS.map(function (section, sIdx) {
          return (
            <View key={sIdx} style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.fieldsCard}>
                {section.fields.map(function (field, fIdx) {
                  var val = h.form[field.key];
                  if (val === undefined || val === null) val = '';
                  val = String(val);
                  return (
                    <View key={field.key} style={[styles.fieldWrap, fIdx < section.fields.length - 1 && styles.fieldBorder]}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <TextInput
                        style={[styles.fieldInput, field.multiline && styles.fieldMultiline]}
                        value={val}
                        onChangeText={function (text) { h.handleChange(field.key, text); }}
                        placeholder={field.placeholder}
                        placeholderTextColor={dark.textMuted}
                        multiline={!!field.multiline}
                        keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                        accessibilityLabel={field.label}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, (!h.dirty || h.saving) && styles.btnDisabled]}
          onPress={h.handleSave}
          disabled={!h.dirty || h.saving}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={h.t('common.save') || 'Save'}
          accessibilityState={{ disabled: !h.dirty || !!h.saving }}
        >
          {h.saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{h.t('common.save') || 'Save'}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  centerWrap: { flex: 1, backgroundColor: BRAND.bgDeep, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },
  unsavedText: { fontSize: 11, fontWeight: '500', color: BRAND.yellow },

  // Alerts
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  errorText: { fontSize: 13, color: BRAND.redSolid, lineHeight: 19 },

  // Completion
  completionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: dark.glassBg, borderRadius: 16,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 16, marginBottom: 12,
  },
  completionRing: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  completionPct: { fontSize: 16, fontWeight: '800', color: BRAND.purple },
  completionInfo: { flex: 1 },
  completionTitle: { fontSize: 15, fontWeight: '700', color: dark.text, marginBottom: 4 },
  completionDesc: { fontSize: 12, color: dark.textTertiary, lineHeight: 17 },

  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: dark.glassBorder,
    overflow: 'hidden', marginBottom: 20,
  },
  progressFill: {
    height: '100%', borderRadius: 2, backgroundColor: BRAND.purple,
  },

  // Sections
  sectionWrap: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: dark.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingLeft: 4, marginBottom: 10,
  },
  fieldsCard: {
    backgroundColor: dark.glassBg, borderRadius: 16,
    borderWidth: 1, borderColor: dark.glassBorder,
    overflow: 'hidden',
  },
  fieldWrap: { padding: 16 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: dark.divider },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: dark.text, marginBottom: 8 },
  fieldInput: {
    fontSize: 14, color: dark.text, backgroundColor: dark.surface,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: dark.glassBorder,
  },
  fieldMultiline: { minHeight: 80, textAlignVertical: 'top' },

  // Save button
  saveBtn: {
    height: 52, borderRadius: 14, backgroundColor: BRAND.purple,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
});

module.exports = PersonaScreen;
