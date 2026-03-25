/**
 * RegisterScreen -- React Native Register screen.
 * Ported from RegisterMobile.jsx + RegisterForm.jsx (web app).
 */
var React = require('react');
var {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} = require('react-native');
var useRegisterScreen = require('./useRegisterScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function RegisterScreen() {
  var h = useRegisterScreen();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap} accessible={true} accessibilityRole="image" accessibilityLabel="Stepora logo">
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon} accessible={false}>✨</Text>
          </View>
          <Text style={styles.logoText} accessible={false}>Stepora</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{h.t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{h.t('auth.startJourney')}</Text>

          {h.serverError ? (
            <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
              <Text style={styles.errorText}>{h.serverError}</Text>
            </View>
          ) : null}

          {/* Display Name */}
          <Text style={styles.label}>{h.t('auth.displayName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={h.t('auth.yourName')}
            placeholderTextColor={dark.textMuted}
            value={h.displayName}
            onChangeText={h.setDisplayName}
            autoCapitalize="words"
            accessible={true}
            accessibilityLabel={h.t('auth.displayName')}
            textContentType="name"
            autoComplete="name"
          />
          {h.errors.name ? <Text style={styles.fieldError} accessibilityLiveRegion="polite" accessibilityRole="alert">{h.errors.name}</Text> : null}

          {/* Email */}
          <Text style={styles.label}>{h.t('auth.email')}</Text>
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
            accessibilityLabel={h.t('auth.email')}
            textContentType="emailAddress"
            autoComplete="email"
          />
          {h.errors.email ? <Text style={styles.fieldError} accessibilityLiveRegion="polite" accessibilityRole="alert">{h.errors.email}</Text> : null}

          {/* Password */}
          <Text style={styles.label}>{h.t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={h.t('auth.createPassword')}
            placeholderTextColor={dark.textMuted}
            value={h.password}
            onChangeText={h.setPassword}
            secureTextEntry={!h.showPassword}
            autoCapitalize="none"
            accessible={true}
            accessibilityLabel={h.t('auth.password')}
            textContentType="newPassword"
            autoComplete="password-new"
          />

          {/* Strength meter */}
          {h.password.length > 0 ? (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthRow}>
                {[1, 2, 3].map(function (level) {
                  return (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: h.strength.level >= level ? h.strength.color : dark.inputBorder },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={[styles.strengthLabel, { color: h.strength.color }]}>
                {h.t(h.strength.key)}
              </Text>
            </View>
          ) : null}
          {h.errors.password ? <Text style={styles.fieldError} accessibilityLiveRegion="polite" accessibilityRole="alert">{h.errors.password}</Text> : null}

          {/* Confirm Password */}
          <Text style={styles.label}>{h.t('auth.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            placeholder={h.t('auth.confirmYourPassword')}
            placeholderTextColor={dark.textMuted}
            value={h.confirmPassword}
            onChangeText={h.setConfirmPassword}
            secureTextEntry={!h.showConfirm}
            autoCapitalize="none"
            accessible={true}
            accessibilityLabel={h.t('auth.confirmPassword')}
            textContentType="newPassword"
          />
          {h.errors.confirm ? <Text style={styles.fieldError} accessibilityLiveRegion="polite" accessibilityRole="alert">{h.errors.confirm}</Text> : null}

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={function () { h.setAgreedToTerms(!h.agreedToTerms); }}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="checkbox"
            accessibilityLabel={h.t('auth.agreeTerms') + ' ' + h.t('auth.termsOfService') + ' ' + h.t('auth.and') + ' ' + h.t('auth.privacyPolicy')}
            accessibilityState={{ checked: h.agreedToTerms }}
          >
            <View style={[styles.checkbox, h.agreedToTerms && styles.checkboxChecked]}>
              {h.agreedToTerms ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkText}>
              {h.t('auth.agreeTerms')}{' '}
              <Text style={styles.checkLink}>{h.t('auth.termsOfService')}</Text>
              {' '}{h.t('auth.and')}{' '}
              <Text style={styles.checkLink}>{h.t('auth.privacyPolicy')}</Text>
            </Text>
          </TouchableOpacity>
          {h.errors.terms ? <Text style={styles.fieldError} accessibilityLiveRegion="polite" accessibilityRole="alert">{h.errors.terms}</Text> : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.primaryBtn, (h.submitting || !h.agreedToTerms) && styles.btnDisabled]}
            onPress={h.handleRegister}
            disabled={h.submitting || !h.agreedToTerms}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={h.t('auth.createAccount')}
            accessibilityState={{ disabled: !!(h.submitting || !h.agreedToTerms), busy: !!h.submitting }}
          >
            {h.submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>{h.t('auth.createAccount')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{h.t('auth.signUpWith')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={h.handleGoogleLogin} disabled={h.submitting} accessible={true} accessibilityRole="button" accessibilityLabel="Sign up with Google">
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={h.handleAppleLogin} disabled={h.submitting} accessible={true} accessibilityRole="button" accessibilityLabel="Sign up with Apple">
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign in link */}
        <View style={styles.bottomLink}>
          <Text style={styles.bottomText}>{h.t('auth.haveAccount')} </Text>
          <TouchableOpacity onPress={function () { h.navigation.navigate('Login'); }} accessible={true} accessibilityRole="link" accessibilityLabel={h.t('auth.signIn')}>
            <Text style={styles.linkText}>{h.t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(139,92,246,0.2)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: '700', color: dark.text, letterSpacing: -0.5 },
  card: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 24, width: '100%' },
  title: { fontSize: 26, fontWeight: '700', color: dark.text, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: dark.textTertiary, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: '500', color: dark.textSecondary, marginBottom: 8 },
  input: { height: 50, borderRadius: 14, backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.inputBorder, paddingHorizontal: 16, fontSize: 15, color: dark.text, marginBottom: 14 },
  fieldError: { fontSize: 12, color: BRAND.redSolid, marginTop: -8, marginBottom: 8 },
  strengthWrap: { marginTop: -8, marginBottom: 14 },
  strengthRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '500' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: dark.textMuted, backgroundColor: dark.surface, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: BRAND.purple, borderColor: 'rgba(139,92,246,0.5)' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkText: { flex: 1, fontSize: 13, color: dark.textSecondary, lineHeight: 18 },
  checkLink: { color: BRAND.purple, fontWeight: '500' },
  primaryBtn: { height: 50, borderRadius: 14, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: BRAND.redSolid, lineHeight: 19 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: dark.inputBorder },
  dividerText: { fontSize: 12, color: dark.textMuted },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.glassBorder, alignItems: 'center', justifyContent: 'center' },
  socialBtnText: { fontSize: 14, fontWeight: '500', color: dark.text },
  bottomLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  bottomText: { fontSize: 14, color: dark.textTertiary },
  linkText: { fontSize: 14, fontWeight: '600', color: BRAND.purple },
});

module.exports = RegisterScreen;
