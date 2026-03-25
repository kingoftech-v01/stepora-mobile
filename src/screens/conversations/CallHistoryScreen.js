/**
 * CallHistoryScreen — Call log showing past voice and video calls.
 *
 * - FlatList of past calls sorted by date
 * - Each entry: caller/callee avatar+name, call type (video/voice), duration, timestamp
 * - Missed calls highlighted in red
 * - Tap to call back (navigate to VideoCallScreen or VoiceCallScreen)
 * - Date section headers (Today, Yesterday, This Week, etc.)
 */
var React = require('react');
var { useState, useCallback, useMemo } = React;
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
var { apiGet } = require('../../services/api');
var { CONVERSATIONS } = require('../../services/endpoints');
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
  if (!seconds || seconds <= 0) return '0:00';
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  if (mins >= 60) {
    var hours = Math.floor(mins / 60);
    mins = mins % 60;
    return hours + ':' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
};

var formatTimestamp = function (dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var hours = d.getHours();
  var mins = d.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return hours + ':' + (mins < 10 ? '0' : '') + mins + ' ' + ampm;
};

/**
 * Categorize a date into section headers:
 * Today, Yesterday, This Week, Last Week, This Month, Older
 */
var getDateSection = function (dateStr) {
  if (!dateStr) return 'Older';
  var d = new Date(dateStr);
  var now = new Date();

  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  var thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
  var lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  var thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  var callDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (callDate.getTime() >= today.getTime()) return 'Today';
  if (callDate.getTime() >= yesterday.getTime()) return 'Yesterday';
  if (callDate.getTime() >= thisWeekStart.getTime()) return 'This Week';
  if (callDate.getTime() >= lastWeekStart.getTime()) return 'Last Week';
  if (callDate.getTime() >= thisMonthStart.getTime()) return 'This Month';
  return 'Older';
};

/**
 * Determine call status from API data.
 * Returns: 'missed', 'incoming', 'outgoing'
 */
var getCallStatus = function (call) {
  if (call.status === 'missed' || call.isMissed) return 'missed';
  if (call.status === 'rejected' || call.isRejected) return 'missed';
  if (call.status === 'cancelled' || call.isCancelled) return 'missed';
  if (call.direction === 'incoming' || call.isIncoming) return 'incoming';
  return 'outgoing';
};

var getCallStatusIcon = function (status) {
  if (status === 'missed') return 'phone-missed';
  if (status === 'incoming') return 'phone-incoming';
  return 'phone-outgoing';
};

var getCallStatusColor = function (status) {
  if (status === 'missed') return COLORS.red;
  if (status === 'incoming') return COLORS.green;
  return COLORS.textSecondary;
};

var getCallerName = function (call) {
  return call.callerName || call.calleeName || call.otherUserName ||
    call.otherUserDisplayName || call.participantName || call.title || 'Unknown';
};

// ─── Main Screen ──────────────────────────────────────────────────

