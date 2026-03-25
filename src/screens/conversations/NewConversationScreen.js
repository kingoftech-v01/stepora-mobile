/**
 * NewConversationScreen — Start a new 1:1 or group conversation.
 *
 * - Search bar to find users
 * - Friends list with checkboxes for multi-select (group chat)
 * - Recent contacts section
 * - "Create Group" toggle with group name input when multiple users selected
 * - Submit creates conversation via API and navigates to ChatScreen
 */
var React = require('react');
var { useState, useCallback, useEffect, useMemo } = React;
var {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Alert,
  Switch,
  Keyboard,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { CONVERSATIONS, SOCIAL } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

// ─── Helpers ──────────────────────────────────────────────────────

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var getDisplayName = function (user) {
  return user.displayName || user.username || user.email || 'User';
};

// ─── Main Screen ──────────────────────────────────────────────────

var NewConversationScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [searchText, setSearchText] = useState('');
  var [selectedUsers, setSelectedUsers] = useState([]);
  var [isGroupMode, setIsGroupMode] = useState(false);
  var [groupName, setGroupName] = useState('');
  var [creating, setCreating] = useState(false);

  // ─── Fetch friends list ───────────────────────────────────────
  var friendsQuery = useQuery({
    queryKey: ['friends-list'],
    queryFn: function () {
      return apiGet(SOCIAL.FRIENDS.LIST);
    },
  });

  var friends = useMemo(function () {
    var data = friendsQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    return list;
  }, [friendsQuery.data]);

  // ─── Search users from API ────────────────────────────────────
  var searchQuery = useQuery({
    queryKey: ['user-search', searchText],
    queryFn: function () {
      return apiGet(SOCIAL.USER_SEARCH + '?q=' + encodeURIComponent(searchText));
    },
    enabled: searchText.length >= 2,
  });

  var searchResults = useMemo(function () {
    if (!searchText || searchText.length < 2) return [];
    var data = searchQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    return list;
  }, [searchText, searchQuery.data]);

  // ─── Recent contacts (derive from conversations) ──────────────
  var conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: function () {
      return apiGet(CONVERSATIONS.LIST);
    },
  });

  var recentContacts = useMemo(function () {
    var data = conversationsQuery.data;
    var list = (data && data.results) || data || [];
    if (!Array.isArray(list)) return [];
    // Extract unique users from recent conversations
    var contacts = [];
    var seen = {};
    for (var i = 0; i < list.length && contacts.length < 10; i++) {
      var conv = list[i];
      var userId = conv.otherUserId || conv.otherUser;
      if (userId && !seen[userId]) {
        seen[userId] = true;
        contacts.push({
          id: userId,
          displayName: conv.otherUserDisplayName || conv.title || conv.name || 'User',
          avatar: conv.otherUserAvatar || conv.avatar || null,
          isOnline: conv.isOnline || false,
        });
      }
    }
    return contacts;
  }, [conversationsQuery.data]);

  // ─── Filter friends by search text ────────────────────────────
  var filteredFriends = useMemo(function () {
    if (!searchText) return friends;
    var lower = searchText.toLowerCase();
    return friends.filter(function (f) {
      var name = getDisplayName(f);
      return name.toLowerCase().indexOf(lower) !== -1;
    });
  }, [friends, searchText]);

  // ─── Display list: search results or friends ──────────────────
  var displayUsers = searchText.length >= 2 ? searchResults : filteredFriends;

  // ─── Selection toggling ───────────────────────────────────────
  var isSelected = function (userId) {
    return selectedUsers.some(function (u) {
      return u.id === userId;
    });
  };

  var toggleUser = useCallback(function (user) {
    setSelectedUsers(function (prev) {
      var exists = prev.some(function (u) {
        return u.id === user.id;
      });
      if (exists) {
        var filtered = prev.filter(function (u) {
          return u.id !== user.id;
        });
        // Turn off group mode if less than 2 selected
        if (filtered.length < 2) {
          setIsGroupMode(false);
        }
        return filtered;
      }
      return prev.concat([user]);
    });
  }, []);

  // ─── Auto-enable group mode when 2+ selected ─────────────────
  useEffect(function () {
    if (selectedUsers.length >= 2 && !isGroupMode) {
      setIsGroupMode(true);
    }
  }, [selectedUsers.length, isGroupMode]);

  // ─── Create conversation ──────────────────────────────────────
  var handleCreate = useCallback(function () {
    if (selectedUsers.length === 0) {
      Alert.alert('No users selected', 'Please select at least one user to start a conversation.');
      return;
    }

    if (isGroupMode && selectedUsers.length > 1 && !groupName.trim()) {
      Alert.alert('Group name required', 'Please enter a name for the group chat.');
      return;
    }

    setCreating(true);
    Keyboard.dismiss();

    var participantIds = selectedUsers.map(function (u) {
      return u.id;
    });

    var payload = {
      participants: participantIds,
    };

    if (isGroupMode && selectedUsers.length > 1) {
      payload.title = groupName.trim();
      payload.isGroup = true;
    }

    apiPost(CONVERSATIONS.LIST, payload)
      .then(function (data) {
        setCreating(false);
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        var convId = data.id;
        var convTitle = data.title || data.name || groupName || getDisplayName(selectedUsers[0]);

        navigation.replace('Chat', {
          conversationId: convId,
          title: convTitle,
        });
      })
      .catch(function (err) {
        setCreating(false);
        Alert.alert(
          'Error',
          (err && err.userMessage) || (err && err.message) || 'Failed to create conversation'
        );
      });
  }, [selectedUsers, isGroupMode, groupName, navigation, queryClient]);

  // ─── 1:1 quick start (tap without checkbox) ──────────────────
  var handleQuickStart = useCallback(function (user) {
    if (selectedUsers.length > 0) {
      // If already selecting, toggle instead
      toggleUser(user);
      return;
    }

    setCreating(true);
    Keyboard.dismiss();

    apiPost(CONVERSATIONS.LIST, { participants: [user.id] })
      .then(function (data) {
        setCreating(false);
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        navigation.replace('Chat', {
          conversationId: data.id,
          title: data.title || data.name || getDisplayName(user),
        });
      })
      .catch(function (err) {
        setCreating(false);
        Alert.alert(
          'Error',
          (err && err.userMessage) || (err && err.message) || 'Failed to create conversation'
        );
      });
  }, [selectedUsers, navigation, queryClient, toggleUser]);

  // ─── Remove selected chip ─────────────────────────────────────
  var removeChip = useCallback(function (userId) {
    setSelectedUsers(function (prev) {
      var filtered = prev.filter(function (u) {
        return u.id !== userId;
      });
      if (filtered.length < 2) {
        setIsGroupMode(false);
      }
      return filtered;
    });
  }, []);

  // ─── Render selected user chips ───────────────────────────────
  var renderSelectedChips = function () {
    if (selectedUsers.length === 0) return null;

    return React.createElement(
      View,
      { style: styles.chipsContainer },
      React.createElement(
        FlatList,
        {
          horizontal: true,
          data: selectedUsers,
          keyExtractor: function (item) {
            return String(item.id);
          },
          showsHorizontalScrollIndicator: false,
          contentContainerStyle: { paddingHorizontal: SPACING.lg },
          renderItem: function (info) {
            var user = info.item;
            return React.createElement(
              TouchableOpacity,
              {
                style: styles.chip,
                onPress: function () {
                  removeChip(user.id);
                },
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: 'Remove ' + getDisplayName(user),
              },
              React.createElement(Avatar, {
                name: getDisplayName(user),
                src: user.avatar,
                size: 24,
                color: avatarColor(getDisplayName(user)),
              }),
              React.createElement(
                Text,
                { style: styles.chipText, numberOfLines: 1 },
                getDisplayName(user)
              ),
              React.createElement(Icon, { name: 'x', size: 14, color: COLORS.textMuted })
            );
          },
        }
      )
    );
  };

  // ─── Render group mode toggle ─────────────────────────────────
  var renderGroupToggle = function () {
    if (selectedUsers.length < 2) return null;

    return React.createElement(
      View,
      { style: styles.groupSection },
      React.createElement(
        View,
        { style: styles.groupToggleRow },
        React.createElement(Icon, { name: 'users', size: 18, color: COLORS.purple }),
        React.createElement(
          Text,
          { style: styles.groupToggleLabel },
          'Create Group Chat'
        ),
        React.createElement(Switch, {
          value: isGroupMode,
          onValueChange: setIsGroupMode,
          trackColor: { false: COLORS.glassBg, true: COLORS.accentSoft },
          thumbColor: isGroupMode ? COLORS.purple : COLORS.textMuted,
          accessible: true,
          accessibilityRole: 'switch',
          accessibilityLabel: 'Create Group Chat',
          accessibilityState: { checked: isGroupMode },
        })
      ),
      isGroupMode
        ? React.createElement(
            View,
            { style: styles.groupNameWrap },
            React.createElement(Icon, {
              name: 'edit-3',
              size: 16,
              color: COLORS.textMuted,
              style: { marginRight: 8 },
            }),
            React.createElement(TextInput, {
              style: styles.groupNameInput,
              placeholder: 'Group name...',
              placeholderTextColor: COLORS.textMuted,
              value: groupName,
              onChangeText: setGroupName,
              maxLength: 100,
              autoCorrect: false,
              accessible: true,
              accessibilityLabel: 'Group name',
            })
          )
        : null
    );
  };

  // ─── Render user row ──────────────────────────────────────────
  var renderUserRow = useCallback(function (info) {
    var user = info.item;
    var name = getDisplayName(user);
    var selected = isSelected(user.id);

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.userRow,
        activeOpacity: 0.7,
        onPress: function () {
          handleQuickStart(user);
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: name + (user.isOnline ? ', online' : '') + (selected ? ', selected' : '') + '. Tap to start chat',
      },
      // Checkbox
      React.createElement(
        TouchableOpacity,
        {
          style: [styles.checkbox, selected && styles.checkboxSelected],
          onPress: function () {
            toggleUser(user);
          },
          accessible: true,
          accessibilityRole: 'checkbox',
          accessibilityState: { checked: selected },
          accessibilityLabel: 'Select ' + name,
        },
        selected
          ? React.createElement(Icon, { name: 'check', size: 14, color: '#FFFFFF' })
          : null
      ),
      // Avatar
      React.createElement(
        View,
        { style: styles.avatarWrap },
        React.createElement(Avatar, {
          name: name,
          src: user.avatar || user.profileImage,
          size: 46,
          color: avatarColor(name),
        }),
        user.isOnline
          ? React.createElement(View, { style: styles.onlineDot })
          : null
      ),
      // Info
      React.createElement(
        View,
        { style: styles.userInfo },
        React.createElement(
          Text,
          { style: styles.userName, numberOfLines: 1 },
          name
        ),
        user.username
          ? React.createElement(
              Text,
              { style: styles.userHandle, numberOfLines: 1 },
              '@' + user.username
            )
          : user.email
            ? React.createElement(
                Text,
                { style: styles.userHandle, numberOfLines: 1 },
                user.email
              )
            : null
      )
    );
  }, [selectedUsers, handleQuickStart, toggleUser]);

  // ─── Render recent contact row ────────────────────────────────
  var renderRecentContact = useCallback(function (info) {
    var user = info.item;
    var name = getDisplayName(user);

    return React.createElement(
      TouchableOpacity,
      {
        style: styles.recentItem,
        activeOpacity: 0.7,
        onPress: function () {
          handleQuickStart(user);
        },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: name + ', recent contact. Tap to start chat',
      },
      React.createElement(Avatar, {
        name: name,
        src: user.avatar,
        size: 52,
        color: avatarColor(name),
      }),
      React.createElement(
        Text,
        { style: styles.recentName, numberOfLines: 1 },
        name.split(' ')[0]
      )
    );
  }, [handleQuickStart]);

  // ─── Section data for SectionList ─────────────────────────────
  var sections = useMemo(function () {
    var result = [];

    if (!searchText && recentContacts.length > 0) {
      result.push({
        title: 'Recent',
        data: ['__recent__'],
        isRecent: true,
      });
    }

    if (displayUsers.length > 0) {
      result.push({
        title: searchText.length >= 2 ? 'Search Results' : 'Friends',
        data: displayUsers,
        isRecent: false,
      });
    }

    return result;
  }, [searchText, recentContacts, displayUsers]);

  // ─── Loading state ────────────────────────────────────────────
  var isSearching = searchText.length >= 2 && searchQuery.isLoading;
  var isLoadingFriends = friendsQuery.isLoading;

  // ─── Key extractor ────────────────────────────────────────────
  var keyExtractor = useCallback(function (item, index) {
    if (item === '__recent__') return 'recent-section';
    return String(item.id || index);
  }, []);

  // ─── Render section item ──────────────────────────────────────
  var renderSectionItem = useCallback(function (info) {
    if (info.item === '__recent__') {
      return React.createElement(
        FlatList,
        {
          horizontal: true,
          data: recentContacts,
          keyExtractor: function (item) {
            return 'recent-' + item.id;
          },
          renderItem: renderRecentContact,
          showsHorizontalScrollIndicator: false,
          contentContainerStyle: {
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.md,
          },
        }
      );
    }
    return renderUserRow(info);
  }, [recentContacts, renderRecentContact, renderUserRow]);

  // ─── Render section header ────────────────────────────────────
  var renderSectionHeader = useCallback(function (info) {
    return React.createElement(
      View,
      { style: styles.sectionHeader },
      React.createElement(
        Text,
        { style: styles.sectionTitle, accessibilityRole: 'header' },
        info.section.title
      ),
      info.section.title === 'Friends'
        ? React.createElement(
            Text,
            { style: styles.sectionCount },
            friends.length + ' friends'
          )
        : null
    );
  }, [friends.length]);

  // ─── Empty component ──────────────────────────────────────────
  var renderEmpty = function () {
    if (isLoadingFriends || isSearching) return null;
    return React.createElement(
      View,
      { style: styles.emptyWrap },
      React.createElement(Icon, { name: 'search', size: 48, color: COLORS.textMuted }),
      React.createElement(
        Text,
        { style: styles.emptyTitle },
        searchText ? 'No users found' : 'No friends yet'
      ),
      React.createElement(
        Text,
        { style: styles.emptySubtitle },
        searchText
          ? 'Try a different search term'
          : 'Add friends to start conversations'
      )
    );
  };

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'New Chat',
      onBack: function () {
        navigation.goBack();
      },
      rightActions: selectedUsers.length > 0
        ? [
            {
              icon: 'check',
              label: 'Create conversation',
              onPress: handleCreate,
            },
          ]
        : [],
    }),

    // ─── Search bar ───────────────────────────────────────────
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
        placeholder: 'Search people...',
        placeholderTextColor: COLORS.textMuted,
        value: searchText,
        onChangeText: setSearchText,
        autoCorrect: false,
        autoCapitalize: 'none',
        accessible: true,
        accessibilityLabel: 'Search people',
        accessibilityRole: 'search',
      }),
      searchText
        ? React.createElement(
            TouchableOpacity,
            {
              onPress: function () {
                setSearchText('');
              },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Clear search',
            },
            React.createElement(Icon, { name: 'x', size: 16, color: COLORS.textMuted })
          )
        : null,
      isSearching
        ? React.createElement(ActivityIndicator, {
            size: 'small',
            color: COLORS.purple,
            style: { marginLeft: 8 },
          })
        : null
    ),

    // ─── Selected chips ─────────────────────────────────────
    renderSelectedChips(),

    // ─── Group toggle and name ──────────────────────────────
    renderGroupToggle(),

    // ─── Loading ────────────────────────────────────────────
    isLoadingFriends && !searchText
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple })
        )
      : React.createElement(SectionList, {
          sections: sections,
          renderItem: renderSectionItem,
          renderSectionHeader: renderSectionHeader,
          keyExtractor: keyExtractor,
          contentContainerStyle: sections.length === 0 ? { flex: 1 } : { paddingBottom: 100 },
          ListEmptyComponent: renderEmpty,
          showsVerticalScrollIndicator: false,
          stickySectionHeadersEnabled: false,
        }),

    // ─── Create button (when users selected) ────────────────
    selectedUsers.length > 0
      ? React.createElement(
          View,
          { style: styles.bottomBar },
          React.createElement(
            TouchableOpacity,
            {
              style: [styles.createBtn, creating && { opacity: 0.6 }],
              onPress: handleCreate,
              disabled: creating,
              activeOpacity: 0.8,
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: creating ? 'Creating conversation' : (isGroupMode && selectedUsers.length > 1 ? 'Create Group with ' + selectedUsers.length + ' members' : 'Start Chat'),
              accessibilityState: { disabled: !!creating, busy: !!creating },
            },
            creating
              ? React.createElement(ActivityIndicator, { size: 'small', color: '#FFFFFF' })
              : React.createElement(Icon, { name: 'send', size: 18, color: '#FFFFFF' }),
            React.createElement(
              Text,
              { style: styles.createBtnText },
              creating
                ? 'Creating...'
                : isGroupMode && selectedUsers.length > 1
                  ? 'Create Group (' + selectedUsers.length + ')'
                  : 'Start Chat'
            )
          )
        )
      : null
  );
};

// ─── Styles ─────────────────────────────────────────────────────────

var styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Selected chips ─────────────────────────────────────────
  chipsContainer: {
    paddingVertical: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentSoft,
    borderRadius: 20,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
    marginRight: SPACING.sm,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    maxWidth: 80,
  },

  // ─── Group toggle ──────────────────────────────────────────
  groupSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  groupToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: 10,
  },
  groupToggleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  groupNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },

  // ─── Section headers ──────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // ─── User rows ────────────────────────────────────────────
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.glassBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  checkboxSelected: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.bodyBg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  userHandle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // ─── Recent contacts (horizontal scroll) ──────────────────
  recentItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 64,
  },
  recentName: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },

  // ─── Empty state ──────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ─── Bottom create bar ────────────────────────────────────
  bottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxl,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    gap: 10,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

module.exports = NewConversationScreen;
