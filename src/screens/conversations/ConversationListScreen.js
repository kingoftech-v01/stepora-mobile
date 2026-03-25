/**
 * ConversationListScreen — List of friend chat conversations.
 * Uses FRIEND_CHAT endpoints (not AI_CHAT). Simple list, tapping navigates to chat.
 * Synced with web: useMessagesScreen.js pattern.
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
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { FRIEND_CHAT, SOCIAL } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var SubscriptionBanner = require('../../components/SubscriptionBanner');
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var timeAgo = function (d) {
  if (!d) return '';
  var date = d instanceof Date ? d : new Date(d);
  var s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 604800) return Math.floor(s / 86400) + 'd';
  return Math.floor(s / 604800) + 'w';
};

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var ConversationListScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [searchText, setSearchText] = useState('');
  var newChatRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('ConversationListScreen');

  // Fetch FRIEND conversations (not AI chats)
  var friendUrl = FRIEND_CHAT.LIST + (searchText ? '?search=' + encodeURIComponent(searchText) : '');
  var conversationsQuery = useQuery({
    queryKey: ['friend-conversations', searchText],
    queryFn: function () {
      return apiGet(friendUrl);
    },
  });

  var conversations = (function () {
    var data = conversationsQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    return list.map(function (c) {
      return Object.assign({}, c, {
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        unread: c.unreadCount || c.unread || 0,
      });
    });
  })();

  // Call history for missed call badge
  var callHistoryQuery = useQuery({
    queryKey: ['call-history'],
    queryFn: function () {
      return apiGet(FRIEND_CHAT.CALLS.HISTORY);
    },
  });

  var handleConversationPress = useCallback(function (conv) {
    // Mark as read
    if (conv.id && (conv.unreadCount || conv.unread) > 0) {
      apiPost(FRIEND_CHAT.MARK_READ(conv.id)).catch(function () {});
      queryClient.invalidateQueries({ queryKey: ['friend-conversations'] });
    }
    // Navigate to friend chat with conversation ID
    // Extract target user info for the header
    var tu = conv.targetUser || conv.target_user || {};
    var name = tu.displayName || tu.display_name || conv.title || conv.name || 'Chat';
    // Strip "Chat with " prefix like web does
    name = name.replace(/^Chat with\s+/i, '');
    navigation.navigate('Chat', {
      conversationId: conv.id,
      friendId: tu.id || null,
      title: name,
    });
  }, [navigation, queryClient]);

  var renderItem = useCallback(function (info) {
    var item = info.item;
    // Use target user's display_name (friend's profile name, NOT buddy pairing name)
    var tu = item.targetUser || item.target_user || {};
    var name = tu.displayName || tu.display_name || item.title || item.name || item.otherUserDisplayName || 'Conversation';
    // Strip "Chat with " prefix
    name = name.replace(/^Chat with\s+/i, '');
    var lastMsg = item.lastMessage || item.lastMessagePreview || '';
    var time = item.lastMessageAt || item.updatedAt || '';
    var unread = item.unreadCount || item.unread || 0;

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.convRow,
        activeOpacity: 0.7,
        onPress: function () {
          handleConversationPress(item);
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: name + (unread > 0 ? ', ' + unread + ' unread messages' : '') + (typeof lastMsg === 'string' && lastMsg ? ', ' + lastMsg : '') + (time ? ', ' + timeAgo(time) : ''),
      },
      // Avatar
      React.createElement(
        View,
        { style: styles.avatarWrap },
        React.createElement(Avatar, {
          name: name,
          src: tu.avatar || tu.avatarUrl || item.otherUserAvatar || item.avatar,
          size: 50,
          color: avatarColor(name),
        }),
        // Online indicator
        (tu.isOnline || item.isOnline)
          ? React.createElement(View, { style: styles.onlineDot })
          : null,
      ),
      // Content
      React.createElement(
        View,
        { style: styles.convContent },
        React.createElement(
          View,
          { style: styles.convTopRow },
          React.createElement(
            Text,
            { style: [styles.convName, unread > 0 && styles.convNameUnread], numberOfLines: 1 },
            name,
          ),
          React.createElement(
            Text,
            { style: styles.convTime },
            timeAgo(time),
          ),
        ),
        React.createElement(
          View,
          { style: styles.convBottomRow },
          React.createElement(
            Text,
            { style: [styles.convPreview, unread > 0 && styles.convPreviewUnread], numberOfLines: 1 },
            typeof lastMsg === 'string' ? lastMsg : (lastMsg && lastMsg.content) || '',
          ),
          unread > 0
            ? React.createElement(
                View,
                { style: styles.unreadBadge },
                React.createElement(
                  Text,
                  { style: styles.unreadText },
                  unread > 99 ? '99+' : String(unread),
                ),
              )
            : null,
        ),
      ),
    );
  }, [handleConversationPress]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  var renderEmpty = function () {
    if (conversationsQuery.isLoading) return null;
    return React.createElement(
      View,
      { style: styles.emptyWrap },
      React.createElement(Icon, { name: 'message-circle', size: 48, color: COLORS.textMuted }),
      React.createElement(
        Text,
        { style: styles.emptyTitle },
        'No conversations yet',
      ),
      React.createElement(
        Text,
        { style: styles.emptySubtitle },
        'Start a chat with friends',
      ),
    );
  };

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(View, { ref: newChatRef },
      React.createElement(GlassHeader, {
        title: 'Messages',
        rightActions: [
          {
            icon: 'clock',
            label: 'Call history',
            onPress: function () {
              navigation.navigate('CallHistory');
            },
          },
          {
            icon: 'edit',
            label: 'New conversation',
            onPress: function () {
              navigation.navigate('NewConversation');
            },
          },
        ],
      })
    ),
    // Subscription banner for free users
    React.createElement(SubscriptionBanner, null),
    // Search bar
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
        placeholder: 'Search conversations...',
        placeholderTextColor: COLORS.textMuted,
        value: searchText,
        onChangeText: setSearchText,
        autoCorrect: false,
        accessible: true,
        accessibilityLabel: 'Search conversations',
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
              hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
            },
            React.createElement(Icon, { name: 'x', size: 16, color: COLORS.textMuted }),
          )
        : null,
    ),
    // Loading
    conversationsQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Loading conversations' }),
        )
      : React.createElement(FlatList, {
          data: conversations,
          renderItem: renderItem,
          keyExtractor: keyExtractor,
          contentContainerStyle: conversations.length === 0 ? { flex: 1 } : { paddingBottom: 100 },
          ListEmptyComponent: renderEmpty,
          onRefresh: function () {
            conversationsQuery.refetch();
          },
          refreshing: conversationsQuery.isRefetching || false,
          showsVerticalScrollIndicator: false,
        }),
    tooltipCfg
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg.id,
          message: tooltipCfg.message,
          position: tooltipCfg.position,
          targetRef: newChatRef,
        })
      : null,
  );
};

var styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
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
  convRow: {
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
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.bodyBg,
  },
  convContent: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  convNameUnread: {
    fontWeight: '700',
  },
  convTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convPreview: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  convPreviewUnread: {
    color: COLORS.text,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: COLORS.purple,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
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

module.exports = ConversationListScreen;
