/**
 * ChatScreen — Individual chat with messages.
 * Uses FlatList (inverted) + KeyboardAvoidingView for input.
 * Real-time messages via WebSocket.
 */
var React = require('react');
var { useState, useCallback, useEffect, useRef } = React;
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
var { CONVERSATIONS, WS } = require('../../services/endpoints');
var useChatSocket = require('../../hooks/useChatSocket');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');
var { getAccessToken } = require('../../services/api');
var AdBanner = require('../../components/AdBanner');

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var formatTime = function (dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var hours = d.getHours();
  var mins = d.getMinutes();
  return (hours < 10 ? '0' : '') + hours + ':' + (mins < 10 ? '0' : '') + mins;
};

var ChatScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var conversationId = route.params && route.params.conversationId;
  var chatTitle = (route.params && route.params.title) || 'Chat';
  var queryClient = useQueryClient();
  var [inputText, setInputText] = useState('');
  var [sending, setSending] = useState(false);
  var [localMessages, setLocalMessages] = useState([]);
  var flatListRef = useRef(null);
  var token = getAccessToken();

  // Fetch messages
  var messagesQuery = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: function () {
      return apiGet(CONVERSATIONS.MESSAGES(conversationId));
    },
    enabled: !!conversationId,
    refetchInterval: 15000,
  });

  var serverMessages = (function () {
    var data = messagesQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  // Merge server + local optimistic messages
  var allMessages = serverMessages.concat(localMessages);

  // WebSocket for real-time messages
  var wsPath = conversationId ? WS.AI_CHAT(conversationId) : null;
  var chat = useChatSocket(wsPath, token, {
    onMessage: function (data) {
      if (data && data.message) {
        // Invalidate to get fresh data
        queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
        // Remove optimistic message if it matches
        setLocalMessages(function (prev) {
          return prev.filter(function (m) {
            return m.content !== data.message.content;
          });
        });
      }
    },
  });

  // Mark as read on mount
  useEffect(
    function () {
      if (conversationId) {
        apiPost(CONVERSATIONS.MARK_READ(conversationId)).catch(function () {});
      }
    },
    [conversationId],
  );

  var handleSend = useCallback(
    function () {
      var text = inputText.trim();
      if (!text || sending) return;

      setSending(true);
      setInputText('');

      // Optimistic local message
      var optimistic = {
        id: 'local-' + Date.now(),
        content: text,
        isUser: true,
        createdAt: new Date().toISOString(),
        _local: true,
      };
      setLocalMessages(function (prev) {
        return prev.concat([optimistic]);
      });

      // Try WebSocket first, fall back to REST
      var wsSent = chat.sendMessage(text);
      if (!wsSent) {
        apiPost(CONVERSATIONS.SEND_MESSAGE(conversationId), { content: text })
          .then(function () {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
            setLocalMessages(function (prev) {
              return prev.filter(function (m) {
                return m.id !== optimistic.id;
              });
            });
          })
          .catch(function () {
            // Mark failed
            setLocalMessages(function (prev) {
              return prev.map(function (m) {
                return m.id === optimistic.id
                  ? Object.assign({}, m, { _failed: true })
                  : m;
              });
            });
          });
      }
      setSending(false);
    },
    [inputText, sending, conversationId, chat, queryClient],
  );

  var renderMessage = useCallback(function (info) {
    var item = info.item;
    var isUser = item.isUser || item.role === 'user';
    var content = item.content || item.text || '';
    var time = formatTime(item.createdAt);

    return React.createElement(
      View,
      {
        style: [
          styles.msgRow,
          isUser ? styles.msgRowUser : styles.msgRowOther,
        ],
      },
      !isUser
        ? React.createElement(Avatar, {
            name: chatTitle,
            size: 32,
            color: avatarColor(chatTitle),
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
          content,
        ),
        React.createElement(
          View,
          { style: styles.msgMeta },
          React.createElement(
            Text,
            { style: styles.msgTime },
            time,
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
    );
  }, [chatTitle]);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: chatTitle,
      onBack: function () {
        navigation.goBack();
      },
      rightActions: [
        {
          icon: 'phone',
          label: 'Voice call',
          onPress: function () {
            navigation.navigate('VoiceCall', { conversationId: conversationId, title: chatTitle });
          },
        },
        {
          icon: 'video',
          label: 'Video call',
          onPress: function () {
            navigation.navigate('VideoCall', { conversationId: conversationId, title: chatTitle });
          },
        },
      ],
      titleComponent: React.createElement(
        View,
        null,
        React.createElement(
          Text,
          { style: styles.headerTitle, numberOfLines: 1 },
          chatTitle,
        ),
        chat.connected
          ? React.createElement(
              Text,
              { style: styles.headerStatus },
              'Online',
            )
          : null,
      ),
    }),

    React.createElement(
      KeyboardAvoidingView,
      {
        style: { flex: 1 },
        behavior: Platform.OS === 'ios' ? 'padding' : 'height',
        keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 0,
      },
      // Messages list (inverted)
      messagesQuery.isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap },
            React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
          )
        : React.createElement(FlatList, {
            ref: flatListRef,
            data: allMessages.slice().reverse(),
            renderItem: renderMessage,
            keyExtractor: keyExtractor,
            inverted: true,
            contentContainerStyle: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
            showsVerticalScrollIndicator: false,
          }),

      // Ad banner above input
      React.createElement(AdBanner, { size: 'small', style: { marginHorizontal: SPACING.sm, marginBottom: 0, borderRadius: 8 } }),

      // Input bar
      React.createElement(
        View,
        { style: styles.inputBar },
        React.createElement(
          TouchableOpacity,
          {
            style: styles.attachBtn,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Attach file',
          },
          React.createElement(Icon, { name: 'plus', size: 20, color: COLORS.textSecondary }),
        ),
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 11,
    color: COLORS.online,
    marginTop: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  msgTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
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
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
