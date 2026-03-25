/**
 * ForgotPasswordScreen -- React Native.
 * Ported from ForgotPasswordMobile.jsx + ForgotPasswordForm.jsx.
 */
var React = require('react');
var {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} = require('react-native');
var useForgotPasswordScreen = require('./useForgotPasswordScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function ForgotPasswordScreen() {
  var h = useForgotPasswordScreen();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Icon */}
        <View style={[styles.iconCircle, h.sent && styles.iconCircleSuccess]}>
          <Text style={styles.iconEmoji}>{h.sent ? '✓' : '🔒'}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {!h.sent ? (
            <View>
              <Text style={styles.title}>{h.t('auth.resetPassword')}</Text>
              <Text style={styles.subtitle}>{h.t('auth.resetDesc')}</Text>

              {h.serverError ? (
                <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
                  <Text style={styles.errorText}>{h.serverError}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>{h.t('auth.emailAddress')}</Text>
              <TextInput
                style={styles.input}
                placeholder={h.t('auth.emailPlaceholder')}
                placeholderTextColor={dark.textMuted}
                value={h.email}
                onChangeText={h.setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel={h.t('auth.emailAddress')}
                textContentType="emailAddress"
                autoComplete="email"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, h.submitting && styles.btnDisabled]}
                onPress={h.handleSend}
                disabled={h.submitting}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={h.t('auth.sendResetLink')}
                accessibilityState={{ disabled: !!h.submitting, busy: !!h.submitting }}
              >
                {h.submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>{h.t('auth.sendResetLink')}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successWrap}>
              <Text style={styles.title}>{h.t('auth.emailSent')}</Text>
              <Text style={styles.subtitle}>{h.t('auth.emailSentDesc')}</Text>
              <Text style={styles.mutedText}>{h.t('auth.checkSpam')}</Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 28 }]}
                onPress={function () { h.navigation.navigate('Login'); }}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={h.t('auth.backToLogin')}
              >
                <Text style={styles.primaryBtnText}>{h.t('auth.backToLogin')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!h.sent ? (
          <View style={styles.bottomLink}>
            <Text style={styles.bottomText}>{h.t('auth.rememberPassword')} </Text>
            <TouchableOpacity onPress={function () { h.navigation.navigate('Login'); }} accessible={true} accessibilityRole="link" accessibilityLabel={h.t('auth.signIn')}>
              <Text style={styles.linkText}>{h.t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 32 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  iconCircleSuccess: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  iconEmoji: { fontSize: 32 },
  card: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 28, width: '100%' },
  title: { fontSize: 26, fontWeight: '700', color: dark.text, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: dark.textTertiary, textAlign: 'center', marginTop: 10, marginBottom: 24, lineHeight: 22 },
  mutedText: { fontSize: 13, color: dark.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '500', color: dark.textSecondary, marginBottom: 8 },
  input: { height: 50, borderRadius: 14, backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.inputBorder, paddingHorizontal: 16, fontSize: 15, color: dark.text, marginBottom: 24 },
  primaryBtn: { height: 50, borderRadius: 14, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: BRAND.redSolid, lineHeight: 19 },
  successWrap: { alignItems: 'center' },
  bottomLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  bottomText: { fontSize: 14, color: dark.textTertiary },
  linkText: { fontSize: 14, fontWeight: '600', color: BRAND.purple },
});

module.exports = ForgotPasswordScreen;
