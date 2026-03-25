/**
 * useAppVersionScreen -- business logic for App Version & Info (React Native).
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { Platform, Linking, Alert } = require('react-native');
var { apiGet } = require('../../../services/api');
var { APP_UPDATES } = require('../../../services/endpoints');

var APP_VERSION = '1.0.0';
var BUILD_NUMBER = '1';

function useAppVersionScreen() {
  var navigation = useNavigation();

  var [checking, setChecking] = useState(false);
  var [updateAvailable, setUpdateAvailable] = useState(false);
  var [latestVersion, setLatestVersion] = useState('');
  var [changelog, setChangelog] = useState([]);
  var [loadingChangelog, setLoadingChangelog] = useState(true);
  var [error, setError] = useState('');

  // ─── System info ──────────────────────────────────────────
  var systemInfo = [
    { label: 'App Version', value: APP_VERSION },
    { label: 'Build Number', value: BUILD_NUMBER },
    { label: 'Platform', value: Platform.OS === 'ios' ? 'iOS' : 'Android' },
    { label: 'OS Version', value: Platform.OS + ' ' + Platform.Version },
    { label: 'Device', value: Platform.OS === 'ios' ? 'iPhone' : 'Android Device' },
  ];

  // ─── Changelog / Release notes ────────────────────────────
  var DEFAULT_CHANGELOG = [
    {
      version: '1.0.0',
      date: '2026-03-15',
      title: 'Initial Release',
      notes: [
        'Dream creation and AI-powered plan generation',
        'AI coach conversations with voice support',
        'Calendar with smart scheduling and time blocks',
        'Social features: friends, circles, and buddy system',
        'Gamification with XP, levels, and achievements',
        'Google Calendar integration',
        'Multi-language support (16 languages)',
        'Push notifications',
        'Subscription status and plan management',
      ],
    },
  ];

  // ─── Fetch update info ────────────────────────────────────
  var checkForUpdates = useCallback(function () {
    setChecking(true);
    setError('');
    apiGet(APP_UPDATES.CHECK)
      .then(function (data) {
        if (data && data.latestVersion) {
          setLatestVersion(data.latestVersion);
          setUpdateAvailable(data.latestVersion !== APP_VERSION);
          if (Array.isArray(data.changelog)) {
            setChangelog(data.changelog);
          }
        } else {
          setUpdateAvailable(false);
        }
        setChecking(false);
        setLoadingChangelog(false);
        if (!data || !data.latestVersion || data.latestVersion === APP_VERSION) {
          Alert.alert('Up to Date', 'You are running the latest version of Stepora.');
        }
      })
      .catch(function (err) {
        setChecking(false);
        setLoadingChangelog(false);
        // Not critical — just show default changelog
        if (changelog.length === 0) {
          setChangelog(DEFAULT_CHANGELOG);
        }
        // Only show error for explicit check, not initial load
        if (err.status !== 404) {
          setError(err.message || 'Could not check for updates');
        }
      });
  }, []);

  useEffect(function () {
    // Load initial changelog
    setLoadingChangelog(true);
    apiGet(APP_UPDATES.CHECK)
      .then(function (data) {
        if (data && data.latestVersion) {
          setLatestVersion(data.latestVersion);
          setUpdateAvailable(data.latestVersion !== APP_VERSION);
        }
        if (data && Array.isArray(data.changelog)) {
          setChangelog(data.changelog);
        } else {
          setChangelog(DEFAULT_CHANGELOG);
        }
        setLoadingChangelog(false);
      })
      .catch(function () {
        setChangelog(DEFAULT_CHANGELOG);
        setLoadingChangelog(false);
      });
  }, []);

  // ─── Actions ──────────────────────────────────────────────
  var handleRateApp = function () {
    var storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/stepora/id000000000'
      : 'https://play.google.com/store/apps/details?id=app.stepora.mobile';
    Linking.openURL(storeUrl).catch(function () {
      Alert.alert('Error', 'Could not open store page.');
    });
  };

  var handleReportBug = function () {
    Linking.openURL('mailto:support@stepora.app?subject=Bug%20Report%20-%20Stepora%20Mobile%20v' + APP_VERSION).catch(function () {
      Alert.alert('Error', 'Could not open email client.');
    });
  };

  var handleFeedback = function () {
    Linking.openURL('mailto:feedback@stepora.app?subject=Feedback%20-%20Stepora%20Mobile%20v' + APP_VERSION).catch(function () {
      Alert.alert('Error', 'Could not open email client.');
    });
  };

  var handleUpdate = function () {
    var storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/stepora/id000000000'
      : 'https://play.google.com/store/apps/details?id=app.stepora.mobile';
    Linking.openURL(storeUrl).catch(function () {
      Alert.alert('Error', 'Could not open store page.');
    });
  };

  return {
    navigation: navigation,
    appVersion: APP_VERSION,
    buildNumber: BUILD_NUMBER,
    checking: checking,
    updateAvailable: updateAvailable,
    latestVersion: latestVersion,
    changelog: changelog,
    loadingChangelog: loadingChangelog,
    error: error,
    systemInfo: systemInfo,
    checkForUpdates: checkForUpdates,
    handleRateApp: handleRateApp,
    handleReportBug: handleReportBug,
    handleFeedback: handleFeedback,
    handleUpdate: handleUpdate,
  };
}

module.exports = useAppVersionScreen;
