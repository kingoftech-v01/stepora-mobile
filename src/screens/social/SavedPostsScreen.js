/**
 * SavedPostsScreen — User's saved/bookmarked posts from the community feed.
 * FlatList with unsave support, tap to navigate to PostDetail.
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiPost } = require('../../services/api');
var { SOCIAL } = require('../../services/endpoints');
var useInfiniteList = require('../../hooks/useInfiniteList');
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

var SavedPostsScreen = function () {
  var navigation = useNavigation();
  var qc = useQueryClient();
  var [refreshing, setRefreshing] = useState(false);
  var [removedIds, setRemovedIds] = useState({});

  // ── Fetch saved posts ──
  var savedFeed = useInfiniteList({
    queryKey: ['saved-posts'],
    url: SOCIAL.POSTS.SAVED,
    limit: 20,
  });

  var posts = savedFeed.items.filter(function (p) {
    return !removedIds[p.id];
  });

  // ── Unsave mutation ──
  var unsaveMut = useMutation({
    mutationFn: function (postId) {
      return apiPost(SOCIAL.POSTS.SAVE(postId));
    },
    onSuccess: function (_data, postId) {
      // Optimistically remove from list
      setRemovedIds(function (prev) {
        var n = Object.assign({}, prev);
        n[postId] = true;
        return n;
      });
      qc.invalidateQueries({ queryKey: ['saved-posts'] });
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to unsave post');
    },
  });

  var likeMut = useMutation({
    mutationFn: function (postId) {
      return apiPost(SOCIAL.POSTS.LIKE(postId));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['saved-posts'] });
    },
  });

  var handleRefresh = useCallback(function () {
    setRefreshing(true);
    setRemovedIds({});
    qc.invalidateQueries({ queryKey: ['saved-posts'] }).finally(function () {
      setRefreshing(false);
    });
  }, [qc]);

  var handleUnsave = useCallback(function (postId) {
    Alert.alert(
      'Unsave Post',
      'Remove this post from your saved collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsave',
          style: 'destructive',
          onPress: function () { unsaveMut.mutate(postId); },
        },
      ],
    );
  }, [unsaveMut]);

  var renderPost = useCallback(function (info) {
    var post = info.item;
    var author = post.author || post.user || {};
    var authorName = author.displayName || author.display_name || author.username || 'User';
    var content = post.content || post.text || '';
    var hasImage = !!(post.image || post.imageUrl);
    var likesCount = post.likesCount || post.likes_count || 0;
    var commentsCount = post.commentsCount || post.comments_count || 0;
    var isLiked = post.isLiked || false;
    var time = post.createdAt || post.created_at || post.savedAt;

    return React.createElement(
      TouchableOpacity,
      {
        activeOpacity: 0.8,
        onPress: function () {
          navigation.navigate('PostDetail', { postId: post.id });
        },
        onLongPress: function () {
          handleUnsave(post.id);
        },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Post by ' + authorName + (content ? ', ' + content.substring(0, 50) : ''), accessibilityHint: 'Tap to view, long press to unsave',
      },
      React.createElement(
        GlassCard,
        { style: { marginHorizontal: SPACING.lg } },
        // Author row
        React.createElement(
          TouchableOpacity,
          {
            style: styles.authorRow,
            onPress: function () {
              if (author.id) navigation.navigate('UserProfile', { userId: author.id });
            },
          },
          React.createElement(Avatar, {
            name: authorName,
            src: author.avatar,
            size: 40,
            color: avatarColor(authorName),
          }),
          React.createElement(
            View,
            { style: { flex: 1, marginLeft: 10 } },
            React.createElement(Text, { style: styles.authorName }, authorName),
            React.createElement(Text, { style: styles.postTime }, formatRelativeTime(time)),
          ),
          // Unsave button
          React.createElement(
            TouchableOpacity,
            {
              style: styles.unsaveBtn,
              onPress: function () { handleUnsave(post.id); },
              hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Unsave post by ' + authorName,
            },
            React.createElement(Icon, { name: 'bookmark', size: 18, color: COLORS.purple }),
          ),
        ),

        // Content preview
        content
          ? React.createElement(
              Text,
              { style: styles.contentPreview, numberOfLines: 4 },
              content,
            )
          : null,

        // Image
        hasImage
          ? React.createElement(Image, {
              source: { uri: post.image || post.imageUrl },
              style: styles.postImage,
              resizeMode: 'cover',
            })
          : null,

        // Actions row
        React.createElement(
          View,
          { style: styles.actionsRow },
          // Like
          React.createElement(
            TouchableOpacity,
            {
              style: styles.actionBtn,
              onPress: function () { likeMut.mutate(post.id); },
              accessible: true, accessibilityRole: 'button', accessibilityLabel: (isLiked ? 'Unlike' : 'Like') + ', ' + likesCount + ' likes', accessibilityState: { selected: isLiked },
            },
            React.createElement(Icon, {
              name: 'heart',
              size: 16,
              color: isLiked ? COLORS.red : COLORS.textMuted,
            }),
            React.createElement(
              Text,
              { style: [styles.actionText, isLiked && { color: COLORS.red }] },
              String(likesCount),
            ),
          ),
          // Comments
          React.createElement(
            TouchableOpacity,
            {
              style: styles.actionBtn,
              onPress: function () {
                navigation.navigate('PostDetail', { postId: post.id });
              },
              accessible: true, accessibilityRole: 'button', accessibilityLabel: commentsCount + ' comments',
            },
            React.createElement(Icon, { name: 'message-circle', size: 16, color: COLORS.textMuted }),
            React.createElement(Text, { style: styles.actionText }, String(commentsCount)),
          ),
          // Share
          React.createElement(
            TouchableOpacity,
            { style: styles.actionBtn, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Share post' },
            React.createElement(Icon, { name: 'share-2', size: 16, color: COLORS.textMuted }),
          ),
        ),
      ),
    );
  }, [navigation, handleUnsave, likeMut]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Saved Posts',
      onBack: function () { navigation.goBack(); },
    }),

    savedFeed.isLoading && !refreshing
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
        )
      : React.createElement(FlatList, {
          data: posts,
          renderItem: renderPost,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100, paddingTop: 8 },
          showsVerticalScrollIndicator: false,
          refreshControl: React.createElement(RefreshControl, {
            refreshing: refreshing,
            onRefresh: handleRefresh,
            tintColor: COLORS.purple,
            colors: [COLORS.purple],
          }),
          onEndReached: function () {
            if (savedFeed.hasNextPage) savedFeed.fetchNextPage();
          },
          onEndReachedThreshold: 0.3,
          ListFooterComponent: savedFeed.isFetchingNextPage
            ? React.createElement(
                View,
                { style: { paddingVertical: 20 } },
                React.createElement(ActivityIndicator, { size: 'small', color: COLORS.purple }),
              )
            : null,
          ListEmptyComponent: React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(
              View,
              { style: styles.emptyIconWrap },
              React.createElement(Icon, { name: 'bookmark', size: 36, color: COLORS.textMuted }),
            ),
            React.createElement(
              Text,
              { style: styles.emptyTitle },
              'No saved posts',
            ),
            React.createElement(
              Text,
              { style: styles.emptyDesc },
              'Save posts from the community feed to read them later. Tap the bookmark icon on any post.',
            ),
            React.createElement(
              TouchableOpacity,
              {
                style: styles.browseBtn,
                onPress: function () { navigation.goBack(); },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Browse Community',
              },
              React.createElement(Text, { style: styles.browseBtnText }, 'Browse Community'),
            ),
          ),
        }),
  );
};

var styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  unsaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.purple + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentPreview: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 5,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 80,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.purple,
    borderRadius: 12,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

module.exports = SavedPostsScreen;
