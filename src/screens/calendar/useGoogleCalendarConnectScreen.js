/**
 * useGoogleCalendarConnectScreen — Business logic for Google Calendar connection.
 * Handles OAuth flow, sync, disconnect, and calendar list toggling.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { Linking } = require('react-native');
var { apiGet, apiPost } = require('../../services/api');
var { CALENDAR } = require('../../services/endpoints');
var { BRAND, adaptColor } = require('../../styles/colors');

var useGoogleCalendarConnectScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

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
    },
    onError: function () {
      setConnecting(false);
    },
  });

  var syncMut = useMutation({
    mutationFn: function () { return apiPost(CALENDAR.GOOGLE.SYNC); },
    onSuccess: function () {
      setLastSync(new Date());
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
    },
  });

  var disconnectMut = useMutation({
    mutationFn: function () { return apiPost(CALENDAR.GOOGLE.DISCONNECT); },
    onSuccess: function () {
      setConnected(false);
      setLastSync(null);
      setCalendars([]);
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
    },
  });

  var handleConnect = function () {
    setConnecting(true);
    var authUrl = CALENDAR.GOOGLE.AUTH;
    authUrl += '?redirect_uri=' + encodeURIComponent(CALENDAR.GOOGLE.NATIVE_CALLBACK);
    apiGet(authUrl)
      .then(function (data) {
        if (data.authUrl) {
          Linking.openURL(data.authUrl).catch(function () {
            setConnecting(false);
          });
        } else {
          setConnecting(false);
        }
      })
      .catch(function () {
        setConnecting(false);
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
