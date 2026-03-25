/**
 * VerifyEmailScreen -- React Native.
 */
var React = require('react');
var { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } = require('react-native');
var useVerifyEmailScreen = require('./useVerifyEmailScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function VerifyEmailScreen() {
  var h = useVerifyEmailScreen();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {h.status === 'verifying' ? (
          <View style={styles.centerWrap} accessibilityLiveRegion="polite">
            <ActivityIndicator color={BRAND.purpleLight} size="large" accessibilityLabel="Verifying email" />
            <Text style={styles.loadingText}>{h.t('auth.verifyingEmail')}</Text>
          </View>
        ) : null}

        {h.status === 'success' ? (
          <View style={styles.centerWrap} accessibilityLiveRegion="polite">
            <View style={[styles.statusIcon, styles.successIcon]} accessible={false}>
              <Text style={styles.iconEmoji}>✓</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">{h.t('auth.emailVerified')}</Text>
            <Text style={styles.subtitle}>{h.t('auth.emailVerifiedDesc')}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={h.handleContinue} accessible={true} accessibilityRole="button" accessibilityLabel={h.t('auth.signIn')}>
              <Text style={styles.primaryBtnText}>{h.t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {h.status === 'error' ? (
          <View style={styles.centerWrap} accessibilityLiveRegion="assertive">
            <View style={[styles.statusIcon, styles.errorIcon]} accessible={false}>
              <Text style={styles.iconEmoji}>✕</Text>
            </View>
            <Text style={styles.title} accessibilityRole="alert">{h.t('auth.verificationFailed')}</Text>
            <Text style={styles.subtitle}>{h.errorMsg}</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={function () { h.navigation.navigate('Login'); }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={h.t('auth.goToLogin')}
            >
              <Text style={styles.primaryBtnText}>{h.t('auth.goToLogin')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep, justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 28 },
  centerWrap: { alignItems: 'center' },
  loadingText: { fontSize: 20, fontWeight: '600', color: dark.text, marginTop: 20 },
  statusIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successIcon: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  errorIcon: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  iconEmoji: { fontSize: 32, color: dark.text },
  title: { fontSize: 22, fontWeight: '700', color: dark.text, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: dark.textTertiary, lineHeight: 22, marginBottom: 28, textAlign: 'center' },
  primaryBtn: { height: 48, borderRadius: 14, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center', width: '100%' },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

module.exports = VerifyEmailScreen;
