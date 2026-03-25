/**
 * SeasonDetailScreen — Seasonal event/competition detail.
 * Features: season banner, countdown timer, challenges, leaderboard,
 * rewards preview, season pass progress bar.
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
var {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet } = require('../../services/api');
var { LEAGUES } = require('../../services/endpoints');
var { BRAND } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS, SHADOWS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var GlassButton = require('../../components/GlassButton');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, CONTACT_COLORS } = require('../../theme/tokens');

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

// ─── Countdown hook ─────────────────────────────────────────────

var useCountdown = function (endDate) {
  var [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(function () {
    if (!endDate) return;

    var calculate = function () {
      var now = new Date().getTime();
      var end = new Date(endDate).getTime();
      var diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };

    calculate();
    var interval = setInterval(calculate, 1000);
    return function () { clearInterval(interval); };
  }, [endDate]);

  return timeLeft;
};

// ─── Screen ─────────────────────────────────────────────────────

var SeasonDetailScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var seasonId = route.params && route.params.seasonId;
  var [refreshing, setRefreshing] = useState(false);

  // ─── Queries ────────────────────────────────────────────────

  var seasonQuery = useQuery({
    queryKey: ['season-detail', seasonId],
    queryFn: function () {
      if (seasonId) return apiGet(LEAGUES.SEASONS.DETAIL(seasonId));
      return apiGet(LEAGUES.SEASONS.CURRENT);
    },
  });

  var leaderboardQuery = useQuery({
    queryKey: ['season-leaderboard', seasonId],
    queryFn: function () {
      if (seasonId) return apiGet(LEAGUES.LEAGUE_SEASONS.LEADERBOARD(seasonId));
      return apiGet(LEAGUES.LEAGUE_SEASONS.CURRENT).then(function (current) {
        if (current && current.id) return apiGet(LEAGUES.LEAGUE_SEASONS.LEADERBOARD(current.id));
        return [];
      });
    },
    enabled: true,
  });

  var rewardsQuery = useQuery({
    queryKey: ['season-rewards'],
    queryFn: function () {
      return apiGet(LEAGUES.SEASONS.MY_REWARDS);
    },
  });

  var season = seasonQuery.data || {};
  var seasonName = season.name || season.title || 'Current Season';
  var seasonTheme = season.theme || season.description || '';
  var startDate = season.startDate || season.start || '';
  var endDate = season.endDate || season.end || '';
  var bannerEmoji = season.emoji || season.icon || '\uD83C\uDFC6';
  var challenges = season.challenges || [];
  var rewards = season.rewards || rewardsQuery.data || [];
  if (!Array.isArray(rewards)) {
    rewards = rewards.results || [];
  }
  if (!Array.isArray(challenges)) {
    challenges = [];
  }

  // Season pass progress
  var passProgress = season.passProgress || season.progress || 0;
  var passLevel = season.passLevel || season.level || 1;
  var passMaxLevel = season.passMaxLevel || season.maxLevel || 30;

  var leaderboardData = (function () {
    var data = leaderboardQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  })();

  var top10 = leaderboardData.slice(0, 10);
  var myPosition = season.myRank || season.userRank || null;

  var countdown = useCountdown(endDate);

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    Promise.all([
      seasonQuery.refetch(),
      leaderboardQuery.refetch(),
      rewardsQuery.refetch(),
    ]).finally(function () {
      setRefreshing(false);
    });
  }, []);

  var isLoading = seasonQuery.isLoading;

  // ─── Countdown renderer ─────────────────────────────────────

  var renderCountdown = function () {
    if (!endDate) return null;

    var units = [
      { value: countdown.days, label: 'DAYS' },
      { value: countdown.hours, label: 'HRS' },
      { value: countdown.minutes, label: 'MIN' },
      { value: countdown.seconds, label: 'SEC' },
    ];

    return React.createElement(
      View,
      { style: styles.countdownRow },
      units.map(function (unit) {
        return React.createElement(
          View,
          { key: unit.label, style: styles.countdownUnit },
          React.createElement(
            View,
            { style: styles.countdownBox },
            React.createElement(
              Text,
              { style: styles.countdownValue },
              String(unit.value).padStart(2, '0'),
            ),
          ),
          React.createElement(
            Text,
            { style: styles.countdownLabel },
            unit.label,
          ),
        );
      }),
    );
  };

  // ─── Render ─────────────────────────────────────────────────

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(ScreenHeader, {
      title: seasonName,
      left: React.createElement(BackButton, {
        onPress: function () { navigation.goBack(); },
      }),
    }),

    isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple }),
        )
      : React.createElement(
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

          // ── Season Banner ──────────────────────────────────
          React.createElement(
            GlassCard,
            {
              padding: 0,
              mb: 16,
              style: {
                backgroundColor: 'rgba(139,92,246,0.08)',
                borderColor: 'rgba(139,92,246,0.2)',
                overflow: 'hidden',
              },
            },
            React.createElement(
              View,
              { style: styles.bannerGradient },
              React.createElement(
                Text,
                { style: styles.bannerEmoji },
                bannerEmoji,
              ),
              React.createElement(
                Text,
                { style: styles.bannerTitle },
                seasonName,
              ),
              seasonTheme
                ? React.createElement(
                    Text,
                    { style: styles.bannerTheme },
                    seasonTheme,
                  )
                : null,
              startDate && endDate
                ? React.createElement(
                    View,
                    { style: styles.bannerDates },
                    React.createElement(Icon, { name: 'calendar', size: 12, color: COLORS.textSecondary }),
                    React.createElement(
                      Text,
                      { style: styles.bannerDateText },
                      new Date(startDate).toLocaleDateString() + ' - ' + new Date(endDate).toLocaleDateString(),
                    ),
                  )
                : null,
            ),
          ),

          // ── Countdown Timer ──────────────────────────────────
          !countdown.expired && endDate
            ? React.createElement(
                GlassCard,
                { padding: 16, mb: 16 },
                React.createElement(
                  Text,
                  { style: styles.sectionTitle },
                  '\u23F3 Season Ends In',
                ),
                renderCountdown(),
              )
            : countdown.expired
              ? React.createElement(
                  GlassCard,
                  {
                    padding: 16,
                    mb: 16,
                    style: { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.15)' },
                  },
                  React.createElement(
                    Text,
                    { style: [styles.sectionTitle, { color: BRAND.redSolid }] },
                    'Season Ended',
                  ),
                )
              : null,

          // ── Season Pass Progress ─────────────────────────────
          React.createElement(
            GlassCard,
            { padding: 16, mb: 16 },
            React.createElement(
              View,
              { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } },
              React.createElement(
                Text,
                { style: styles.sectionTitle },
                '\uD83C\uDFAB Season Pass',
              ),
              React.createElement(
                Text,
                { style: styles.passLevelText },
                'Level ' + passLevel + '/' + passMaxLevel,
              ),
            ),
            React.createElement(
              View,
              { style: styles.progressTrack },
              React.createElement(View, {
                style: [styles.progressBar, { width: Math.min(passProgress, 100) + '%' }],
              }),
            ),
            React.createElement(
              Text,
              { style: styles.progressPercent },
              Math.round(passProgress) + '% complete',
            ),
          ),

          // ── Challenges ──────────────────────────────────────
          challenges.length > 0
            ? React.createElement(
                GlassCard,
                { padding: 16, mb: 16 },
                React.createElement(
                  Text,
                  { style: styles.sectionTitle },
                  '\uD83C\uDFAF Season Challenges (' + challenges.length + ')',
                ),
                challenges.map(function (challenge, idx) {
                  var progress = challenge.progress || challenge.percentComplete || 0;
                  var isComplete = progress >= 100 || challenge.completed;
                  var name = challenge.name || challenge.title || 'Challenge ' + (idx + 1);
                  var desc = challenge.description || '';
                  var xpReward = challenge.xpReward || challenge.reward || 0;

                  return React.createElement(
                    View,
                    { key: challenge.id || idx, style: styles.challengeRow },
                    React.createElement(
                      View,
                      {
                        style: [
                          styles.challengeIcon,
                          isComplete && { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' },
                        ],
                      },
                      React.createElement(
                        Icon,
                        {
                          name: isComplete ? 'check-circle' : 'target',
                          size: 18,
                          color: isComplete ? BRAND.greenSolid : BRAND.purple,
                        },
                      ),
                    ),
                    React.createElement(
                      View,
                      { style: { flex: 1, marginLeft: 12 } },
                      React.createElement(
                        View,
                        { style: { flexDirection: 'row', justifyContent: 'space-between' } },
                        React.createElement(
                          Text,
                          { style: [styles.challengeName, isComplete && { color: BRAND.greenSolid }], numberOfLines: 1 },
                          name,
                        ),
                        xpReward > 0
                          ? React.createElement(
                              Text,
                              { style: styles.challengeXP },
                              '\u26A1 ' + xpReward + ' XP',
                            )
                          : null,
                      ),
                      desc
                        ? React.createElement(
                            Text,
                            { style: styles.challengeDesc, numberOfLines: 2 },
                            desc,
                          )
                        : null,
                      // Progress bar
                      React.createElement(
                        View,
                        { style: styles.challengeProgressTrack },
                        React.createElement(View, {
                          style: [
                            styles.challengeProgressBar,
                            {
                              width: Math.min(progress, 100) + '%',
                              backgroundColor: isComplete ? BRAND.greenSolid : BRAND.purple,
                            },
                          ],
                        }),
                      ),
                      React.createElement(
                        Text,
                        { style: styles.challengeProgressText },
                        Math.round(progress) + '%',
                      ),
                    ),
                  );
                }),
              )
            : null,

          // ── Leaderboard (Top 10) ─────────────────────────────
          React.createElement(
            GlassCard,
            { padding: 16, mb: 16 },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              '\uD83C\uDFC6 Season Leaderboard',
            ),
            leaderboardQuery.isLoading
              ? React.createElement(
                  View,
                  { style: { padding: 24, alignItems: 'center' } },
                  React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purple }),
                )
              : top10.length === 0
                ? React.createElement(
                    Text,
                    { style: { color: theme.textMuted, textAlign: 'center', paddingVertical: 16 } },
                    'No leaderboard data yet.',
                  )
                : top10.map(function (entry, idx) {
                    var rank = entry.rank || idx + 1;
                    var name = entry.userDisplayName || entry.displayName || entry.name || entry.username || 'User';
                    var xp = entry.xp || entry.points || entry.score || 0;
                    var medal = MEDAL_COLORS[rank];
                    var isUser = entry.isCurrentUser || entry.isMe || false;

                    return React.createElement(
                      View,
                      {
                        key: entry.id || idx,
                        style: [styles.lbRow, isUser && styles.lbRowHighlight],
                      },
                      medal
                        ? React.createElement(
                            View,
                            { style: [styles.medalBadge, { backgroundColor: medal.bg }] },
                            React.createElement(
                              Text,
                              { style: { fontSize: 11, fontWeight: '800', color: medal.text } },
                              String(rank),
                            ),
                          )
                        : React.createElement(
                            Text,
                            { style: styles.lbRank },
                            String(rank),
                          ),
                      React.createElement(Avatar, {
                        name: name,
                        size: 32,
                        color: getAvatarColor(name),
                        style: { marginHorizontal: 10 },
                      }),
                      React.createElement(
                        Text,
                        { style: [styles.lbName, isUser && { color: BRAND.purple }], numberOfLines: 1 },
                        name + (isUser ? ' (you)' : ''),
                      ),
                      React.createElement(
                        Text,
                        { style: styles.lbXP },
                        xp.toLocaleString() + ' XP',
                      ),
                    );
                  }),
            // My position
            myPosition && myPosition > 10
              ? React.createElement(
                  View,
                  { style: styles.myPositionRow },
                  React.createElement(
                    Text,
                    { style: styles.myPositionText },
                    'Your rank: #' + myPosition,
                  ),
                )
              : null,
          ),

          // ── Rewards Preview ──────────────────────────────────
          rewards.length > 0
            ? React.createElement(
                GlassCard,
                { padding: 16, mb: 20 },
                React.createElement(
                  Text,
                  { style: styles.sectionTitle },
                  '\uD83C\uDF81 Season Rewards',
                ),
                rewards.map(function (reward, idx) {
                  var name = reward.name || reward.title || 'Reward';
                  var tier = reward.tier || reward.level || '';
                  var claimed = reward.claimed || false;

                  return React.createElement(
                    View,
                    { key: reward.id || idx, style: styles.rewardRow },
                    React.createElement(
                      View,
                      { style: styles.rewardIcon },
                      React.createElement(
                        Text,
                        { style: { fontSize: 24 } },
                        reward.image || reward.emoji || '\uD83C\uDFC5',
                      ),
                    ),
                    React.createElement(
                      View,
                      { style: { flex: 1, marginLeft: 12 } },
                      React.createElement(
                        Text,
                        { style: styles.rewardName },
                        name,
                      ),
                      tier
                        ? React.createElement(
                            Text,
                            { style: styles.rewardTier },
                            'Tier: ' + tier,
                          )
                        : null,
                    ),
                    claimed
                      ? React.createElement(
                          View,
                          { style: styles.claimedBadge },
                          React.createElement(Icon, { name: 'check', size: 12, color: BRAND.greenSolid }),
                          React.createElement(
                            Text,
                            { style: styles.claimedText },
                            'Claimed',
                          ),
                        )
                      : React.createElement(
                          View,
                          { style: styles.unclaimedBadge },
                          React.createElement(Icon, { name: 'lock', size: 12, color: COLORS.textMuted }),
                        ),
                  );
                }),
              )
            : null,

          React.createElement(View, { style: { height: 40 } }),
        ),
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Banner
  bannerGradient: {
    padding: 28,
    alignItems: 'center',
  },
  bannerEmoji: { fontSize: 56, marginBottom: 12 },
  bannerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  bannerTheme: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
    maxWidth: 280,
  },
  bannerDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerDateText: { fontSize: 12, color: COLORS.textSecondary },

  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    marginBottom: 12,
  },

  // Countdown
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  countdownUnit: { alignItems: 'center' },
  countdownBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: BRAND.purple,
  },
  countdownLabel: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },

  // Season pass
  passLevelText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: BRAND.purple,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: BRAND.purple,
  },
  progressPercent: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 6,
    textAlign: 'right',
  },

  // Challenges
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    flex: 1,
    marginRight: 8,
  },
  challengeXP: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.bold,
    color: BRAND.yellow,
  },
  challengeDesc: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  challengeProgressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(139,92,246,0.1)',
    marginTop: 8,
  },
  challengeProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  challengeProgressText: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 3,
    textAlign: 'right',
  },

  // Leaderboard
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  lbRowHighlight: {
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  lbRank: {
    width: 24,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.textMuted,
    textAlign: 'center',
  },
  medalBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lbName: {
    flex: 1,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  lbXP: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.bold,
    color: BRAND.purple,
  },
  myPositionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    alignItems: 'center',
  },
  myPositionText: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.semibold,
    color: BRAND.purple,
  },

  // Rewards
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  rewardTier: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  claimedText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.semibold,
    color: BRAND.greenSolid,
  },
  unclaimedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

module.exports = SeasonDetailScreen;
