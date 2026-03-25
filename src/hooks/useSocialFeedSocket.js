/**
 * useSocialFeedSocket — real-time social feed updates via WebSocket.
 */
var { useEffect, useRef } = require('react');
var { useQueryClient } = require('@tanstack/react-query');
var { createWebSocket } = require('../services/websocket');

var useSocialFeedSocket = function (token, opts) {
  var wsRef = useRef(null);
  var queryClient = useQueryClient();
  var qcRef = useRef(queryClient);
  qcRef.current = queryClient;
  var onNewPostRef = useRef((opts && opts.onNewPost) || null);
  onNewPostRef.current = (opts && opts.onNewPost) || null;

  useEffect(
    function () {
      if (!token) return;
      var ws = createWebSocket('/ws/social-feed/', {
        token: token,
        onMessage: function (data) {
          if (data.type === 'new_post' || data.type === 'post_created') {
            qcRef.current.invalidateQueries({ queryKey: ['social-posts-feed'] });
            if (onNewPostRef.current) onNewPostRef.current(data);
          }
        },
      });
      wsRef.current = ws;
      return function () {
        if (wsRef.current) wsRef.current.close();
      };
    },
    [token],
  );
};

module.exports = useSocialFeedSocket;
