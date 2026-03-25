/**
 * useBlockedUsersScreen -- business logic for blocked users management (React Native).
 * Synced with web app's useBlockedUsersScreen.js.
 */
var { useState, useEffect, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { Alert } = require('react-native');
var { apiGet, apiDelete } = require('../../../services/api');
var { SOCIAL } = require('../../../services/endpoints');
var { useT } = require('../../../context/I18nContext');

function useBlockedUsersScreen() {
  var navigation = useNavigation();
  var { t } = useT();

  var [loading, setLoading] = useState(true);
  var [users, setUsers] = useState([]);
  var [error, setError] = useState('');
  var [unblocking, setUnblocking] = useState({}); // keyed by userId
  var [confirmId, setConfirmId] = useState(null);

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
        setError(err.userMessage || err.message || t('blockedUsers.loadFailed'));
        setLoading(false);
      });
  }, []);

  useEffect(function () {
    fetchBlocked();
  }, [fetchBlocked]);

  // ─── Unblock user (uses DELETE, matching web) ─────────────
  var handleUnblock = function (user) {
    var userId = user.id || user.userId || user.blockedUser;
    var userName = user.displayName || user.display_name || user.username || 'this user';

    // Two-tap confirm pattern (matching web's confirmId approach)
    if (confirmId === userId) {
      var next = Object.assign({}, unblocking);
      next[userId] = true;
      setUnblocking(next);
      setConfirmId(null);

      apiDelete(SOCIAL.UNBLOCK(userId))
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
          Alert.alert(t('common.error') || 'Error', err.userMessage || err.message || t('blockedUsers.unblockFailed'));
        });
    } else {
      setConfirmId(userId);
    }
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
    t: t,
    loading: loading,
    users: users,
    error: error,
    unblocking: unblocking,
    confirmId: confirmId,
    fetchBlocked: fetchBlocked,
    handleUnblock: handleUnblock,
    getUserInitial: getUserInitial,
    getUserName: getUserName,
    getBlockedDate: getBlockedDate,
    getAvatarUrl: getAvatarUrl,
  };
}

module.exports = useBlockedUsersScreen;
