/**
 * ExploreScreen — User search / discover users.
 * Adapted from UserSearchMobile.jsx + useUserSearchScreen.js
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiDelete } = require('../../services/api');
var { SOCIAL } = require('../../services/endpoints');
var useInfiniteList = require('../../hooks/useInfiniteList');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var GlassCard = require('../../components/shared/GlassCard');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var getAvatarColor = function (name) {
  var hash = 0;
  for (var i = 0; i < (name || '').length; i++) {
    hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
};

var ExploreScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [query, setQuery] = useState('');
  var [debouncedQuery, setDebouncedQuery] = useState('');
  var [sentRequests, setSentRequests] = useState({});

  // Debounce search
  useEffect(
    function () {
      var timer = setTimeout(function () {
        setDebouncedQuery(query.trim());
      }, 350);
      return function () {
        clearTimeout(timer);
      };
    },
    [query],
  );

  // Search results
  var searchInf = useInfiniteList({
    queryKey: ['user-search', debouncedQuery],
    url: SOCIAL.USER_SEARCH + '?q=' + encodeURIComponent(debouncedQuery),
    limit: 20,
    enabled: debouncedQuery.length > 0,
  });

  // Suggestions
  var suggestionsInf = useInfiniteList({
    queryKey: ['follow-suggestions'],
    url: SOCIAL.FOLLOW_SUGGESTIONS,
    limit: 20,
  });

  // Recent searches
  var recentQuery = useQuery({
    queryKey: ['recent-searches'],
    queryFn: function () {
      return apiGet(SOCIAL.RECENT_SEARCHES.LIST);
    },
  });
  var recentSearches = (function () {
    var d = recentQuery.data;
    var list = (d && (d.recentSearches || d.results)) || d || [];
    if (!Array.isArray(list)) return [];
    return list;
  })();

  var normalizeUser = function (u) {
    var name = u.name || u.displayName || u.display_name || u.username || 'User';
    return Object.assign({}, u, {
      name: name,
      initial: name[0].toUpperCase(),
      level: u.currentLevel || u.level || 1,
      mutualFriends: u.mutualFriends || 0,
      isFriend: u.isFriend || false,
    });
  };

  var searchResults = searchInf.items.map(normalizeUser);
  var suggestions = suggestionsInf.items.map(normalizeUser);
  var isSearching = query.length > 0;

  var handleAddFriend = useCallback(
    function (userId) {
      setSentRequests(function (prev) {
        var n = Object.assign({}, prev);
        n[userId] = true;
        return n;
      });
      apiPost(SOCIAL.FRIENDS.REQUEST, { target_user_id: userId })
        .then(function () {
          // success
        })
        .catch(function () {
          setSentRequests(function (prev) {
            var n = Object.assign({}, prev);
            delete n[userId];
            return n;
          });
        });
    },
    [],
  );

  var removeRecentSearch = useCallback(
    function (id) {
      queryClient.setQueryData(['recent-searches'], function (old) {
        if (!old) return old;
        var list = old.results || old;
        var filtered = (Array.isArray(list) ? list : []).filter(function (s) {
          return s.id !== id;
        });
        return old.results ? Object.assign({}, old, { results: filtered }) : filtered;
      });
      apiDelete(SOCIAL.RECENT_SEARCHES.REMOVE(id)).catch(function () {
        queryClient.invalidateQueries({ queryKey: ['recent-searches'] });
      });
    },
    [queryClient],
  );

  var renderUserCard = useCallback(
    function (info) {
      var user = info.item;
      var isSent = sentRequests[user.id];

      return React.createElement(
        TouchableOpacity,
        {
          style: styles.userRow,
          activeOpacity: 0.7,
          onPress: function () {
            navigation.navigate('UserProfile', { userId: user.id });
          },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: user.name + ', Level ' + user.level + (user.mutualFriends > 0 ? ', ' + user.mutualFriends + ' mutual friends' : '') + (user.isFriend ? ', friend' : ''),
        },
        React.createElement(Avatar, {
          name: user.name,
          src: user.avatar || user.avatarUrl,
          size: 48,
          color: getAvatarColor(user.name),
        }),
        React.createElement(
          View,
          { style: styles.userInfo },
          React.createElement(
            Text,
            { style: styles.userName, numberOfLines: 1 },
            user.name,
          ),
          React.createElement(
            Text,
            { style: styles.userMeta },
            'Lvl ' + user.level +
              (user.mutualFriends > 0 ? ' \u00B7 ' + user.mutualFriends + ' mutual' : ''),
          ),
        ),
        !user.isFriend && !isSent
          ? React.createElement(
              TouchableOpacity,
              {
                style: styles.addBtn,
                onPress: function () {
                  handleAddFriend(user.id);
                },
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: 'Send friend request to ' + user.name,
              },
              React.createElement(Icon, { name: 'user-plus', size: 16, color: '#FFFFFF' }),
            )
          : isSent
            ? React.createElement(
                View,
                { style: styles.sentBadge },
                React.createElement(Icon, { name: 'check', size: 14, color: COLORS.purple }),
              )
            : React.createElement(
                View,
                { style: styles.friendBadge },
                React.createElement(Icon, { name: 'users', size: 14, color: COLORS.online }),
              ),
      );
    },
    [sentRequests, handleAddFriend, navigation],
  );

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  // Empty states
  var renderSearchEmpty = function () {
    if (searchInf.isLoading) {
      return React.createElement(
        View,
        { style: styles.centerWrap },
        React.createElement(ActivityIndicator, { size: 'small', color: COLORS.purple }),
      );
    }
    if (debouncedQuery.length > 0 && searchResults.length === 0) {
      return React.createElement(
        View,
        { style: styles.centerWrap },
        React.createElement(
          Text,
          { style: styles.emptyText },
          'No users found for "' + debouncedQuery + '"',
        ),
      );
    }
    return null;
  };

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Find People',
      onBack: function () {
        navigation.goBack();
      },
    }),

    // Search bar
    React.createElement(
      View,
      { style: styles.searchWrap },
      React.createElement(Icon, {
        name: 'search',
        size: 16,
        color: COLORS.textMuted,
        style: { marginRight: 8 },
      }),
      React.createElement(TextInput, {
        style: styles.searchInput,
        placeholder: 'Search by name or username...',
        placeholderTextColor: COLORS.textMuted,
        value: query,
        onChangeText: setQuery,
        autoCorrect: false,
        autoCapitalize: 'none',
        accessible: true,
        accessibilityLabel: 'Search by name or username',
        accessibilityRole: 'search',
      }),
      query
        ? React.createElement(
            TouchableOpacity,
            { onPress: function () { setQuery(''); }, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Clear search' },
            React.createElement(Icon, { name: 'x', size: 16, color: COLORS.textMuted }),
          )
        : null,
    ),

    // Content
    isSearching
      ? // Search results
        React.createElement(FlatList, {
          data: searchResults,
          renderItem: renderUserCard,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100 },
          ListHeaderComponent: renderSearchEmpty,
          onEndReached: function () {
            if (searchInf.hasNextPage) searchInf.fetchNextPage();
          },
          onEndReachedThreshold: 0.3,
          showsVerticalScrollIndicator: false,
        })
      : // Default: recent searches + suggestions
        React.createElement(FlatList, {
          data: suggestions,
          renderItem: renderUserCard,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100 },
          ListHeaderComponent: React.createElement(
            View,
            null,
            // Recent searches section
            recentSearches.length > 0
              ? React.createElement(
                  View,
                  { style: styles.section },
                  React.createElement(
                    Text,
                    { style: styles.sectionTitle, accessibilityRole: 'header' },
                    'Recent Searches',
                  ),
                  recentSearches.slice(0, 5).map(function (rs) {
                    return React.createElement(
                      View,
                      { key: rs.id, style: styles.recentRow },
                      React.createElement(Icon, {
                        name: 'clock',
                        size: 14,
                        color: COLORS.textMuted,
                        style: { marginRight: 10 },
                      }),
                      React.createElement(
                        TouchableOpacity,
                        {
                          style: { flex: 1 },
                          onPress: function () {
                            setQuery(rs.query || rs.name || '');
                          },
                        },
                        React.createElement(
                          Text,
                          { style: styles.recentText },
                          rs.query || rs.name || '',
                        ),
                      ),
                      React.createElement(
                        TouchableOpacity,
                        {
                          onPress: function () {
                            removeRecentSearch(rs.id);
                          },
                        },
                        React.createElement(Icon, { name: 'x', size: 14, color: COLORS.textMuted }),
                      ),
                    );
                  }),
                )
              : null,
            // Suggestions header
            suggestions.length > 0
              ? React.createElement(
                  Text,
                  { style: [styles.sectionTitle, { marginTop: 16, marginHorizontal: SPACING.lg }], accessibilityRole: 'header' },
                  'Suggested for You',
                )
              : null,
          ),
          onEndReached: function () {
            if (suggestionsInf.hasNextPage) suggestionsInf.fetchNextPage();
          },
          onEndReachedThreshold: 0.3,
          showsVerticalScrollIndicator: false,
        }),
  );
};

var styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: SPACING.lg,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentText: {
    fontSize: 14,
    color: COLORS.text,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

module.exports = ExploreScreen;
