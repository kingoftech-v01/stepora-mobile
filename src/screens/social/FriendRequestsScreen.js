/**
 * FriendRequestsScreen — Received and sent friend requests.
 * Adapted from FriendRequestsMobile.jsx + useFriendRequestsScreen.js
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQueryClient, useMutation } = require('@tanstack/react-query');
var { apiPost, apiDelete } = require('../../services/api');
var { SOCIAL } = require('../../services/endpoints');
var useInfiniteList = require('../../hooks/useInfiniteList');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var getAvatarColor = function (name) {
  var hash = 0;
  for (var i = 0; i < (name || '').length; i++) {
    hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
};

var FriendRequestsScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [activeTab, setActiveTab] = useState('received');
  var [receivedStates, setReceivedStates] = useState({});
  var [cancelledSent, setCancelledSent] = useState({});

  var receivedInf = useInfiniteList({
    queryKey: ['friend-requests-received'],
    url: SOCIAL.FRIENDS.PENDING,
    limit: 20,
  });

  var sentInf = useInfiniteList({
    queryKey: ['friend-requests-sent'],
    url: SOCIAL.FRIENDS.SENT,
    limit: 20,
  });

  var normalizeReceived = function (r) {
    var s = r.sender || {};
    var sName =
      s.displayName ||
      s.display_name ||
      s.username ||
      r.name ||
      r.displayName ||
      r.display_name ||
      r.username ||
      'User';
    return Object.assign({}, r, {
      name: sName,
      initial: sName[0].toUpperCase(),
      level: s.level || r.level || 1,
      avatarUrl: s.avatarUrl || s.avatar_url || r.avatarUrl || '',
      mutualFriends: r.mutualFriends || r.mutual_friends || 0,
      time: r.time || r.createdAt || r.created_at || '',
    });
  };

  var normalizeSent = function (r) {
    var recv = r.receiver || r.sender || {};
    var rName =
      recv.displayName ||
      recv.display_name ||
      recv.username ||
      r.name ||
      r.displayName ||
      r.display_name ||
      r.username ||
      'User';
    return Object.assign({}, r, {
      name: rName,
      initial: rName[0].toUpperCase(),
      level: recv.level || r.level || 1,
      avatarUrl: recv.avatarUrl || recv.avatar_url || r.avatarUrl || '',
      time: r.time || r.createdAt || r.created_at || '',
    });
  };

  var receivedRequests = receivedInf.items.map(normalizeReceived);
  var sentRequests = sentInf.items.map(normalizeSent);
  var pendingCount = receivedRequests.filter(function (r) { return !receivedStates[r.id]; }).length;

  var acceptMut = useMutation({
    mutationFn: function (reqId) { return apiPost(SOCIAL.FRIENDS.ACCEPT(reqId)); },
    onMutate: function (reqId) {
      queryClient.cancelQueries({ queryKey: ['friend-requests-received'] });
      var prev = queryClient.getQueryData(['friend-requests-received']);
      setReceivedStates(function (p) {
        return Object.assign({}, p, { [reqId]: 'accepted' });
      });
      return { prev: prev };
    },
    onError: function (err, reqId, ctx) {
      setReceivedStates(function (p) {
        var n = Object.assign({}, p);
        delete n[reqId];
        return n;
      });
      if (ctx && ctx.prev) queryClient.setQueryData(['friend-requests-received'], ctx.prev);
    },
    onSettled: function () {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-received'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests-count'] });
      queryClient.invalidateQueries({ queryKey: ['friends-list'] });
    },
  });

  var handleAccept = useCallback(function (id) {
    acceptMut.mutate(id);
  }, [acceptMut]);

  var declineMut = useMutation({
    mutationFn: function (reqId) { return apiPost(SOCIAL.FRIENDS.REJECT(reqId)); },
    onMutate: function (reqId) {
      queryClient.cancelQueries({ queryKey: ['friend-requests-received'] });
      var prev = queryClient.getQueryData(['friend-requests-received']);
      setReceivedStates(function (p) {
        return Object.assign({}, p, { [reqId]: 'declined' });
      });
      return { prev: prev };
    },
    onError: function (err, reqId, ctx) {
      setReceivedStates(function (p) {
        var n = Object.assign({}, p);
        delete n[reqId];
        return n;
      });
      if (ctx && ctx.prev) queryClient.setQueryData(['friend-requests-received'], ctx.prev);
    },
    onSettled: function () {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-received'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests-count'] });
    },
  });

  var handleDecline = useCallback(function (id) {
    declineMut.mutate(id);
  }, [declineMut]);

  var cancelSentMut = useMutation({
    mutationFn: function (reqId) { return apiDelete(SOCIAL.FRIENDS.CANCEL(reqId)); },
    onMutate: function (reqId) {
      queryClient.cancelQueries({ queryKey: ['friend-requests-sent'] });
      var prev = queryClient.getQueryData(['friend-requests-sent']);
      setCancelledSent(function (p) {
        return Object.assign({}, p, { [reqId]: true });
      });
      return { prev: prev };
    },
    onError: function (err, reqId, ctx) {
      setCancelledSent(function (p) {
        var n = Object.assign({}, p);
        delete n[reqId];
        return n;
      });
      if (ctx && ctx.prev) queryClient.setQueryData(['friend-requests-sent'], ctx.prev);
    },
    onSettled: function () {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
    },
  });

  var handleCancelSent = useCallback(function (id) {
    cancelSentMut.mutate(id);
  }, [cancelSentMut]);

  var renderReceived = useCallback(function (info) {
    var item = info.item;
    var state = receivedStates[item.id];
    if (state) {
      return React.createElement(
        View,
        { style: [styles.requestRow, { opacity: 0.5 }] },
        React.createElement(Avatar, { name: item.name, size: 44, color: getAvatarColor(item.name) }),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 12 } },
          React.createElement(Text, { style: styles.userName }, item.name),
          React.createElement(
            Text,
            { style: styles.stateText },
            state === 'accepted' ? 'Accepted' : 'Declined',
          ),
        ),
      );
    }
    return React.createElement(
      View,
      { style: styles.requestRow },
      React.createElement(Avatar, { name: item.name, src: item.avatarUrl, size: 44, color: getAvatarColor(item.name) }),
      React.createElement(
        View,
        { style: { flex: 1, marginLeft: 12 } },
        React.createElement(Text, { style: styles.userName }, item.name),
        React.createElement(
          Text,
          { style: styles.userMeta },
          'Lvl ' + item.level + (item.mutualFriends > 0 ? ' \u00B7 ' + item.mutualFriends + ' mutual' : ''),
        ),
      ),
      React.createElement(
        TouchableOpacity,
        { style: styles.acceptBtn, onPress: function () { handleAccept(item.id); }, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Accept friend request from ' + item.name },
        React.createElement(Icon, { name: 'check', size: 18, color: '#FFFFFF' }),
      ),
      React.createElement(
        TouchableOpacity,
        { style: styles.declineBtn, onPress: function () { handleDecline(item.id); }, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Decline friend request from ' + item.name },
        React.createElement(Icon, { name: 'x', size: 18, color: COLORS.textSecondary }),
      ),
    );
  }, [receivedStates, handleAccept, handleDecline]);

  var renderSent = useCallback(function (info) {
    var item = info.item;
    if (cancelledSent[item.id]) return null;
    return React.createElement(
      View,
      { style: styles.requestRow },
      React.createElement(Avatar, { name: item.name, src: item.avatarUrl, size: 44, color: getAvatarColor(item.name) }),
      React.createElement(
        View,
        { style: { flex: 1, marginLeft: 12 } },
        React.createElement(Text, { style: styles.userName }, item.name),
        React.createElement(Text, { style: styles.userMeta }, 'Pending'),
      ),
      React.createElement(
        TouchableOpacity,
        { style: styles.cancelBtn, onPress: function () { handleCancelSent(item.id); }, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel friend request to ' + item.name },
        React.createElement(Text, { style: styles.cancelBtnText }, 'Cancel'),
      ),
    );
  }, [cancelledSent, handleCancelSent]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Friend Requests',
      onBack: function () { navigation.goBack(); },
      titleComponent: React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' } },
        React.createElement(Text, { style: styles.headerTitle }, 'Friend Requests'),
        pendingCount > 0
          ? React.createElement(
              View,
              { style: styles.pendingBadge },
              React.createElement(Text, { style: styles.pendingBadgeText }, String(pendingCount)),
            )
          : null,
      ),
    }),

    // Tabs
    React.createElement(
      View,
      { style: styles.tabRow },
      React.createElement(
        TouchableOpacity,
        {
          style: [styles.tab, activeTab === 'received' && styles.tabActive],
          onPress: function () { setActiveTab('received'); },
          accessible: true,
          accessibilityRole: 'tab',
          accessibilityLabel: 'Received, ' + receivedRequests.length + ' requests',
          accessibilityState: { selected: activeTab === 'received' },
        },
        React.createElement(
          Text,
          { style: [styles.tabText, activeTab === 'received' && styles.tabTextActive] },
          'Received (' + receivedRequests.length + ')',
        ),
      ),
      React.createElement(
        TouchableOpacity,
        {
          style: [styles.tab, activeTab === 'sent' && styles.tabActive],
          onPress: function () { setActiveTab('sent'); },
          accessible: true,
          accessibilityRole: 'tab',
          accessibilityLabel: 'Sent, ' + sentRequests.length + ' requests',
          accessibilityState: { selected: activeTab === 'sent' },
        },
        React.createElement(
          Text,
          { style: [styles.tabText, activeTab === 'sent' && styles.tabTextActive] },
          'Sent (' + sentRequests.length + ')',
        ),
      ),
    ),

    // Content
    activeTab === 'received'
      ? React.createElement(FlatList, {
          data: receivedRequests,
          renderItem: renderReceived,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100 },
          showsVerticalScrollIndicator: false,
          ListEmptyComponent: React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Text, { style: styles.emptyText }, 'No pending requests'),
          ),
        })
      : React.createElement(FlatList, {
          data: sentRequests,
          renderItem: renderSent,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100 },
          showsVerticalScrollIndicator: false,
          ListEmptyComponent: React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Text, { style: styles.emptyText }, 'No sent requests'),
          ),
        }),
  );
};

var styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  pendingBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  userMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});

module.exports = FriendRequestsScreen;
