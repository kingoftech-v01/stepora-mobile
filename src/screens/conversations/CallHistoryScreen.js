/**
 * CallHistoryScreen — Call log showing past voice and video calls.
 *
 * Uses FRIEND_CHAT.CALLS endpoints (not CONVERSATIONS.CALLS).
 * Shows caller/callee info using user display_name from profile.
 * Synced with web: useCallHistoryScreen.js pattern.
 */
var React = require('react');
var { useState, useCallback, useMemo } = React;
var logger = require('../../utils/logger');
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { FRIEND_CHAT } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

// ─── Helpers ──────────────────────────────────────────────────────

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var formatDuration = function (seconds) {
  if (!seconds || seconds <= 0) return '';
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return m > 0 ? m + 'm ' + s + 's' : s + 's';
};

var formatDate = function (dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var now = new Date();
  var td = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var cd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var diff = Math.floor((td - cd) / 86400000);
  var time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return 'Today ' + time;
  if (diff === 1) return 'Yesterday ' + time;
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + time;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + time;
};

var getDateSection = function (dateStr) {
  if (!dateStr) return 'Older';
  var d = new Date(dateStr);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  var thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());

  var callDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (callDate.getTime() >= today.getTime()) return 'Today';
  if (callDate.getTime() >= yesterday.getTime()) return 'Yesterday';
  if (callDate.getTime() >= thisWeekStart.getTime()) return 'This Week';
  return 'Older';
};

// ─── Main Screen ──────────────────────────────────────────────────

