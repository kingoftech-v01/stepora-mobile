/**
 * UserProfileScreen — View another user's profile.
 * Shows avatar, stats, bio, public dreams, interests.
 * Actions: add friend, follow, message, block, report.
 */
var React = require('react');
var { useState, useEffect, useCallback } = React;
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiDelete } = require('../../services/api');
var { USERS, SOCIAL } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var getAvatarColor = function (name) {
  var hash = 0;
  for (var i = 0; i < (name || '').length; i++) {
    hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
};

var CAT_COLORS = {
  career: '#3B82F6',
  hobbies: '#EC4899',
  health: '#10B981',
  finance: '#F59E0B',
  personal: '#8B5CF6',
  relationships: '#14B8A6',
};

var CAT_ICONS = {
  career: 'briefcase',
  hobbies: 'palette',
  health: 'heart',
  finance: 'credit-card',
  personal: 'cpu',
  relationships: 'users',
};

var UserProfileScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var userId = route.params && route.params.userId;
  var queryClient = useQueryClient();
  var [requestSent, setRequestSent] = useState(false);
  var [isFriend, setIsFriend] = useState(false);
  var [isFollowing, setIsFollowing] = useState(false);
  var [isBlocked, setIsBlocked] = useState(false);
  var [showMenu, setShowMenu] = useState(false);
  var [showReportModal, setShowReportModal] = useState(false);
  var [reportReason, setReportReason] = useState('');

  var profileQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: function () {
      return apiGet(USERS.PROFILE(userId));
    },
    enabled: !!userId,
  });

  var countsQuery = useQuery({
    queryKey: ['user-counts', userId],
    queryFn: function () {
      return apiGet(SOCIAL.COUNTS(userId));
    },
    enabled: !!userId,
  });

  var rawUser = profileQuery.data || null;
  var counts = countsQuery.data || {};

  useEffect(
    function () {
      if (rawUser) {
        if (rawUser.isFriend) {
          setIsFriend(true);
          setRequestSent(true);
        }
        if (rawUser.isFollowing) setIsFollowing(true);
      }
    },
    [rawUser],
  );

  var user = rawUser
    ? Object.assign({}, rawUser, {
        name:
          rawUser.name ||
          rawUser.displayName ||
          rawUser.display_name ||
          rawUser.username ||
          'User',
        level: rawUser.level || counts.level || 1,
        xp: rawUser.xp || counts.xp || 0,
        streak: rawUser.streak || counts.streak || 0,
        bio: rawUser.bio || '',
        mutualFriends: rawUser.mutualFriends || counts.mutualFriends || 0,
        dreams: rawUser.dreams || [],
        categories: rawUser.categories || [],
        joinedDate: rawUser.joinedDate || rawUser.dateJoined || '',
      })
    : null;

  var handleSendRequest = useCallback(
    function () {
      setRequestSent(true);
      apiPost(SOCIAL.FRIENDS.REQUEST, { target_user_id: userId })
        .then(function () {
          queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
        })
        .catch(function () {
          setRequestSent(false);
          Alert.alert('Error', 'Failed to send friend request.');
        });
    },
    [userId, queryClient],
  );

  var handleFollow = useCallback(
    function () {
      if (isFollowing) {
        setIsFollowing(false);
        apiDelete(SOCIAL.UNFOLLOW(userId)).catch(function () {
          setIsFollowing(true);
        });
      } else {
        setIsFollowing(true);
        apiPost(SOCIAL.FOLLOW, { target_user_id: userId }).catch(function () {
          setIsFollowing(false);
        });
      }
    },
    [userId, isFollowing],
  );

  var handleBlock = useCallback(
    function () {
      setShowMenu(false);
      if (isBlocked) {
        apiDelete(SOCIAL.UNBLOCK(userId))
          .then(function () {
            setIsBlocked(false);
          })
          .catch(function () {
            Alert.alert('Error', 'Failed to unblock user.');
          });
      } else {
        apiPost(SOCIAL.BLOCK, { target_user_id: userId })
          .then(function () {
            setIsBlocked(true);
          })
          .catch(function () {
            Alert.alert('Error', 'Failed to block user.');
          });
      }
    },
    [userId, isBlocked],
  );

  var handleRemoveFriend = useCallback(
    function () {
      setShowMenu(false);
      Alert.alert('Remove Friend', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: function () {
            apiDelete(SOCIAL.FRIENDS.REMOVE(userId))
              .then(function () {
                setIsFriend(false);
                setRequestSent(false);
                queryClient.invalidateQueries({ queryKey: ['friends'] });
              })
              .catch(function () {
                Alert.alert('Error', 'Failed to remove friend.');
              });
          },
        },
      ]);
    },
    [userId, queryClient],
  );

  var handleReport = useCallback(function () {
    setShowMenu(false);
    setShowReportModal(true);
  }, []);

  var submitReport = useCallback(
    function () {
      if (!reportReason.trim()) return;
      apiPost(SOCIAL.REPORT, {
        target_user_id: userId,
        reason: reportReason.trim(),
        category: 'inappropriate',
      })
        .then(function () {
          setShowReportModal(false);
          setReportReason('');
          Alert.alert('Reported', 'Your report has been submitted.');
        })
        .catch(function () {
          Alert.alert('Error', 'Failed to submit report.');
        });
    },
    [userId, reportReason],
  );

  // Loading
  if (profileQuery.isLoading) {
    return React.createElement(
      ScreenShell,
      null,
      React.createElement(GlassHeader, {
        title: 'Profile',
        onBack: function () {
          navigation.goBack();
        },
      }),
      React.createElement(
        View,
        { style: styles.loadingWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
      ),
    );
  }

  // Not found
  if (!user) {
    return React.createElement(
      ScreenShell,
      null,
      React.createElement(GlassHeader, {
        title: 'Profile',
        onBack: function () {
          navigation.goBack();
        },
      }),
      React.createElement(
        View,
        { style: styles.emptyWrap },
        React.createElement(Icon, { name: 'user-x', size: 48, color: COLORS.textMuted }),
        React.createElement(Text, { style: styles.emptyTitle }, 'User not found'),
        React.createElement(
          Text,
          { style: styles.emptyDesc },
          'This profile does not exist or has been removed.',
        ),
      ),
    );
  }

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: user.name,
      onBack: function () {
        navigation.goBack();
      },
      rightActions: [
        {
          icon: 'more-vertical',
          onPress: function () {
            setShowMenu(true);
          },
        },
      ],
    }),

    React.createElement(
      ScrollView,
      { contentContainerStyle: { paddingBottom: 100 }, showsVerticalScrollIndicator: false },

      // Avatar + Name
      React.createElement(
        View,
        { style: styles.avatarSection },
        React.createElement(Avatar, {
          name: user.name,
          src: user.avatar || user.avatarUrl,
          size: 88,
          color: getAvatarColor(user.name),
        }),
        React.createElement(Text, { style: styles.userName }, user.name),
        user.joinedDate
          ? React.createElement(
              Text,
              { style: styles.joinedText },
              'Joined ' + user.joinedDate,
            )
          : null,
        user.mutualFriends > 0
          ? React.createElement(
              View,
              { style: styles.mutualRow },
              React.createElement(Icon, { name: 'users', size: 13, color: COLORS.textMuted }),
              React.createElement(
                Text,
                { style: styles.mutualText },
                user.mutualFriends + ' mutual friends',
              ),
            )
          : null,
      ),

      // Action buttons
      React.createElement(
        View,
        { style: styles.actionsRow },
        React.createElement(
          TouchableOpacity,
          {
            style: [
              styles.actionBtnPrimary,
              (isFriend || requestSent) ? styles.actionBtnDone : null,
            ],
            onPress: function () {
              if (!requestSent && !isFriend) handleSendRequest();
            },
            disabled: requestSent || isFriend,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: isFriend ? 'Already friends' : requestSent ? 'Friend request sent' : 'Add ' + user.name + ' as friend', accessibilityState: { disabled: requestSent || isFriend },
          },
          React.createElement(Icon, {
            name: isFriend ? 'user-check' : requestSent ? 'check' : 'user-plus',
            size: 16,
            color: '#FFFFFF',
          }),
          React.createElement(
            Text,
            { style: styles.actionBtnPrimaryText },
            isFriend ? 'Friends' : requestSent ? 'Sent' : 'Add Friend',
          ),
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionBtnSecondary,
            onPress: function () {
              navigation.navigate('Chat', {
                conversationId: 'buddy-' + userId,
                title: user.name,
              });
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Message ' + user.name,
          },
          React.createElement(Icon, { name: 'message-circle', size: 16, color: COLORS.text }),
          React.createElement(Text, { style: styles.actionBtnSecondaryText }, 'Message'),
        ),
      ),

      // Follow button
      React.createElement(
        View,
        { style: styles.followRow },
        React.createElement(
          TouchableOpacity,
          {
            style: [styles.followBtn, isFollowing ? styles.followBtnActive : null],
            onPress: handleFollow,
            accessible: true, accessibilityRole: 'button', accessibilityLabel: isFollowing ? 'Unfollow ' + user.name : 'Follow ' + user.name, accessibilityState: { selected: isFollowing },
          },
          React.createElement(Icon, {
            name: isFollowing ? 'user-check' : 'user-plus',
            size: 14,
            color: isFollowing ? COLORS.purple : COLORS.textSecondary,
          }),
          React.createElement(
            Text,
            { style: [styles.followBtnText, isFollowing ? styles.followBtnTextActive : null] },
            isFollowing ? 'Following' : 'Follow',
          ),
        ),
      ),

      // Bio
      user.bio
        ? React.createElement(
            GlassCard,
            { style: { marginHorizontal: SPACING.lg } },
            React.createElement(Text, { style: styles.bioText }, user.bio),
          )
        : null,

      // Stats
      React.createElement(
        View,
        { style: styles.statsGrid },
        [
          { icon: 'star', label: 'Level', value: String(user.level), color: '#FCD34D' },
          { icon: 'zap', label: 'XP', value: (user.xp || 0).toLocaleString(), color: COLORS.purple },
          { icon: 'activity', label: 'Streak', value: (user.streak || 0) + 'd', color: '#EF4444' },
        ].map(function (stat) {
          return React.createElement(
            GlassCard,
            { key: stat.label, style: styles.statCard },
            React.createElement(Icon, { name: stat.icon, size: 18, color: stat.color }),
            React.createElement(Text, { style: styles.statValue }, stat.value),
            React.createElement(Text, { style: styles.statLabel }, stat.label),
          );
        }),
      ),

      // Public Dreams
      user.dreams && user.dreams.length > 0
        ? React.createElement(
            View,
            { style: { marginTop: 8 } },
            React.createElement(
              View,
              { style: styles.sectionHeader },
              React.createElement(Icon, { name: 'globe', size: 16, color: '#10B981' }),
              React.createElement(Text, { style: styles.sectionTitle }, 'Dreams'),
              React.createElement(
                Text,
                { style: styles.sectionCount },
                String(user.dreams.length),
              ),
            ),
            user.dreams.map(function (dream, i) {
              var d = typeof dream === 'string' ? { title: dream } : dream;
              var catColor = CAT_COLORS[d.category] || COLORS.purple;
              var catIcon = CAT_ICONS[d.category] || 'target';
              return React.createElement(
                TouchableOpacity,
                {
                  key: d.id || i,
                  style: styles.dreamCard,
                  onPress: function () {
                    if (d.id) navigation.navigate('DreamDetail', { dreamId: d.id });
                  },
                  disabled: !d.id,
                  accessible: true, accessibilityRole: 'button', accessibilityLabel: d.title + (d.category ? ', ' + d.category : '') + (d.progressPercentage != null ? ', ' + Math.round(d.progressPercentage) + ' percent complete' : ''),
                },
                React.createElement(
                  View,
                  { style: [styles.dreamIconWrap, { backgroundColor: catColor + '15', borderColor: catColor + '25' }] },
                  React.createElement(Icon, { name: catIcon, size: 16, color: catColor }),
                ),
                React.createElement(
                  View,
                  { style: { flex: 1 } },
                  React.createElement(
                    Text,
                    { style: styles.dreamTitle, numberOfLines: 1 },
                    d.title,
                  ),
                  d.category
                    ? React.createElement(
                        Text,
                        { style: styles.dreamCat },
                        d.category.charAt(0).toUpperCase() + d.category.slice(1),
                      )
                    : null,
                  d.progressPercentage != null
                    ? React.createElement(
                        View,
                        { style: styles.progressBarWrap },
                        React.createElement(
                          View,
                          { style: styles.progressBarBg },
                          React.createElement(View, {
                            style: [
                              styles.progressBarFill,
                              {
                                width: Math.round(d.progressPercentage) + '%',
                                backgroundColor: catColor,
                              },
                            ],
                          }),
                        ),
                        React.createElement(
                          Text,
                          { style: [styles.progressPercent, { color: catColor }] },
                          Math.round(d.progressPercentage) + '%',
                        ),
                      )
                    : null,
                ),
                React.createElement(Icon, { name: 'chevron-right', size: 16, color: COLORS.textMuted }),
              );
            }),
          )
        : null,

      // Interests
      user.categories && user.categories.length > 0
        ? React.createElement(
            View,
            { style: { marginTop: 16, paddingHorizontal: SPACING.lg } },
            React.createElement(
              View,
              { style: styles.sectionHeader },
              React.createElement(Icon, { name: 'heart', size: 16, color: '#EC4899' }),
              React.createElement(Text, { style: styles.sectionTitle }, 'Interests'),
            ),
            React.createElement(
              View,
              { style: styles.interestsWrap },
              user.categories.map(function (cat, i) {
                var color = CAT_COLORS[cat] || COLORS.purple;
                var label =
                  cat.charAt(0).toUpperCase() + cat.slice(1);
                return React.createElement(
                  View,
                  {
                    key: i,
                    style: [
                      styles.interestPill,
                      { backgroundColor: color + '15', borderColor: color + '30' },
                    ],
                  },
                  React.createElement(Icon, {
                    name: CAT_ICONS[cat] || 'star',
                    size: 14,
                    color: color,
                  }),
                  React.createElement(
                    Text,
                    { style: [styles.interestText, { color: color }] },
                    label,
                  ),
                );
              }),
            ),
          )
        : null,
    ),

    // Context menu modal
    React.createElement(
      Modal,
      {
        visible: showMenu,
        transparent: true,
        animationType: 'fade',
        onRequestClose: function () {
          setShowMenu(false);
        },
      },
      React.createElement(
        TouchableOpacity,
        {
          style: styles.menuOverlay,
          activeOpacity: 1,
          onPress: function () {
            setShowMenu(false);
          },
        },
        React.createElement(
          View,
          { style: styles.menuSheet },
          React.createElement(
            TouchableOpacity,
            { style: styles.menuItem, onPress: handleRemoveFriend, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Remove Friend' },
            React.createElement(Icon, { name: 'user-minus', size: 18, color: COLORS.text }),
            React.createElement(Text, { style: styles.menuItemText }, 'Remove Friend'),
          ),
          React.createElement(
            TouchableOpacity,
            { style: styles.menuItem, onPress: handleBlock, accessible: true, accessibilityRole: 'button', accessibilityLabel: isBlocked ? 'Unblock User' : 'Block User' },
            React.createElement(Icon, {
              name: 'shield-off',
              size: 18,
              color: isBlocked ? '#10B981' : '#EF4444',
            }),
            React.createElement(
              Text,
              {
                style: [
                  styles.menuItemText,
                  { color: isBlocked ? '#10B981' : '#EF4444' },
                ],
              },
              isBlocked ? 'Unblock User' : 'Block User',
            ),
          ),
          React.createElement(
            TouchableOpacity,
            { style: styles.menuItem, onPress: handleReport, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Report User' },
            React.createElement(Icon, { name: 'flag', size: 18, color: '#F59E0B' }),
            React.createElement(
              Text,
              { style: [styles.menuItemText, { color: '#F59E0B' }] },
              'Report User',
            ),
          ),
          React.createElement(
            TouchableOpacity,
            {
              style: [styles.menuItem, { borderBottomWidth: 0 }],
              onPress: function () {
                setShowMenu(false);
              },
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel',
            },
            React.createElement(Text, { style: styles.menuItemTextCancel }, 'Cancel'),
          ),
        ),
      ),
    ),

    // Report modal
    React.createElement(
      Modal,
      {
        visible: showReportModal,
        transparent: true,
        animationType: 'slide',
        onRequestClose: function () {
          setShowReportModal(false);
        },
      },
      React.createElement(
        View,
        { style: styles.reportOverlay },
        React.createElement(
          View,
          { style: styles.reportSheet },
          React.createElement(Text, { style: styles.reportTitle }, 'Report User'),
          React.createElement(TextInput, {
            style: styles.reportInput,
            placeholder: 'Describe the issue...',
            placeholderTextColor: COLORS.textMuted,
            value: reportReason,
            onChangeText: setReportReason,
            multiline: true,
            maxLength: 1000,
            accessibilityLabel: 'Report reason',
            accessibilityHint: 'Describe the issue you want to report',
          }),
          React.createElement(
            View,
            { style: styles.reportActions },
            React.createElement(
              TouchableOpacity,
              {
                style: styles.reportCancelBtn,
                onPress: function () {
                  setShowReportModal(false);
                  setReportReason('');
                },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel report',
              },
              React.createElement(Text, { style: styles.reportCancelText }, 'Cancel'),
            ),
            React.createElement(
              TouchableOpacity,
              {
                style: styles.reportSubmitBtn,
                onPress: submitReport,
                disabled: !reportReason.trim(),
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Submit report', accessibilityState: { disabled: !reportReason.trim() },
              },
              React.createElement(Text, { style: styles.reportSubmitText }, 'Submit'),
            ),
          ),
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
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  joinedText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  mutualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  mutualText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 5,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    backgroundColor: COLORS.purple,
    borderRadius: 14,
    marginRight: 8,
  },
  actionBtnDone: {
    backgroundColor: '#14B8A6',
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 14,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  followRow: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 20,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  followBtnActive: {
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 7,
  },
  followBtnTextActive: {
    color: COLORS.purple,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  dreamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    marginHorizontal: SPACING.lg,
    marginBottom: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 16,
  },
  dreamIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  dreamTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dreamCat: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
    minWidth: 28,
    textAlign: 'right',
  },
  interestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: COLORS.bodyBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 14,
  },
  menuItemTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  reportSheet: {
    backgroundColor: COLORS.bodyBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  reportInput: {
    backgroundColor: COLORS.glassBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  reportActions: {
    flexDirection: 'row',
  },
  reportCancelBtn: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
  },
  reportCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  reportSubmitBtn: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  reportSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

module.exports = UserProfileScreen;
