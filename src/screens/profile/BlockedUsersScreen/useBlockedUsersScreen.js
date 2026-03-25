/**
 * useBlockedUsersScreen -- business logic for blocked users management (React Native).
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { Alert } = require('react-native');
var { apiGet, apiPost } = require('../../../services/api');
var { SOCIAL } = require('../../../services/endpoints');

function useBlockedUsersScreen() {
  var navigation = useNavigation();

  var [loading, setLoading] = useState(true);
  var [users, setUsers] = useState([]);
  var [error, setError] = useState('');
  var [unblocking, setUnblocking] = useState({}); // keyed by userId

  // ─── Fetch blocked users ──────────────────────────────────
  var fetchBlocked = useCallback(function () {
    setLoading(true);
    setError('');
    apiGet(SOCIAL.BLOCKED)
      .then(function (data) {
        var list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.results)) {
          list = data.results;
        } else if (data && Array.isArray(data.blockedUsers)) {
          list = data.blockedUsers;
        }
        setUsers(list);
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.message || 'Failed to load blocked users');
        setLoading(false);
      });
  }, []);

  useEffect(function () {
    fetchBlocked();
  }, [fetchBlocked]);

  // ─── Unblock user ─────────────────────────────────────────
  var handleUnblock = function (user) {
    var userId = user.id || user.userId || user.blockedUser;
    var userName = user.displayName || user.display_name || user.username || 'this user';

    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock ' + userName + '? They will be able to find and contact you again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: function () {
            var next = Object.assign({}, unblocking);
            next[userId] = true;
            setUnblocking(next);

            apiPost(SOCIAL.UNBLOCK(userId))
              .then(function () {
                setUsers(function (prev) {
                  return prev.filter(function (u) {
                    var uid = u.id || u.userId || u.blockedUser;
                    return uid !== userId;
                  });
                });
                var done = Object.assign({}, unblocking);
                delete done[userId];
                setUnblocking(done);
              })
              .catch(function (err) {
                var done = Object.assign({}, unblocking);
                delete done[userId];
                setUnblocking(done);
                Alert.alert('Error', err.message || 'Failed to unblock user');
              });
          },
        },
      ]
    );
  };

  // ─── Helpers ──────────────────────────────────────────────
  var getUserInitial = function (user) {
    var name = user.displayName || user.display_name || user.username || '';
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  var getUserName = function (user) {
    return user.displayName || user.display_name || user.username || 'Unknown User';
  };

  var getBlockedDate = function (user) {
    var date = user.blockedAt || user.blocked_at || user.createdAt || user.created_at;
    if (!date) return '';
    try {
      var d = new Date(date);
      return 'Blocked ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  var getAvatarUrl = function (user) {
    return user.avatarUrl || user.avatar_url || user.avatar || null;
  };

  return {
    navigation: navigation,
    loading: loading,
    users: users,
    error: error,
    unblocking: unblocking,
    fetchBlocked: fetchBlocked,
    handleUnblock: handleUnblock,
    getUserInitial: getUserInitial,
    getUserName: getUserName,
    getBlockedDate: getBlockedDate,
    getAvatarUrl: getAvatarUrl,
  };
}

module.exports = useBlockedUsersScreen;
