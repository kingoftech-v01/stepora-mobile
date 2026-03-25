/**
 * GroupLeaderboardScreen — Leaderboard within a group/circle.
 * Features: podium top 3, FlatList for remaining, time filter,
 * highlight current user, group name in header.
 * Receives `circleId` or `groupId` via route params.
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet } = require('../../services/api');
var { LEAGUES, CIRCLES } = require('../../services/endpoints');
var { BRAND } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var PillTabs = require('../../components/PillTabs');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, CONTACT_COLORS } = require('../../theme/tokens');

var TIME_FILTERS = [
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'alltime', label: 'All Time' },
];

var MEDAL_COLORS = {
  1: { bg: '#FCD34D', text: '#92400E' },
  2: { bg: '#C0C0C0', text: '#374151' },
  3: { bg: '#CD7F32', text: '#451A03' },
};

var getAvatarColor = function (name) {
  if (!name) return CONTACT_COLORS[0];
  var hash = 0;
  for (var i = 0; i < name.length; i++) hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
};

// ─── Screen ─────────────────────────────────────────────────────

var GroupLeaderboardScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var params = route.params || {};
  var circleId = params.circleId || null;
  var groupId = params.groupId || null;
  var groupName = params.groupName || params.circleName || 'Group';
  var entityId = circleId || groupId;

  var [timeFilter, setTimeFilter] = useState('weekly');
  var [refreshing, setRefreshing] = useState(false);

  // ─── Queries ────────────────────────────────────────────────

  // Fetch group/circle details for name
  var detailQuery = useQuery({
    queryKey: ['group-detail', entityId],
    queryFn: function () {
      if (circleId) return apiGet(CIRCLES.DETAIL(circleId));
      if (groupId) return apiGet(LEAGUES.GROUPS.DETAIL(groupId));
      return null;
    },
    enabled: !!entityId,
  });

  // Fetch leaderboard
  var leaderboardQuery = useQuery({
    queryKey: ['group-leaderboard', entityId, timeFilter],
    queryFn: function () {
      var url;
      if (groupId) {
        url = LEAGUES.GROUPS.LEADERBOARD(groupId) + '?period=' + timeFilter;
      } else if (circleId) {
        // Use circles challenges leaderboard or fall back to group leaderboard endpoint
        url = LEAGUES.LEADERBOARD.GROUP + '?group_id=' + circleId + '&period=' + timeFilter;
      } else {
        url = LEAGUES.LEADERBOARD.GROUP + '?period=' + timeFilter;
      }
      return apiGet(url);
    },
    enabled: !!entityId,
  });

  var detail = detailQuery.data || {};
  var resolvedName = detail.name || detail.title || groupName;

  var entries = (function () {
    var data = leaderboardQuery.data;
    if (!data) return [];
    var list = Array.isArray(data) ? data : (data.results || []);
    return list.map(function (entry, i) {
      var name = entry.userDisplayName || entry.displayName || entry.name || entry.username || 'User';
      return {
        id: entry.id || entry.userId || i,
        name: name,
        initial: name[0] ? name[0].toUpperCase() : '?',
        rank: entry.rank || i + 1,
        xp: entry.xp || entry.points || entry.score || 0,
        level: entry.userLevel || entry.level || 1,
        streak: entry.streak || 0,
        isUser: entry.isCurrentUser || entry.isMe || false,
        avatar: entry.avatar || entry.avatarUrl || null,
      };
    });
  })();

  var top3 = entries.slice(0, 3);
  var rest = entries.slice(3);

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    Promise.all([
      detailQuery.refetch(),
      leaderboardQuery.refetch(),
    ]).finally(function () {
      setRefreshing(false);
    });
  }, []);

  // ─── Podium ─────────────────────────────────────────────────

  var renderPodium = function () {
    if (top3.length < 3) {
      // Still render with available entries
      if (top3.length === 0) return null;
    }

    var podiumOrder = top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3;
    var heights = top3.length >= 3
      ? [90, 120, 70]
      : top3.map(function (_, i) { return 120 - (i * 25); });

    return React.createElement(
      View,
      { style: styles.podiumWrap },
      podiumOrder.map(function (entry, idx) {
        if (!entry) return React.createElement(View, { key: idx, style: { flex: 1 } });
        var rank = entry.rank;
        var medal = MEDAL_COLORS[rank];

        return React.createElement(
          View,
          { key: entry.id || idx, style: styles.podiumItem },
          rank === 1
            ? React.createElement(Icon, { name: 'award', size: 20, color: '#FCD34D', style: { marginBottom: 4 } })
            : null,
          React.createElement(Avatar, {
            name: entry.name,
            src: entry.avatar,
            size: rank === 1 ? 56 : 44,
            color: getAvatarColor(entry.name),
          }),
          React.createElement(
            Text,
            { style: styles.podiumName, numberOfLines: 1 },
            entry.name.split(' ')[0],
          ),
          React.createElement(
            Text,
            { style: styles.podiumXP },
            entry.xp.toLocaleString() + ' XP',
          ),
          React.createElement(
            View,
            {
              style: [
                styles.podiumBar,
                {
                  height: heights[idx],
                  backgroundColor: medal ? medal.bg + '30' : COLORS.glassBg,
                },
              ],
            },
            React.createElement(
              View,
              { style: [styles.rankBadge, medal ? { backgroundColor: medal.bg } : null] },
              React.createElement(
                Text,
                { style: [styles.rankBadgeText, medal ? { color: medal.text } : null] },
                String(rank),
              ),
            ),
          ),
        );
      }),
    );
  };

  // ─── Entry row ──────────────────────────────────────────────

  var renderEntry = useCallback(function (info) {
    var entry = info.item;

    return React.createElement(
      View,
      { style: [styles.entryRow, entry.isUser && styles.entryRowHighlight] },
      React.createElement(
        Text,
        { style: styles.entryRank },
        String(entry.rank),
      ),
      React.createElement(Avatar, {
        name: entry.name,
        src: entry.avatar,
        size: 38,
        color: getAvatarColor(entry.name),
        style: { marginHorizontal: 10 },
      }),
      React.createElement(
        View,
        { style: { flex: 1 } },
        React.createElement(
          Text,
          { style: [styles.entryName, entry.isUser && { color: BRAND.purple }], numberOfLines: 1 },
          entry.name + (entry.isUser ? ' (you)' : ''),
        ),
        React.createElement(
          Text,
          { style: styles.entryMeta },
          'Lvl ' + entry.level + (entry.streak > 0 ? ' \u00B7 ' + entry.streak + ' day streak' : ''),
        ),
      ),
      React.createElement(
        Text,
        { style: styles.entryXP },
        entry.xp.toLocaleString() + ' XP',
      ),
    );
  }, []);

  var keyExtractor = useCallback(function (item) {
    return String(item.id || item.rank);
  }, []);

  // ─── Find current user position ─────────────────────────────

  var currentUserEntry = entries.find(function (e) { return e.isUser; });

  // ─── Render ─────────────────────────────────────────────────

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(ScreenHeader, {
      title: resolvedName,
      left: React.createElement(BackButton, {
        onPress: function () { navigation.goBack(); },
      }),
      right: React.createElement(
        View,
        { style: styles.headerBadge },
        React.createElement(Icon, { name: 'users', size: 14, color: BRAND.purple }),
        React.createElement(
          Text,
          { style: styles.headerBadgeText },
          String(entries.length),
        ),
      ),
    }),

    // Time filters
    React.createElement(
      View,
      { style: styles.filterRow },
      React.createElement(PillTabs, {
        tabs: TIME_FILTERS,
        active: timeFilter,
        onChange: setTimeFilter,
        scrollable: true,
      }),
    ),

    // Content
    leaderboardQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple }),
        )
      : !entityId
        ? React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Icon, { name: 'alert-circle', size: 32, color: COLORS.textMuted }),
            React.createElement(Text, { style: styles.emptyTitle }, 'No group selected'),
            React.createElement(Text, { style: styles.emptyDesc }, 'Navigate here from a group or circle.'),
          )
        : entries.length === 0
          ? React.createElement(
              View,
              { style: styles.emptyWrap },
              React.createElement(Icon, { name: 'bar-chart-2', size: 32, color: COLORS.textMuted }),
              React.createElement(Text, { style: styles.emptyTitle }, 'No leaderboard data'),
              React.createElement(Text, { style: styles.emptyDesc }, 'Activity will appear here as members earn XP.'),
            )
          : React.createElement(FlatList, {
              data: rest,
              renderItem: renderEntry,
              keyExtractor: keyExtractor,
              contentContainerStyle: { paddingBottom: 100 },
              ListHeaderComponent: React.createElement(
                View,
                null,
                renderPodium(),
                // Current user position banner (if not in top list)
                currentUserEntry && currentUserEntry.rank > 10
                  ? React.createElement(
                      GlassCard,
                      {
                        padding: 12,
                        mb: 10,
                        style: {
                          marginHorizontal: SPACING.lg,
                          backgroundColor: 'rgba(139,92,246,0.06)',
                          borderColor: 'rgba(139,92,246,0.15)',
                        },
                      },
                      React.createElement(
                        View,
                        { style: { flexDirection: 'row', alignItems: 'center' } },
                        React.createElement(Icon, { name: 'map-pin', size: 14, color: BRAND.purple }),
                        React.createElement(
                          Text,
                          { style: styles.myRankBanner },
                          ' Your rank: #' + currentUserEntry.rank + ' with ' + currentUserEntry.xp.toLocaleString() + ' XP',
                        ),
                      ),
                    )
                  : null,
              ),
              showsVerticalScrollIndicator: false,
              refreshControl: React.createElement(RefreshControl, {
                refreshing: refreshing,
                onRefresh: onRefresh,
                tintColor: BRAND.purple,
              }),
            }),
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.textTertiary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: { fontSize: 13, color: theme.textMuted, textAlign: 'center' },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.semibold,
    color: BRAND.purple,
  },

  filterRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  // Podium
  podiumWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 20,
    marginBottom: 10,
  },
  podiumItem: { flex: 1, alignItems: 'center' },
  podiumName: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    marginTop: 6,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumXP: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  podiumBar: {
    width: '80%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    paddingTop: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.text,
  },

  // Entry rows
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  entryRowHighlight: {
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  entryRank: {
    width: 28,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.textMuted,
    textAlign: 'center',
  },
  entryName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  entryMeta: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  entryXP: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.bold,
    color: BRAND.purple,
  },

  myRankBanner: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.semibold,
    color: BRAND.purple,
  },
});

module.exports = GroupLeaderboardScreen;
