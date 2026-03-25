/**
 * TwoFactorScreen -- React Native.
 * Full 2FA setup/disable flow: status, QR code, verify TOTP, backup codes.
 */
var React = require('react');
var {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, ActivityIndicator, Modal, Platform,
} = require('react-native');
var useTwoFactorScreen = require('./useTwoFactorScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

/* ─── Status View (2FA enabled or disabled) ─────────────── */
function StatusView(props) {
  var h = props.hook;
  return (
    <View>
      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, h.enabled ? styles.statusDotOn : styles.statusDotOff]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              Two-Factor Authentication
            </Text>
            <Text style={styles.statusSub}>
              {h.enabled ? 'Enabled — Your account is secured with TOTP' : 'Disabled — Add an extra layer of security'}
            </Text>
          </View>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.infoTitle}>How it works</Text>
        <View style={styles.infoStep}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
          <Text style={styles.infoText}>Scan a QR code with your authenticator app (Google Authenticator, Authy, etc.)</Text>
        </View>
        <View style={styles.infoStep}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
          <Text style={styles.infoText}>Enter the 6-digit code from the app to verify</Text>
        </View>
        <View style={styles.infoStep}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
          <Text style={styles.infoText}>Save your backup codes in case you lose access to your device</Text>
        </View>
      </View>

      {/* Actions */}
      {h.enabled ? (
        <View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={h.handleViewBackupCodes}
            disabled={h.submitting}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View Backup Codes"
            accessibilityState={{ disabled: !!h.submitting, busy: !!h.submitting }}
          >
            {h.submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>View Backup Codes</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={h.handleConfirmDisable}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Disable Two-Factor Authentication"
          >
            <Text style={styles.dangerBtnText}>Disable 2FA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={h.handleStartSetup}
          disabled={h.submitting}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Enable Two-Factor Authentication"
          accessibilityState={{ disabled: !!h.submitting, busy: !!h.submitting }}
        >
          {h.submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Enable Two-Factor Auth</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── Setup View (QR code + secret key) ─────────────────── */
function SetupView(props) {
  var h = props.hook;
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Step 1: Scan QR Code</Text>
        <Text style={styles.cardDesc}>
          Open your authenticator app and scan this QR code. If you cannot scan, enter the secret key manually.
        </Text>

        {/* QR Code */}
        {h.qrUri ? (
          <View style={styles.qrWrap}>
            <Image
              source={{ uri: h.qrUri }}
              style={styles.qrImage}
              resizeMode="contain"
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel="QR code for authenticator app setup"
            />
          </View>
        ) : (
          <View style={styles.qrWrap}>
            <Text style={styles.qrFallback}>QR Code</Text>
            <Text style={[styles.cardDesc, { textAlign: 'center', marginTop: 4 }]}>
              Use the secret key below instead
            </Text>
          </View>
        )}

        {/* Secret Key */}
        {h.secretKey ? (
          <View style={styles.secretRow}>
            <View style={styles.secretBox}>
              <Text style={styles.secretLabel}>Secret Key</Text>
              <Text style={styles.secretValue} selectable>{h.secretKey}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={h.handleCopySecret}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={h.copiedSecret ? 'Secret key copied' : 'Copy secret key'}
            >
              <Text style={styles.copyBtnText}>{h.copiedSecret ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Step 2: Verify */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Step 2: Verify Code</Text>
        <Text style={styles.cardDesc}>
          Enter the 6-digit code from your authenticator app to confirm setup.
        </Text>

        <TextInput
          style={styles.codeInput}
          value={h.totpCode}
          onChangeText={function (val) {
            var clean = val.replace(/[^0-9]/g, '');
            if (clean.length <= 6) h.setTotpCode(clean);
          }}
          placeholder="000000"
          placeholderTextColor={dark.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          accessible={true}
          accessibilityLabel="6-digit verification code"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, (!h.totpCode || h.totpCode.length !== 6) && styles.btnDisabled]}
          onPress={h.handleVerify}
          disabled={!h.totpCode || h.totpCode.length !== 6 || h.submitting}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Verify and Enable"
          accessibilityState={{ disabled: !h.totpCode || h.totpCode.length !== 6 || !!h.submitting, busy: !!h.submitting }}
        >
          {h.submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Verify & Enable</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Cancel */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={function () { h.setStep('status'); h.setError(''); h.setTotpCode(''); }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Cancel Setup"
      >
        <Text style={styles.secondaryBtnText}>Cancel Setup</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Backup Codes View ──────────────────────────────────── */
function BackupView(props) {
  var h = props.hook;
  return (
    <View>
      <View style={styles.card}>
        <View style={styles.successBanner}>
          <Text style={styles.successEmoji}>🔐</Text>
          <Text style={styles.successTitle}>Two-Factor Auth Enabled!</Text>
          <Text style={styles.successDesc}>
            Save these backup codes in a safe place. Each code can only be used once.
          </Text>
        </View>

        {/* Backup Codes Grid */}
        <View style={styles.codesGrid}>
          {h.backupCodes.map(function (code, i) {
            return (
              <View key={i} style={styles.codeItem}>
                <Text style={styles.codeIndex}>{i + 1}.</Text>
                <Text style={styles.codeValue} selectable>{code}</Text>
              </View>
            );
          })}
        </View>

        {h.backupCodes.length === 0 ? (
          <View style={styles.emptyCodesWrap}>
            <Text style={styles.emptyCodesText}>No backup codes available</Text>
          </View>
        ) : null}

        {/* Copy All */}
        {h.backupCodes.length > 0 ? (
          <TouchableOpacity
            style={styles.copyAllBtn}
            onPress={h.handleCopyBackupCodes}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={h.copiedBackup ? 'Backup codes copied to clipboard' : 'Copy all backup codes'}
          >
            <Text style={styles.copyAllText}>
              {h.copiedBackup ? 'Copied to clipboard!' : 'Copy All Codes'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Warning */}
        <View style={styles.warningBox} accessibilityRole="alert">
          <Text style={styles.warningTitle}>Important</Text>
          <Text style={styles.warningText}>
            If you lose your authenticator device and these backup codes, you will be locked out of your account. Store them securely.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={function () { h.setStep('status'); }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.primaryBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Disable View (password confirmation) ───────────────── */
function DisableView(props) {
  var h = props.hook;
  return (
    <View>
      <View style={styles.card}>
        <View style={styles.disableHeader}>
          <View style={styles.disableIcon}>
            <Text style={{ fontSize: 24 }}>⚠️</Text>
          </View>
          <Text style={styles.disableTitle}>Disable Two-Factor Auth</Text>
          <Text style={styles.disableDesc}>
            This will remove the extra security layer from your account. Enter your password to confirm.
          </Text>
        </View>

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.passwordInput}
          value={h.password}
          onChangeText={h.setPassword}
          placeholder="Enter your password"
          placeholderTextColor={dark.textMuted}
          secureTextEntry
          autoCapitalize="none"
          accessible={true}
          accessibilityLabel="Password"
          textContentType="password"
        />

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={function () { h.setStep('status'); h.setPassword(''); h.setError(''); }}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.disableBtn, !h.password && styles.btnDisabled]}
            onPress={h.handleDisable}
            disabled={!h.password || h.submitting}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Disable Two-Factor Authentication"
            accessibilityState={{ disabled: !h.password || !!h.submitting, busy: !!h.submitting }}
          >
            {h.submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.disableBtnText}>Disable 2FA</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */
function TwoFactorScreen() {
  var h = useTwoFactorScreen();

  if (h.loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator color={BRAND.purple} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>{'<-'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Two-Factor Auth</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Error */}
        {h.error ? (
          <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
            <Text style={styles.errorText}>{h.error}</Text>
          </View>
        ) : null}

        {/* Step-based rendering */}
        {h.step === 'status' ? <StatusView hook={h} /> : null}
        {h.step === 'setup' ? <SetupView hook={h} /> : null}
        {h.step === 'verify' ? <SetupView hook={h} /> : null}
        {h.step === 'backup' ? <BackupView hook={h} /> : null}
        {h.step === 'disable' ? <DisableView hook={h} /> : null}

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

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: BRAND.redSolid, lineHeight: 19 },

  // Card
  card: {
    backgroundColor: dark.glassBg, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 20, marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: dark.text, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: dark.textTertiary, lineHeight: 19, marginBottom: 16 },

  // Status
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  statusDotOn: { backgroundColor: '#5DE5A8' },
  statusDotOff: { backgroundColor: '#707080' },
  statusTitle: { fontSize: 15, fontWeight: '600', color: dark.text },
  statusSub: { fontSize: 12, color: dark.textTertiary, marginTop: 2 },

  // Info steps
  infoTitle: { fontSize: 14, fontWeight: '600', color: dark.textSecondary, marginBottom: 12 },
  infoStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: BRAND.purple },
  infoText: { flex: 1, fontSize: 13, color: dark.textPrimary, lineHeight: 19 },

  // QR Code
  qrWrap: {
    alignSelf: 'center', width: 200, height: 200, borderRadius: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  qrImage: { width: 180, height: 180 },
  qrFallback: { fontSize: 16, fontWeight: '600', color: '#333' },

  // Secret key
  secretRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  secretBox: {
    flex: 1, backgroundColor: dark.surface, borderRadius: 12,
    borderWidth: 1, borderColor: dark.inputBorder, padding: 12,
  },
  secretLabel: { fontSize: 11, fontWeight: '600', color: dark.textTertiary, marginBottom: 4 },
  secretValue: { fontSize: 14, fontWeight: '600', color: BRAND.purpleLight, letterSpacing: 1 },
  copyBtn: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: BRAND.purple },

  // Code input
  codeInput: {
    height: 60, borderRadius: 14, backgroundColor: dark.surface,
    borderWidth: 1, borderColor: dark.inputBorder,
    fontSize: 28, fontWeight: '700', color: dark.text, letterSpacing: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },

  // Backup codes
  successBanner: { alignItems: 'center', marginBottom: 20 },
  successEmoji: { fontSize: 32, marginBottom: 8 },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#5DE5A8', marginBottom: 6 },
  successDesc: { fontSize: 13, color: dark.textTertiary, textAlign: 'center', lineHeight: 19 },
  codesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  codeItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: dark.surface, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    width: '48%',
  },
  codeIndex: { fontSize: 11, fontWeight: '600', color: dark.textMuted },
  codeValue: { fontSize: 14, fontWeight: '600', color: dark.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  emptyCodesWrap: { alignItems: 'center', paddingVertical: 20 },
  emptyCodesText: { fontSize: 14, color: dark.textMuted },
  copyAllBtn: {
    height: 44, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  copyAllText: { fontSize: 14, fontWeight: '600', color: BRAND.purple },
  warningBox: {
    backgroundColor: 'rgba(252,211,77,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(252,211,77,0.2)', padding: 14,
  },
  warningTitle: { fontSize: 13, fontWeight: '700', color: BRAND.yellow, marginBottom: 4 },
  warningText: { fontSize: 12, color: dark.textPrimary, lineHeight: 18 },

  // Disable view
  disableHeader: { alignItems: 'center', marginBottom: 20 },
  disableIcon: { marginBottom: 8 },
  disableTitle: { fontSize: 18, fontWeight: '700', color: dark.text, marginBottom: 6 },
  disableDesc: { fontSize: 13, color: dark.textTertiary, textAlign: 'center', lineHeight: 19 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: dark.textSecondary, marginBottom: 8 },
  passwordInput: {
    height: 50, borderRadius: 14, backgroundColor: dark.surface,
    borderWidth: 1, borderColor: dark.inputBorder,
    paddingHorizontal: 16, fontSize: 15, color: dark.text, marginBottom: 16,
  },

  // Buttons
  primaryBtn: {
    height: 52, borderRadius: 14, backgroundColor: BRAND.purple,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  secondaryBtn: {
    height: 48, borderRadius: 14, backgroundColor: dark.surface,
    borderWidth: 1, borderColor: dark.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '500', color: dark.textSecondary },
  dangerBtn: {
    height: 48, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  dangerBtnText: { fontSize: 15, fontWeight: '600', color: BRAND.redSolid },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 14, backgroundColor: dark.surface,
    borderWidth: 1, borderColor: dark.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '500', color: dark.textSecondary },
  disableBtn: {
    flex: 1, height: 48, borderRadius: 14, backgroundColor: BRAND.redSolid,
    alignItems: 'center', justifyContent: 'center',
  },
  disableBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
});

module.exports = TwoFactorScreen;
