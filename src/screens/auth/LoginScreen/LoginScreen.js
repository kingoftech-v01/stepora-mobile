/**
 * LoginScreen -- React Native Login screen.
 * Ported from LoginMobile.jsx (web app).
 */
var React = require('react');
var {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} = require('react-native');
var useLoginScreen = require('./useLoginScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function LoginScreen() {
  var h = useLoginScreen();

  if (h.tfaRequired) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* TFA Card */}
          <View style={styles.card}>
            <View style={styles.tfaIconWrap}>
              <Text style={styles.tfaIcon}>🛡</Text>
            </View>
            <Text style={styles.title}>{h.t('auth.twoFactorTitle')}</Text>
            <Text style={styles.subtitle}>{h.t('auth.twoFactorDesc')}</Text>

            {h.serverError ? (
              <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
                <Text style={styles.errorText}>{h.serverError}</Text>
              </View>
            ) : null}

            <TextInput
              style={[styles.input, styles.tfaInput]}
              placeholder={h.t('auth.enterCode')}
              placeholderTextColor={dark.textMuted}
              value={h.tfaCode}
              onChangeText={h.setTfaCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              accessible={true}
              accessibilityLabel={h.t('auth.enterCode')}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, h.submitting && styles.btnDisabled]}
              onPress={h.handleTfaVerify}
              disabled={h.submitting}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={h.t('auth.verify')}
              accessibilityState={{ disabled: !!h.submitting, busy: !!h.submitting }}
            >
              {h.submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>{h.t('auth.verify')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={h.resetTfa} style={styles.ghostBtn} accessible={true} accessibilityRole="button" accessibilityLabel={h.t('auth.backToLogin')}>
              <Text style={styles.ghostBtnText}>{h.t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap} accessible={true} accessibilityRole="image" accessibilityLabel="Stepora logo">
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon} accessible={false}>✨</Text>
          </View>
          <Text style={styles.logoText} accessible={false}>Stepora</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{h.t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{h.t('auth.signInContinue')}</Text>

          {h.serverError ? (
            <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
              <Text style={styles.errorText}>{h.serverError}</Text>
            </View>
          ) : null}

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

          {/* Password */}
          <Text style={styles.label}>{h.t('auth.password')}</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder={h.t('auth.enterPassword')}
              placeholderTextColor={dark.textMuted}
              value={h.password}
              onChangeText={h.setPassword}
              secureTextEntry={!h.showPassword}
              autoCapitalize="none"
              accessible={true}
              accessibilityLabel={h.t('auth.password')}
              textContentType="password"
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={function () { h.setShowPassword(!h.showPassword); }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={h.showPassword ? 'Hide password' : 'Show password'}
            >
              <Text style={styles.eyeText}>{h.showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            onPress={function () { h.navigation.navigate('ForgotPassword'); }}
            style={styles.forgotBtn}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel={h.t('auth.forgotPassword')}
          >
            <Text style={styles.forgotText}>{h.t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          {/* Sign in button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (h.submitting || h.loginCooldown) && styles.btnDisabled,
            ]}
            onPress={h.handleSignIn}
            disabled={h.submitting || h.loginCooldown}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={h.loginCooldown ? h.t('auth.pleaseWait') : h.t('auth.signIn')}
            accessibilityState={{ disabled: !!(h.submitting || h.loginCooldown), busy: !!h.submitting }}
          >
            {h.submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {h.loginCooldown ? h.t('auth.pleaseWait') : h.t('auth.signIn')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{h.t('auth.continueWith')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={h.handleGoogleLogin}
              disabled={h.submitting}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
              accessibilityState={{ disabled: !!h.submitting }}
            >
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={h.handleAppleLogin}
              disabled={h.submitting}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Apple"
              accessibilityState={{ disabled: !!h.submitting }}
            >
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign up link */}
        <View style={styles.bottomLink}>
          <Text style={styles.bottomText}>{h.t('auth.noAccount')} </Text>
          <TouchableOpacity
            onPress={function () { h.navigation.navigate('Register'); }}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel={h.t('auth.signUp')}
          >
            <Text style={styles.linkText}>{h.t('auth.signUp')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.bgDeep,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: dark.text,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: dark.glassBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dark.glassBorder,
    padding: 28,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: dark.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: dark.textTertiary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 21,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: dark.textSecondary,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 14,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.inputBorder,
    paddingHorizontal: 16,
    fontSize: 15,
    color: dark.text,
    marginBottom: 16,
  },
  tfaInput: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 24,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 13,
  },
  eyeText: {
    fontSize: 18,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND.purple,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: BRAND.redSolid,
    lineHeight: 19,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: dark.inputBorder,
  },
  dividerText: {
    fontSize: 12,
    color: dark.textMuted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: dark.text,
  },
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  bottomText: {
    fontSize: 14,
    color: dark.textTertiary,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.purple,
  },
  tfaIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  tfaIcon: {
    fontSize: 24,
  },
  ghostBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: dark.textTertiary,
  },
});

module.exports = LoginScreen;
