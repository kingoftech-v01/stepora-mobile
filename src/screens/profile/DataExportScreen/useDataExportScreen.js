/**
 * useDataExportScreen -- business logic for GDPR data export (React Native).
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { Linking, Alert } = require('react-native');
var { apiGet, apiPost } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');

function useDataExportScreen() {
  var navigation = useNavigation();

  var [loading, setLoading] = useState(true);
  var [exports, setExports] = useState([]);
  var [requesting, setRequesting] = useState(false);
  var [error, setError] = useState('');
  var [successMsg, setSuccessMsg] = useState('');

  // ─── Data categories included in export ───────────────────
  var DATA_CATEGORIES = [
    { key: 'profile', label: 'Profile Information', desc: 'Name, email, avatar, bio, timezone' },
    { key: 'dreams', label: 'Dreams & Goals', desc: 'All dreams, goals, tasks, milestones, and progress' },
    { key: 'conversations', label: 'AI Conversations', desc: 'Chat history with your AI coach' },
    { key: 'calendar', label: 'Calendar & Habits', desc: 'Events, time blocks, and habit tracking data' },
    { key: 'social', label: 'Social Activity', desc: 'Friends, circles, posts, and interactions' },
    { key: 'subscription', label: 'Subscription & Payments', desc: 'Plan history and billing records' },
    { key: 'achievements', label: 'Achievements & XP', desc: 'Badges, levels, streaks, and gamification data' },
  ];

  // ─── Fetch export history ─────────────────────────────────
  var fetchExports = useCallback(function () {
    setLoading(true);
    setError('');
    apiGet(USERS.EXPORT_DATA)
      .then(function (data) {
        var list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.exports)) {
          list = data.exports;
        } else if (data && Array.isArray(data.results)) {
          list = data.results;
        }
        setExports(list);
        setLoading(false);
      })
      .catch(function (err) {
        // If the endpoint only supports POST (no GET), just set empty list
        if (err.status === 405 || err.status === 404) {
          setExports([]);
          setLoading(false);
        } else {
          setError(err.message || 'Failed to load export history');
          setLoading(false);
        }
      });
  }, []);

  useEffect(function () {
    fetchExports();
  }, [fetchExports]);

  // ─── Request new data export ──────────────────────────────
  var handleRequestExport = function () {
    Alert.alert(
      'Request Data Export',
      'We will prepare a downloadable file with all your data. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: function () {
            setRequesting(true);
            setError('');
            setSuccessMsg('');
            apiPost(USERS.EXPORT_DATA)
              .then(function (data) {
                setRequesting(false);
                setSuccessMsg('Export requested! You will be notified when it is ready.');
                // Add the new export to the list if returned
                if (data && data.id) {
                  setExports(function (prev) { return [data].concat(prev); });
                } else {
                  // Refresh list
                  fetchExports();
                }
              })
              .catch(function (err) {
                setRequesting(false);
                setError(err.message || 'Failed to request export');
              });
          },
        },
      ]
    );
  };

  // ─── Download an export ───────────────────────────────────
  var handleDownload = function (exportItem) {
    var url = exportItem.downloadUrl || exportItem.url || exportItem.fileUrl;
    if (url) {
      Linking.openURL(url).catch(function () {
        Alert.alert('Error', 'Could not open download link.');
      });
    } else {
      Alert.alert('Not Available', 'Download link is not available yet.');
    }
  };

  // ─── Status helpers ───────────────────────────────────────
  var getStatusLabel = function (status) {
    if (!status) return 'Unknown';
    var s = status.toLowerCase();
    if (s === 'ready' || s === 'completed' || s === 'complete') return 'Ready';
    if (s === 'pending' || s === 'processing' || s === 'in_progress') return 'Processing';
    if (s === 'expired') return 'Expired';
    if (s === 'failed' || s === 'error') return 'Failed';
    return status;
  };

  var getStatusColor = function (status) {
    if (!status) return '#707080';
    var s = status.toLowerCase();
    if (s === 'ready' || s === 'completed' || s === 'complete') return '#5DE5A8';
    if (s === 'pending' || s === 'processing' || s === 'in_progress') return '#FCD34D';
    if (s === 'expired') return '#707080';
    if (s === 'failed' || s === 'error') return '#EF4444';
    return '#707080';
  };

  var formatDate = function (dateStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return {
    navigation: navigation,
    loading: loading,
    exports: exports,
    requesting: requesting,
    error: error,
    successMsg: successMsg,
    setSuccessMsg: setSuccessMsg,
    DATA_CATEGORIES: DATA_CATEGORIES,
    fetchExports: fetchExports,
    handleRequestExport: handleRequestExport,
    handleDownload: handleDownload,
    getStatusLabel: getStatusLabel,
    getStatusColor: getStatusColor,
    formatDate: formatDate,
  };
}

module.exports = useDataExportScreen;
