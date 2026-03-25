/**
 * CommunityScreen (SocialHub) — Main social feed with stories bar,
 * quick nav links, and mixed posts/events feed.
 * Entry point for all social features.
 */
var React = require('react');
var { useState, useCallback, useEffect, useRef } = React;
var {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { SOCIAL } = require('../../services/endpoints');
var useInfiniteList = require('../../hooks/useInfiniteList');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var AdNative = require('../../components/AdNative');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var getAvatarColor = function (name) {
  var hash = 0;
  for (var i = 0; i < (name || '').length; i++) {
    hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
};

var QUICK_NAV = [
  { icon: 'users', label: 'Circles', screen: 'Circles', color: '#8B5CF6' },
  { icon: 'award', label: 'Leaderboard', screen: 'Leaderboard', color: '#FCD34D' },
  { icon: 'user-plus', label: 'Find Buddy', screen: 'FindBuddy', color: '#10B981' },
  { icon: 'search', label: 'Search', screen: 'Explore', color: '#6366F1' },
  { icon: 'heart', label: 'Friends', screen: 'OnlineFriends', color: '#EC4899' },
];

var formatRelativeTime = function (dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var now = new Date();
  var diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

var CommunityScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [refreshing, setRefreshing] = useState(false);
  var postBtnRef = useRef(null);
  var tooltipCfg = getTooltipConfig('CommunityScreen');

  // Stories feed
  var storiesQuery = useQuery({
    queryKey: ['stories-feed'],
    queryFn: function () {
      return apiGet(SOCIAL.STORIES.FEED);
    },
  });
  var storyGroups = (function () {
    var d = storiesQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  // Friends activity / events
  var eventsQuery = useQuery({
    queryKey: ['social-events-feed'],
    queryFn: function () {
      return apiGet(SOCIAL.EVENTS.FEED);
    },
  });

  // Posts feed (infinite)
  var postsFeed = useInfiniteList({
    queryKey: ['social-posts-feed'],
    url: SOCIAL.POSTS.FEED,
    limit: 20,
  });

  // Friend requests count
  var requestsQuery = useQuery({
    queryKey: ['friend-requests-count'],
    queryFn: function () {
      return apiGet(SOCIAL.FRIENDS.PENDING);
    },
  });
  var requestsCount = (function () {
    var d = requestsQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return 0;
    return list.length;
  })();

  // Build mixed feed: posts + events interleaved
  var events = (function () {
    var d = eventsQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return [];
    return list.map(function (e) {
      return Object.assign({}, e, { _type: 'event' });
    });
  })();

  var posts = postsFeed.items.map(function (p) {
    return Object.assign({}, p, { _type: 'post' });
  });

  // Interleave: 3 posts, 1 event, repeat
  var mixedFeed = [];
  var pi = 0;
  var ei = 0;
  while (pi < posts.length || ei < events.length) {
    // Add up to 3 posts
    var batch = 0;
    while (batch < 3 && pi < posts.length) {
      mixedFeed.push(posts[pi]);
      pi++;
      batch++;
    }
    // Add 1 event
    if (ei < events.length) {
      mixedFeed.push(events[ei]);
      ei++;
    }
  }

  var handleRefresh = useCallback(
    function () {
      setRefreshing(true);
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['social-posts-feed'] }),
        queryClient.invalidateQueries({ queryKey: ['stories-feed'] }),
        queryClient.invalidateQueries({ queryKey: ['social-events-feed'] }),
      ]).finally(function () {
        setRefreshing(false);
      });
    },
    [queryClient],
  );

  var handleLikePost = useCallback(
    function (postId) {
      apiPost(SOCIAL.POSTS.LIKE(postId))
        .then(function () {
          queryClient.invalidateQueries({ queryKey: ['social-posts-feed'] });
        })
        .catch(function () {});
    },
    [queryClient],
  );

  // Stories bar
  var renderStoriesBar = function () {
    return React.createElement(
      View,
      { style: styles.storiesSection },
      React.createElement(
        ScrollView,
        {
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          contentContainerStyle: { paddingHorizontal: SPACING.lg },
        },
        // "You" story
        React.createElement(
          TouchableOpacity,
          {
            style: styles.storyItem,
            onPress: function () {
              // Navigate to create story
            },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Add your story',
          },
          React.createElement(
            View,
            { style: styles.storyRingEmpty },
            React.createElement(
              View,
              { style: styles.storyAvatarWrap },
              React.createElement(Avatar, { name: 'You', size: 56, color: COLORS.purple }),
            ),
            React.createElement(
              View,
              { style: styles.storyAddBadge },
              React.createElement(Icon, { name: 'plus', size: 10, color: '#FFFFFF' }),
            ),
          ),
          React.createElement(Text, { style: styles.storyName }, 'You'),
        ),

        // Other users' stories
        storyGroups.map(function (group) {
          var u = group.user || {};
          var name =
            u.displayName || u.display_name || u.username || 'User';
          var hasUnviewed = group.hasUnviewed;
          return React.createElement(
            TouchableOpacity,
            {
              key: u.id,
              style: styles.storyItem,
              onPress: function () {
                // Open story viewer
              },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: name + ' story' + (hasUnviewed ? ', new' : ''),
            },
            React.createElement(
              View,
              {
                style: [
                  styles.storyRing,
                  hasUnviewed ? styles.storyRingActive : styles.storyRingSeen,
                ],
              },
              React.createElement(
                View,
                { style: styles.storyAvatarWrap },
                React.createElement(Avatar, {
                  name: name,
                  src: u.avatar,
                  size: 56,
                  color: getAvatarColor(name),
                }),
              ),
            ),
            React.createElement(
              Text,
              { style: [styles.storyName, hasUnviewed ? { color: COLORS.text } : null] },
              name.split(' ')[0],
            ),
          );
        }),
      ),
    );
  };

  // Quick nav pills
  var renderQuickNav = function () {
    return React.createElement(
      ScrollView,
      {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: { paddingHorizontal: SPACING.lg, paddingVertical: 12 },
      },
      QUICK_NAV.map(function (nav) {
        return React.createElement(
          TouchableOpacity,
          {
            key: nav.screen,
            style: [
              styles.navPill,
              { backgroundColor: nav.color + '10', borderColor: nav.color + '20' },
            ],
            onPress: function () {
              navigation.navigate(nav.screen);
            },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: nav.label,
          },
          React.createElement(Icon, { name: nav.icon, size: 15, color: nav.color }),
          React.createElement(Text, { style: styles.navPillText }, nav.label),
        );
      }),
    );
  };

  var renderPostCard = function (item) {
    var author = item.author || item.user || {};
    var authorName =
      author.displayName || author.display_name || author.username || 'User';
    return React.createElement(
      GlassCard,
      { style: { marginHorizontal: SPACING.lg, marginBottom: 12 } },
      // Author row
      React.createElement(
        TouchableOpacity,
        {
          style: styles.postAuthorRow,
          onPress: function () {
            if (author.id)
              navigation.navigate('UserProfile', { userId: author.id });
          },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: authorName + ', view profile',
        },
        React.createElement(Avatar, {
          name: authorName,
          src: author.avatar,
          size: 40,
          color: getAvatarColor(authorName),
        }),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 10 } },
          React.createElement(Text, { style: styles.postAuthorName }, authorName),
          React.createElement(
            Text,
            { style: styles.postTime },
            formatRelativeTime(item.createdAt || item.created_at),
          ),
        ),
      ),
      // Content
      item.content || item.text
        ? React.createElement(
            Text,
            { style: styles.postContent },
            item.content || item.text,
          )
        : null,
      // Image
      item.image || item.imageUrl || item.image_url
        ? React.createElement(Image, {
            source: { uri: item.image || item.imageUrl || item.image_url },
            style: styles.postImage,
            resizeMode: 'cover',
            accessible: true,
            accessibilityRole: 'image',
            accessibilityLabel: 'Post image by ' + authorName,
          })
        : null,
      // Actions
      React.createElement(
        View,
        { style: styles.postActionsRow },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.postActionBtn,
            onPress: function () {
              handleLikePost(item.id);
            },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: ((item.isLiked || item.is_liked) ? 'Unlike' : 'Like') + ', ' + String(item.likesCount || item.likes_count || 0) + ' likes',
            accessibilityState: { selected: !!(item.isLiked || item.is_liked) },
          },
          React.createElement(Icon, {
            name: 'heart',
            size: 18,
            color: (item.isLiked || item.is_liked) ? '#EF4444' : COLORS.textMuted,
          }),
          React.createElement(
            Text,
            { style: styles.postActionText },
            String(item.likesCount || item.likes_count || 0),
          ),
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.postActionBtn,
            onPress: function () {
              navigation.navigate('PostDetail', { postId: item.id });
            },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Comments, ' + String(item.commentsCount || item.comments_count || 0),
          },
          React.createElement(Icon, {
            name: 'message-circle',
            size: 18,
            color: COLORS.textMuted,
          }),
          React.createElement(
            Text,
            { style: styles.postActionText },
            String(item.commentsCount || item.comments_count || 0),
          ),
        ),
        React.createElement(
          TouchableOpacity,
          { style: styles.postActionBtn, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Share post' },
          React.createElement(Icon, { name: 'share-2', size: 18, color: COLORS.textMuted }),
        ),
      ),
    );
  };

  var renderEventCard = function (item) {
    return React.createElement(
      GlassCard,
      {
        style: {
          marginHorizontal: SPACING.lg,
          marginBottom: 12,
          borderLeftWidth: 3,
          borderLeftColor: '#14B8A6',
        },
      },
      React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' } },
        React.createElement(Icon, { name: 'calendar', size: 16, color: '#14B8A6' }),
        React.createElement(
          Text,
          { style: styles.eventType },
          item.type || 'Activity',
        ),
        React.createElement(
          Text,
          { style: styles.eventTime },
          formatRelativeTime(item.createdAt || item.created_at),
        ),
      ),
      React.createElement(
        Text,
        { style: styles.eventContent },
        item.description || item.content || item.text || (item.data && (item.data.dream || item.data.task)) || '',
      ),
    );
  };

  var renderItem = useCallback(
    function (info) {
      var item = info.item;
      var adEl = (info.index > 0 && info.index % 5 === 0)
        ? React.createElement(AdNative, { key: 'ad-social-' + info.index, variant: Math.floor(info.index / 5) })
        : null;
      var cardEl = item._type === 'event' ? renderEventCard(item) : renderPostCard(item);
      if (adEl) {
        return React.createElement(View, { key: 'wrap-' + (item.id || info.index) }, adEl, cardEl);
      }
      return cardEl;
    },
    [navigation, handleLikePost],
  );

  var keyExtractor = useCallback(function (item, index) {
    return (item._type || 'p') + '-' + (item.id || index);
  }, []);

  var isLoading = postsFeed.isLoading && !refreshing;

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Community',
      rightActions: [
        {
          icon: 'search',
          label: 'Search',
          onPress: function () {
            navigation.navigate('Explore');
          },
        },
        {
          icon: 'user-plus',
          label: 'Friend requests' + (requestsCount ? ', ' + requestsCount + ' pending' : ''),
          badge: requestsCount,
          onPress: function () {
            navigation.navigate('FriendRequests');
          },
        },
      ],
    }),

    isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Loading community feed' }),
        )
      : React.createElement(FlatList, {
          data: mixedFeed,
          renderItem: renderItem,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100 },
          showsVerticalScrollIndicator: false,
          refreshControl: React.createElement(RefreshControl, {
            refreshing: refreshing,
            onRefresh: handleRefresh,
            tintColor: COLORS.purple,
            colors: [COLORS.purple],
          }),
          ListHeaderComponent: React.createElement(
            View,
            null,
            renderStoriesBar(),
            renderQuickNav(),
          ),
          ListEmptyComponent: React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(
              View,
              { style: styles.emptyIconWrap },
              React.createElement(Icon, {
                name: 'users',
                size: 32,
                color: COLORS.textSecondary,
              }),
            ),
            React.createElement(
              Text,
              { style: styles.emptyTitle },
              'No posts yet',
            ),
            React.createElement(
              Text,
              { style: styles.emptyDesc },
              'Be the first to share something with the community!',
            ),
          ),
          onEndReached: function () {
            if (postsFeed.hasNextPage) postsFeed.fetchNextPage();
          },
          onEndReachedThreshold: 0.3,
        }),

    // Create post FAB
    React.createElement(
      TouchableOpacity,
      {
        ref: postBtnRef,
        style: styles.fab,
        onPress: function () {
          // Navigate to create post
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Create new post',
      },
      React.createElement(Icon, { name: 'edit-3', size: 22, color: '#FFFFFF' }),
    ),
    tooltipCfg
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg.id,
          message: tooltipCfg.message,
          position: tooltipCfg.position,
          targetRef: postBtnRef,
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
  storiesSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 14,
    width: 68,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingActive: {
    borderWidth: 2,
    borderColor: COLORS.purple,
  },
  storyRingSeen: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  storyRingEmpty: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAddBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.purple,
    borderWidth: 2,
    borderColor: COLORS.bodyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyName: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  navPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 6,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  postActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 10,
  },
  postActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  postActionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 5,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14B8A6',
    marginLeft: 6,
    flex: 1,
  },
  eventTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  eventContent: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

module.exports = CommunityScreen;
