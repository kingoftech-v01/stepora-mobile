/**
 * useTimeBlockTemplatesScreen — Business logic for the Time Block Templates screen.
 * Fetches templates (preset + user), apply/delete/save mutations.
 * Synced with web: toast/alert messages, formatTime12, sanitizeText.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { Alert } = require('react-native');
var { apiGet, apiPost, apiDelete } = require('../../services/api');
var { CALENDAR } = require('../../services/endpoints');
var { sanitizeText } = require('../../utils/sanitize');
var { BRAND } = require('../../styles/colors');

var DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

var BLOCK_TYPE_META = {
  work: { label: 'Work', color: '#3B82F6', icon: 'briefcase' },
  personal: { label: 'Personal', color: '#8B5CF6', icon: 'user' },
  family: { label: 'Family', color: '#EC4899', icon: 'users' },
  exercise: { label: 'Exercise', color: '#10B981', icon: 'activity' },
  blocked: { label: 'Blocked', color: '#6B7280', icon: 'lock' },
};

function formatTime12(timeStr) {
  if (!timeStr) return '';
  var parts = timeStr.split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  var hour12 = h % 12 || 12;
  return hour12 + ':' + m + ' ' + ampm;
}

var useTimeBlockTemplatesScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var [mounted, setMounted] = useState(false);
  var [showSaveModal, setShowSaveModal] = useState(false);
  var [showApplyConfirm, setShowApplyConfirm] = useState(null);
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  var [saveName, setSaveName] = useState('');
  var [saveDescription, setSaveDescription] = useState('');

  useEffect(function () {
    var timer = setTimeout(function () { setMounted(true); }, 50);
    return function () { clearTimeout(timer); };
  }, []);

  var templatesQuery = useQuery({
    queryKey: ['timeblock-templates'],
    queryFn: function () { return apiGet(CALENDAR.TEMPLATES); },
  });
  var allTemplates =
    (templatesQuery.data && templatesQuery.data.results) || templatesQuery.data || [];

  var presets = [];
  var userTemplates = [];
  for (var i = 0; i < allTemplates.length; i++) {
    if (allTemplates[i].is_preset) {
      presets.push(allTemplates[i]);
    } else {
      userTemplates.push(allTemplates[i]);
    }
  }

  var applyMut = useMutation({
    mutationFn: function (templateId) { return apiPost(CALENDAR.TEMPLATE_APPLY(templateId)); },
    onSuccess: function (data) {
      Alert.alert('Applied', (data && data.detail) || 'Template applied!');
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['timeblock-templates'] });
      setShowApplyConfirm(null);
    },
    onError: function (err) {
      Alert.alert('Error', err.userMessage || err.message || 'Failed to apply template.');
      setShowApplyConfirm(null);
    },
  });

  var saveMut = useMutation({
    mutationFn: function (payload) { return apiPost(CALENDAR.TEMPLATE_SAVE_CURRENT, payload); },
    onSuccess: function () {
      Alert.alert('Saved', 'Template saved!');
      queryClient.invalidateQueries({ queryKey: ['timeblock-templates'] });
      closeSaveModal();
    },
    onError: function (err) {
      Alert.alert('Error', err.userMessage || err.message || 'Failed to save template.');
    },
  });

  var deleteMut = useMutation({
    mutationFn: function (id) { return apiDelete(CALENDAR.TEMPLATE_DETAIL(id)); },
    onSuccess: function () {
      Alert.alert('Deleted', 'Template deleted.');
      queryClient.invalidateQueries({ queryKey: ['timeblock-templates'] });
      setShowDeleteConfirm(null);
    },
    onError: function (err) {
      Alert.alert('Error', err.userMessage || err.message || 'Failed to delete template.');
      setShowDeleteConfirm(null);
    },
  });

  var closeSaveModal = function () {
    setShowSaveModal(false);
    setSaveName('');
    setSaveDescription('');
  };

  var handleSave = function () {
    var cleanName = sanitizeText(saveName, 100);
    if (!cleanName) {
      Alert.alert('Validation', 'Please enter a name for the template.');
      return;
    }
    saveMut.mutate({
      name: cleanName,
      description: sanitizeText(saveDescription, 500) || '',
    });
  };

  return {
    navigation: navigation,
    mounted: mounted,
    showSaveModal: showSaveModal,
    setShowSaveModal: setShowSaveModal,
    showApplyConfirm: showApplyConfirm,
    setShowApplyConfirm: setShowApplyConfirm,
    showDeleteConfirm: showDeleteConfirm,
    setShowDeleteConfirm: setShowDeleteConfirm,
    saveName: saveName,
    setSaveName: setSaveName,
    saveDescription: saveDescription,
    setSaveDescription: setSaveDescription,
    templatesQuery: templatesQuery,
    allTemplates: allTemplates,
    presets: presets,
    userTemplates: userTemplates,
    applyMut: applyMut,
    saveMut: saveMut,
    deleteMut: deleteMut,
    closeSaveModal: closeSaveModal,
    handleSave: handleSave,
    DAY_NAMES: DAY_NAMES,
    BLOCK_TYPE_META: BLOCK_TYPE_META,
    formatTime12: formatTime12,
    BRAND: BRAND,
  };
};

module.exports = useTimeBlockTemplatesScreen;
