/**
 * BuddyScreen — Accountability buddy pairing, chat, and progress.
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { BUDDIES } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var BuddyScreen = function () {
  var navigation = useNavigation();
  var qc = useQueryClient();
  var [finding, setFinding] = useState(false);

  var currentQuery = useQuery({
    queryKey: ['buddy-current'],
    queryFn: function () {
      return apiGet(BUDDIES.CURRENT);
    },
  });

  var buddy = currentQuery.data || null;
  var hasBuddy = buddy && buddy.id && buddy.status === 'active';
  var buddyUser = hasBuddy ? (buddy.otherUser || buddy.partner || {}) : {};
  var buddyName = buddyUser.displayName || buddyUser.display_name || buddyUser.username || 'Buddy';

  // AI matches for finding a buddy
  var matchesQuery = useQuery({
    queryKey: ['buddy-matches'],
    queryFn: function () {
      return apiGet(BUDDIES.AI_MATCHES);
    },
    enabled: !hasBuddy,
  });
  var matches = (function () {
    var d = matchesQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  var pairMut = useMutation({
    mutationFn: function (userId) {
      return apiPost(BUDDIES.PAIR, { user_id: userId });
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['buddy-current'] });
    },
  });

  var encourageMut = useMutation({
    mutationFn: function () {
      return apiPost(BUDDIES.ENCOURAGE(buddy.id));
    },
  });

  var renderActiveBuddy = function () {
    return React.createElement(
      ScrollView,
      { contentContainerStyle: { paddingBottom: 100 } },
      // Buddy card
      React.createElement(
        GlassCard,
        { style: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg } },
        React.createElement(
          View,
          { style: styles.buddyHeader, accessible: true, accessibilityLabel: buddyName + ', your accountability buddy, online' },
          React.createElement(Avatar, {
            name: buddyName,
            src: buddyUser.avatar,
            size: 56,
            color: avatarColor(buddyName),
          }),
          React.createElement(
            View,
            { style: { marginLeft: 14, flex: 1 }, accessible: false },
            React.createElement(Text, { style: styles.buddyName }, buddyName),
            React.createElement(
              Text,
              { style: styles.buddyMeta },
              'Your accountability buddy',
            ),
          ),
          React.createElement(View, { style: styles.onlineDot, importantForAccessibility: 'no' }),
        ),
      ),

      // Quick actions
      React.createElement(
        View,
        { style: styles.actionsRow },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionCard,
            onPress: function () {
              navigation.navigate('BuddyChat', { buddyId: buddy.id });
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Chat with ' + buddyName,
          },
          React.createElement(Icon, { name: 'message-circle', size: 22, color: COLORS.purple }),
          React.createElement(Text, { style: styles.actionLabel, accessible: false }, 'Chat'),
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionCard,
            onPress: function () { encourageMut.mutate(); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Send encouragement to ' + buddyName,
          },
          React.createElement(Icon, { name: 'heart', size: 22, color: '#EC4899' }),
          React.createElement(Text, { style: styles.actionLabel, accessible: false }, 'Encourage'),
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionCard,
            onPress: function () {
              navigation.navigate('UserProfile', { userId: buddyUser.id });
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'View ' + buddyName + ' profile',
          },
          React.createElement(Icon, { name: 'user', size: 22, color: '#14B8A6' }),
          React.createElement(Text, { style: styles.actionLabel, accessible: false }, 'Profile'),
        ),
      ),

      // Progress section
      buddy.progress
        ? React.createElement(
            GlassCard,
            { style: { marginHorizontal: SPACING.lg } },
            React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, 'Progress'),
            React.createElement(
              View,
              { style: styles.progressRow },
              React.createElement(Text, { style: styles.progressLabel }, 'Your streak'),
              React.createElement(
                Text,
                { style: styles.progressValue },
                (buddy.progress.myStreak || 0) + ' days',
              ),
            ),
            React.createElement(
              View,
              { style: styles.progressRow },
              React.createElement(Text, { style: styles.progressLabel }, 'Buddy streak'),
              React.createElement(
                Text,
                { style: styles.progressValue },
                (buddy.progress.buddyStreak || 0) + ' days',
              ),
            ),
          )
        : null,
    );
  };

  var renderMatchCard = useCallback(function (info) {
    var match = info.item;
    var name = match.displayName || match.display_name || match.username || 'User';
    return React.createElement(
      GlassCard,
      { style: { marginHorizontal: SPACING.lg } },
      React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' }, accessible: true, accessibilityLabel: name + ', Level ' + (match.level || 1) + (match.matchScore ? ', ' + Math.round(match.matchScore * 100) + '% match' : '') },
        React.createElement(Avatar, { name: name, size: 48, color: avatarColor(name) }),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 12 }, accessible: false },
          React.createElement(Text, { style: styles.matchName }, name),
          React.createElement(
            Text,
            { style: styles.matchMeta },
            'Lvl ' + (match.level || 1) +
              (match.matchScore ? ' \u00B7 ' + Math.round(match.matchScore * 100) + '% match' : ''),
          ),
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.pairBtn,
            onPress: function () { pairMut.mutate(match.id); },
            disabled: pairMut.isPending,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Pair with ' + name, accessibilityState: { disabled: pairMut.isPending },
          },
          React.createElement(Text, { style: styles.pairBtnText }, 'Pair'),
        ),
      ),
      match.sharedGoals
        ? React.createElement(
            Text,
            { style: styles.matchGoals },
            'Shared interests: ' + match.sharedGoals.join(', '),
          )
        : null,
    );
  }, [pairMut]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  var renderFindBuddy = function () {
    return React.createElement(FlatList, {
      data: matches,
      renderItem: renderMatchCard,
      keyExtractor: keyExtractor,
      contentContainerStyle: { paddingBottom: 100, paddingTop: 8 },
      ListHeaderComponent: React.createElement(
        View,
        { style: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg } },
        React.createElement(
          View,
          { style: styles.noBuddyWrap },
          React.createElement(Icon, { name: 'users', size: 48, color: COLORS.textMuted }),
          React.createElement(Text, { style: styles.noBuddyTitle }, 'Find an accountability buddy'),
          React.createElement(
            Text,
            { style: styles.noBuddyDesc },
            'Get matched with someone who shares your goals and hold each other accountable.',
          ),
        ),
        matches.length > 0
          ? React.createElement(
              Text,
              { style: styles.matchesTitle, accessibilityRole: 'header' },
              'Suggested Matches',
            )
          : null,
      ),
      ListEmptyComponent: matchesQuery.isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
            React.createElement(ActivityIndicator, { size: 'small', color: COLORS.purple, accessibilityLabel: 'Loading matches' }),
          )
        : React.createElement(
            View,
            { style: { alignItems: 'center', paddingVertical: 20 } },
            React.createElement(
              TouchableOpacity,
              {
                style: styles.findBtn,
                onPress: function () {
                  apiPost(BUDDIES.FIND_MATCH).then(function () {
                    matchesQuery.refetch();
                  });
                },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Find matches',
              },
              React.createElement(Text, { style: styles.findBtnText }, 'Find Matches'),
            ),
          ),
      showsVerticalScrollIndicator: false,
    });
  };

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Buddy',
      onBack: function () { navigation.goBack(); },
    }),
    currentQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Loading buddy information' }),
        )
      : hasBuddy
        ? renderActiveBuddy()
        : renderFindBuddy(),
  );
};

var styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  buddyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buddyName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  buddyMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.online,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginHorizontal: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  progressLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  noBuddyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noBuddyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  noBuddyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  matchesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  matchName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  matchMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  matchGoals: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  pairBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 10,
  },
  pairBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  findBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.purple,
    borderRadius: 12,
  },
  findBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

module.exports = BuddyScreen;
