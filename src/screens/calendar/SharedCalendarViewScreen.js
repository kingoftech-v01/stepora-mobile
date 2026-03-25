/**
 * SharedCalendarViewScreen — View a shared calendar from another user.
 *
 * - Calendar component showing shared events
 * - Event list below calendar for selected date
 * - Shared by: user info banner at top
 * - Suggest time/event button
 * - Accept/decline shared events
 * - Fetches from CALENDAR.SHARING endpoints
 */
var React = require('react');
var { useState, useCallback, useMemo, useEffect } = React;
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Alert,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery, useQueryClient, useMutation } = require('@tanstack/react-query');
var { apiGet, apiPost, apiPatch } = require('../../services/api');
var { CALENDAR } = require('../../services/endpoints');
var { SafeAreaView } = require('react-native-safe-area-context');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

// ─── Helpers ──────────────────────────────────────────────────────

var MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

var DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

var EVENT_COLORS = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#22C55E',
  '#F59E0B', '#14B8A6', '#6366F1', '#EF4444',
];

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var getKey = function (y, m, d) {
  return y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d;
};

var formatTime = function (dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var hours = d.getHours();
  var mins = d.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return hours + ':' + (mins < 10 ? '0' : '') + mins + ' ' + ampm;
};

var formatDate = function (dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

var getColorForEvent = function (evt, idx) {
  if (evt.color) return evt.color;
  return EVENT_COLORS[idx % EVENT_COLORS.length];
};

// ─── Main Screen ──────────────────────────────────────────────────

var SharedCalendarViewScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var shareToken = route.params && route.params.token;
  var shareId = route.params && route.params.shareId;
  var queryClient = useQueryClient();

  // Calendar state
  var now = new Date();
  var [viewY, setViewY] = useState(now.getFullYear());
  var [viewM, setViewM] = useState(now.getMonth());
  var [selDay, setSelDay] = useState(null);
  var [suggestModal, setSuggestModal] = useState(false);
  var [suggestDate, setSuggestDate] = useState('');
  var [suggestStartTime, setSuggestStartTime] = useState('10:00');
  var [suggestEndTime, setSuggestEndTime] = useState('11:00');
  var [suggestNote, setSuggestNote] = useState('');

  // ─── Fetch shared calendar data ───────────────────────────────
  var sharedQuery = useQuery({
    queryKey: ['shared-calendar', shareToken],
    queryFn: function () {
      if (shareToken) {
        return apiGet(CALENDAR.SHARING.SHARED(shareToken));
      }
      // Fallback: fetch shared-with-me list
      return apiGet(CALENDAR.SHARING.SHARED_WITH_ME);
    },
    enabled: !!shareToken || !!shareId,
    staleTime: 60000,
    retry: 1,
  });

  // Extract data from the query
  var sharedData = useMemo(function () {
    var data = sharedQuery.data;
    if (!data) return { events: [], sharer: null, permissions: {} };

    var events = data.events || data.items || [];
    if (!Array.isArray(events)) events = [];

    var sharer = data.sharedBy || data.sharer || data.owner || null;
    var permissions = data.permissions || {};

    return {
      events: events,
      sharer: sharer,
      permissions: permissions,
      title: data.title || data.name || 'Shared Calendar',
    };
  }, [sharedQuery.data]);

  // ─── Build event map by date ──────────────────────────────────
  var eventsByDate = useMemo(function () {
    var map = {};
    for (var i = 0; i < sharedData.events.length; i++) {
      var evt = sharedData.events[i];
      var dateStr = evt.date || evt.startDate || evt.start || evt.startTime;
      if (!dateStr) continue;
      var d = new Date(dateStr);
      var key = getKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (!map[key]) map[key] = [];
      map[key].push(Object.assign({}, evt, {
        color: getColorForEvent(evt, i),
        formattedTime: formatTime(dateStr),
        formattedDate: formatDate(dateStr),
      }));
    }
    return map;
  }, [sharedData.events]);

  // ─── Calendar grid cells ──────────────────────────────────────
  var cells = useMemo(function () {
    var firstDay = new Date(viewY, viewM, 1).getDay();
    var daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    var arr = [];
    for (var i = 0; i < firstDay; i++) arr.push(null);
    for (var d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [viewY, viewM]);

  // Today helpers
  var isToday = function (day) {
    return day === now.getDate() && viewM === now.getMonth() && viewY === now.getFullYear();
  };

  var isSel = function (day) {
    return day === selDay;
  };

  // Selected day events
  var selKey = selDay ? getKey(viewY, viewM, selDay) : null;
  var selEvents = selKey ? (eventsByDate[selKey] || []) : [];

  // Today events (default view)
  var todayKey = getKey(now.getFullYear(), now.getMonth(), now.getDate());
  var todayEvents = eventsByDate[todayKey] || [];

  var displayEvents = selDay ? selEvents : todayEvents;

  // ─── Navigation ───────────────────────────────────────────────
  var prevMonth = function () {
    if (viewM === 0) {
      setViewM(11);
      setViewY(viewY - 1);
    } else {
      setViewM(viewM - 1);
    }
    setSelDay(null);
  };

  var nextMonth = function () {
    if (viewM === 11) {
      setViewM(0);
      setViewY(viewY + 1);
    } else {
      setViewM(viewM + 1);
    }
    setSelDay(null);
  };

  var goToday = function () {
    setViewY(now.getFullYear());
    setViewM(now.getMonth());
    setSelDay(now.getDate());
  };

  // ─── Suggest time mutation ───────────────────────────────────
  var suggestMut = useMutation({
    mutationFn: function (data) {
      return apiPost(CALENDAR.SHARING.SUGGEST(shareToken), data);
    },
    onSuccess: function () {
      Alert.alert('Suggestion sent', 'Your time suggestion has been sent to the calendar owner.');
      queryClient.invalidateQueries({ queryKey: ['shared-calendar', shareToken] });
      setSuggestModal(false);
      setSuggestTitle('');
      setSuggestDate('');
      setSuggestStartTime('10:00');
      setSuggestEndTime('11:00');
      setSuggestNote('');
    },
    onError: function (err) {
      Alert.alert(
        'Error',
        (err && err.userMessage) || (err && err.message) || 'Failed to send suggestion'
      );
    },
  });

  var handleSuggest = useCallback(function () {
    if (!suggestDate || !suggestStartTime || !suggestEndTime) {
      Alert.alert('Required', 'Please fill in all time fields.');
      return;
    }
    var startISO = suggestDate + 'T' + suggestStartTime + ':00Z';
    var endISO = suggestDate + 'T' + suggestEndTime + ':00Z';
    suggestMut.mutate({ suggestedStart: startISO, suggestedEnd: endISO, note: suggestNote });
  }, [shareToken, suggestDate, suggestStartTime, suggestEndTime, suggestNote]);

  // ─── Accept/decline shared event ──────────────────────────────
  var handleEventAction = useCallback(function (eventId, action) {
    // action: 'accept' or 'decline'
    var endpoint = CALENDAR.EVENT_DETAIL(eventId);
    var payload = { status: action === 'accept' ? 'accepted' : 'declined' };

    apiPatch(endpoint, payload)
      .then(function () {
        queryClient.invalidateQueries({ queryKey: ['shared-calendar', shareToken] });
        Alert.alert(
          action === 'accept' ? 'Event accepted' : 'Event declined',
          action === 'accept'
            ? 'The event has been added to your calendar.'
            : 'The event has been declined.'
        );
      })
      .catch(function (err) {
        Alert.alert(
          'Error',
          (err && err.userMessage) || (err && err.message) || 'Failed to update event'
        );
      });
  }, [shareToken, queryClient]);

  // ─── Render: Shared-by banner ─────────────────────────────────
  var renderSharerBanner = function () {
    var sharer = sharedData.sharer;
    if (!sharer) return null;

    var sharerName = sharer.displayName || sharer.username || sharer.name || 'Someone';

    return React.createElement(
      View,
      { style: styles.sharerBanner },
      React.createElement(Avatar, {
        name: sharerName,
        src: sharer.avatar || sharer.profileImage,
        size: 40,
        color: avatarColor(sharerName),
      }),
      React.createElement(
        View,
        { style: styles.sharerInfo },
        React.createElement(
          Text,
          { style: styles.sharerLabel },
          'Shared by'
        ),
        React.createElement(
          Text,
          { style: styles.sharerName },
          sharerName
        )
      ),
      React.createElement(
        View,
        { style: styles.sharerBadge },
        React.createElement(Icon, { name: 'share-2', size: 12, color: COLORS.purple }),
        React.createElement(
          Text,
          { style: styles.sharerBadgeText },
          sharedData.permissions.canEdit ? 'Can edit' : 'View only'
        )
      )
    );
  };

  // ─── Render: Header ───────────────────────────────────────────
  var renderHeader = function () {
    return React.createElement(
      View,
      { style: styles.header },
      React.createElement(
        TouchableOpacity,
        {
          style: styles.headerBtn,
          onPress: function () {
            navigation.goBack();
          },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back',
        },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(
        View,
        { style: styles.headerTitleWrap },
        React.createElement(Icon, { name: 'calendar', size: 18, color: COLORS.purple }),
        React.createElement(
          Text,
          { style: styles.headerTitle },
          sharedData.title || 'Shared Calendar'
        )
      ),
      React.createElement(
        View,
        { style: styles.headerRight },
        React.createElement(
          TouchableOpacity,
          { style: styles.todayBtn, onPress: goToday, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go to today' },
          React.createElement(Text, { style: styles.todayBtnText }, 'Today')
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.headerBtn,
            onPress: function () {
              setSuggestDate('');
              setSuggestStartTime('10:00');
              setSuggestEndTime('11:00');
              setSuggestNote('');
              setSuggestModal(true);
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Suggest an event',
          },
          React.createElement(Icon, { name: 'plus', size: 20, color: COLORS.text })
        )
      )
    );
  };

  // ─── Render: Month navigation ─────────────────────────────────
  var renderMonthNav = function () {
    return React.createElement(
      View,
      { style: styles.monthNav },
      React.createElement(
        TouchableOpacity,
        { style: styles.navBtn, onPress: prevMonth, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Previous month' },
        React.createElement(Icon, { name: 'chevron-left', size: 20, color: COLORS.textSecondary })
      ),
      React.createElement(
        Text,
        { style: styles.monthLabel },
        MONTHS[viewM] + ' ' + viewY
      ),
      React.createElement(
        TouchableOpacity,
        { style: styles.navBtn, onPress: nextMonth, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Next month' },
        React.createElement(Icon, { name: 'chevron-right', size: 20, color: COLORS.textSecondary })
      )
    );
  };

  // ─── Render: Calendar grid ────────────────────────────────────
  var renderCalendarGrid = function () {
    return React.createElement(
      View,
      { style: styles.calendarCard },
      // Day headers
      React.createElement(
        View,
        { style: styles.dayHeaders },
        DAYS.map(function (d) {
          return React.createElement(
            View,
            { key: d, style: styles.dayHeaderCell },
            React.createElement(Text, { style: styles.dayHeaderText }, d)
          );
        })
      ),
      // Cells
      React.createElement(
        View,
        { style: styles.calGrid },
        cells.map(function (d, i) {
          if (d === null) {
            return React.createElement(View, { key: 'e' + i, style: styles.calCell });
          }
          var k = getKey(viewY, viewM, d);
          var hasEvt = eventsByDate[k] && eventsByDate[k].length > 0;
          var evtColors = (eventsByDate[k] || []).slice(0, 3).map(function (e) {
            return e.color;
          });

          return React.createElement(
            TouchableOpacity,
            {
              key: d,
              style: [
                styles.calCell,
                isSel(d) && styles.calCellSel,
                isToday(d) && !isSel(d) && styles.calCellToday,
              ],
              onPress: function () {
                setSelDay(d);
              },
              accessible: true, accessibilityRole: 'button', accessibilityLabel: MONTHS[viewM] + ' ' + d + (hasEvt ? ', has events' : '') + (isToday(d) ? ', today' : ''), accessibilityState: { selected: isSel(d) },
            },
            React.createElement(
              Text,
              {
                style: [
                  styles.calCellText,
                  isSel(d) && styles.calCellTextSel,
                  isToday(d) && !isSel(d) && styles.calCellTextToday,
                ],
              },
              String(d)
            ),
            hasEvt
              ? React.createElement(
                  View,
                  { style: styles.evtDots },
                  evtColors.map(function (c, j) {
                    return React.createElement(View, {
                      key: j,
                      style: [styles.evtDot, { backgroundColor: c }],
                    });
                  })
                )
              : null
          );
        })
      )
    );
  };

  // ─── Render: Event list ───────────────────────────────────────
  var renderEventList = function () {
    if (sharedQuery.isLoading) {
      return React.createElement(
        View,
        { style: { padding: 20, alignItems: 'center' } },
        React.createElement(ActivityIndicator, { size: 'small', color: COLORS.purple })
      );
    }

    var dateLabel = selDay
      ? isToday(selDay)
        ? 'Today'
        : new Date(viewY, viewM, selDay).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })
      : 'Today';

    return React.createElement(
      View,
      { style: styles.eventSection },
      // Section header
      React.createElement(
        View,
        { style: styles.evtSectionHeader },
        React.createElement(
          Text,
          { style: styles.evtSectionTitle },
          dateLabel
        ),
        selDay
          ? React.createElement(
              TouchableOpacity,
              {
                onPress: function () {
                  setSelDay(null);
                },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Clear date selection',
              },
              React.createElement(
                Text,
                { style: { fontSize: 12, color: COLORS.textTertiary } },
                'Clear'
              )
            )
          : null,
        React.createElement(
          Text,
          { style: styles.evtCount },
          displayEvents.length + ' events'
        )
      ),

      // Events
      displayEvents.length === 0
        ? React.createElement(
            View,
            { style: styles.noEventsCard },
            React.createElement(Icon, { name: 'calendar', size: 28, color: COLORS.textMuted }),
            React.createElement(
              Text,
              { style: styles.noEventsText },
              'No events for this day'
            )
          )
        : displayEvents.map(function (evt, idx) {
            var evtStatus = evt.status || evt.responseStatus || 'pending';
            var isPending = evtStatus === 'pending' || evtStatus === 'needsAction';
            var isAccepted = evtStatus === 'accepted';
            var isDeclined = evtStatus === 'declined';

            return React.createElement(
              View,
              { key: evt.id || idx, style: styles.eventCard },
              // Color strip
              React.createElement(View, {
                style: [styles.eventStrip, { backgroundColor: evt.color }],
              }),
              // Event icon
              React.createElement(
                View,
                {
                  style: [styles.eventTypeIcon, { backgroundColor: evt.color + '15' }],
                },
                React.createElement(Icon, {
                  name: evt.isAllDay ? 'sun' : 'clock',
                  size: 12,
                  color: evt.color,
                })
              ),
              // Event info
              React.createElement(
                View,
                { style: { flex: 1, marginLeft: 12 } },
                React.createElement(
                  Text,
                  { style: styles.eventTitle, numberOfLines: 1 },
                  evt.title || evt.summary || 'Untitled Event'
                ),
                React.createElement(
                  View,
                  { style: styles.eventMeta },
                  React.createElement(
                    Text,
                    { style: styles.eventTime },
                    evt.isAllDay ? 'All day' : evt.formattedTime
                  ),
                  evt.location
                    ? React.createElement(
                        View,
                        { style: styles.locationBadge },
                        React.createElement(Icon, {
                          name: 'map-pin',
                          size: 10,
                          color: COLORS.textMuted,
                        }),
                        React.createElement(
                          Text,
                          { style: styles.locationText, numberOfLines: 1 },
                          evt.location
                        )
                      )
                    : null,
                  // Status badge
                  isAccepted
                    ? React.createElement(
                        View,
                        { style: styles.statusBadgeAccepted },
                        React.createElement(
                          Text,
                          { style: styles.statusBadgeTextAccepted },
                          'Accepted'
                        )
                      )
                    : isDeclined
                      ? React.createElement(
                          View,
                          { style: styles.statusBadgeDeclined },
                          React.createElement(
                            Text,
                            { style: styles.statusBadgeTextDeclined },
                            'Declined'
                          )
                        )
                      : null
                ),
                // Accept/Decline buttons for pending events
                isPending
                  ? React.createElement(
                      View,
                      { style: styles.eventActions },
                      React.createElement(
                        TouchableOpacity,
                        {
                          style: styles.acceptBtn,
                          onPress: function () {
                            handleEventAction(evt.id, 'accept');
                          },
                          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Accept event ' + (evt.title || evt.summary || ''),
                        },
                        React.createElement(Icon, {
                          name: 'check',
                          size: 14,
                          color: '#FFFFFF',
                        }),
                        React.createElement(
                          Text,
                          { style: styles.acceptBtnText },
                          'Accept'
                        )
                      ),
                      React.createElement(
                        TouchableOpacity,
                        {
                          style: styles.declineBtn,
                          onPress: function () {
                            handleEventAction(evt.id, 'decline');
                          },
                          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Decline event ' + (evt.title || evt.summary || ''),
                        },
                        React.createElement(Icon, {
                          name: 'x',
                          size: 14,
                          color: COLORS.red,
                        }),
                        React.createElement(
                          Text,
                          { style: styles.declineBtnText },
                          'Decline'
                        )
                      )
                    )
                  : null
              )
            );
          })
    );
  };

  // ─── Render: Suggest button ───────────────────────────────────
  var renderSuggestButton = function () {
    return React.createElement(
      TouchableOpacity,
      {
        style: styles.suggestFab,
        onPress: function () {
          var dateStr = '';
          if (selDay) {
            dateStr = getKey(viewY, viewM, selDay);
          }
          setSuggestDate(dateStr);
          setSuggestStartTime('10:00');
          setSuggestEndTime('11:00');
          setSuggestNote('');
          setSuggestModal(true);
        },
        activeOpacity: 0.85,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Suggest a time',
      },
      React.createElement(Icon, { name: 'message-circle', size: 20, color: '#FFFFFF' }),
      React.createElement(
        Text,
        { style: styles.suggestFabText },
        'Suggest Time'
      )
    );
  };

  // ─── Render: Suggest modal ────────────────────────────────────
  var renderSuggestModal = function () {
    return React.createElement(
      Modal,
      {
        visible: suggestModal,
        transparent: true,
        animationType: 'fade',
        onRequestClose: function () {
          setSuggestModal(false);
        },
      },
      React.createElement(
        View,
        { style: styles.modalOverlay },
        React.createElement(
          View,
          { style: styles.modalContent },
          React.createElement(
            View,
            { style: styles.modalHeader },
            React.createElement(Icon, { name: 'message-circle', size: 18, color: COLORS.purple }),
            React.createElement(
              Text,
              { style: styles.modalTitle },
              'Suggest an Event'
            )
          ),
          React.createElement(
            Text,
            { style: styles.modalDesc },
            'Send a suggestion to the calendar owner.'
          ),

          // Date
          React.createElement(Text, { style: styles.modalLabel }, 'Suggested Date'),
          React.createElement(TextInput, {
            style: styles.modalInput,
            value: suggestDate,
            onChangeText: setSuggestDate,
            placeholder: 'YYYY-MM-DD',
            placeholderTextColor: COLORS.textMuted,
            accessible: true, accessibilityLabel: 'Suggested date',
          }),

          // Start Time
          React.createElement(Text, { style: styles.modalLabel }, 'Start Time'),
          React.createElement(TextInput, {
            style: styles.modalInput,
            value: suggestStartTime,
            onChangeText: setSuggestStartTime,
            placeholder: '10:00',
            placeholderTextColor: COLORS.textMuted,
            accessible: true, accessibilityLabel: 'Start time',
          }),

          // End Time
          React.createElement(Text, { style: styles.modalLabel }, 'End Time'),
          React.createElement(TextInput, {
            style: styles.modalInput,
            value: suggestEndTime,
            onChangeText: setSuggestEndTime,
            placeholder: '11:00',
            placeholderTextColor: COLORS.textMuted,
            accessible: true, accessibilityLabel: 'End time',
          }),

          // Note
          React.createElement(Text, { style: styles.modalLabel }, 'Note (optional)'),
          React.createElement(TextInput, {
            style: [styles.modalInput, { height: 60, textAlignVertical: 'top' }],
            value: suggestNote,
            onChangeText: setSuggestNote,
            placeholder: 'Any additional details...',
            placeholderTextColor: COLORS.textMuted,
            multiline: true,
            accessible: true, accessibilityLabel: 'Additional note',
          }),

          // Actions
          React.createElement(
            View,
            { style: styles.modalActions },
            React.createElement(
              TouchableOpacity,
              {
                style: styles.modalCancelBtn,
                onPress: function () {
                  setSuggestModal(false);
                },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel',
              },
              React.createElement(Text, { style: styles.modalCancelText }, 'Cancel')
            ),
            React.createElement(
              TouchableOpacity,
              {
                style: [styles.modalSubmitBtn, (!suggestDate || !suggestStartTime || !suggestEndTime) && { opacity: 0.5 }],
                onPress: handleSuggest,
                disabled: !suggestDate || !suggestStartTime || !suggestEndTime || suggestMut.isPending,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Send suggestion', accessibilityState: { disabled: !suggestDate || !suggestStartTime || !suggestEndTime },
              },
              React.createElement(Icon, {
                name: 'send',
                size: 14,
                color: '#FFFFFF',
                style: { marginRight: 6 },
              }),
              React.createElement(
                Text,
                { style: styles.modalSubmitText },
                'Send Suggestion'
              )
            )
          )
        )
      )
    );
  };

  // ─── Error state ──────────────────────────────────────────────
  if (sharedQuery.isError) {
    return React.createElement(
      SafeAreaView,
      { style: styles.container },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.headerBtn,
            onPress: function () {
              navigation.goBack();
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back',
          },
          React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
        ),
        React.createElement(
          View,
          { style: styles.headerTitleWrap },
          React.createElement(Text, { style: styles.headerTitle }, 'Shared Calendar')
        ),
        React.createElement(View, { style: { width: 36 } })
      ),
      React.createElement(
        View,
        { style: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } },
        React.createElement(Icon, { name: 'alert-circle', size: 48, color: COLORS.red }),
        React.createElement(
          Text,
          { style: { color: COLORS.red, fontSize: 16, fontWeight: '600', marginTop: 16 } },
          'Failed to load shared calendar'
        ),
        React.createElement(
          Text,
          { style: { color: COLORS.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' } },
          'This link may have expired or been revoked.'
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: {
              marginTop: 20,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: RADIUS.md,
              backgroundColor: COLORS.purple,
            },
            onPress: function () {
              sharedQuery.refetch();
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Retry loading shared calendar',
          },
          React.createElement(
            Text,
            { style: { color: '#FFFFFF', fontWeight: '600' } },
            'Retry'
          )
        )
      )
    );
  }

  // ─── Loading state ────────────────────────────────────────────
  if (sharedQuery.isLoading) {
    return React.createElement(
      SafeAreaView,
      { style: styles.container },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.headerBtn,
            onPress: function () {
              navigation.goBack();
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back',
          },
          React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
        ),
        React.createElement(
          View,
          { style: styles.headerTitleWrap },
          React.createElement(Text, { style: styles.headerTitle }, 'Shared Calendar')
        ),
        React.createElement(View, { style: { width: 36 } })
      ),
      React.createElement(
        View,
        { style: { flex: 1, alignItems: 'center', justifyContent: 'center' } },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple })
      )
    );
  }

  // ─── Main render ──────────────────────────────────────────────
  return React.createElement(
    SafeAreaView,
    { style: styles.container },
    React.createElement(
      ScrollView,
      {
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
      },
      renderHeader(),
      renderSharerBanner(),
      renderMonthNav(),
      renderCalendarGrid(),
      renderEventList()
    ),
    renderSuggestButton(),
    renderSuggestModal()
  );
};

