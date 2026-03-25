/**
 * useGoogleCalendarConnectScreen — Business logic for Google Calendar connection.
 * Handles OAuth flow, sync, disconnect, and calendar list toggling.
 * Synced with web: feature flag guard, toast messages, auth URL validation,
 * 501 error handling, native redirect_uri in callback.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { Linking, Alert } = require('react-native');
var { apiGet, apiPost } = require('../../services/api');
var { CALENDAR } = require('../../services/endpoints');
var { BRAND, adaptColor } = require('../../styles/colors');
var { isEnabled } = require('../../config/featureFlags');

var useGoogleCalendarConnectScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var googleCalendarEnabled = isEnabled('GOOGLE_CALENDAR');

  // Feature flag guard: redirect if disabled
  useEffect(function () {
    if (!googleCalendarEnabled) {
      Alert.alert('Coming Soon', 'Google Calendar integration is coming soon.');
      navigation.goBack();
    }
  }, [googleCalendarEnabled]);

  var [connected, setConnected] = useState(false);
  var [connecting, setConnecting] = useState(false);
  var [calendars, setCalendars] = useState([]);
  var [lastSync, setLastSync] = useState(null);

  var statusQuery = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: function () { return apiGet(CALENDAR.GOOGLE.STATUS); },
  });

  useEffect(function () {
    if (statusQuery.data) {
      var data = statusQuery.data;
      if (data.connected) {
        setConnected(true);
        if (data.calendars && data.calendars.length > 0) setCalendars(data.calendars);
        if (data.lastSync) setLastSync(new Date(data.lastSync));
      } else {
        setConnected(false);
      }
    }
  }, [statusQuery.data]);

  var callbackMut = useMutation({
    mutationFn: function (payload) { return apiPost(CALENDAR.GOOGLE.CALLBACK, payload); },
    onSuccess: function () {
      setConnecting(false);
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      Alert.alert('Connected', 'Google Calendar connected successfully.');
    },
    onError: function (err) {
      setConnecting(false);
      Alert.alert('Error', err.userMessage || err.message || 'Failed to connect Google Calendar.');
    },
  });

  // Handle deep link callback with OAuth code
  useEffect(function () {
    var handleDeepLink = function (event) {
      var url = event.url || '';
      var codeMatch = url.match(/[?&]code=([^&]+)/);
      if (codeMatch) {
        setConnecting(true);
        var payload = {
          code: codeMatch[1],
          redirect_uri: CALENDAR.GOOGLE.NATIVE_CALLBACK,
        };
        callbackMut.mutate(payload);
      }
    };
    var sub = Linking.addEventListener('url', handleDeepLink);
    // Also check initial URL
    Linking.getInitialURL().then(function (url) {
      if (url) handleDeepLink({ url: url });
    });
    return function () { sub.remove(); };
  }, []);

  var syncMut = useMutation({
    mutationFn: function () { return apiPost(CALENDAR.GOOGLE.SYNC); },
    onSuccess: function () {
      setLastSync(new Date());
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      Alert.alert('Synced', 'Calendar synced successfully.');
    },
    onError: function (err) {
      Alert.alert('Sync Failed', err.userMessage || err.message || 'Failed to sync calendar.');
    },
  });

  var disconnectMut = useMutation({
    mutationFn: function () { return apiPost(CALENDAR.GOOGLE.DISCONNECT); },
    onSuccess: function () {
      setConnected(false);
      setLastSync(null);
      setCalendars([]);
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      Alert.alert('Disconnected', 'Google Calendar disconnected.');
    },
    onError: function (err) {
      Alert.alert('Error', err.userMessage || err.message || 'Failed to disconnect calendar.');
    },
  });

  var handleConnect = function () {
    setConnecting(true);
    var authUrl = CALENDAR.GOOGLE.AUTH;
    authUrl += '?redirect_uri=' + encodeURIComponent(CALENDAR.GOOGLE.NATIVE_CALLBACK);
    apiGet(authUrl)
      .then(function (data) {
        // Validate auth URL domain (must be accounts.google.com)
        if (
          data.authUrl &&
          (function (u) {
            try {
              var p = new URL(u);
              return (
                p.protocol === 'https:' &&
                (p.hostname === 'accounts.google.com' ||
                  p.hostname.endsWith('.accounts.google.com'))
              );
            } catch (e) {
              return false;
            }
          })(data.authUrl)
        ) {
          Linking.openURL(data.authUrl).catch(function () {
            setConnecting(false);
            Alert.alert('Error', 'Could not open browser for authentication.');
          });
        } else {
          setConnecting(false);
          Alert.alert('Error', 'Authentication failed. Invalid auth URL.');
        }
      })
      .catch(function (err) {
        setConnecting(false);
        var msg = (err.userMessage || err.message || '').toLowerCase().includes('501')
          ? 'Google Calendar is not available yet.'
          : err.userMessage || err.message || 'Authentication failed.';
        Alert.alert('Error', msg);
      });
  };

  var handleSync = function () { syncMut.mutate(); };
  var handleDisconnect = function () { disconnectMut.mutate(); };

  var syncing = syncMut.isPending;
  var disconnecting = disconnectMut.isPending;

  var toggleCalendar = function (id) {
    setCalendars(function (prev) {
      return prev.map(function (c) {
        return c.id === id ? Object.assign({}, c, { enabled: !c.enabled }) : c;
      });
    });
  };

  return {
    navigation: navigation,
    connected: connected,
    connecting: connecting,
    calendars: calendars,
    lastSync: lastSync,
    statusQuery: statusQuery,
    syncing: syncing,
    disconnecting: disconnecting,
    handleConnect: handleConnect,
    handleSync: handleSync,
    handleDisconnect: handleDisconnect,
    toggleCalendar: toggleCalendar,
    BRAND: BRAND,
    adaptColor: adaptColor,
  };
};

module.exports = useGoogleCalendarConnectScreen;
