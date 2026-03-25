/**
 * NewConversationScreen — Start a new friend chat.
 *
 * Uses FRIEND_CHAT.START to create/get a conversation with a friend.
 * Uses SOCIAL.FRIENDS.LIST for friends list (separate from buddy pairing).
 * Uses display_name from user profile, NOT from buddy pairing.
 * Synced with web: useNewChatScreen.js + useMessagesScreen.js patterns.
 */
var React = require('react');
var { useState, useCallback, useMemo } = React;
var {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Alert,
  Keyboard,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { FRIEND_CHAT, SOCIAL } = require('../../services/endpoints');
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

var getDisplayName = function (user) {
  return user.displayName || user.display_name || user.username || user.email || 'User';
};

// ─── Main Screen ──────────────────────────────────────────────────

var NewConversationScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [searchText, setSearchText] = useState('');
  var [creating, setCreating] = useState(false);

  // ─── Fetch friends list (from SOCIAL, not BUDDIES) ──────────────
  var friendsQuery = useQuery({
    queryKey: ['friends-list'],
    queryFn: function () {
      return apiGet(SOCIAL.FRIENDS.LIST);
    },
  });

  var friends = useMemo(function () {
    var data = friendsQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    return list;
  }, [friendsQuery.data]);

  // ─── Search users from API ────────────────────────────────────
  var searchQuery = useQuery({
    queryKey: ['user-search', searchText],
    queryFn: function () {
      return apiGet(SOCIAL.USER_SEARCH + '?q=' + encodeURIComponent(searchText));
    },
    enabled: searchText.length >= 2,
  });

  var searchResults = useMemo(function () {
    if (!searchText || searchText.length < 2) return [];
    var data = searchQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    return list;
  }, [searchText, searchQuery.data]);

  // ─── Filter friends by search text ────────────────────────────
  var filteredFriends = useMemo(function () {
    if (!searchText) return friends;
    var lower = searchText.toLowerCase();
    return friends.filter(function (f) {
      var name = getDisplayName(f);
      return name.toLowerCase().indexOf(lower) !== -1;
    });
  }, [friends, searchText]);

  // ─── Display list: search results or friends ──────────────────
  var displayUsers = searchText.length >= 2 ? searchResults : filteredFriends;

  // ─── Start 1:1 conversation via FRIEND_CHAT.START ─────────────
  var handleStartChat = useCallback(function (user) {
    if (creating) return;
    setCreating(true);
    Keyboard.dismiss();

    apiPost(FRIEND_CHAT.START, { targetUserId: user.id })
      .then(function (conv) {
        setCreating(false);
        queryClient.invalidateQueries({ queryKey: ['friend-conversations'] });
        var tu = conv.targetUser || conv.target_user || {};
        var name = tu.displayName || tu.display_name || getDisplayName(user);
        navigation.replace('Chat', {
          conversationId: conv.id,
          friendId: user.id,
          title: name,
        });
      })
      .catch(function (err) {
        setCreating(false);
        Alert.alert(
          'Error',
          (err && err.userMessage) || (err && err.message) || 'Failed to start conversation'
        );
      });
  }, [creating, navigation, queryClient]);

  // ─── Render user row ──────────────────────────────────────────
  var renderUserRow = useCallback(function (info) {
    var user = info.item;
    var name = getDisplayName(user);

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.userRow,
        activeOpacity: 0.7,
        onPress: function () {
          handleStartChat(user);
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: name + (user.isOnline ? ', online' : '') + '. Tap to start chat',
      },
      // Avatar
      React.createElement(
        View,
        { style: styles.avatarWrap },
        React.createElement(Avatar, {
          name: name,
          src: user.avatar || user.avatarUrl || user.profileImage,
          size: 46,
          color: avatarColor(name),
        }),
        user.isOnline
          ? React.createElement(View, { style: styles.onlineDot })
          : null
      ),
      // Info
      React.createElement(
        View,
        { style: styles.userInfo },
        React.createElement(
          Text,
          { style: styles.userName, numberOfLines: 1 },
          name
        ),
        user.username
          ? React.createElement(
              Text,
              { style: styles.userHandle, numberOfLines: 1 },
              '@' + user.username
            )
          : null
      ),
      // Arrow
      React.createElement(Icon, {
        name: 'chevron-right',
        size: 18,
        color: COLORS.textMuted,
      })
    );
  }, [handleStartChat]);

  // ─── Loading state ────────────────────────────────────────────
  var isSearching = searchText.length >= 2 && searchQuery.isLoading;
  var isLoadingFriends = friendsQuery.isLoading;

  // ─── Key extractor ────────────────────────────────────────────
  var keyExtractor = useCallback(function (item, index) {
    return String(item.id || index);
  }, []);

  // ─── Empty component ──────────────────────────────────────────
  var renderEmpty = function () {
    if (isLoadingFriends || isSearching) return null;
    return React.createElement(
      View,
      { style: styles.emptyWrap },
      React.createElement(Icon, { name: 'search', size: 48, color: COLORS.textMuted }),
      React.createElement(
        Text,
        { style: styles.emptyTitle },
        searchText ? 'No users found' : 'No friends yet'
      ),
      React.createElement(
        Text,
        { style: styles.emptySubtitle },
        searchText
          ? 'Try a different search term'
          : 'Add friends to start conversations'
      )
    );
  };

  // ─── Section header ──────────────────────────────────────────
  var renderSectionHeader = function () {
    if (displayUsers.length === 0) return null;
    return React.createElement(
      View,
      { style: styles.sectionHeader },
      React.createElement(
        Text,
        { style: styles.sectionTitle, accessibilityRole: 'header' },
        searchText.length >= 2 ? 'Search Results' : 'Friends'
      ),
      !searchText
        ? React.createElement(
            Text,
            { style: styles.sectionCount },
            friends.length + ' friends'
          )
        : null
    );
  };

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'New Chat',
      onBack: function () {
        navigation.goBack();
      },
    }),

    // ─── Search bar ───────────────────────────────────────────
    React.createElement(
      View,
      { style: styles.searchWrap },
      React.createElement(Icon, {
        name: 'search',
        size: 16,
        color: COLORS.textMuted,
        style: { marginRight: 8 },
      }),
      React.createElement(TextInput, {
        style: styles.searchInput,
        placeholder: 'Search people...',
        placeholderTextColor: COLORS.textMuted,
        value: searchText,
        onChangeText: setSearchText,
        autoCorrect: false,
        autoCapitalize: 'none',
        accessible: true,
        accessibilityLabel: 'Search people',
        accessibilityRole: 'search',
      }),
      searchText
        ? React.createElement(
            TouchableOpacity,
            {
              onPress: function () {
                setSearchText('');
              },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Clear search',
            },
            React.createElement(Icon, { name: 'x', size: 16, color: COLORS.textMuted })
          )
        : null,
      isSearching
        ? React.createElement(ActivityIndicator, {
            size: 'small',
            color: COLORS.purple,
            style: { marginLeft: 8 },
          })
        : null
    ),

    // ─── Section header ─────────────────────────────────────
    renderSectionHeader(),

    // ─── Loading / List ─────────────────────────────────────
    isLoadingFriends && !searchText
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple })
        )
      : React.createElement(FlatList, {
          data: displayUsers,
          renderItem: renderUserRow,
          keyExtractor: keyExtractor,
          contentContainerStyle: displayUsers.length === 0 ? { flex: 1 } : { paddingBottom: 100 },
          ListEmptyComponent: renderEmpty,
          showsVerticalScrollIndicator: false,
        }),

    // ─── Creating overlay ───────────────────────────────────
    creating
      ? React.createElement(
          View,
          { style: styles.creatingOverlay },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
          React.createElement(
            Text,
            { style: styles.creatingText },
            'Starting chat...'
          )
        )
      : null
  );
};

// ─── Styles ─────────────────────────────────────────────────────────

var styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Section headers ──────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // ─── User rows ────────────────────────────────────────────
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.bodyBg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  userHandle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
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

  // ─── Creating overlay ─────────────────────────────────────
  creatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatingText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 12,
  },
});

module.exports = NewConversationScreen;
