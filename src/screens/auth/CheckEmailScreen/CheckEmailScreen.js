/**
 * CheckEmailScreen -- React Native.
 */
var React = require('react');
var { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } = require('react-native');
var useCheckEmailScreen = require('./useCheckEmailScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

function CheckEmailScreen() {
  var h = useCheckEmailScreen();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>✉️</Text>
        </View>

        <Text style={styles.title}>{h.t('auth.checkEmail')}</Text>
        <Text style={styles.subtitle}>{h.t('auth.checkEmailDesc')}</Text>

        {h.email ? (
          <Text style={styles.emailText}>{h.email}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={h.handleResend}
          disabled={h.resending || h.resent}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={h.resent ? h.t('auth.emailResent') : h.t('auth.resendEmail')}
          accessibilityState={{ disabled: !!(h.resending || h.resent) }}
        >
          {h.resending ? (
            <ActivityIndicator color={BRAND.purple} size="small" />
          ) : null}
          <Text style={[styles.resendText, h.resent && styles.resendSuccess]}>
            {h.resent ? h.t('auth.emailResent') : h.t('auth.resendEmail')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={function () { h.navigation.navigate('Login'); }}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={h.t('auth.goToLogin')}
        >
          <Text style={styles.primaryBtnText}>{h.t('auth.goToLogin')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep, justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 28, alignItems: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconEmoji: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: '700', color: dark.text, marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: dark.textTertiary, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  emailText: { fontSize: 15, fontWeight: '600', color: BRAND.purple, marginBottom: 28 },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, marginBottom: 24 },
  resendText: { fontSize: 14, fontWeight: '500', color: BRAND.purple },
  resendSuccess: { color: '#10B981' },
  primaryBtn: { height: 48, borderRadius: 14, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center', width: '100%' },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

module.exports = CheckEmailScreen;
