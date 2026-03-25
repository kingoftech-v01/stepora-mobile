/**
 * useChatSocket — real-time chat messages via WebSocket.
 * Used by ChatScreen for AI conversations and buddy chats.
 */
var { useEffect, useRef, useCallback, useState } = require('react');
var { createWebSocket } = require('../services/websocket');

var useChatSocket = function (path, token, opts) {
  var wsRef = useRef(null);
  var [connected, setConnected] = useState(false);
  var onMessageRef = useRef((opts && opts.onMessage) || null);
  onMessageRef.current = (opts && opts.onMessage) || null;
  var onTypingRef = useRef((opts && opts.onTyping) || null);
  onTypingRef.current = (opts && opts.onTyping) || null;

  useEffect(
    function () {
      if (!token || !path) return;
      var ws = createWebSocket(path, {
        token: token,
        onOpen: function () {
          setConnected(true);
        },
        onClose: function () {
          setConnected(false);
        },
        onMessage: function (data) {
          if (!data) return;
          if (data.type === 'chat_message' || data.type === 'message') {
            if (onMessageRef.current) onMessageRef.current(data);
          }
          if (data.type === 'typing') {
            if (onTypingRef.current) onTypingRef.current(data);
          }
        },
      });
      wsRef.current = ws;
      return function () {
        if (wsRef.current) wsRef.current.close();
      };
    },
    [path, token],
  );

  var sendMessage = useCallback(function (content) {
    if (wsRef.current) {
      return wsRef.current.send({ type: 'chat_message', content: content });
    }
    return false;
  }, []);

  var sendTyping = useCallback(function () {
    if (wsRef.current) {
      wsRef.current.send({ type: 'typing' });
    }
  }, []);

  return {
    connected: connected,
    sendMessage: sendMessage,
    sendTyping: sendTyping,
  };
};

module.exports = useChatSocket;
