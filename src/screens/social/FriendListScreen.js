/**
 * FriendListScreen — Shows all friends with online/offline status.
 * Adapted from OnlineFriendsMobile.jsx + useOnlineFriendsScreen.js
 */
var React = require('react');
var { useState, useEffect, useCallback, useMemo } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet } = require('../../services/api');
var { SOCIAL } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var FRIEND_COLORS = [
  '#14B8A6', '#EC4899', '#F59E0B', '#8B5CF6',
  '#3B82F6', '#10B981', '#6366F1', '#EF4444',
];

var FriendListScreen = function () {
  var navigation = useNavigation();
  var [mounted, setMounted] = useState(false);

  useEffect(function () {
    var timer = setTimeout(function () {
      setMounted(true);
    }, 50);
    return function () { clearTimeout(timer); };
  }, []);

  var friendsQuery = useQuery({
    queryKey: ['friends-list'],
    queryFn: function () {
      return apiGet(SOCIAL.FRIENDS.LIST);
    },
  });

  var allFriends = (function () {
    var data = friendsQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  // NOTE: In the web app, online status is determined via Agora RTM presence.
  // For RN, we use the isOnline field from the API or a future RN presence hook.
  var friendsWithStatus = allFriends.map(function (f, i) {
    if (!f) return null;
    return {
      id: f.id,
      name: f.displayName || f.display_name || f.username || 'Friend',
      avatar: f.avatar || f.avatarUrl || null,
      initial: (f.displayName || f.display_name || f.username || 'F')[0].toUpperCase(),
      level: f.level || 1,
      status: f.status || f.currentActivity || '',
      color: f.color || FRIEND_COLORS[i % FRIEND_COLORS.length],
      isOnline: f.isOnline || false,
    };
  }).filter(Boolean);

  var onlineFriends = friendsWithStatus.filter(function (f) { return f.isOnline; });
  var offlineFriends = friendsWithStatus.filter(function (f) { return !f.isOnline; });
  var onlineCount = onlineFriends.length;

  var sections = [];
  if (onlineFriends.length > 0) {
    sections.push({ title: 'online', data: onlineFriends });
  }
  if (offlineFriends.length > 0) {
    sections.push({ title: 'offline', data: offlineFriends });
  }

  var renderSectionHeader = useCallback(function (info) {
    var section = info.section;
    var isOnline = section.title === 'online';
    return React.createElement(
      View,
      { style: styles.sectionHeader, accessible: true, accessibilityRole: 'header' },
      React.createElement(View, {
        style: [
          styles.statusDot,
          { backgroundColor: isOnline ? COLORS.online : COLORS.textMuted, opacity: isOnline ? 1 : 0.5 },
        ],
        importantForAccessibility: 'no',
      }),
      React.createElement(
        Text,
        { style: [styles.sectionLabel, !isOnline && { color: COLORS.textMuted }], accessible: false },
        (isOnline ? 'Online' : 'Offline') + ' (' + section.data.length + ')',
      ),
    );
  }, []);

  var renderFriend = useCallback(function (info) {
    var friend = info.item;

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.friendRow,
        activeOpacity: 0.7,
        onPress: function () {
          navigation.navigate('UserProfile', { userId: friend.id });
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: friend.name + ', Level ' + friend.level + (friend.isOnline ? ', online' : ', offline'),
      },
      // Avatar with online indicator
      React.createElement(
        View,
        { style: styles.avatarWrap },
        React.createElement(Avatar, {
          name: friend.name,
          src: friend.avatar,
          size: 48,
          color: friend.color,
        }),
        friend.isOnline
          ? React.createElement(View, { style: styles.onlineDot })
          : null,
      ),
      // Info
      React.createElement(
        View,
        { style: styles.friendInfo },
        React.createElement(
          Text,
          { style: styles.friendName, numberOfLines: 1 },
          friend.name,
        ),
        React.createElement(
          Text,
          { style: styles.friendMeta },
          friend.status || ('Lvl ' + friend.level),
        ),
      ),
      // Actions
      React.createElement(
        View,
        { style: styles.actionWrap },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionBtn,
            onPress: function () {
              navigation.navigate('Chat', {
                conversationId: null,
                title: friend.name,
                friendId: friend.id,
              });
            },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Message ' + friend.name,
            hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
          },
          React.createElement(Icon, { name: 'message-circle', size: 18, color: COLORS.purple }),
        ),
      ),
    );
  }, [navigation]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Friends',
      onBack: function () {
        navigation.goBack();
      },
      rightActions: [
        {
          icon: 'user-plus',
          label: 'Friend requests',
          onPress: function () {
            navigation.navigate('FriendRequests');
          },
        },
      ],
      titleComponent: React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' } },
        React.createElement(
          Text,
          { style: styles.headerTitle },
          'Friends',
        ),
        onlineCount > 0
          ? React.createElement(
              View,
              { style: styles.onlineChip },
              React.createElement(View, { style: styles.onlineChipDot }),
              React.createElement(
                Text,
                { style: styles.onlineChipText },
                onlineCount + ' online',
              ),
            )
          : null,
      ),
    }),

    friendsQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Loading friends' }),
        )
      : friendsWithStatus.length === 0
        ? React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Icon, { name: 'users', size: 48, color: COLORS.textMuted }),
            React.createElement(
              Text,
              { style: styles.emptyText },
              'No friends yet',
            ),
            React.createElement(
              TouchableOpacity,
              {
                style: styles.findBtn,
                onPress: function () {
                  navigation.navigate('Explore');
                },
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: 'Find People',
              },
              React.createElement(
                Text,
                { style: styles.findBtnText },
                'Find People',
              ),
            ),
          )
        : React.createElement(SectionList, {
            sections: sections,
            renderItem: renderFriend,
            renderSectionHeader: renderSectionHeader,
            keyExtractor: keyExtractor,
            contentContainerStyle: { paddingBottom: 100 },
            stickySectionHeadersEnabled: false,
            showsVerticalScrollIndicator: false,
            onRefresh: function () { friendsQuery.refetch(); },
            refreshing: friendsQuery.isRefetching || false,
          }),
  );
};

var styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  onlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  onlineChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.online,
    marginRight: 5,
  },
  onlineChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.online,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg + 4,
    paddingTop: 16,
    paddingBottom: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.bodyBg,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  friendMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionWrap: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 16,
    marginBottom: 16,
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

module.exports = FriendListScreen;
