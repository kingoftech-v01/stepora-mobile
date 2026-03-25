/**
 * LeaderboardScreen — XP leaderboards with scope/time filters.
 * Adapted from LeaderboardMobile.jsx + useLeaderboardScreen.js
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet } = require('../../services/api');
var { LEAGUES } = require('../../services/endpoints');
var useInfiniteList = require('../../hooks/useInfiniteList');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var TIME_FILTERS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'alltime', label: 'All Time' },
];

var SCOPE_FILTERS = [
  { id: 'global', label: 'Global', icon: 'globe' },
  { id: 'friends', label: 'Friends', icon: 'users' },
  { id: 'league', label: 'League', icon: 'shield' },
  { id: 'nearby', label: 'Nearby', icon: 'map-pin' },
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

var LeaderboardScreen = function () {
  var navigation = useNavigation();
  var [timeFilter, setTimeFilter] = useState('weekly');
  var [scopeFilter, setScopeFilter] = useState('global');
  var headerRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('LeaderboardScreen');

  var SCOPE_URLS = {
    global: LEAGUES.LEADERBOARD.GLOBAL,
    friends: LEAGUES.LEADERBOARD.FRIENDS,
    league: LEAGUES.LEADERBOARD.LEAGUE,
    nearby: LEAGUES.LEADERBOARD.NEARBY,
  };

  var lbInf = useInfiniteList({
    queryKey: ['leaderboard', scopeFilter, timeFilter],
    url: (SCOPE_URLS[scopeFilter] || LEAGUES.LEADERBOARD.GLOBAL) + '?period=' + timeFilter,
    limit: 50,
  });

  var myRankQuery = useQuery({
    queryKey: ['leaderboard-me', timeFilter],
    queryFn: function () {
      return apiGet(LEAGUES.LEADERBOARD.ME + '?period=' + timeFilter);
    },
  });

  var entries = lbInf.items.map(function (entry, i) {
    if (!entry) return null;
    var name = entry.userDisplayName || entry.user_display_name || entry.name || entry.displayName || 'User';
    return Object.assign({}, entry, {
      name: name,
      initial: name[0].toUpperCase(),
      rank: entry.rank || i + 1,
      xp: entry.xp || 0,
      level: entry.userLevel || entry.level || 1,
      streak: entry.streak || 0,
      isUser: entry.isCurrentUser || false,
    });
  }).filter(Boolean);

  var top3 = entries.slice(0, 3);
  var rest = entries.slice(3);

  var renderPodium = function () {
    if (top3.length < 3) return null;
    var podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
    var heights = [90, 120, 70];

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
            { style: [styles.podiumBar, { height: heights[idx], backgroundColor: medal ? medal.bg + '30' : COLORS.glassBg }] },
            React.createElement(
              View,
              {
                style: [
                  styles.rankBadge,
                  medal ? { backgroundColor: medal.bg } : null,
                ],
              },
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

  var renderEntry = useCallback(function (info) {
    var entry = info.item;
    return React.createElement(
      View,
      {
        style: [styles.entryRow, entry.isUser && styles.entryRowHighlight],
      },
      React.createElement(
        Text,
        { style: styles.entryRank },
        String(entry.rank),
      ),
      React.createElement(Avatar, {
        name: entry.name,
        size: 38,
        color: getAvatarColor(entry.name),
        style: { marginHorizontal: 10 },
      }),
      React.createElement(
        View,
        { style: { flex: 1 } },
        React.createElement(
          Text,
          { style: [styles.entryName, entry.isUser && { color: COLORS.purple }], numberOfLines: 1 },
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

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(View, { ref: headerRef },
      React.createElement(GlassHeader, {
        title: 'Leaderboard',
        onBack: function () { navigation.goBack(); },
      })
    ),

    // Scope filters
    React.createElement(
      ScrollView,
      {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
      },
      SCOPE_FILTERS.map(function (scope) {
        var isActive = scopeFilter === scope.id;
        return React.createElement(
          TouchableOpacity,
          {
            key: scope.id,
            style: [styles.scopePill, isActive && styles.scopePillActive],
            onPress: function () { setScopeFilter(scope.id); },
            accessible: true, accessibilityRole: 'tab', accessibilityLabel: scope.label + ' leaderboard', accessibilityState: { selected: isActive },
          },
          React.createElement(Icon, {
            name: scope.icon,
            size: 14,
            color: isActive ? COLORS.purple : COLORS.textMuted,
            style: { marginRight: 5 },
          }),
          React.createElement(
            Text,
            { style: [styles.scopeText, isActive && styles.scopeTextActive] },
            scope.label,
          ),
        );
      }),
    ),

    // Time filters
    React.createElement(
      View,
      { style: styles.timeRow },
      TIME_FILTERS.map(function (tf) {
        var isActive = timeFilter === tf.id;
        return React.createElement(
          TouchableOpacity,
          {
            key: tf.id,
            style: [styles.timePill, isActive && styles.timePillActive],
            onPress: function () { setTimeFilter(tf.id); },
            accessible: true, accessibilityRole: 'tab', accessibilityLabel: tf.label, accessibilityState: { selected: isActive },
          },
          React.createElement(
            Text,
            { style: [styles.timeText, isActive && styles.timeTextActive] },
            tf.label,
          ),
        );
      }),
    ),

    // Content
    lbInf.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
        )
      : React.createElement(FlatList, {
          data: rest,
          renderItem: renderEntry,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100 },
          ListHeaderComponent: renderPodium,
          showsVerticalScrollIndicator: false,
          onEndReached: function () {
            if (lbInf.hasNextPage) lbInf.fetchNextPage();
          },
          onEndReachedThreshold: 0.3,
        }),
    tooltipCfg
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg.id,
          message: tooltipCfg.message,
          position: tooltipCfg.position,
          targetRef: headerRef,
        })
      : null,
  );
};

var styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.glassBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
  },
  scopePillActive: {
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  scopeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  scopeTextActive: {
    color: COLORS.purple,
  },
  timeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  timePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.glassBg,
    marginRight: 8,
  },
  timePillActive: {
    backgroundColor: COLORS.purple,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  timeTextActive: {
    color: '#FFFFFF',
  },
  podiumWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 20,
    marginBottom: 10,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 6,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumXP: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
    color: COLORS.text,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  entryRowHighlight: {
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  entryRank: {
    width: 28,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  entryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  entryMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  entryXP: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.purple,
  },
});

module.exports = LeaderboardScreen;