var CallHistoryScreen = function () {
  var navigation = useNavigation();
  var [filter, setFilter] = useState('all'); // 'all', 'missed', 'voice', 'video'

  // ─── Fetch call history ───────────────────────────────────────
  var callsQuery = useQuery({
    queryKey: ['call-history'],
    queryFn: function () {
      return apiGet(CONVERSATIONS.CALLS.HISTORY);
    },
  });

  var allCalls = useMemo(function () {
    var data = callsQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    // Sort by date descending (most recent first)
    return list.slice().sort(function (a, b) {
      var dateA = new Date(a.createdAt || a.startedAt || a.timestamp || 0).getTime();
      var dateB = new Date(b.createdAt || b.startedAt || b.timestamp || 0).getTime();
      return dateB - dateA;
    });
  }, [callsQuery.data]);

  // ─── Apply filter ─────────────────────────────────────────────
  var filteredCalls = useMemo(function () {
    if (filter === 'all') return allCalls;
    if (filter === 'missed') {
      return allCalls.filter(function (c) {
        return getCallStatus(c) === 'missed';
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

  // ─── Group by date section ────────────────────────────────────
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

  // ─── Handle callback ─────────────────────────────────────────
  var handleCallBack = useCallback(function (call) {
    var callType = call.callType || call.type || 'audio';
    var isVideo = callType === 'video';
    var conversationId = call.conversationId || call.conversation;
    var name = getCallerName(call);

    navigation.navigate(isVideo ? 'VideoCall' : 'VoiceCall', {
      conversationId: conversationId,
      title: name,
    });
  }, [navigation]);

  // ─── Render filter tabs ───────────────────────────────────────
  var renderFilterTabs = function () {
    var tabs = [
      { key: 'all', label: 'All' },
      { key: 'missed', label: 'Missed' },
      { key: 'voice', label: 'Voice' },
      { key: 'video', label: 'Video' },
    ];

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
          tab.key === 'missed' && allCalls.filter(function (c) { return getCallStatus(c) === 'missed'; }).length > 0
            ? React.createElement(
                View,
                { style: styles.missedBadge },
                React.createElement(
                  Text,
                  { style: styles.missedBadgeText },
                  String(allCalls.filter(function (c) { return getCallStatus(c) === 'missed'; }).length)
                )
              )
            : null
        );
      })
    );
  };

  // ─── Render call item or section header ───────────────────────
  var renderItem = useCallback(function (info) {
    var item = info.item;

    // Section header
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

    // Call entry
    var call = item.data;
    var name = getCallerName(call);
    var callType = call.callType || call.type || 'audio';
    var isVideo = callType === 'video';
    var status = getCallStatus(call);
    var isMissed = status === 'missed';
    var dateStr = call.createdAt || call.startedAt || call.timestamp;
    var duration = call.duration || call.durationSeconds || 0;

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
        accessibilityLabel: name + ', ' + (isVideo ? 'video' : 'voice') + ' call, ' + (isMissed ? 'missed' : status) + (!isMissed && duration > 0 ? ', ' + formatDuration(duration) : '') + ', ' + formatTimestamp(dateStr),
      },
      // Avatar
      React.createElement(
        View,
        { style: styles.avatarWrap },
        React.createElement(Avatar, {
          name: name,
          src: call.callerAvatar || call.calleeAvatar || call.otherUserAvatar || call.avatar,
          size: 48,
          color: avatarColor(name),
        })
      ),

      // Call info
      React.createElement(
        View,
        { style: styles.callInfo },
        // Name + call type icon
        React.createElement(
          View,
          { style: styles.callTopRow },
          React.createElement(
            Text,
            {
              style: [styles.callName, isMissed && styles.callNameMissed],
              numberOfLines: 1,
            },
            name
          ),
          React.createElement(
            View,
            { style: [styles.callTypeBadge, isVideo ? styles.callTypeBadgeVideo : null] },
            React.createElement(Icon, {
              name: isVideo ? 'video' : 'phone',
              size: 10,
              color: isVideo ? COLORS.blue : COLORS.textSecondary,
            })
          )
        ),
        // Status, duration, time
        React.createElement(
          View,
          { style: styles.callBottomRow },
          React.createElement(Icon, {
            name: getCallStatusIcon(status),
            size: 13,
            color: getCallStatusColor(status),
            style: { marginRight: 4 },
          }),
          React.createElement(
            Text,
            { style: [styles.callStatusText, isMissed && styles.callStatusTextMissed] },
            isMissed
              ? 'Missed'
              : status === 'incoming'
                ? 'Incoming'
                : 'Outgoing'
          ),
          !isMissed && duration > 0
            ? React.createElement(
                Text,
                { style: styles.callDuration },
                ' \u00B7 ' + formatDuration(duration)
              )
            : null
        )
      ),

      // Timestamp + call back button
      React.createElement(
        View,
        { style: styles.callRight },
        React.createElement(
          Text,
          { style: [styles.callTime, isMissed && styles.callTimeMissed] },
          formatTimestamp(dateStr)
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
            accessibilityLabel: 'Call back ' + name + ' with ' + (isVideo ? 'video' : 'voice'),
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

  // ─── Empty component ──────────────────────────────────────────
  var renderEmpty = function () {
    if (callsQuery.isLoading) return null;
    return React.createElement(
      View,
      { style: styles.emptyWrap },
      React.createElement(Icon, { name: 'phone-off', size: 48, color: COLORS.textMuted }),
      React.createElement(
        Text,
        { style: styles.emptyTitle },
        filter === 'missed'
          ? 'No missed calls'
          : filter === 'voice'
            ? 'No voice calls'
            : filter === 'video'
              ? 'No video calls'
              : 'No call history'
      ),
      React.createElement(
        Text,
        { style: styles.emptySubtitle },
        'Your call history will appear here'
      )
    );
  };

  // ─── Stats summary ────────────────────────────────────────────
  var renderStats = function () {
    if (allCalls.length === 0) return null;

    var totalDuration = 0;
    var missedCount = 0;
    for (var i = 0; i < allCalls.length; i++) {
      totalDuration += allCalls[i].duration || allCalls[i].durationSeconds || 0;
      if (getCallStatus(allCalls[i]) === 'missed') missedCount++;
    }

    return React.createElement(
      View,
      { style: styles.statsRow },
      React.createElement(
        View,
        { style: styles.statCard },
        React.createElement(
          Text,
          { style: styles.statValue },
          String(allCalls.length)
        ),
        React.createElement(
          Text,
          { style: styles.statLabel },
          'Total Calls'
        )
      ),
      React.createElement(
        View,
        { style: styles.statCard },
        React.createElement(
          Text,
          { style: styles.statValue },
          formatDuration(totalDuration)
        ),
        React.createElement(
          Text,
          { style: styles.statLabel },
          'Talk Time'
        )
      ),
      React.createElement(
        View,
        { style: [styles.statCard, missedCount > 0 && styles.statCardMissed] },
        React.createElement(
          Text,
          { style: [styles.statValue, missedCount > 0 && { color: COLORS.red }] },
          String(missedCount)
        ),
        React.createElement(
          Text,
          { style: styles.statLabel },
          'Missed'
        )
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

    // Stats
    renderStats(),

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

  // ─── Stats ────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statCardMissed: {
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
