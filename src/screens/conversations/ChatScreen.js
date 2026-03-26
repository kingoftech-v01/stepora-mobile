/**
 * ChatScreen — Friend-to-friend chat (1:1).
 * Uses FRIEND_CHAT endpoints. Resolves friend info from conversation or /start/.
 * Uses friend's display_name from user profile, NOT from buddy pairing.
 * Synced with web: useFriendChatScreen.js pattern.
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
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { FRIEND_CHAT, USERS } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

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

var ChatScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var queryClient = useQueryClient();

  // Route params: can receive conversationId (existing conv) or friendId (start new)
  var paramConvId = route.params && route.params.conversationId;
  var paramFriendId = route.params && route.params.friendId;
  var chatTitle = (route.params && route.params.title) || 'Chat';

  // State for resolved conversation + friend info
  var [convId, setConvId] = useState(paramConvId || null);
  var [friendInfo, setFriendInfo] = useState(null);
  var [initLoading, setInitLoading] = useState(true);
  var [initError, setInitError] = useState(null);

  var [inputText, setInputText] = useState('');
  var [sending, setSending] = useState(false);
  var [messages, setMessages] = useState([]);
  var [hasMore, setHasMore] = useState(false);
  var [loadingMore, setLoadingMore] = useState(false);
  var [nextOffset, setNextOffset] = useState(0);
  var flatListRef = useRef(null);

  // Resolve conversation: try DETAIL first, then START
  var id = paramConvId || paramFriendId;
  useEffect(
    function () {
      if (!id || id === 'undefined') {
        setInitError('No friend selected');
        setInitLoading(false);
        return;
      }
      var cancelled = false;
      setInitLoading(true);
      setInitError(null);

      // Step 1: If we have a conversationId, fetch conversation detail
      if (paramConvId) {
        apiGet(FRIEND_CHAT.DETAIL(paramConvId))
          .then(function (conv) {
            if (cancelled) return;
            setConvId(conv.id);
            var tu = conv.targetUser || conv.target_user;
            if (tu) {
              setFriendInfo({
                id: tu.id,
                displayName: tu.displayName || tu.display_name || 'Unknown',
                avatar: tu.avatar || tu.avatarUrl || '',
              });
            }
            setInitLoading(false);
          })
          .catch(function () {
            if (cancelled) return;
            // If DETAIL fails, try START with this ID as user ID
            apiPost(FRIEND_CHAT.START, { targetUserId: paramConvId })
              .then(function (conv) {
                if (cancelled) return;
                setConvId(conv.id);
                var tu = conv.targetUser || conv.target_user;
                if (tu) {
                  setFriendInfo({
                    id: tu.id,
                    displayName: tu.displayName || tu.display_name || 'Unknown',
                    avatar: tu.avatar || tu.avatarUrl || '',
                  });
                }
                setInitLoading(false);
              })
              .catch(function (err) {
                if (cancelled) return;
                setInitError('Could not load conversation');
                setInitLoading(false);
              });
          });
      } else if (paramFriendId) {
        // Step 2: Start or get conversation with friend
        apiPost(FRIEND_CHAT.START, { targetUserId: paramFriendId })
          .then(function (conv) {
            if (cancelled) return;
            setConvId(conv.id);
            var tu = conv.targetUser || conv.target_user;
            if (tu) {
              setFriendInfo({
                id: tu.id,
                displayName: tu.displayName || tu.display_name || 'Unknown',
                avatar: tu.avatar || tu.avatarUrl || '',
              });
            } else {
              // Fetch user profile as last resort
              apiGet(USERS.PROFILE(paramFriendId))
                .then(function (u) {
                  if (cancelled) return;
                  setFriendInfo({
                    id: u.id,
                    displayName: u.displayName || u.display_name || 'Unknown',
                    avatar: u.avatar || u.avatarUrl || '',
                  });
                })
                .catch(function () {});
            }
            setInitLoading(false);
          })
          .catch(function (err) {
            if (cancelled) return;
            setFriendInfo({ id: paramFriendId, displayName: chatTitle });
            setInitError('Could not start conversation');
            setInitLoading(false);
          });
      }

      return function () {
        cancelled = true;
      };
    },
    [paramConvId, paramFriendId],
  );

  var friendName = (friendInfo && friendInfo.displayName) || chatTitle;

  // Map API message to internal format
  var mapMsg = function (m) {
    var sid = m.senderId || (m.metadata && (m.metadata.senderId || m.metadata.sender_id)) || '';
    var role = m.role || '';
    if (role === 'system' && !(m.content || m.text)) return null;
    return {
      id: String(m.id),
      content: m.content || m.text || '',
      isUser: String(sid) === String(route.params && route.params.userId) || m.isUser || false,
      time: m.createdAt || m.created_at || m.time || new Date().toISOString(),
      pinned: !!(m.pinned || m.isPinned || m.is_pinned),
      read: m.read !== false,
      audioUrl: m.audioUrl || m.audio_url || '',
      audioDuration: m.audioDuration || m.audio_duration || null,
    };
  };

  // Fetch messages
  var messagesQuery = useQuery({
    queryKey: ['friend-messages', convId],
    queryFn: function () {
      return apiGet(FRIEND_CHAT.MESSAGES(convId) + '?limit=' + PAGE_SIZE);
    },
    enabled: !!convId && !initLoading,
    refetchInterval: 10000,
  });

  // Sync messages from query
  useEffect(
    function () {
      if (messagesQuery.data) {
        var raw = messagesQuery.data;
        var list = raw.results || raw || [];
        setMessages(list.map(mapMsg).filter(Boolean));
        setNextOffset(list.length);
        setHasMore(!!raw.next);
      }
    },
    [messagesQuery.data],
  );

  // Mark as read on mount
  useEffect(
    function () {
      if (convId && !initLoading) {
        apiPost(FRIEND_CHAT.MARK_READ(convId)).catch(function () {});
        queryClient.invalidateQueries({ queryKey: ['friend-conversations'] });
      }
    },
    [convId, initLoading],
  );

  // Load older messages
  var loadOlder = useCallback(
    function () {
      if (loadingMore || !hasMore || !convId) return;
      setLoadingMore(true);
      apiGet(FRIEND_CHAT.MESSAGES(convId) + '?limit=' + PAGE_SIZE + '&offset=' + nextOffset)
        .then(function (raw) {
          var list = raw.results || raw || [];
          if (list.length > 0) {
            setMessages(function (prev) {
              return list.map(mapMsg).filter(Boolean).concat(prev);
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
    [loadingMore, hasMore, convId, nextOffset],
  );

  var handleSend = useCallback(
    function () {
      var text = inputText.trim();
      if (!text || sending || !convId) return;

      setSending(true);
      setInputText('');

      // Optimistic local message
      var optimistic = {
        id: 'local-' + Date.now(),
        content: text,
        isUser: true,
        time: new Date().toISOString(),
        pinned: false,
        read: false,
        _local: true,
      };
      setMessages(function (prev) {
        return prev.concat([optimistic]);
      });

      apiPost(FRIEND_CHAT.SEND_MESSAGE(convId), { content: text })
        .then(function () {
          queryClient.invalidateQueries({ queryKey: ['friend-messages', convId] });
          queryClient.invalidateQueries({ queryKey: ['friend-conversations'] });
          setMessages(function (prev) {
            return prev.filter(function (m) {
              return m.id !== optimistic.id;
            });
          });
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
    [inputText, sending, convId, queryClient],
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
          !isUser
            ? React.createElement(Avatar, {
                name: friendName,
                src: friendInfo && friendInfo.avatar,
                size: 32,
                color: COLORS.teal || '#14B8A6',
                style: { marginRight: 8 },
              })
            : null,
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
      );
    },
    [reversedMessages, friendName, friendInfo],
  );

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  // Error state
  if (initError && !convId) {
    return React.createElement(
      ScreenShell,
      null,
      React.createElement(GlassHeader, {
        title: friendName,
        onBack: function () {
          navigation.goBack();
        },
      }),
      React.createElement(
        View,
        { style: styles.loadingWrap },
        React.createElement(
          Text,
          { style: { color: COLORS.textSecondary, fontSize: 14 } },
          initError,
        ),
      ),
    );
  }

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: friendName,
      onBack: function () {
        navigation.goBack();
      },
      rightActions: [
        {
          icon: 'phone',
          label: 'Voice call',
          onPress: function () {
            var friendUserId = (friendInfo && friendInfo.id) || paramFriendId;
            apiPost(FRIEND_CHAT.CALLS.INITIATE, { calleeId: friendUserId, callType: 'voice' })
              .then(function (data) {
                var callId = data.callId || data.id;
                navigation.navigate('VoiceCall', {
                  callId: callId,
                  friendName: friendName,
                });
              })
              .catch(function (err) {
                logger.error('[Chat] voice call failed:', err);
              });
          },
        },
        {
          icon: 'video',
          label: 'Video call',
          onPress: function () {
            var friendUserId = (friendInfo && friendInfo.id) || paramFriendId;
            apiPost(FRIEND_CHAT.CALLS.INITIATE, { calleeId: friendUserId, callType: 'video' })
              .then(function (data) {
                var callId = data.callId || data.id;
                navigation.navigate('VideoCall', {
                  callId: callId,
                  friendName: friendName,
                });
              })
              .catch(function (err) {
                logger.error('[Chat] video call failed:', err);
              });
          },
        },
      ],
    }),

    React.createElement(
      KeyboardAvoidingView,
      {
        style: { flex: 1 },
        behavior: Platform.OS === 'ios' ? 'padding' : 'height',
        keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 0,
      },
      // Messages list (inverted)
      initLoading || messagesQuery.isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap },
            React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
          )
        : React.createElement(FlatList, {
            ref: flatListRef,
            data: reversedMessages,
            renderItem: renderMessage,
            keyExtractor: keyExtractor,
            inverted: true,
            contentContainerStyle: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
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
          maxLength: 2000,
          onSubmitEditing: handleSend,
          blurOnSubmit: false,
          accessible: true,
          accessibilityLabel: 'Message input',
          accessibilityHint: 'Type a message to send',
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
    marginBottom: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  msgBubble: {
    maxWidth: '75%',
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

module.exports = ChatScreen;
