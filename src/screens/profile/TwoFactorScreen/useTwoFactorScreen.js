/**
 * useTwoFactorScreen -- business logic for 2FA setup (React Native).
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { Alert } = require('react-native');
var { apiGet, apiPost } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');

// Clipboard: try @react-native-clipboard if available, else fallback
var Clipboard = null;
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  // fallback: no clipboard
}

function useTwoFactorScreen() {
  var navigation = useNavigation();

  // ─── State ───────────────────────────────────────────────
  var [loading, setLoading] = useState(true);
  var [enabled, setEnabled] = useState(false);
  var [step, setStep] = useState('status'); // status | setup | verify | backup | disable
  var [qrUri, setQrUri] = useState('');
  var [secretKey, setSecretKey] = useState('');
  var [totpCode, setTotpCode] = useState('');
  var [backupCodes, setBackupCodes] = useState([]);
  var [password, setPassword] = useState('');
  var [error, setError] = useState('');
  var [submitting, setSubmitting] = useState(false);
  var [copiedSecret, setCopiedSecret] = useState(false);
  var [copiedBackup, setCopiedBackup] = useState(false);

  // ─── Fetch current 2FA status ────────────────────────────
  var fetchStatus = useCallback(function () {
    setLoading(true);
    setError('');
    apiGet(USERS.TFA.STATUS)
      .then(function (data) {
        setEnabled(!!(data && data.twoFactorEnabled));
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.message || 'Failed to load 2FA status');
        setLoading(false);
      });
  }, []);

  useEffect(function () {
    fetchStatus();
  }, [fetchStatus]);

  // ─── Begin setup — request QR code ──────────────────────
  var handleStartSetup = function () {
    setError('');
    setSubmitting(true);
    apiPost(USERS.TFA.SETUP)
      .then(function (data) {
        setQrUri(data.qrUri || data.qrCode || data.otpauthUrl || '');
        setSecretKey(data.secretKey || data.secret || data.manualKey || '');
        setStep('setup');
        setSubmitting(false);
      })
      .catch(function (err) {
        setError(err.message || 'Failed to start 2FA setup');
        setSubmitting(false);
      });
  };

  // ─── Verify TOTP code ───────────────────────────────────
  var handleVerify = function () {
    if (!totpCode || totpCode.length !== 6) {
      setError('Enter a 6-digit code');
      return;
    }
    setError('');
    setSubmitting(true);
    apiPost(USERS.TFA.VERIFY, { totpCode: totpCode })
      .then(function (data) {
        setEnabled(true);
        setBackupCodes(data.backupCodes || data.codes || []);
        setStep('backup');
        setTotpCode('');
        setSubmitting(false);
      })
      .catch(function (err) {
        setError(err.message || 'Invalid code. Please try again.');
        setSubmitting(false);
      });
  };

  // ─── Fetch backup codes (if already enabled) ────────────
  var handleViewBackupCodes = function () {
    setError('');
    setSubmitting(true);
    apiGet(USERS.TFA.BACKUP_CODES)
      .then(function (data) {
        setBackupCodes(data.backupCodes || data.codes || []);
        setStep('backup');
        setSubmitting(false);
      })
      .catch(function (err) {
        setError(err.message || 'Failed to load backup codes');
        setSubmitting(false);
      });
  };

  // ─── Disable 2FA ─────────────────────────────────────────
  var handleDisable = function () {
    if (!password) {
      setError('Password is required');
      return;
    }
    setError('');
    setSubmitting(true);
    apiPost(USERS.TFA.DISABLE, { password: password })
      .then(function () {
        setEnabled(false);
        setPassword('');
        setStep('status');
        setSubmitting(false);
      })
      .catch(function (err) {
        setError(err.message || 'Failed to disable 2FA');
        setSubmitting(false);
      });
  };

  // ─── Copy helpers ────────────────────────────────────────
  var handleCopySecret = function () {
    try {
      if (Clipboard) {
        Clipboard.setString(secretKey);
      }
    } catch (e) {
      // clipboard unavailable
    }
    setCopiedSecret(true);
    setTimeout(function () { setCopiedSecret(false); }, 2000);
  };

  var handleCopyBackupCodes = function () {
    var text = backupCodes.join('\n');
    try {
      if (Clipboard) {
        Clipboard.setString(text);
      }
    } catch (e) {
      // clipboard unavailable
    }
    setCopiedBackup(true);
    setTimeout(function () { setCopiedBackup(false); }, 2000);
  };

  // ─── Confirm disable ─────────────────────────────────────
  var handleConfirmDisable = function () {
    Alert.alert(
      'Disable Two-Factor Auth',
      'Are you sure? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: function () { setStep('disable'); } },
      ]
    );
  };

  return {
    navigation: navigation,
    loading: loading,
    enabled: enabled,
    step: step,
    setStep: setStep,
    qrUri: qrUri,
    secretKey: secretKey,
    totpCode: totpCode,
    setTotpCode: setTotpCode,
    backupCodes: backupCodes,
    password: password,
    setPassword: setPassword,
    error: error,
    setError: setError,
    submitting: submitting,
    copiedSecret: copiedSecret,
    copiedBackup: copiedBackup,
    fetchStatus: fetchStatus,
    handleStartSetup: handleStartSetup,
    handleVerify: handleVerify,
    handleViewBackupCodes: handleViewBackupCodes,
    handleDisable: handleDisable,
    handleCopySecret: handleCopySecret,
    handleCopyBackupCodes: handleCopyBackupCodes,
    handleConfirmDisable: handleConfirmDisable,
  };
}

module.exports = useTwoFactorScreen;
