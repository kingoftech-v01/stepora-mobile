/**
 * PersonaScreen -- React Native.
 * AI coach persona customization: personality, tone, check-in frequency.
 */
var React = require('react');
var {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var usePersonaScreen = require('./usePersonaScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

/* ─── Persona Card ────────────────────────────────────────── */
function PersonaCard(props) {
  var persona = props.persona;
  var isSelected = props.isSelected;
  var isExpanded = props.isExpanded;
  var onSelect = props.onSelect;
  var onToggle = props.onToggle;

  return (
    <View style={[styles.personaCard, isSelected && styles.personaCardSelected]}>
      <TouchableOpacity
        style={styles.personaHeader}
        onPress={function () { onSelect(persona.id); }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="radio"
        accessibilityLabel={persona.name + ', ' + persona.tagline}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={[styles.personaIconWrap, { backgroundColor: persona.color + '20' }]}>
          <Text style={styles.personaEmoji}>{persona.emoji}</Text>
        </View>
        <View style={styles.personaInfo}>
          <Text style={[styles.personaName, isSelected && { color: persona.color }]}>
            {persona.name}
          </Text>
          <Text style={styles.personaTagline}>{persona.tagline}</Text>
        </View>
        {isSelected ? (
          <View style={[styles.selectedBadge, { backgroundColor: persona.color + '20', borderColor: persona.color + '40' }]}>
            <Text style={[styles.selectedText, { color: persona.color }]}>Active</Text>
          </View>
        ) : (
          <View style={styles.radioOuter}>
            <View style={styles.radioInner} />
          </View>
        )}
      </TouchableOpacity>

      {/* Description */}
      <Text style={styles.personaDesc}>{persona.description}</Text>

      {/* Preview toggle */}
      <TouchableOpacity
        style={styles.previewToggle}
        onPress={function () { onToggle(persona.id); }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Hide conversation preview for ' + persona.name : 'Show conversation preview for ' + persona.name}
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text style={styles.previewToggleText}>
          {isExpanded ? 'Hide preview' : 'Show conversation preview'}
        </Text>
      </TouchableOpacity>

      {/* Conversation Preview */}
      {isExpanded && persona.preview ? (
        <View style={styles.previewWrap}>
          {persona.preview.map(function (msg, i) {
            var isUser = msg.role === 'user';
            return (
              <View key={i} style={[styles.previewBubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={styles.bubbleLabel}>{isUser ? 'You' : persona.name}</Text>
                <Text style={[styles.bubbleText, !isUser && { color: dark.text }]}>{msg.text}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/* ─── Option Pill ──────────────────────────────────────────── */
function OptionPill(props) {
  var isSelected = props.isSelected;
  return (
    <TouchableOpacity
      style={[styles.optionPill, isSelected && styles.optionPillSelected]}
      onPress={props.onPress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="radio"
      accessibilityLabel={props.title + ', ' + props.desc}
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
        {props.title}
      </Text>
      <Text style={styles.optionDesc}>{props.desc}</Text>
    </TouchableOpacity>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */
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
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>{'<-'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">AI Coach Persona</Text>
          <View style={{ width: 60, alignItems: 'flex-end' }}>
            {h.hasChanges && !h.saving ? (
              <Text style={styles.unsavedText}>Unsaved</Text>
            ) : h.saving ? (
              <ActivityIndicator color={BRAND.greenSolid} size="small" />
            ) : null}
          </View>
        </View>

        {/* Error */}
        {h.error ? (
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Text style={styles.errorText}>{h.error}</Text>
          </View>
        ) : null}

        {/* Saved toast */}
        {h.saved ? (
          <View style={styles.savedBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.savedText}>Preferences saved!</Text>
          </View>
        ) : null}

        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>🤖</Text>
          <Text style={styles.introTitle}>Choose Your AI Coach</Text>
          <Text style={styles.introDesc}>
            Pick a personality that matches your preferred coaching style. Your AI coach will adapt its
            communication to match this persona.
          </Text>
        </View>

        {/* Personas */}
        <Text style={styles.sectionTitle}>Personality</Text>
        {h.PERSONAS.map(function (persona) {
          return (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isSelected={h.selectedPersona === persona.id}
              isExpanded={h.expandedPersona === persona.id}
              onSelect={h.handleSelectPersona}
              onToggle={h.handleToggleExpand}
            />
          );
        })}

        {/* Communication Tone */}
        <Text style={styles.sectionTitle}>Communication Tone</Text>
        <View style={styles.optionsCard}>
          {h.TONES.map(function (tone) {
            return (
              <OptionPill
                key={tone.id}
                title={tone.label}
                desc={tone.desc}
                isSelected={h.selectedTone === tone.id}
                onPress={function () { h.setSelectedTone(tone.id); }}
              />
            );
          })}
        </View>

        {/* Check-in Frequency */}
        <Text style={styles.sectionTitle}>Check-in Frequency</Text>
        <View style={styles.optionsCard}>
          {h.CHECKIN_FREQUENCIES.map(function (freq) {
            return (
              <OptionPill
                key={freq.id}
                title={freq.label}
                desc={freq.desc}
                isSelected={h.selectedFrequency === freq.id}
                onPress={function () { h.setSelectedFrequency(freq.id); }}
              />
            );
          })}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, (!h.hasChanges || h.saving) && styles.btnDisabled]}
          onPress={h.handleSave}
          disabled={!h.hasChanges || h.saving}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save Preferences"
          accessibilityState={{ disabled: !h.hasChanges || !!h.saving, busy: !!h.saving }}
        >
          {h.saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Preferences</Text>
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
  savedBox: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  savedText: { fontSize: 13, fontWeight: '600', color: BRAND.greenSolid },

  // Intro card
  introCard: {
    backgroundColor: dark.glassBg, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 20, alignItems: 'center', marginBottom: 20,
  },
  introEmoji: { fontSize: 32, marginBottom: 8 },
  introTitle: { fontSize: 18, fontWeight: '700', color: dark.text, marginBottom: 6 },
  introDesc: { fontSize: 13, color: dark.textTertiary, textAlign: 'center', lineHeight: 19 },

  // Section title
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: dark.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingLeft: 4, marginBottom: 10, marginTop: 8,
  },

  // Persona card
  personaCard: {
    backgroundColor: dark.glassBg, borderRadius: 16,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 16, marginBottom: 8,
  },
  personaCardSelected: {
    borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.04)',
  },
  personaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  personaIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  personaEmoji: { fontSize: 22 },
  personaInfo: { flex: 1 },
  personaName: { fontSize: 15, fontWeight: '700', color: dark.text },
  personaTagline: { fontSize: 12, color: dark.textTertiary, marginTop: 1 },
  selectedBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1,
  },
  selectedText: { fontSize: 11, fontWeight: '700' },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: dark.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 0, height: 0, borderRadius: 5 },
  personaDesc: { fontSize: 13, color: dark.textPrimary, lineHeight: 19, marginBottom: 8 },

  // Preview toggle
  previewToggle: { paddingVertical: 6 },
  previewToggleText: { fontSize: 12, fontWeight: '600', color: BRAND.purple },

  // Conversation preview
  previewWrap: {
    marginTop: 8, backgroundColor: dark.surface, borderRadius: 12,
    padding: 12, gap: 8,
  },
  previewBubble: {
    borderRadius: 12, padding: 10, maxWidth: '90%',
  },
  bubbleUser: {
    backgroundColor: 'rgba(139,92,246,0.12)', alignSelf: 'flex-end',
  },
  bubbleAi: {
    backgroundColor: 'rgba(255,255,255,0.04)', alignSelf: 'flex-start',
  },
  bubbleLabel: { fontSize: 10, fontWeight: '700', color: dark.textMuted, marginBottom: 4 },
  bubbleText: { fontSize: 13, color: BRAND.purpleLight, lineHeight: 18 },

  // Options card
  optionsCard: {
    backgroundColor: dark.glassBg, borderRadius: 16,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 8, marginBottom: 12,
  },
  optionPill: {
    borderRadius: 12, padding: 14, marginBottom: 4,
    borderWidth: 1, borderColor: 'transparent',
  },
  optionPillSelected: {
    backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.3)',
  },
  optionTitle: { fontSize: 14, fontWeight: '600', color: dark.text, marginBottom: 2 },
  optionTitleSelected: { color: BRAND.purple },
  optionDesc: { fontSize: 12, color: dark.textTertiary },

  // Save button
  saveBtn: {
    height: 52, borderRadius: 14, backgroundColor: BRAND.purple,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
});

module.exports = PersonaScreen;
