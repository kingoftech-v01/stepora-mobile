/**
 * CircleDetailScreen — Circle detail with feed, members, challenges.
 * Adapted from CircleDetailMobile.jsx + useCircleDetailScreen.js
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
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
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiPut, apiDelete } = require('../../services/api');
var { CIRCLES } = require('../../services/endpoints');
var useInfiniteList = require('../../hooks/useInfiniteList');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');
var { BRAND, catSolid } = require('../../styles/colors');

var EXTRA_CAT_COLORS = {
  fitness: '#3B82F6',
  education: '#6366F1',
  creativity: '#EC4899',
  personal_growth: '#6366F1',
  other: '#9CA3AF',
};

var getCatColor = function (key) {
  if (!key) return BRAND.purple;
  var k = key.toLowerCase().replace(/\s+/g, '_');
  return catSolid(k) || EXTRA_CAT_COLORS[k] || BRAND.purple;
};

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var CircleDetailScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var id = route.params && route.params.circleId;
  var qc = useQueryClient();
  var [activeTab, setActiveTab] = useState('feed');
  var [newPost, setNewPost] = useState('');

  // ── Data ──
  var circleQuery = useQuery({
    queryKey: ['circle', id],
    queryFn: function () {
      return apiGet(CIRCLES.DETAIL(id));
    },
    enabled: !!id,
  });
  var circle = circleQuery.data || {};
  var members = circle.members || [];
  var isMember = circle.isMember || false;
  var myRole = (function () {
    var me = members.find(function (m) {
      return m.isCurrentUser;
    });
    return me ? me.role : null;
  })();
  var isAdmin = myRole === 'admin';
  var catColor = getCatColor(circle.category);

  var challengesQuery = useQuery({
    queryKey: ['circle-challenges', id],
    queryFn: function () {
      return apiGet(CIRCLES.CHALLENGES(id));
    },
    enabled: !!id && isMember,
  });
  var challenges = (function () {
    var d = challengesQuery.data;
    return (d && d.results) || d || [];
  })();

  var feedInf = useInfiniteList({
    queryKey: ['circle-feed', id],
    url: CIRCLES.FEED(id),
    limit: 20,
    enabled: !!id && isMember,
  });
  var posts = feedInf.items || [];

  // ── Mutations ──
  var createPostMut = useMutation({
    mutationFn: function (payload) {
      return apiPost(CIRCLES.POSTS(id), payload);
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['circle-feed', id] });
      setNewPost('');
    },
  });

  var joinCircleMut = useMutation({
    mutationFn: function () {
      return apiPost(CIRCLES.JOIN(id));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['circle', id] });
      qc.invalidateQueries({ queryKey: ['circles'] });
    },
  });

  var leaveMut = useMutation({
    mutationFn: function () {
      return apiPost(CIRCLES.LEAVE(id));
    },
    onSuccess: function () {
      navigation.goBack();
    },
  });

  var reactMut = useMutation({
    mutationFn: function (data) {
      return apiPost(CIRCLES.POST_REACT(id, data.postId), { reaction_type: data.type || 'heart' });
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['circle-feed', id] });
    },
  });

  var challengeJoinMut = useMutation({
    mutationFn: function (challengeId) {
      return apiPost(CIRCLES.CHALLENGE_JOIN(challengeId));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['circle-challenges', id] });
    },
  });

  var handlePost = useCallback(function () {
    var text = newPost.trim();
    if (!text) return;
    createPostMut.mutate({ content: text });
  }, [newPost, createPostMut]);

  // ── Tabs ──
  var tabs = [
    { key: 'feed', label: 'Feed' },
    { key: 'challenges', label: 'Challenges (' + (challenges.length || 0) + ')' },
    { key: 'members', label: 'Members (' + (members.length || 0) + ')' },
  ];

  // ── Renderers ──
  var renderPost = useCallback(function (info) {
    var post = info.item;
    var author = post.author || post.user || {};
    var authorName = author.displayName || author.display_name || author.username || 'Member';

    return React.createElement(
      GlassCard,
      { style: { marginHorizontal: SPACING.lg } },
      // Header
      React.createElement(
        View,
        { style: styles.postHeader },
        React.createElement(Avatar, {
          name: authorName,
          src: author.avatar,
          size: 36,
          color: avatarColor(authorName),
        }),
        React.createElement(
          View,
          { style: { marginLeft: 10, flex: 1 } },
          React.createElement(Text, { style: styles.postAuthor }, authorName),
          React.createElement(
            Text,
            { style: styles.postTime },
            post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '',
          ),
        ),
      ),
      // Content
      React.createElement(
        Text,
        { style: styles.postContent },
        post.content,
      ),
      // Reactions
      React.createElement(
        View,
        { style: styles.postActions },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.postActionBtn,
            onPress: function () {
              reactMut.mutate({ postId: post.id, type: 'heart' });
            },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Like, ' + (post.reactionCount || post.reactionsCount || 0) + ' reactions',
          },
          React.createElement(Icon, { name: 'heart', size: 16, color: COLORS.textSecondary }),
          React.createElement(
            Text,
            { style: styles.postActionText, accessible: false },
            String(post.reactionCount || post.reactionsCount || 0),
          ),
        ),
        React.createElement(
          TouchableOpacity,
          { style: styles.postActionBtn, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Comments, ' + (post.commentCount || 0) },
          React.createElement(Icon, { name: 'message-circle', size: 16, color: COLORS.textSecondary }),
          React.createElement(
            Text,
            { style: styles.postActionText, accessible: false },
            String(post.commentCount || 0),
          ),
        ),
      ),
    );
  }, [reactMut]);

  var renderMember = useCallback(function (info) {
    var member = info.item;
    var u = member.user || member;
    var name = u.displayName || u.display_name || u.username || 'Member';

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.memberRow,
        onPress: function () {
          navigation.navigate('UserProfile', { userId: u.id });
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: name + (member.role ? ', ' + member.role : ''),
      },
      React.createElement(Avatar, {
        name: name,
        src: u.avatar,
        size: 42,
        color: avatarColor(name),
      }),
      React.createElement(
        View,
        { style: { marginLeft: 10, flex: 1 } },
        React.createElement(Text, { style: styles.memberName }, name),
        member.role
          ? React.createElement(
              Text,
              { style: [styles.memberRole, member.role === 'admin' && { color: COLORS.purple }] },
              member.role,
            )
          : null,
      ),
    );
  }, [navigation]);

  var renderChallenge = useCallback(function (info) {
    var ch = info.item;
    var isJoined = ch.isJoined || false;

    return React.createElement(
      GlassCard,
      { style: { marginHorizontal: SPACING.lg } },
      React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 } },
        React.createElement(Icon, { name: 'target', size: 18, color: catColor }),
        React.createElement(
          Text,
          { style: [styles.challengeTitle, { marginLeft: 8 }] },
          ch.title,
        ),
      ),
      ch.description
        ? React.createElement(Text, { style: styles.challengeDesc }, ch.description)
        : null,
      React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center', marginTop: 10 } },
        React.createElement(
          Text,
          { style: styles.challengeMeta },
          (ch.durationDays || ch.duration_days || 7) + ' days \u00B7 ' + (ch.participantCount || 0) + ' participants',
        ),
        !isJoined
          ? React.createElement(
              TouchableOpacity,
              {
                style: styles.joinChallengeBtn,
                onPress: function () {
                  challengeJoinMut.mutate(ch.id);
                },
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: 'Join challenge ' + ch.title,
              },
              React.createElement(Text, { style: styles.joinChallengeBtnText }, 'Join'),
            )
          : React.createElement(
              View,
              { style: styles.joinedBadge },
              React.createElement(Icon, { name: 'check', size: 14, color: COLORS.online }),
              React.createElement(Text, { style: styles.joinedText }, 'Joined'),
            ),
      ),
    );
  }, [catColor, challengeJoinMut]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  // Build right actions for header
  var rightActions = [];
  if (!isMember) {
    rightActions.push({
      icon: 'user-plus',
      label: 'Join circle',
      onPress: function () { joinCircleMut.mutate(); },
    });
  }
  if (isMember) {
    rightActions.push({
      icon: 'message-circle',
      label: 'Circle chat',
      onPress: function () {
        navigation.navigate('CircleChat', { circleId: id });
      },
    });
  }

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: circle.name || 'Circle',
      onBack: function () { navigation.goBack(); },
      rightActions: rightActions,
    }),

    // Circle info banner
    React.createElement(
      View,
      { style: [styles.banner, { borderLeftColor: catColor }] },
      React.createElement(
        Text,
        { style: styles.bannerName },
        circle.name || '',
      ),
      circle.description
        ? React.createElement(Text, { style: styles.bannerDesc }, circle.description)
        : null,
      React.createElement(
        View,
        { style: styles.bannerStats },
        React.createElement(Text, { style: styles.bannerStat }, (members.length || 0) + ' members'),
        React.createElement(Text, { style: styles.bannerStatDot }, '\u00B7'),
        React.createElement(
          Text,
          { style: [styles.bannerStat, { color: catColor }] },
          circle.category || 'General',
        ),
      ),
    ),

    // Tabs
    React.createElement(
      View,
      { style: styles.tabRow },
      tabs.map(function (tab) {
        var isActive = activeTab === tab.key;
        return React.createElement(
          TouchableOpacity,
          {
            key: tab.key,
            style: [styles.tabBtn, isActive && styles.tabBtnActive],
            onPress: function () { setActiveTab(tab.key); },
            accessible: true,
            accessibilityRole: 'tab',
            accessibilityLabel: tab.label,
            accessibilityState: { selected: isActive },
          },
          React.createElement(
            Text,
            { style: [styles.tabText, isActive && styles.tabTextActive] },
            tab.label,
          ),
        );
      }),
    ),

    // Tab content
    circleQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Loading circle' }),
        )
      : activeTab === 'feed'
        ? React.createElement(
            FlatList,
            {
              data: posts,
              renderItem: renderPost,
              keyExtractor: keyExtractor,
              contentContainerStyle: { paddingBottom: 100, paddingTop: 8 },
              ListHeaderComponent: isMember
                ? React.createElement(
                    View,
                    { style: styles.postInputWrap },
                    React.createElement(TextInput, {
                      style: styles.postInput,
                      placeholder: 'Share something with the circle...',
                      placeholderTextColor: COLORS.textMuted,
                      value: newPost,
                      onChangeText: setNewPost,
                      multiline: true,
                      accessible: true,
                      accessibilityLabel: 'Write a post for the circle',
                    }),
                    newPost.trim()
                      ? React.createElement(
                          TouchableOpacity,
                          { style: styles.postSendBtn, onPress: handlePost, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Send post', hitSlop: { top: 6, bottom: 6, left: 6, right: 6 } },
                          React.createElement(Icon, { name: 'send', size: 16, color: '#FFFFFF' }),
                        )
                      : null,
                  )
                : null,
              showsVerticalScrollIndicator: false,
              onEndReached: function () {
                if (feedInf.hasNextPage) feedInf.fetchNextPage();
              },
              onEndReachedThreshold: 0.3,
            },
          )
        : activeTab === 'challenges'
          ? React.createElement(FlatList, {
              data: challenges,
              renderItem: renderChallenge,
              keyExtractor: keyExtractor,
              contentContainerStyle: { paddingBottom: 100, paddingTop: 8 },
              showsVerticalScrollIndicator: false,
              ListEmptyComponent: React.createElement(
                View,
                { style: styles.emptyWrap },
                React.createElement(Text, { style: styles.emptyText }, 'No challenges yet'),
              ),
            })
          : React.createElement(FlatList, {
              data: members,
              renderItem: renderMember,
              keyExtractor: function (item) { return String((item.user || item).id); },
              contentContainerStyle: { paddingBottom: 100, paddingTop: 8 },
              showsVerticalScrollIndicator: false,
            }),
  );
};

var styles = StyleSheet.create({
  banner: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderLeftWidth: 3,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
  },
  bannerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  bannerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerStat: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bannerStatDot: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 6,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.purple,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    marginBottom: 12,
  },
  postInput: {
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
  postSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: 12,
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
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberRole: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  challengeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  challengeMeta: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  joinChallengeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.purple,
    borderRadius: 10,
  },
  joinChallengeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 10,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.online,
    marginLeft: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});

module.exports = CircleDetailScreen;
