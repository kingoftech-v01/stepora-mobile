/**
 * useDreamJournalScreen — Business logic for the daily journal entries screen.
 */
var { useState, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiPatch, apiDelete } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');

var MOOD_OPTIONS = [
  { key: 'amazing', emoji: '\uD83E\uDD29', label: 'Amazing' },
  { key: 'happy', emoji: '\uD83D\uDE04', label: 'Happy' },
  { key: 'good', emoji: '\uD83D\uDE42', label: 'Good' },
  { key: 'neutral', emoji: '\uD83D\uDE10', label: 'Neutral' },
  { key: 'sad', emoji: '\uD83D\uDE14', label: 'Sad' },
  { key: 'frustrated', emoji: '\uD83D\uDE24', label: 'Frustrated' },
  { key: 'anxious', emoji: '\uD83D\uDE30', label: 'Anxious' },
  { key: 'tired', emoji: '\uD83D\uDE34', label: 'Tired' },
];

var MOOD_COLORS = {
  amazing: '#EC4899',
  happy: '#22C55E',
  good: '#14B8A6',
  neutral: '#6366F1',
  sad: '#3B82F6',
  frustrated: '#EF4444',
  anxious: '#F59E0B',
  tired: '#9CA3AF',
};

var useDreamJournalScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  // Journal entries query
  var journalQuery = useQuery({
    queryKey: ['dream-journal'],
    queryFn: function () {
      return apiGet(DREAMS.JOURNAL.LIST + '?ordering=-created_at&page_size=50');
    },
  });

  var rawEntries = journalQuery.data;
  var entries = Array.isArray(rawEntries)
    ? rawEntries
    : rawEntries && rawEntries.results
      ? rawEntries.results
      : [];

  // Group entries by date
  var groupedEntries = [];
  var dateMap = {};
  entries.forEach(function (entry) {
    var date = (entry.createdAt || entry.date || '').split('T')[0];
    if (!dateMap[date]) {
      dateMap[date] = { date: date, entries: [] };
      groupedEntries.push(dateMap[date]);
    }
    dateMap[date].entries.push(entry);
  });

  // New entry form state
  var [showForm, setShowForm] = useState(false);
  var [formMood, setFormMood] = useState('');
  var [formText, setFormText] = useState('');
  var [formImageUri, setFormImageUri] = useState(null);
  var [editingId, setEditingId] = useState(null);

  // Create entry mutation
  var createMut = useMutation({
    mutationFn: function (data) {
      return apiPost(DREAMS.JOURNAL.LIST, data);
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['dream-journal'] });
      resetForm();
    },
  });

  // Update entry mutation
  var updateMut = useMutation({
    mutationFn: function (data) {
      return apiPatch(DREAMS.JOURNAL.DETAIL(data.id), {
        mood: data.mood,
        text: data.text,
      });
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['dream-journal'] });
      resetForm();
    },
  });

  // Delete entry mutation
  var deleteMut = useMutation({
    mutationFn: function (id) {
      return apiDelete(DREAMS.JOURNAL.DETAIL(id));
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['dream-journal'] });
    },
  });

  var resetForm = useCallback(function () {
    setShowForm(false);
    setFormMood('');
    setFormText('');
    setFormImageUri(null);
    setEditingId(null);
  }, []);

  var openNewEntry = useCallback(function () {
    setEditingId(null);
    setFormMood('');
    setFormText('');
    setFormImageUri(null);
    setShowForm(true);
  }, []);

  var openEditEntry = useCallback(function (entry) {
    setEditingId(entry.id);
    setFormMood(entry.mood || '');
    setFormText(entry.text || entry.content || '');
    setShowForm(true);
  }, []);

  var handleSubmit = useCallback(function () {
    if (!formText.trim() && !formMood) return;
    var payload = {
      mood: formMood || 'neutral',
      text: formText.trim(),
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, mood: payload.mood, text: payload.text });
    } else {
      createMut.mutate(payload);
    }
  }, [formMood, formText, editingId]);

  var handleDelete = useCallback(function (id) {
    var { Alert } = require('react-native');
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: function () { deleteMut.mutate(id); },
        },
      ]
    );
  }, []);

  var handlePickImage = useCallback(function () {
    try {
      var ImagePicker = require('react-native-image-picker');
      ImagePicker.launchImageLibrary(
        { mediaType: 'photo', maxWidth: 800, maxHeight: 800, quality: 0.8 },
        function (response) {
          if (response.didCancel || response.errorCode) return;
          var asset = response.assets && response.assets[0];
          if (asset && asset.uri) {
            setFormImageUri(asset.uri);
          }
        }
      );
    } catch (e) {
      // Image picker not available
    }
  }, []);

  var formatDate = useCallback(function (dateStr) {
    if (!dateStr) return '';
    var now = new Date();
    var d = new Date(dateStr + 'T00:00:00');
    var today = now.toISOString().split('T')[0];
    var yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, []);

  var formatTime = useCallback(function (isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }, []);

  return {
    navigation: navigation,
    journalQuery: journalQuery,
    entries: entries,
    groupedEntries: groupedEntries,
    showForm: showForm,
    setShowForm: setShowForm,
    formMood: formMood,
    setFormMood: setFormMood,
    formText: formText,
    setFormText: setFormText,
    formImageUri: formImageUri,
    editingId: editingId,
    openNewEntry: openNewEntry,
    openEditEntry: openEditEntry,
    handleSubmit: handleSubmit,
    handleDelete: handleDelete,
    handlePickImage: handlePickImage,
    resetForm: resetForm,
    createMut: createMut,
    updateMut: updateMut,
    deleteMut: deleteMut,
    formatDate: formatDate,
    formatTime: formatTime,
    MOOD_OPTIONS: MOOD_OPTIONS,
    MOOD_COLORS: MOOD_COLORS,
  };
};

module.exports = useDreamJournalScreen;
