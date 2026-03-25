/**
 * useDataExportScreen -- business logic for GDPR data export (React Native).
 * Synced with web app's useDataExportScreen.js.
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { Linking, Alert, Share } = require('react-native');
var { apiGet } = require('../../../services/api');
var { USERS } = require('../../../services/endpoints');
var { useToast } = require('../../../context/ToastContext');
var { useT } = require('../../../context/I18nContext');

var EXPORT_FORMATS = [
  { id: 'json', label: 'JSON', desc: 'Complete structured data in JSON format', color: '#8B5CF6' },
  { id: 'csv', label: 'CSV', desc: 'Spreadsheet-compatible CSV format', color: '#10B981' },
];

var DATA_CATEGORIES = [
  { key: 'dreams', label: 'Dreams & Goals', desc: 'All dreams, goals, tasks, milestones, and progress' },
  { key: 'profile', label: 'Profile & Settings', desc: 'Name, email, avatar, bio, timezone, preferences' },
  { key: 'activity', label: 'Activity History', desc: 'Streaks, XP, achievements, and interaction logs' },
];

function useDataExportScreen() {
  var navigation = useNavigation();
  var { showToast } = useToast();
  var { t } = useT();
  var [mounted, setMounted] = useState(false);
  var [selectedFormat, setSelectedFormat] = useState('json');
  var [isExporting, setIsExporting] = useState(false);
  var [exportProgress, setExportProgress] = useState(0);
  var [exportDone, setExportDone] = useState(false);

  useEffect(function () {
    var timer = setTimeout(function () {
      setMounted(true);
    }, 50);
    return function () { clearTimeout(timer); };
  }, []);

  var handleExport = function () {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportDone(false);

    apiGet(USERS.EXPORT_DATA + '?format=' + selectedFormat)
      .then(function (data) {
        setExportProgress(100);
        setExportDone(true);
        showToast(t('export.exportSuccess') || 'Export completed successfully!', 'success');

        // On mobile, try to share the data
        if (data) {
          var content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          Share.share({
            message: content,
            title: 'Stepora Data Export',
          }).catch(function () {});
        }

        setTimeout(function () {
          setIsExporting(false);
          setExportProgress(0);
          setExportDone(false);
        }, 3000);
      })
      .catch(function (err) {
        setIsExporting(false);
        setExportProgress(0);
        if (err.status === 429) {
          showToast(t('export.limitReached') || 'Export limit reached. Please try again later.', 'error');
        } else {
          showToast(err.userMessage || err.message || t('export.failedExport') || 'Failed to export data', 'error');
        }
      });
  };

  return {
    navigation: navigation,
    t: t,
    mounted: mounted,
    selectedFormat: selectedFormat,
    setSelectedFormat: setSelectedFormat,
    isExporting: isExporting,
    exportProgress: exportProgress,
    exportDone: exportDone,
    handleExport: handleExport,
    EXPORT_FORMATS: EXPORT_FORMATS,
    DATA_CATEGORIES: DATA_CATEGORIES,
  };
}

module.exports = useDataExportScreen;
