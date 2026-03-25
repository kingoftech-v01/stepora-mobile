/**
 * PostDetailScreen — Full post view with comments and interactions.
 * Post content, author info, like/comment/share/save actions,
 * comments list with reply support, comment input (KeyboardAvoidingView).
 */
var React = require('react');
var { useState, useCallback, useRef, useEffect } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { SOCIAL } = require('../../services/endpoints');
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

var PostDetailScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var postId = route.params && route.params.postId;
  var qc = useQueryClient();

  var [commentText, setCommentText] = useState('');
  var [replyTo, setReplyTo] = useState(null);
  var inputRef = useRef(null);

  // ── Fetch post ──
  var postQuery = useQuery({
    queryKey: ['post', postId],
    queryFn: function () {
      return apiGet(SOCIAL.POSTS.DETAIL(postId));
    },
    enabled: !!postId,
  });
  var post = postQuery.data || {};
  var author = post.author || post.user || {};
  var authorName = author.displayName || author.display_name || author.username || 'User';

  // ── Fetch comments ──
  var commentsQuery = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: function () {
      return apiGet(SOCIAL.POSTS.COMMENTS(postId));
    },
    enabled: !!postId,
  });
  var comments = (function () {
    var d = commentsQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  // ── Mutations ──
  var likeMut = useMutation({
    mutationFn: function () {
      return apiPost(SOCIAL.POSTS.LIKE(postId));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['social-posts-feed'] });
    },
  });

  var saveMut = useMutation({
    mutationFn: function () {
      return apiPost(SOCIAL.POSTS.SAVE(postId));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['saved-posts'] });
    },
  });

  var shareMut = useMutation({
    mutationFn: function () {
      return apiPost(SOCIAL.POSTS.SHARE(postId));
    },
    onSuccess: function () {
      Alert.alert('Shared', 'Post shared successfully!');
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to share post');
    },
  });

  var commentMut = useMutation({
    mutationFn: function (data) {
      return apiPost(SOCIAL.POSTS.COMMENT(postId), data);
    },
    onSuccess: function () {
      setCommentText('');
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ['post-comments', postId] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to post comment');
    },
  });

  var followMut = useMutation({
    mutationFn: function () {
      if (post.isFollowing || author.isFollowing) {
        return apiPost(SOCIAL.UNFOLLOW(author.id));
      }
      return apiPost(SOCIAL.FOLLOW, { userId: author.id });
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  var handleSubmitComment = useCallback(function () {
    var text = commentText.trim();
    if (!text) return;
    var payload = { content: text };
    if (replyTo) {
      payload.parentId = replyTo.id;
    }
    commentMut.mutate(payload);
  }, [commentText, replyTo, commentMut]);

  var handleReply = useCallback(function (comment) {
    var commAuthor = comment.author || comment.user || {};
    var name = commAuthor.displayName || commAuthor.display_name || commAuthor.username || 'User';
    setReplyTo({ id: comment.id, name: name });
    if (inputRef.current) inputRef.current.focus();
  }, []);

  var isLiked = post.isLiked || post.is_liked || post.hasLiked || post.has_liked || false;
  var isSaved = post.isSaved || post.is_saved || post.isBookmarked || post.hasSaved || post.has_saved || false;
  var isFollowing = post.isFollowing || post.is_following || (author && (author.isFollowing || author.is_following)) || false;
  var likesCount = post.likesCount != null ? post.likesCount : (post.likes_count || 0);
  var commentsCount = post.commentsCount != null ? post.commentsCount : (post.comments_count || comments.length || 0);

  // ── Render comment ──
  var renderComment = useCallback(function (info) {
    var comment = info.item;
    var commAuthor = comment.author || comment.user || {};
    var commName = commAuthor.displayName || commAuthor.display_name || commAuthor.username || 'User';
    var replies = comment.replies || [];
    var isReply = !!comment.parentId || !!comment.parent;

    return React.createElement(
      View,
      { style: [styles.commentWrap, isReply && styles.commentReply] },
      React.createElement(
        View,
        { style: styles.commentRow },
        React.createElement(
          TouchableOpacity,
          {
            onPress: function () {
              if (commAuthor.id) navigation.navigate('UserProfile', { userId: commAuthor.id });
            },
          },
          React.createElement(Avatar, {
            name: commName,
            src: commAuthor.avatar,
            size: isReply ? 28 : 34,
            color: avatarColor(commName),
          }),
        ),
        React.createElement(
          View,
          { style: styles.commentContent },
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center' } },
            React.createElement(Text, { style: styles.commentAuthor }, commName),
            React.createElement(
              Text,
              { style: styles.commentTime },
              ' \u00B7 ' + formatRelativeTime(comment.createdAt || comment.created_at),
            ),
          ),
          React.createElement(Text, { style: styles.commentText }, comment.content || comment.text || comment.body || ''),
          // Comment actions
          React.createElement(
            View,
            { style: styles.commentActions },
            React.createElement(
              TouchableOpacity,
              {
                style: styles.commentActionBtn,
                onPress: function () { handleReply(comment); },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Reply to ' + commName,
              },
              React.createElement(Text, { style: styles.commentActionText }, 'Reply'),
            ),
            comment.likesCount || comment.likes_count
              ? React.createElement(
                  Text,
                  { style: styles.commentLikeCount },
                  String(comment.likesCount || comment.likes_count) + ' likes',
                )
              : null,
          ),
        ),
      ),
      // Render nested replies
      replies.length > 0
        ? replies.map(function (reply) {
            var replyAuthor = reply.author || reply.user || {};
            var replyName = replyAuthor.displayName || replyAuthor.display_name || replyAuthor.username || 'User';
            return React.createElement(
              View,
              { key: reply.id, style: [styles.commentWrap, styles.commentReply] },
              React.createElement(
                View,
                { style: styles.commentRow },
                React.createElement(
                  TouchableOpacity,
                  {
                    onPress: function () {
                      if (replyAuthor.id) navigation.navigate('UserProfile', { userId: replyAuthor.id });
                    },
                  },
                  React.createElement(Avatar, {
                    name: replyName,
                    src: replyAuthor.avatar,
                    size: 28,
                    color: avatarColor(replyName),
                  }),
                ),
                React.createElement(
                  View,
                  { style: styles.commentContent },
                  React.createElement(
                    View,
                    { style: { flexDirection: 'row', alignItems: 'center' } },
                    React.createElement(Text, { style: styles.commentAuthor }, replyName),
                    React.createElement(
                      Text,
                      { style: styles.commentTime },
                      ' \u00B7 ' + formatRelativeTime(reply.createdAt || reply.created_at),
                    ),
                  ),
                  React.createElement(Text, { style: styles.commentText }, reply.content || reply.text || ''),
                ),
              ),
            );
          })
        : null,
    );
  }, [navigation, handleReply]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  // ── Post header component (rendered at top of FlatList) ──
  var renderPostHeader = function () {
    return React.createElement(
      View,
      { style: styles.postSection },

      // Author info with follow button
      React.createElement(
        View,
        { style: styles.authorRow },
        React.createElement(
          TouchableOpacity,
          {
            style: { flexDirection: 'row', alignItems: 'center', flex: 1 },
            onPress: function () {
              if (author.id) navigation.navigate('UserProfile', { userId: author.id });
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'View ' + authorName + ' profile',
          },
          React.createElement(Avatar, {
            name: authorName,
            src: author.avatar,
            size: 46,
            color: avatarColor(authorName),
          }),
          React.createElement(
            View,
            { style: { marginLeft: 12, flex: 1 } },
            React.createElement(Text, { style: styles.authorName }, authorName),
            React.createElement(
              Text,
              { style: styles.postTime },
              formatRelativeTime(post.createdAt || post.created_at),
            ),
          ),
        ),
        // Follow button
        author.id && !author.isCurrentUser
          ? React.createElement(
              TouchableOpacity,
              {
                style: [styles.followBtn, isFollowing && styles.followingBtn],
                onPress: function () { followMut.mutate(); },
                disabled: followMut.isPending,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: isFollowing ? 'Unfollow ' + authorName : 'Follow ' + authorName, accessibilityState: { disabled: followMut.isPending },
              },
              React.createElement(
                Text,
                { style: [styles.followBtnText, isFollowing && styles.followingBtnText] },
                isFollowing ? 'Following' : 'Follow',
              ),
            )
          : null,
      ),

      // Post content
      post.content || post.text
        ? React.createElement(
            Text,
            { style: styles.postContent },
            post.content || post.text,
          )
        : null,

      // Post images
      post.image || post.imageUrl
        ? React.createElement(Image, {
            source: { uri: post.image || post.imageUrl },
            style: styles.postImage,
            resizeMode: 'cover',
          })
        : null,

      // Multiple images support
      post.images && Array.isArray(post.images) && post.images.length > 0
        ? post.images.map(function (img, idx) {
            var uri = typeof img === 'string' ? img : img.url || img.uri || img.image;
            return uri
              ? React.createElement(Image, {
                  key: idx,
                  source: { uri: uri },
                  style: styles.postImage,
                  resizeMode: 'cover',
                })
              : null;
          })
        : null,

      // Actions bar
      React.createElement(
        View,
        { style: styles.actionsRow },
        // Like
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionBtn,
            onPress: function () { likeMut.mutate(); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: (isLiked ? 'Unlike' : 'Like') + ', ' + likesCount + ' likes', accessibilityState: { selected: isLiked },
          },
          React.createElement(Icon, {
            name: 'heart',
            size: 20,
            color: isLiked ? COLORS.red : COLORS.textMuted,
          }),
          React.createElement(
            Text,
            { style: [styles.actionText, isLiked && { color: COLORS.red }] },
            String(likesCount),
          ),
        ),
        // Comment
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionBtn,
            onPress: function () {
              if (inputRef.current) inputRef.current.focus();
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Comment, ' + commentsCount + ' comments',
          },
          React.createElement(Icon, { name: 'message-circle', size: 20, color: COLORS.textMuted }),
          React.createElement(Text, { style: styles.actionText }, String(commentsCount)),
        ),
        // Share
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionBtn,
            onPress: function () { shareMut.mutate(); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Share post',
          },
          React.createElement(Icon, { name: 'share-2', size: 20, color: COLORS.textMuted }),
        ),
        // Save / Bookmark
        React.createElement(
          TouchableOpacity,
          {
            style: [styles.actionBtn, { marginLeft: 'auto' }],
            onPress: function () { saveMut.mutate(); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: isSaved ? 'Unsave post' : 'Save post', accessibilityState: { selected: isSaved },
          },
          React.createElement(Icon, {
            name: 'bookmark',
            size: 20,
            color: isSaved ? COLORS.purple : COLORS.textMuted,
          }),
        ),
      ),

      // Comments section header
      React.createElement(
        View,
        { style: styles.commentsHeader },
        React.createElement(
          Text,
          { style: styles.commentsTitle },
          'Comments (' + commentsCount + ')',
        ),
      ),
    );
  };

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Post',
      onBack: function () { navigation.goBack(); },
      rightActions: [
        {
          icon: 'more-horizontal',
          onPress: function () {
            Alert.alert(
              'Post Options',
              null,
              [
                { text: isSaved ? 'Unsave' : 'Save', onPress: function () { saveMut.mutate(); } },
                {
                  text: 'Report',
                  style: 'destructive',
                  onPress: function () {
                    apiPost(SOCIAL.REPORT, { contentType: 'post', objectId: postId })
                      .then(function () { Alert.alert('Reported', 'Thank you for your report.'); })
                      .catch(function () {});
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ],
            );
          },
        },
      ],
    }),

    React.createElement(
      KeyboardAvoidingView,
      {
        style: { flex: 1 },
        behavior: Platform.OS === 'ios' ? 'padding' : undefined,
        keyboardVerticalOffset: Platform.OS === 'ios' ? 90 : 0,
      },

      postQuery.isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap },
            React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
          )
        : React.createElement(FlatList, {
            data: comments,
            renderItem: renderComment,
            keyExtractor: keyExtractor,
            contentContainerStyle: { paddingBottom: 20 },
            showsVerticalScrollIndicator: false,
            ListHeaderComponent: renderPostHeader,
            ListEmptyComponent: !commentsQuery.isLoading
              ? React.createElement(
                  View,
                  { style: styles.noCommentsWrap },
                  React.createElement(Text, { style: styles.noCommentsText }, 'No comments yet'),
                  React.createElement(
                    Text,
                    { style: styles.noCommentsSubtext },
                    'Be the first to share your thoughts!',
                  ),
                )
              : React.createElement(
                  View,
                  { style: { paddingVertical: 20, alignItems: 'center' } },
                  React.createElement(ActivityIndicator, { size: 'small', color: COLORS.purple }),
                ),
          }),

      // ── Comment input bar ──
      React.createElement(
        View,
        { style: styles.inputBar },
        // Reply indicator
        replyTo
          ? React.createElement(
              View,
              { style: styles.replyIndicator },
              React.createElement(
                Text,
                { style: styles.replyIndicatorText },
                'Replying to ' + replyTo.name,
              ),
              React.createElement(
                TouchableOpacity,
                {
                  onPress: function () { setReplyTo(null); },
                  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
                  accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel reply',
                },
                React.createElement(Icon, { name: 'x', size: 14, color: COLORS.textMuted }),
              ),
            )
          : null,
        React.createElement(
          View,
          { style: styles.inputRow },
          React.createElement(TextInput, {
            ref: inputRef,
            style: styles.commentInput,
            placeholder: replyTo ? 'Write a reply...' : 'Write a comment...',
            placeholderTextColor: COLORS.textMuted,
            value: commentText,
            onChangeText: setCommentText,
            multiline: true,
            maxLength: 1000,
            accessibilityLabel: replyTo ? 'Write a reply to ' + replyTo.name : 'Write a comment',
          }),
          React.createElement(
            TouchableOpacity,
            {
              style: [styles.sendBtn, !commentText.trim() && { opacity: 0.3 }],
              onPress: handleSubmitComment,
              disabled: !commentText.trim() || commentMut.isPending,
              accessible: true, accessibilityRole: 'button', accessibilityLabel: replyTo ? 'Send reply' : 'Send comment', accessibilityState: { disabled: !commentText.trim() || commentMut.isPending },
            },
            commentMut.isPending
              ? React.createElement(ActivityIndicator, { size: 'small', color: '#FFFFFF' })
              : React.createElement(Icon, { name: 'send', size: 16, color: '#FFFFFF' }),
          ),
        ),
      ),
    ),
  );
};

var styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: COLORS.purple,
    borderRadius: 10,
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.glassBorderLight,
  },
  followingBtnText: {
    color: COLORS.textSecondary,
  },
  postContent: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
  commentsHeader: {
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  // Comments
  commentWrap: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  commentReply: {
    paddingLeft: SPACING.lg + 44,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  commentTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  commentText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 3,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  commentActionBtn: {
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  commentLikeCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  noCommentsWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noCommentsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  noCommentsSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Input bar
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.bodyBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.purple + '10',
    borderRadius: 8,
    marginBottom: 6,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: COLORS.purple,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

module.exports = PostDetailScreen;
