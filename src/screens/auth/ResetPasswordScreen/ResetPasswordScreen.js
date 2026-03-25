/**
 * ResetPasswordScreen -- React Native.
 * Ported from ResetPasswordMobile.jsx + ResetPasswordForm.jsx.
 */
var React = require('react');
var {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} = require('react-native');
var useResetPasswordScreen = require('./useResetPasswordScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function ResetPasswordScreen() {
  var h = useResetPasswordScreen();

  var content;

  if (h.validating) {
    content = (
      <View style={styles.centerWrap}>
        <ActivityIndicator color={BRAND.purple} size="large" />
      </View>
    );
  } else if (h.tokenExpired) {
    content = (
      <View style={styles.card}>
        <View style={[styles.statusIcon, styles.errorIcon]}>
          <Text style={styles.iconEmoji}>⚠️</Text>
        </View>
        <Text style={styles.title}>{h.t('auth.resetLinkExpired')}</Text>
        <Text style={styles.subtitle}>{h.t('auth.resetLinkExpiredDesc')}</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={function () { h.navigation.navigate('ForgotPassword'); }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={h.t('auth.requestNewLink')}
        >
          <Text style={styles.primaryBtnText}>{h.t('auth.requestNewLink')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ghostBtn, { marginTop: 12 }]}
          onPress={function () { h.navigation.navigate('Login'); }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={h.t('auth.backToLogin')}
        >
          <Text style={styles.ghostBtnText}>{h.t('auth.backToLogin')}</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (h.success) {
    content = (
      <View style={styles.card}>
        <View style={[styles.statusIcon, styles.successIcon]}>
          <Text style={styles.iconEmoji}>✓</Text>
        </View>
        <Text style={styles.title}>{h.t('auth.passwordResetSuccess')}</Text>
        <Text style={styles.subtitle}>{h.t('auth.passwordResetSuccessDesc')}</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={function () { h.navigation.navigate('Login'); }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={h.t('auth.signIn')}
        >
          <Text style={styles.primaryBtnText}>{h.t('auth.signIn')}</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <View style={styles.card}>
        <View style={styles.statusIcon}>
          <Text style={styles.iconEmoji}>🔒</Text>
        </View>
        <Text style={styles.title}>{h.t('auth.setNewPassword')}</Text>
        <Text style={styles.subtitle}>{h.t('auth.setNewPasswordDesc')}</Text>

        {h.serverError ? (
          <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
            <Text style={styles.errorText}>{h.serverError}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>{h.t('auth.newPassword')}</Text>
        <TextInput
          style={styles.input}
          placeholder={h.t('auth.createPassword')}
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

        <Text style={styles.label}>{h.t('auth.confirmPassword')}</Text>
        <TextInput
          style={styles.input}
          placeholder={h.t('auth.confirmYourPassword')}
          placeholderTextColor={dark.textMuted}
          value={h.confirmPassword}
          onChangeText={h.setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          accessible={true}
          accessibilityLabel={h.t('auth.confirmPassword')}
          textContentType="newPassword"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, h.submitting && styles.btnDisabled]}
          onPress={h.handleSubmit}
          disabled={h.submitting}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={h.t('auth.resetPassword')}
          accessibilityState={{ disabled: !!h.submitting, busy: !!h.submitting }}
        >
          {h.submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>{h.t('auth.resetPassword')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  card: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 28, width: '100%', alignItems: 'center' },
  statusIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successIcon: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  errorIcon: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
  iconEmoji: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: '700', color: dark.text, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, color: dark.textTertiary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', color: dark.textSecondary, marginBottom: 8, alignSelf: 'flex-start' },
  input: { height: 50, borderRadius: 14, backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.inputBorder, paddingHorizontal: 16, fontSize: 15, color: dark.text, marginBottom: 14, width: '100%' },
  strengthWrap: { marginTop: -8, marginBottom: 14, width: '100%' },
  strengthRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '500' },
  primaryBtn: { height: 48, borderRadius: 14, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center', width: '100%' },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  ghostBtn: { height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', width: '100%' },
  ghostBtnText: { fontSize: 14, fontWeight: '500', color: dark.textTertiary },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, marginBottom: 16, width: '100%' },
  errorText: { fontSize: 13, color: BRAND.redSolid, lineHeight: 19 },
});

module.exports = ResetPasswordScreen;
