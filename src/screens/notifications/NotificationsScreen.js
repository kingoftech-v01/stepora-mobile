/**
 * NotificationsScreen — Notification center for React Native.
 * Converted from NotificationsMobile.jsx (web app).
 * Features: filter tabs, date sections, dismiss on tap, mark all read,
 * type-colored icons, pull-to-refresh, infinite scroll.
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useMutation, useQueryClient, useInfiniteQuery } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { NOTIFICATIONS } = require('../../services/endpoints');
var { BRAND } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var PillTabs = require('../../components/PillTabs');
var { ScreenHeader, BackButton, HeaderIconButton } = require('../../components/ScreenHeader');

// ─── Constants ──────────────────────────────────────────────────

var TYPE_COLORS = {
  dream_progress: '#8B5CF6',
  friend_request: '#14B8A6',
  achievement: '#FCD34D',
  buddy: '#10B981',
  reminder: '#3B82F6',
  social: '#EC4899',
  system: '#6366F1',
  weekly_report: '#A855F7',
};

var TYPE_EMOJIS = {
  dream_progress: '\uD83C\uDFAF',
  friend_request: '\uD83D\uDC65',
  achievement: '\u2B50',
  buddy: '\uD83D\uDCAC',
  reminder: '\u23F0',
  social: '\uD83D\uDC65',
  system: '\u26A1',
  weekly_report: '\uD83D\uDCCA',
};

var FILTER_TABS = [
  { id: 'all', labelKey: 'All', types: undefined },
  { id: 'dreams', labelKey: 'Dreams', types: ['dream_progress', 'reminder'] },
  { id: 'social', labelKey: 'Social', types: ['friend_request', 'buddy', 'social'] },
  { id: 'system', labelKey: 'System', types: ['system', 'achievement', 'weekly_report'] },
];

var EMPTY_STATES = {
  all: { emoji: '\uD83D\uDD14', title: 'All caught up!', message: 'No new notifications', color: '#8B5CF6' },
  dreams: { emoji: '\uD83C\uDFAF', title: 'No dream updates', message: 'Dream progress and reminders will appear here.', color: '#8B5CF6' },
  social: { emoji: '\uD83D\uDC65', title: 'No social activity', message: 'Friend requests and buddy updates will show here.', color: '#14B8A6' },
  system: { emoji: '\u26A1', title: 'No system notifications', message: 'Achievements and system updates will appear here.', color: '#6366F1' },
};

// ─── Helpers ────────────────────────────────────────────────────

function relativeTime(dateStr) {
  if (!dateStr) return '';
  var now = Date.now();
  var then = new Date(dateStr).getTime();
  var diffMs = now - then;
  if (diffMs < 0) return 'just now';
  var mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  var days = Math.floor(hours / 24);
  if (days < 30) return days + 'd ago';
  var months = Math.floor(days / 30);
  return months + 'mo ago';
}

function timeCategory(dateStr) {
  if (!dateStr) return 'earlier';
  var now = Date.now();
  var then = new Date(dateStr).getTime();
  var hours = Math.floor((now - then) / 3600000);
  if (hours < 24) return 'today';
  var days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days <= 6) return 'thisWeek';
  return 'earlier';
}

var DATE_SECTIONS = [
  { label: 'Today', category: 'today' },
  { label: 'Yesterday', category: 'yesterday' },
  { label: 'This Week', category: 'thisWeek' },
  { label: 'Earlier', category: 'earlier' },
];

// ─── Screen ─────────────────────────────────────────────────────

var NotificationsScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var [activeFilter, setActiveFilter] = useState('all');
  var [dismissed, setDismissed] = useState({});
  var [refreshing, setRefreshing] = useState(false);

  // ─── Query ──────────────────────────────────────────────────

  var notifsQuery = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: function (ctx) {
      var page = ctx.pageParam || 1;
      return apiGet(NOTIFICATIONS.LIST + '?page=' + page);
    },
    getNextPageParam: function (lastPage) {
      return lastPage && lastPage.next ? (lastPage.page || 1) + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten
  var allNotifications = [];
  if (notifsQuery.data && notifsQuery.data.pages) {
    notifsQuery.data.pages.forEach(function (page) {
      var items = (page && page.results) || (Array.isArray(page) ? page : []);
      allNotifications = allNotifications.concat(items);
    });
  }

  var notifications = allNotifications.map(function (n) {
    var dateField = n.createdAt;
    return {
      id: n.id,
      type: n.notificationType || n.type || 'system',
      title: n.title || '',
      message: n.body || n.message || '',
      read: n.isRead != null ? n.isRead : n.read != null ? n.read : n.readAt != null,
      time: relativeTime(dateField),
      category: timeCategory(dateField),
      data: n.data,
    };
  });

  // ─── Mutations ──────────────────────────────────────────────

  var markAllReadMut = useMutation({
    mutationFn: function () {
      return apiPost(NOTIFICATIONS.MARK_ALL_READ);
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread'] });
    },
  });

  var markReadMut = useMutation({
    mutationFn: function (id) {
      return apiPost(NOTIFICATIONS.MARK_READ(id));
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread'] });
    },
  });

  // ─── Handlers ───────────────────────────────────────────────

  var handleDismiss = function (id) {
    markReadMut.mutate(id);
    setDismissed(function (prev) {
      var next = Object.assign({}, prev);
      next[id] = true;
      return next;
    });
  };

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    notifsQuery.refetch().finally(function () {
      setRefreshing(false);
    });
  }, []);

  // ─── Filtering ──────────────────────────────────────────────

  var filteredNotifications = notifications.filter(function (n) {
    if (dismissed[n.id]) return false;
    if (activeFilter === 'all') return true;
    var tab = FILTER_TABS.find(function (t) {
      return t.id === activeFilter;
    });
    return tab && tab.types && tab.types.indexOf(n.type) !== -1;
  });

  var unreadCount = notifications.filter(function (n) {
    return !n.read && !dismissed[n.id];
  }).length;

  var tabCounts = {};
  FILTER_TABS.forEach(function (tab) {
    tabCounts[tab.id] = notifications.filter(function (n) {
      if (dismissed[n.id]) return false;
      if (n.read) return false;
      if (tab.id === 'all') return true;
      return tab.types && tab.types.indexOf(n.type) !== -1;
    }).length;
  });

  // Group into date sections
  var sections = [];
  DATE_SECTIONS.forEach(function (section) {
    var items = filteredNotifications.filter(function (n) {
      return n.category === section.category;
    });
    if (items.length > 0) {
      sections.push({ label: section.label, items: items });
    }
  });

  // ─── Render helpers ─────────────────────────────────────────

  var renderNotification = function (notification) {
    var typeColor = TYPE_COLORS[notification.type] || '#8B5CF6';
    var typeEmoji = TYPE_EMOJIS[notification.type] || '\uD83D\uDD14';
    var isUnread = !notification.read;

    return React.createElement(
      TouchableOpacity,
      {
        key: notification.id,
        style: [
          styles.notifCard,
          {
            backgroundColor: isUnread ? theme.glassBg : theme.surfaceHover,
            borderColor: isUnread ? typeColor + '30' : theme.glassBorder,
            opacity: isUnread ? 1 : 0.55,
          },
        ],
        activeOpacity: 0.7,
        onPress: function () {
          handleDismiss(notification.id);
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: (isUnread ? 'Unread: ' : '') + notification.title + '. ' + notification.message + '. ' + notification.time,
        accessibilityHint: 'Dismiss notification',
      },
      // Unread indicator
      isUnread
        ? React.createElement(View, {
            style: [styles.unreadBar, { backgroundColor: typeColor }],
          })
        : null,
      // Icon
      React.createElement(
        View,
        {
          style: [
            styles.notifIcon,
            {
              backgroundColor: isUnread ? typeColor + '20' : typeColor + '10',
              borderColor: typeColor + (isUnread ? '35' : '18'),
            },
          ],
        },
        React.createElement(
          Text,
          { style: { fontSize: 20 } },
          typeEmoji,
        ),
      ),
      // Content
      React.createElement(
        View,
        { style: { flex: 1, marginLeft: 12 } },
        React.createElement(
          Text,
          {
            style: [
              styles.notifTitle,
              {
                fontWeight: isUnread ? FONT_WEIGHTS.bold : FONT_WEIGHTS.medium,
                color: isUnread ? theme.text : theme.textSecondary,
              },
            ],
            numberOfLines: 1,
          },
          notification.title,
        ),
        React.createElement(
          Text,
          { style: styles.notifMessage, numberOfLines: 2 },
          notification.message,
        ),
        React.createElement(
          View,
          { style: styles.notifTimeRow },
          React.createElement(
            Text,
            { style: styles.notifTime },
            notification.time,
          ),
          isUnread
            ? React.createElement(View, {
                style: [styles.unreadDot, { backgroundColor: typeColor }],
              })
            : null,
        ),
      ),
    );
  };

  // ─── Render ─────────────────────────────────────────────────

  var FeatherIcon;
  try {
    FeatherIcon = require('react-native-vector-icons/Feather');
  } catch (e) {
    FeatherIcon = null;
  }

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(ScreenHeader, {
      title: 'Notifications',
      left: React.createElement(BackButton, {
        onPress: function () {
          navigation.goBack();
        },
      }),
      right: unreadCount > 0
        ? React.createElement(
            HeaderIconButton,
            {
              onPress: function () {
                markAllReadMut.mutate();
              },
              label: 'Mark all read',
            },
            FeatherIcon
              ? React.createElement(FeatherIcon, {
                  name: 'check-circle',
                  size: 20,
                  color: theme.text,
                })
              : React.createElement(Text, { style: { color: theme.text, fontSize: 14 } }, '\u2713\u2713'),
          )
        : null,
    }),

    React.createElement(
      ScrollView,
      {
        style: styles.scroll,
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        refreshControl: React.createElement(RefreshControl, {
          refreshing: refreshing,
          onRefresh: onRefresh,
          tintColor: BRAND.purple,
        }),
      },

      // Filter tabs
      React.createElement(
        View,
        { style: { marginBottom: SPACING.xl } },
        React.createElement(PillTabs, {
          tabs: FILTER_TABS.map(function (tab) {
            var c = tabCounts[tab.id] || 0;
            return { key: tab.id, label: tab.labelKey, count: c > 0 ? c : undefined };
          }),
          active: activeFilter,
          onChange: setActiveFilter,
          scrollable: false,
        }),
      ),

      // Loading
      notifsQuery.isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap },
            React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple }),
          )
        : null,

      // Sections
      !notifsQuery.isLoading && sections.length > 0
        ? sections.map(function (section) {
            return React.createElement(
              View,
              { key: section.label, style: { marginBottom: SPACING.xxl } },
              // Section header
              React.createElement(
                View,
                { style: styles.sectionHeader },
                React.createElement(
                  Text,
                  { style: styles.sectionLabel, accessibilityRole: 'header' },
                  section.label,
                ),
                React.createElement(View, { style: styles.sectionLine }),
                React.createElement(
                  Text,
                  { style: styles.sectionCount },
                  String(section.items.length),
                ),
              ),
              // Notification items
              section.items.map(renderNotification),
            );
          })
        : null,

      // Loading more
      notifsQuery.isFetchingNextPage
        ? React.createElement(
            View,
            { style: { padding: SPACING.lg, alignItems: 'center' } },
            React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purple }),
          )
        : null,

      // Empty state
      !notifsQuery.isLoading && sections.length === 0
        ? (function () {
            var emptyConfig = EMPTY_STATES[activeFilter] || EMPTY_STATES.all;
            return React.createElement(
              View,
              { style: styles.emptyWrap },
              React.createElement(
                View,
                {
                  style: [
                    styles.emptyIconWrap,
                    {
                      backgroundColor: emptyConfig.color + '12',
                      borderColor: emptyConfig.color + '20',
                    },
                  ],
                },
                React.createElement(
                  Text,
                  { style: { fontSize: 38 } },
                  emptyConfig.emoji,
                ),
              ),
              React.createElement(
                Text,
                { style: styles.emptyTitle },
                emptyConfig.title,
              ),
              React.createElement(
                Text,
                { style: styles.emptyDesc },
                emptyConfig.message,
              ),
            );
          })()
        : null,

      React.createElement(View, { style: { height: 40 } }),
    ),
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.sm - 1,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.divider,
  },
  sectionCount: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: theme.textMuted,
    opacity: 0.6,
  },
  notifCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  notifTitle: {
    fontSize: FONT_SIZES.md,
    marginBottom: 3,
  },
  notifMessage: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  notifTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  notifTime: {
    fontSize: FONT_SIZES.xs,
    color: theme.textMuted,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingWrap: {
    padding: 60,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.textSecondary,
    marginBottom: 8,
    lineHeight: 22,
  },
  emptyDesc: {
    fontSize: FONT_SIZES.md,
    color: theme.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
});

module.exports = NotificationsScreen;
