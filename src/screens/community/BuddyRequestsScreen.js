/**
 * BuddyRequestsScreen — Accountability buddy requests.
 * Tabs: Received / Sent.
 * Accept, decline, cancel actions.
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiDelete } = require('../../services/api');
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

var BuddyRequestsScreen = function () {
  var navigation = useNavigation();
  var qc = useQueryClient();
  var [activeTab, setActiveTab] = useState('received');

  // ── Fetch buddy history (includes pending requests) ──
  var historyQuery = useQuery({
    queryKey: ['buddy-history'],
    queryFn: function () {
      return apiGet(BUDDIES.HISTORY);
    },
  });
  var allRequests = (function () {
    var d = historyQuery.data;
    var list = (d && d.results) || d || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  // Separate received vs sent pending requests
  var received = allRequests.filter(function (req) {
    return req.status === 'pending' && req.direction === 'received';
  });
  var sent = allRequests.filter(function (req) {
    return req.status === 'pending' && req.direction === 'sent';
  });

  var requests = activeTab === 'received' ? received : sent;

  // ── Mutations ──
  var acceptMut = useMutation({
    mutationFn: function (id) {
      return apiPost(BUDDIES.ACCEPT(id));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['buddy-history'] });
      qc.invalidateQueries({ queryKey: ['buddy-current'] });
      Alert.alert('Accepted', 'You now have an accountability buddy!');
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to accept request');
    },
  });

  var rejectMut = useMutation({
    mutationFn: function (id) {
      return apiPost(BUDDIES.REJECT(id));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['buddy-history'] });
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to decline request');
    },
  });

  var cancelMut = useMutation({
    mutationFn: function (id) {
      return apiDelete(BUDDIES.DELETE(id));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['buddy-history'] });
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to cancel request');
    },
  });

  var handleAccept = useCallback(function (id) {
    acceptMut.mutate(id);
  }, [acceptMut]);

  var handleDecline = useCallback(function (id) {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this buddy request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: function () { rejectMut.mutate(id); },
        },
      ],
    );
  }, [rejectMut]);

  var handleCancel = useCallback(function (id) {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this buddy request?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: function () { cancelMut.mutate(id); },
        },
      ],
    );
  }, [cancelMut]);

  var renderReceivedCard = useCallback(function (info) {
    var req = info.item;
    var user = req.fromUser || req.otherUser || req.user || {};
    var userName = user.displayName || user.display_name || user.username || 'User';
    var message = req.message || req.note || '';
    var time = req.createdAt || req.created_at || req.sentAt;
    var isProcessing = acceptMut.isPending || rejectMut.isPending;

    return React.createElement(
      GlassCard,
      { style: { marginHorizontal: SPACING.lg } },
      // User info row
      React.createElement(
        TouchableOpacity,
        {
          style: styles.userRow,
          onPress: function () {
            if (user.id) navigation.navigate('UserProfile', { userId: user.id });
          },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: userName + (user.level ? ', Level ' + user.level : '') + (time ? ', ' + formatRelativeTime(time) : '') + ', view profile', accessibilityHint: 'Double tap to view profile',
        },
        React.createElement(Avatar, {
          name: userName,
          src: user.avatar,
          size: 48,
          color: avatarColor(userName),
        }),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 12 }, accessible: false },
          React.createElement(Text, { style: styles.userName }, userName),
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', marginTop: 2 } },
            user.level
              ? React.createElement(
                  Text,
                  { style: styles.userMeta },
                  'Level ' + user.level,
                )
              : null,
            time
              ? React.createElement(
                  Text,
                  { style: styles.userMeta },
                  (user.level ? ' \u00B7 ' : '') + formatRelativeTime(time),
                )
              : null,
          ),
        ),
      ),

      // Message
      message
        ? React.createElement(
            View,
            { style: styles.messageWrap },
            React.createElement(Icon, { name: 'message-circle', size: 14, color: COLORS.textMuted }),
            React.createElement(Text, { style: styles.messageText }, message),
          )
        : null,

      // Accept / Decline buttons
      React.createElement(
        View,
        { style: styles.actionRow },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.declineBtn,
            onPress: function () { handleDecline(req.id); },
            disabled: isProcessing,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Decline buddy request from ' + userName, accessibilityState: { disabled: isProcessing },
          },
          React.createElement(Icon, { name: 'x', size: 16, color: COLORS.red }),
          React.createElement(Text, { style: styles.declineBtnText }, 'Decline'),
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.acceptBtn,
            onPress: function () { handleAccept(req.id); },
            disabled: isProcessing,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Accept buddy request from ' + userName, accessibilityState: { disabled: isProcessing },
          },
          isProcessing
            ? React.createElement(ActivityIndicator, { size: 'small', color: '#FFFFFF' })
            : React.createElement(
                View,
                { style: { flexDirection: 'row', alignItems: 'center' } },
                React.createElement(Icon, { name: 'check', size: 16, color: '#FFFFFF' }),
                React.createElement(Text, { style: styles.acceptBtnText }, 'Accept'),
              ),
        ),
      ),
    );
  }, [navigation, handleAccept, handleDecline, acceptMut.isPending, rejectMut.isPending]);

  var renderSentCard = useCallback(function (info) {
    var req = info.item;
    var user = req.toUser || req.otherUser || req.user || {};
    var userName = user.displayName || user.display_name || user.username || 'User';
    var time = req.createdAt || req.created_at || req.sentAt;

    return React.createElement(
      GlassCard,
      { style: { marginHorizontal: SPACING.lg } },
      React.createElement(
        TouchableOpacity,
        {
          style: styles.userRow,
          onPress: function () {
            if (user.id) navigation.navigate('UserProfile', { userId: user.id });
          },
          accessible: true, accessibilityRole: 'button', accessibilityLabel: userName + ', pending' + (time ? ', ' + formatRelativeTime(time) : ''), accessibilityHint: 'Double tap to view profile',
        },
        React.createElement(Avatar, {
          name: userName,
          src: user.avatar,
          size: 48,
          color: avatarColor(userName),
        }),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 12 }, accessible: false },
          React.createElement(Text, { style: styles.userName }, userName),
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', marginTop: 2 } },
            React.createElement(
              View,
              { style: styles.pendingBadge },
              React.createElement(Text, { style: styles.pendingText }, 'Pending'),
            ),
            time
              ? React.createElement(
                  Text,
                  { style: styles.userMeta },
                  ' \u00B7 ' + formatRelativeTime(time),
                )
              : null,
          ),
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.cancelBtn,
            onPress: function () { handleCancel(req.id); },
            disabled: cancelMut.isPending,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel buddy request to ' + userName, accessibilityState: { disabled: cancelMut.isPending }, hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
          },
          React.createElement(Icon, { name: 'x-circle', size: 18, color: COLORS.red }),
        ),
      ),
    );
  }, [navigation, handleCancel, cancelMut.isPending]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  var tabs = [
    { key: 'received', label: 'Received (' + received.length + ')' },
    { key: 'sent', label: 'Sent (' + sent.length + ')' },
  ];

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Buddy Requests',
      onBack: function () { navigation.goBack(); },
    }),

    // ── Tabs ──
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
            accessible: true, accessibilityRole: 'tab', accessibilityLabel: tab.label, accessibilityState: { selected: isActive },
          },
          React.createElement(
            Text,
            { style: [styles.tabText, isActive && styles.tabTextActive] },
            tab.label,
          ),
        );
      }),
    ),

    // ── List ──
    historyQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Loading buddy requests' }),
        )
      : React.createElement(FlatList, {
          data: requests,
          renderItem: activeTab === 'received' ? renderReceivedCard : renderSentCard,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100, paddingTop: 8 },
          showsVerticalScrollIndicator: false,
          ListEmptyComponent: React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Icon, {
              name: activeTab === 'received' ? 'inbox' : 'send',
              size: 48,
              color: COLORS.textMuted,
            }),
            React.createElement(
              Text,
              { style: styles.emptyText },
              activeTab === 'received'
                ? 'No buddy requests received'
                : 'No pending requests sent',
            ),
            React.createElement(
              Text,
              { style: styles.emptySubtext },
              activeTab === 'received'
                ? 'When someone wants to be your buddy, you\'ll see it here'
                : 'Find a buddy match to send a request',
            ),
            activeTab === 'sent'
              ? React.createElement(
                  TouchableOpacity,
                  {
                    style: styles.findBtn,
                    onPress: function () { navigation.navigate('FindBuddy'); },
                    accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Find a buddy',
                  },
                  React.createElement(Text, { style: styles.findBtnText }, 'Find a Buddy'),
                )
              : null,
          ),
        }),
  );
};

var styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  userMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  messageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10,
    marginRight: 8,
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.red,
    marginLeft: 6,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.purple,
    borderRadius: 10,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(252,211,77,0.12)',
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.yellow,
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  findBtn: {
    marginTop: 20,
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

module.exports = BuddyRequestsScreen;