// ─── Styles ─────────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },

  // ─── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accentSoft,
    backgroundColor: COLORS.accentSoft,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },

  // ─── Sharer banner ────────────────────────────────────────
  sharerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 12,
  },
  sharerInfo: {
    flex: 1,
  },
  sharerLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sharerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  sharerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
  },
  sharerBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.purple,
  },

  // ─── Month navigation ─────────────────────────────────────
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },

  // ─── Calendar grid ────────────────────────────────────────
  calendarCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 16,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  calCellSel: {
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  calCellToday: {
    backgroundColor: 'rgba(93,229,168,0.08)',
  },
  calCellText: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textPrimary,
  },
  calCellTextSel: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  calCellTextToday: {
    color: '#5DE5A8',
    fontWeight: '700',
  },
  evtDots: {
    flexDirection: 'row',
    gap: 2,
  },
  evtDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // ─── Events section ───────────────────────────────────────
  eventSection: {
    marginTop: SPACING.sm,
  },
  evtSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  evtSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  evtCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  noEventsCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    gap: 8,
  },
  noEventsText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // ─── Event cards ──────────────────────────────────────────
  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    gap: 12,
  },
  eventStrip: {
    width: 4,
    alignSelf: 'stretch',
    minHeight: 40,
    borderRadius: 2,
  },
  eventTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  eventTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    maxWidth: 120,
  },

  // ─── Status badges ────────────────────────────────────────
  statusBadgeAccepted: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  statusBadgeTextAccepted: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.green,
  },
  statusBadgeDeclined: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  statusBadgeTextDeclined: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.red,
  },

  // ─── Accept/Decline actions ───────────────────────────────
  eventActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.green,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  declineBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.red,
  },

  // ─── Suggest FAB ──────────────────────────────────────────
  suggestFab: {
    position: 'absolute',
    bottom: 24,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.purple,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    elevation: 8,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  suggestFabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ─── Modals ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1A1A2E',
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

module.exports = SharedCalendarViewScreen;
