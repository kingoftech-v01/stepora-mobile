/**
 * useGoogleSyncSettingsScreen — Business logic for Google Sync Settings screen.
 * Manages sync direction, what to sync, per-dream sync toggles, and save.
 * Synced with web: toast/alert messages on save/sync success/error.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { Alert } = require('react-native');
var { apiGet, apiPost } = require('../../services/api');
var { CALENDAR } = require('../../services/endpoints');
var { BRAND, adaptColor } = require('../../styles/colors');

var useGoogleSyncSettingsScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var [syncDirection, setSyncDirection] = useState('both');
  var [syncTasks, setSyncTasks] = useState(true);
  var [syncEvents, setSyncEvents] = useState(true);
  var [syncedDreamIds, setSyncedDreamIds] = useState([]);
  var [dreams, setDreams] = useState([]);
  var [lastSyncAt, setLastSyncAt] = useState(null);
  var [connected, setConnected] = useState(false);
  var [dirty, setDirty] = useState(false);

  var settingsQuery = useQuery({
    queryKey: ['google-sync-settings'],
    queryFn: function () { return apiGet(CALENDAR.GOOGLE.SYNC_SETTINGS); },
  });

  useEffect(function () {
    if (!settingsQuery.data) return;
    var d = settingsQuery.data;
    setConnected(!!d.connected);
    if (d.connected) {
      setSyncDirection(d.syncDirection || 'both');
      setSyncTasks(d.syncTasks !== false);
      setSyncEvents(d.syncEvents !== false);
      setSyncedDreamIds(d.syncedDreamIds || []);
      setDreams(d.dreams || []);
      if (d.lastSyncAt) setLastSyncAt(new Date(d.lastSyncAt));
    }
  }, [settingsQuery.data]);

  var saveMut = useMutation({
    mutationFn: function (payload) { return apiPost(CALENDAR.GOOGLE.SYNC_SETTINGS, payload); },
    onSuccess: function () {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['google-sync-settings'] });
      Alert.alert('Saved', 'Sync settings saved.');
    },
    onError: function (err) {
      Alert.alert('Error', err.userMessage || err.message || 'Failed to save settings.');
    },
  });

  var syncMut = useMutation({
    mutationFn: function () { return apiPost(CALENDAR.GOOGLE.SYNC); },
    onSuccess: function () {
      setLastSyncAt(new Date());
      queryClient.invalidateQueries({ queryKey: ['google-sync-settings'] });
      Alert.alert('Syncing', 'Sync started.');
    },
    onError: function (err) {
      Alert.alert('Sync Failed', err.userMessage || err.message || 'Sync failed.');
    },
  });

  var handleDirectionChange = function (val) {
    setSyncDirection(val);
    setDirty(true);
  };
  var handleToggleTasks = function () {
    setSyncTasks(function (p) { return !p; });
    setDirty(true);
  };
  var handleToggleEvents = function () {
    setSyncEvents(function (p) { return !p; });
    setDirty(true);
  };
  var handleToggleDream = function (dreamId) {
    setSyncedDreamIds(function (prev) {
      var idx = prev.indexOf(dreamId);
      if (idx >= 0) {
        var next = prev.slice();
        next.splice(idx, 1);
        return next;
      }
      return prev.concat([dreamId]);
    });
    setDirty(true);
  };
  var handleSelectAll = function () {
    setSyncedDreamIds([]);
    setDirty(true);
  };
  var handleDeselectAll = function () {
    setSyncedDreamIds(['00000000-0000-0000-0000-000000000000']);
    setDirty(true);
  };
  var handleSave = function () {
    saveMut.mutate({
      synced_dream_ids: syncedDreamIds,
      sync_direction: syncDirection,
      sync_tasks: syncTasks,
      sync_events: syncEvents,
    });
  };
  var handleSyncNow = function () { syncMut.mutate(); };

  var isDreamSynced = function (dreamId) {
    if (!syncedDreamIds || syncedDreamIds.length === 0) return true;
    return syncedDreamIds.indexOf(dreamId) >= 0;
  };

  var allSelected = !syncedDreamIds || syncedDreamIds.length === 0;
  var syncing = syncMut.isPending;
  var saving = saveMut.isPending;
  var loading = settingsQuery.isLoading;

  return {
    navigation: navigation,
    syncDirection: syncDirection,
    syncTasks: syncTasks,
    syncEvents: syncEvents,
    syncedDreamIds: syncedDreamIds,
    dreams: dreams,
    lastSyncAt: lastSyncAt,
    connected: connected,
    dirty: dirty,
    allSelected: allSelected,
    syncing: syncing,
    saving: saving,
    loading: loading,
    handleDirectionChange: handleDirectionChange,
    handleToggleTasks: handleToggleTasks,
    handleToggleEvents: handleToggleEvents,
    handleToggleDream: handleToggleDream,
    handleSelectAll: handleSelectAll,
    handleDeselectAll: handleDeselectAll,
    handleSave: handleSave,
    handleSyncNow: handleSyncNow,
    isDreamSynced: isDreamSynced,
    BRAND: BRAND,
    adaptColor: adaptColor,
  };
};

module.exports = useGoogleSyncSettingsScreen;