var CallHistoryScreen = function () {
  var navigation = useNavigation();
  var [filter, setFilter] = useState('all');

  // Fetch call history from FRIEND_CHAT.CALLS
  var callsQuery = useQuery({
    queryKey: ['call-history'],
    queryFn: function () {
      return apiGet(FRIEND_CHAT.CALLS.HISTORY);
    },
  });

  var allCalls = useMemo(function () {
    var data = callsQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    return list.slice().sort(function (a, b) {
      var dateA = new Date(a.createdAt || a.startedAt || a.timestamp || 0).getTime();
      var dateB = new Date(b.createdAt || b.startedAt || b.timestamp || 0).getTime();
      return dateB - dateA;
    });
  }, [callsQuery.data]);

  // Apply filter
  var filteredCalls = useMemo(function () {
    if (filter === 'all') return allCalls;
    if (filter === 'missed') {
      return allCalls.filter(function (c) {
        return c.status === 'missed' || c.status === 'rejected' || c.status === 'cancelled';
      });
    }
    if (filter === 'voice') {
      return allCalls.filter(function (c) {
        return c.callType === 'audio' || c.callType === 'voice' || c.type === 'audio' || c.type === 'voice';
      });
    }
    if (filter === 'video') {
      return allCalls.filter(function (c) {
        return c.callType === 'video' || c.type === 'video';
      });
    }
    return allCalls;
  }, [allCalls, filter]);

  // Group by date section
  var sectionsWithHeaders = useMemo(function () {
    var result = [];
    var lastSection = '';

    for (var i = 0; i < filteredCalls.length; i++) {
      var call = filteredCalls[i];
      var dateStr = call.createdAt || call.startedAt || call.timestamp;
      var section = getDateSection(dateStr);

      if (section !== lastSection) {
        result.push({ type: 'header', title: section, id: 'header-' + section });
        lastSection = section;
      }
      result.push({ type: 'call', data: call, id: String(call.id || i) });
    }

    return result;
  }, [filteredCalls]);

  // Get call info (matching web pattern: uses callerId/calleeId)
  var getCallInfo = function (call, userId) {
    var isOutgoing = String(call.callerId) === String(userId);
    var name = isOutgoing
      ? call.calleeName || call.callerName || 'Unknown'
      : call.callerName || call.calleeName || 'Unknown';
    var isMissed = call.status === 'missed';
    var isRejected = call.status === 'rejected';
    var isCancelled = call.status === 'cancelled';

    var iconName = 'phone-outgoing';
    var color = COLORS.green || '#10B981';
    var label = 'Outgoing';

    if (!isOutgoing) {
      if (isMissed) {
        iconName = 'phone-missed';
        color = COLORS.red;
        label = 'Missed';
      } else {
        iconName = 'phone-incoming';
        color = COLORS.blue || '#3B82F6';
        label = 'Incoming';
      }
    } else {
      if (isMissed || isCancelled) {
        iconName = 'phone-missed';
        color = COLORS.red;
        label = isCancelled ? 'Cancelled' : 'No answer';
      } else if (isRejected) {
        iconName = 'phone-missed';
        color = COLORS.red;
        label = 'Declined';
      }
    }

    return {
      name: name,
      iconName: iconName,
      color: color,
      label: label,
      isOutgoing: isOutgoing,
      buddyId: isOutgoing ? call.calleeId : call.callerId,
    };
  };

  // Handle callback: initiate call via FRIEND_CHAT.CALLS
  var handleCallBack = useCallback(function (call) {
    var callType = call.callType || call.type || 'voice';
    var isVideo = callType === 'video';
    var buddyId = String(call.callerId) === String(call.calleeId) ? call.calleeId : call.callerId;
    var name = call.callerName || call.calleeName || 'Unknown';

    apiPost(FRIEND_CHAT.CALLS.INITIATE, { calleeId: buddyId, callType: callType })
      .then(function (data) {
        var newCallId = data.callId || data.id;
        navigation.navigate(isVideo ? 'VideoCall' : 'VoiceCall', {
          callId: newCallId,
          friendName: name,
        });
      })
      .catch(function (err) {
        logger.error('[CallHistory] callback failed:', err);
      });
  }, [navigation]);

  // Render filter tabs
  var renderFilterTabs = function () {
    var tabs = [
      { key: 'all', label: 'All' },
      { key: 'missed', label: 'Missed' },
      { key: 'voice', label: 'Voice' },
      { key: 'video', label: 'Video' },
    ];

    var missedCount = allCalls.filter(function (c) {
      return c.status === 'missed' || c.status === 'rejected' || c.status === 'cancelled';
    }).length;

    return React.createElement(
      View,
      { style: styles.filterRow },
      tabs.map(function (tab) {
        var isActive = filter === tab.key;
        return React.createElement(
          TouchableOpacity,
          {
            key: tab.key,
            style: [styles.filterTab, isActive && styles.filterTabActive],
            onPress: function () {
              setFilter(tab.key);
            },
            accessible: true,
            accessibilityRole: 'tab',
            accessibilityLabel: tab.label + ' calls',
            accessibilityState: { selected: isActive },
          },
          React.createElement(
            Text,
            { style: [styles.filterTabText, isActive && styles.filterTabTextActive] },
            tab.label
          ),
          tab.key === 'missed' && missedCount > 0
            ? React.createElement(
                View,
                { style: styles.missedBadge },
                React.createElement(
                  Text,
                  { style: styles.missedBadgeText },
                  String(missedCount)
                )
              )
            : null
        );
      })
    );
  };

  // Render call item or section header
  var renderItem = useCallback(function (info) {
    var item = info.item;

    if (item.type === 'header') {
      return React.createElement(
        View,
        { style: styles.sectionHeader, accessible: true, accessibilityRole: 'header' },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          item.title
        )
      );
    }

    var call = item.data;
    var callInfo = getCallInfo(call);
    var callType = call.callType || call.type || 'audio';
    var isVideo = callType === 'video';
    var isMissed = call.status === 'missed' || call.status === 'rejected' || call.status === 'cancelled';
    var dateStr = call.createdAt || call.startedAt || call.timestamp;
    var dur = call.duration || call.durationSeconds || 0;

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.callRow,
        activeOpacity: 0.7,
        onPress: function () {
          handleCallBack(call);
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: callInfo.name + ', ' + (isVideo ? 'video' : 'voice') + ' call, ' + callInfo.label + (!isMissed && dur > 0 ? ', ' + formatDuration(dur) : ''),
      },
      // Avatar
      React.createElement(
        View,
        { style: styles.avatarWrap },
        React.createElement(Avatar, {
          name: callInfo.name,
          src: call.callerAvatar || call.calleeAvatar || call.avatar,
          size: 48,
          color: avatarColor(callInfo.name),
        })
      ),

      // Call info
      React.createElement(
        View,
        { style: styles.callInfo },
        React.createElement(
          View,
          { style: styles.callTopRow },
          React.createElement(
            Text,
            {
              style: [styles.callName, isMissed && styles.callNameMissed],
              numberOfLines: 1,
            },
            callInfo.name
          ),
          React.createElement(
            View,
            { style: [styles.callTypeBadge, isVideo ? styles.callTypeBadgeVideo : null] },
            React.createElement(Icon, {
              name: isVideo ? 'video' : 'phone',
              size: 10,
              color: isVideo ? (COLORS.blue || '#3B82F6') : COLORS.textSecondary,
            })
          )
        ),
        React.createElement(
          View,
          { style: styles.callBottomRow },
          React.createElement(Icon, {
            name: callInfo.iconName,
            size: 13,
            color: callInfo.color,
            style: { marginRight: 4 },
          }),
          React.createElement(
            Text,
            { style: [styles.callStatusText, isMissed && styles.callStatusTextMissed] },
            callInfo.label
          ),
          !isMissed && dur > 0
            ? React.createElement(
                Text,
                { style: styles.callDuration },
                ' \u00B7 ' + formatDuration(dur)
              )
            : null
        )
      ),

      // Time + call back button
      React.createElement(
        View,
        { style: styles.callRight },
        React.createElement(
          Text,
          { style: [styles.callTime, isMissed && styles.callTimeMissed] },
          formatDate(dateStr)
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.callBackBtn,
            onPress: function () {
              handleCallBack(call);
            },
            hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Call back ' + callInfo.name,
          },
          React.createElement(Icon, {
            name: isVideo ? 'video' : 'phone',
            size: 16,
            color: COLORS.purple,
          })
        )
      )
    );
  }, [handleCallBack]);

  var keyExtractor = useCallback(function (item) {
    return item.id;
  }, []);

  var renderEmpty = function () {
    if (callsQuery.isLoading) return null;
    return React.createElement(
      View,
      { style: styles.emptyWrap },
      React.createElement(Icon, { name: 'phone-off', size: 48, color: COLORS.textMuted }),
      React.createElement(
        Text,
        { style: styles.emptyTitle },
        filter === 'missed' ? 'No missed calls'
          : filter === 'voice' ? 'No voice calls'
          : filter === 'video' ? 'No video calls'
          : 'No call history'
      ),
      React.createElement(
        Text,
        { style: styles.emptySubtitle },
        'Your call history will appear here'
      )
    );
  };

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Call History',
      onBack: function () {
        navigation.goBack();
      },
    }),

    // Filter tabs
    renderFilterTabs(),

    // Loading
    callsQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Loading call history' })
        )
      : React.createElement(FlatList, {
          data: sectionsWithHeaders,
          renderItem: renderItem,
          keyExtractor: keyExtractor,
          contentContainerStyle: sectionsWithHeaders.length === 0 ? { flex: 1 } : { paddingBottom: 100 },
          ListEmptyComponent: renderEmpty,
          refreshControl: React.createElement(RefreshControl, {
            refreshing: callsQuery.isRefetching || false,
            onRefresh: function () {
              callsQuery.refetch();
            },
            tintColor: COLORS.purple,
            colors: [COLORS.purple],
          }),
          showsVerticalScrollIndicator: false,
        })
  );
};

// ─── Styles ─────────────────────────────────────────────────────────

var styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Filter tabs ──────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.purple,
    fontWeight: '600',
  },
  missedBadge: {
    backgroundColor: COLORS.red,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  missedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // ─── Section headers ──────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ─── Call rows ────────────────────────────────────────────
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  avatarWrap: {
    marginRight: SPACING.md,
  },
  callInfo: {
    flex: 1,
  },
  callTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  callName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  callNameMissed: {
    color: COLORS.red,
  },
  callTypeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  callTypeBadgeVideo: {
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  callBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callStatusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  callStatusTextMissed: {
    color: COLORS.red,
    fontWeight: '500',
  },
  callDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  callRight: {
    alignItems: 'flex-end',
    marginLeft: SPACING.md,
    gap: 6,
  },
  callTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  callTimeMissed: {
    color: 'rgba(239,68,68,0.7)',
  },
  callBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Empty state ──────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

module.exports = CallHistoryScreen;
