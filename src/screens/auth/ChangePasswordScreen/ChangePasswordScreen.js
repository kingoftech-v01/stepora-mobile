/**
 * ChangePasswordScreen -- React Native.
 * Ported from ChangePasswordMobile.jsx + ChangePasswordForm.jsx.
 */
var React = require('react');
var {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} = require('react-native');
var useChangePasswordScreen = require('./useChangePasswordScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function ChangePasswordScreen() {
  var h = useChangePasswordScreen();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">{h.t('auth.changePassword')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Shield icon */}
        <View style={styles.shieldCircle}>
          <Text style={styles.shieldEmoji}>🛡</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {h.serverError ? (
            <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
              <Text style={styles.errorText}>{h.serverError}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>{h.t('auth.currentPassword')}</Text>
          <TextInput
            style={styles.input}
            placeholder={h.t('auth.enterCurrentPassword')}
            placeholderTextColor={dark.textMuted}
            value={h.currentPassword}
            onChangeText={h.setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            accessible={true}
            accessibilityLabel={h.t('auth.currentPassword')}
            textContentType="password"
          />

          <View style={styles.separator} />

          <Text style={styles.label}>{h.t('auth.newPassword')}</Text>
          <TextInput
            style={styles.input}
            placeholder={h.t('auth.createNewPassword')}
            placeholderTextColor={dark.textMuted}
            value={h.newPassword}
            onChangeText={h.setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            accessible={true}
            accessibilityLabel={h.t('auth.newPassword')}
            textContentType="newPassword"
          />

          {h.newPassword.length > 0 ? (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthRow}>
                {[1, 2, 3].map(function (level) {
                  return (
                    <View
                      key={level}
                      style={[styles.strengthBar, { backgroundColor: h.strength.level >= level ? h.strength.color : dark.inputBorder }]}
                    />
                  );
                })}
              </View>
              <Text style={[styles.strengthLabel, { color: h.strength.color }]}>{h.t(h.strength.key)}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>{h.t('auth.confirmNewPassword')}</Text>
          <TextInput
            style={styles.input}
            placeholder={h.t('auth.confirmNewPwd')}
            placeholderTextColor={dark.textMuted}
            value={h.confirmPassword}
            onChangeText={h.setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            accessible={true}
            accessibilityLabel={h.t('auth.confirmNewPassword')}
            textContentType="newPassword"
          />

          {h.confirmPassword && h.newPassword && h.confirmPassword !== h.newPassword ? (
            <Text style={styles.mismatchText} accessibilityLiveRegion="polite" accessibilityRole="alert">{h.t('auth.passwordsDontMatch')}</Text>
          ) : null}
          {h.confirmPassword && h.newPassword && h.confirmPassword === h.newPassword ? (
            <Text style={styles.matchText} accessibilityLiveRegion="polite">✓ {h.t('auth.passwordsMatch')}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, h.submitting && styles.btnDisabled]}
            onPress={h.handleUpdate}
            disabled={h.submitting}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={h.t('auth.updatePassword')}
            accessibilityState={{ disabled: !!h.submitting, busy: !!h.submitting }}
          >
            {h.submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>{h.t('auth.updatePassword')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>{h.t('auth.passwordTips')}:</Text>
          <Text style={styles.tipsText}>{h.t('auth.passwordTipsFull')}</Text>
        </View>

        {/* Success toast */}
        {h.showToast ? (
          <View style={styles.toast} accessibilityLiveRegion="assertive" accessibilityRole="alert">
            <Text style={styles.toastText}>✓ {h.t('auth.passwordUpdated')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },
  shieldCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  shieldEmoji: { fontSize: 28 },
  card: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 24 },
  separator: { height: 1, backgroundColor: dark.glassBorder, marginVertical: 20 },
  label: { fontSize: 13, fontWeight: '500', color: dark.textSecondary, marginBottom: 8 },
  input: { height: 50, borderRadius: 14, backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.inputBorder, paddingHorizontal: 16, fontSize: 15, color: dark.text, marginBottom: 14 },
  strengthWrap: { marginTop: -8, marginBottom: 18 },
  strengthRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '500' },
  mismatchText: { fontSize: 12, color: BRAND.redSolid, marginTop: -8, marginBottom: 12 },
  matchText: { fontSize: 12, color: '#10B981', marginTop: -8, marginBottom: 12 },
  primaryBtn: { height: 50, borderRadius: 14, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: BRAND.redSolid, lineHeight: 19 },
  tipsCard: { backgroundColor: dark.glassBg, borderRadius: 16, borderWidth: 1, borderColor: dark.glassBorder, padding: 16, marginTop: 20 },
  tipsTitle: { fontSize: 12, fontWeight: '600', color: dark.textSecondary },
  tipsText: { fontSize: 12, color: dark.textTertiary, marginTop: 4, lineHeight: 20 },
  toast: { position: 'absolute', top: 24, alignSelf: 'center', backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  toastText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
});

module.exports = ChangePasswordScreen;
