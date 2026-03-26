/**
 * GroupChatScreen — Circle group chat with REST messaging + polling.
 * Uses CIRCLES endpoints. Identifies user messages via AuthContext.
 * Uses display_name from user profile for sender names.
 * Synced with web: useCircleChatScreen.js pattern.
 */
var React = require('react');
var { useState, useCallback, useEffect, useRef } = React;
var logger = require('../../utils/logger');
var {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { CIRCLES } = require('../../services/endpoints');
var { useAuth } = require('../../context/AuthContext');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');

var MEMBER_COLORS = [
  '#8B5CF6',
  '#14B8A6',
  '#EC4899',
  '#3B82F6',
  '#F59E0B',
  '#10B981',
  '#6366F1',
  '#F97316',
];

var hashCode = function (s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
};

var getMemberColor = function (id) {
  return MEMBER_COLORS[Math.abs(hashCode(String(id || ''))) % MEMBER_COLORS.length];
};

var formatTime = function (dateStr) {
  if (!dateStr) return '';
  var d = typeof dateStr === 'object' ? dateStr : new Date(dateStr);
  var hours = d.getHours();
  var mins = d.getMinutes();
  return (hours < 10 ? '0' : '') + hours + ':' + (mins < 10 ? '0' : '') + mins;
};

var formatDateLabel = function (dateStr) {
  var d = typeof dateStr === 'object' ? dateStr : new Date(dateStr);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var diff = Math.floor((today - msgDay) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

var shouldShowDate = function (messages, index) {
  if (index === messages.length - 1) return true;
  var current = new Date(messages[index].time);
  var next = new Date(messages[index + 1].time);
  return current.toDateString() !== next.toDateString();
};

var PAGE_SIZE = 50;

var GroupChatScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var { user } = useAuth();
  var circleId = route.params && route.params.circleId;
  var chatTitle = (route.params && route.params.title) || 'Group Chat';
  var [inputText, setInputText] = useState('');
  var [sending, setSending] = useState(false);
  var [messages, setMessages] = useState([]);
  var [initLoading, setInitLoading] = useState(true);
  var [hasMore, setHasMore] = useState(false);
  var [loadingMore, setLoadingMore] = useState(false);
  var [nextOffset, setNextOffset] = useState(0);
  var flatListRef = useRef(null);
  var membersMapRef = useRef({});
  var pollRef = useRef(null);

  // Fetch circle details for member info
  var circleQuery = useQuery({
    queryKey: ['circle', circleId],
    queryFn: function () {
      return apiGet(CIRCLES.DETAIL(circleId));
    },
    enabled: !!circleId,
  });

  var rawCircleData = circleQuery.data || {};
  var circle = rawCircleData.circle || rawCircleData;
  var circleName = circle.name || chatTitle;
  var memberCount = (circle.members && circle.members.length) || circle.memberCount || 0;

  // Build members map
  useEffect(
    function () {
      if (circle.members) {
        var map = {};
        circle.members.forEach(function (m) {
          var u = m.user || m;
          map[String(u.id)] = {
            name:
              u.displayName || u.display_name || u.username || u.name || 'Member',
            initial: (
              u.displayName ||
              u.display_name ||
              u.username ||
              u.name ||
              'M'
            )[0].toUpperCase(),
          };
        });
        membersMapRef.current = map;
      }
    },
    [circle.members],
  );

  var getSenderInfo = function (senderId) {
    var m = membersMapRef.current[String(senderId)];
    if (m) return m;
    return { name: 'Member', initial: 'M' };
  };

  var mapMsg = function (m) {
    var sender = m.sender || m.user || {};
    var sid = String(sender.id || m.senderId || '');
    var info = getSenderInfo(sid);
    return {
      id: String(m.id),
      content: m.content || m.text || '',
      senderId: sid,
      senderName:
        sender.displayName ||
        sender.display_name ||
        sender.username ||
        sender.name ||
        info.name,
      senderInitial: (
        sender.displayName ||
        sender.display_name ||
        sender.username ||
        sender.name ||
        info.name
      )[0].toUpperCase(),
      senderColor: getMemberColor(sid),
      isUser: sid === String(user && user.id),
      time: m.createdAt || m.timestamp || new Date().toISOString(),
    };
  };

  // Fetch initial messages
  useEffect(
    function () {
      if (!circleId) return;
      setInitLoading(true);
      apiGet(CIRCLES.CHAT(circleId) + '?limit=' + PAGE_SIZE)
        .then(function (raw) {
          var list = raw.results || raw || [];
          setMessages(list.map(mapMsg));
          setNextOffset(list.length);
          setHasMore(!!raw.next);
          setInitLoading(false);
        })
        .catch(function (err) {
          logger.error('[GroupChat] init:', err);
          setInitLoading(false);
        });
    },
    [circleId],
  );

  // Poll for new messages (since mobile doesn't have Agora RTM)
  useEffect(
    function () {
      if (!circleId || initLoading) return;
      pollRef.current = setInterval(function () {
        apiGet(CIRCLES.CHAT(circleId) + '?limit=' + PAGE_SIZE)
          .then(function (raw) {
            var list = raw.results || raw || [];
            if (list.length > 0) {
              setMessages(list.map(mapMsg));
            }
          })
          .catch(function () {});
      }, 8000);
      return function () {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    },
    [circleId, initLoading],
  );

  var loadOlder = useCallback(
    function () {
      if (loadingMore || !hasMore || !circleId) return;
      setLoadingMore(true);
      apiGet(CIRCLES.CHAT(circleId) + '?limit=' + PAGE_SIZE + '&offset=' + nextOffset)
        .then(function (raw) {
          var list = raw.results || raw || [];
          if (list.length > 0) {
            setMessages(function (prev) {
              return list.map(mapMsg).concat(prev);
            });
            setNextOffset(function (prev) {
              return prev + list.length;
            });
          }
          setHasMore(!!raw.next);
        })
        .catch(function () {})
        .finally(function () {
          setLoadingMore(false);
        });
    },
    [loadingMore, hasMore, circleId, nextOffset],
  );

  var handleSend = useCallback(
    function () {
      var text = inputText.trim();
      if (!text || sending || !circleId) return;

      setSending(true);
      setInputText('');

      var displayName = (user && (user.displayName || user.display_name || user.username)) || 'You';

      // Optimistic local message
      var optimistic = {
        id: 'local-' + Date.now(),
        content: text,
        senderId: String(user && user.id),
        senderName: displayName,
        senderInitial: displayName[0].toUpperCase(),
        senderColor: getMemberColor(user && user.id),
        isUser: true,
        time: new Date().toISOString(),
        _local: true,
      };
      setMessages(function (prev) {
        return prev.concat([optimistic]);
      });

      apiPost(CIRCLES.CHAT_SEND(circleId), { content: text })
        .then(function () {
          setMessages(function (prev) {
            return prev.filter(function (m) {
              return m.id !== optimistic.id;
            });
          });
          // Refresh messages
          apiGet(CIRCLES.CHAT(circleId) + '?limit=' + PAGE_SIZE)
            .then(function (raw) {
              var list = raw.results || raw || [];
              if (list.length > 0) setMessages(list.map(mapMsg));
            })
            .catch(function () {});
        })
        .catch(function () {
          setMessages(function (prev) {
            return prev.map(function (m) {
              return m.id === optimistic.id
                ? Object.assign({}, m, { _failed: true })
                : m;
            });
          });
        });

      setSending(false);
    },
    [inputText, sending, circleId, user],
  );

  // Reversed messages for inverted FlatList
  var reversedMessages = messages.slice().reverse();

  var renderMessage = useCallback(
    function (info) {
      var item = info.item;
      var index = info.index;
      var isUser = item.isUser;
      var showDate = shouldShowDate(reversedMessages, index);

      return React.createElement(
        View,
        null,
        showDate
          ? React.createElement(
              View,
              { style: styles.dateSeparator },
              React.createElement(
                View,
                { style: styles.datePill },
                React.createElement(
                  Text,
                  { style: styles.dateText },
                  formatDateLabel(item.time),
                ),
              ),
            )
          : null,

        React.createElement(
          View,
          {
            style: [
              styles.msgRow,
              isUser ? styles.msgRowUser : styles.msgRowOther,
            ],
          },
          // Sender avatar (non-user messages)
          !isUser
            ? React.createElement(
                View,
                { style: [styles.senderAvatar, { backgroundColor: item.senderColor + '20', borderColor: item.senderColor + '40' }] },
                React.createElement(
                  Text,
                  { style: [styles.senderAvatarText, { color: item.senderColor }] },
                  item.senderInitial,
                ),
              )
            : null,

          React.createElement(
            View,
            { style: { maxWidth: '75%' } },
            // Sender name
            !isUser
              ? React.createElement(
                  Text,
                  { style: [styles.senderName, { color: item.senderColor }] },
                  item.senderName,
                )
              : null,
            // Bubble
            React.createElement(
              View,
              {
                style: [
                  styles.msgBubble,
                  isUser ? styles.msgBubbleUser : styles.msgBubbleOther,
                  item._failed ? { opacity: 0.5 } : null,
                ],
              },
              React.createElement(
                Text,
                { style: [styles.msgText, isUser ? styles.msgTextUser : null] },
                item.content,
              ),
              React.createElement(
                View,
                { style: styles.msgMeta },
                React.createElement(
                  Text,
                  { style: [styles.msgTime, isUser ? { color: 'rgba(255,255,255,0.6)' } : null] },
                  formatTime(item.time),
                ),
                item._failed
                  ? React.createElement(Icon, {
                      name: 'alert-circle',
                      size: 12,
                      color: COLORS.red,
                      style: { marginLeft: 4 },
                    })
                  : null,
              ),
            ),
          ),
        ),
      );
    },
    [reversedMessages],
  );

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: circleName,
      onBack: function () {
        navigation.goBack();
      },
      rightActions: [
        {
          icon: 'users',
          label: 'View members',
          onPress: function () {
            if (circleId) {
              navigation.navigate('CircleDetail', { circleId: circleId });
            }
          },
        },
      ],
      titleComponent: React.createElement(
        View,
        null,
        React.createElement(
          Text,
          { style: styles.headerTitle, numberOfLines: 1 },
          circleName,
        ),
        React.createElement(
          Text,
          { style: styles.headerSub },
          memberCount > 0 ? memberCount + ' members' : 'Group chat',
        ),
      ),
    }),

    React.createElement(
      KeyboardAvoidingView,
      {
        style: { flex: 1 },
        behavior: Platform.OS === 'ios' ? 'padding' : 'height',
        keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 0,
      },

      // Messages
      initLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
            React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple, accessibilityLabel: 'Loading messages' }),
          )
        : React.createElement(FlatList, {
            ref: flatListRef,
            data: reversedMessages,
            renderItem: renderMessage,
            keyExtractor: keyExtractor,
            inverted: true,
            contentContainerStyle: {
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.md,
            },
            showsVerticalScrollIndicator: false,
            onEndReached: function () {
              if (hasMore && !loadingMore) loadOlder();
            },
            onEndReachedThreshold: 0.3,
            ListFooterComponent: loadingMore
              ? React.createElement(
                  View,
                  { style: { paddingVertical: 12 } },
                  React.createElement(ActivityIndicator, {
                    size: 'small',
                    color: COLORS.purple,
                  }),
                )
              : null,
          }),

      // Input bar
      React.createElement(
        View,
        { style: styles.inputBar },
        React.createElement(TextInput, {
          style: styles.textInput,
          placeholder: 'Type a message...',
          placeholderTextColor: COLORS.textMuted,
          value: inputText,
          onChangeText: setInputText,
          multiline: true,
          maxLength: 5000,
          onSubmitEditing: handleSend,
          blurOnSubmit: false,
          accessible: true,
          accessibilityLabel: 'Type a message',
        }),
        React.createElement(
          TouchableOpacity,
          {
            style: [
              styles.sendBtn,
              inputText.trim() ? styles.sendBtnActive : null,
            ],
            onPress: handleSend,
            disabled: !inputText.trim() || sending,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Send message',
            accessibilityState: { disabled: !inputText.trim() || sending },
          },
          React.createElement(Icon, {
            name: 'send',
            size: 18,
            color: inputText.trim() ? '#FFFFFF' : COLORS.textMuted,
          }),
        ),
      ),
    ),
  );
};

var styles = StyleSheet.create({
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  datePill: {
    backgroundColor: COLORS.glassBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  senderAvatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    paddingLeft: 4,
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  msgBubbleUser: {
    backgroundColor: COLORS.purple,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  msgTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    marginRight: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.purple,
  },
});

module.exports = GroupChatScreen;
