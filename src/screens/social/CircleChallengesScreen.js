/**
 * CircleChallengesScreen — Circle challenges: active/past challenges,
 * join/leave, leaderboard, create challenge (admin only).
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
} = require('react-native');
var { useNavigation, useRoute } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { CIRCLES } = require('../../services/endpoints');
var ScreenShell = require('../../components/shared/ScreenShell');
var GlassHeader = require('../../components/shared/GlassHeader');
var GlassCard = require('../../components/shared/GlassCard');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { useAuth } = require('../../context/AuthContext');
var { COLORS, SPACING, RADIUS, CONTACT_COLORS } = require('../../theme/tokens');

var avatarColor = function (name) {
  var h = 0;
  for (var i = 0; i < (name || '').length; i++) {
    h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  }
  return CONTACT_COLORS[Math.abs(h) % CONTACT_COLORS.length];
};

var formatDeadline = function (dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var now = new Date();
  var diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Ended';
  if (diff === 0) return 'Ends today';
  if (diff === 1) return '1 day left';
  if (diff <= 7) return diff + ' days left';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

var CircleChallengesScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  var circleId = route.params && route.params.circleId;
  var { user: authUser } = useAuth();
  var qc = useQueryClient();

  var [activeTab, setActiveTab] = useState('active');
  var [showCreateForm, setShowCreateForm] = useState(false);
  var [selectedChallenge, setSelectedChallenge] = useState(null);
  var [showLeaderboard, setShowLeaderboard] = useState(false);

  // ── Create form state ──
  var [formTitle, setFormTitle] = useState('');
  var [formDesc, setFormDesc] = useState('');
  var [formDuration, setFormDuration] = useState('7');

  // ── Data ──
  var circleQuery = useQuery({
    queryKey: ['circle', circleId],
    queryFn: function () {
      return apiGet(CIRCLES.DETAIL(circleId));
    },
    enabled: !!circleId,
  });
  var rawCircleData = circleQuery.data || {};
  var circle = rawCircleData.circle || rawCircleData;
  var members = circle.members || [];
  var myRole = (function () {
    var me = members.find(function (m) {
      return m.isCurrentUser || String((m.user || m).id) === String(authUser && authUser.id);
    });
    return me ? me.role : null;
  })();
  var isAdmin = myRole === 'admin';

  var challengesQuery = useQuery({
    queryKey: ['circle-challenges', circleId],
    queryFn: function () {
      return apiGet(CIRCLES.CHALLENGES(circleId));
    },
    enabled: !!circleId,
  });
  var allChallenges = (function () {
    var d = challengesQuery.data;
    return (d && d.results) || d || [];
  })();

  var activeChallenges = allChallenges.filter(function (ch) {
    return ch.status !== 'completed' && ch.status !== 'ended';
  });
  var pastChallenges = allChallenges.filter(function (ch) {
    return ch.status === 'completed' || ch.status === 'ended';
  });

  var challenges = activeTab === 'active' ? activeChallenges : pastChallenges;

  // ── Leaderboard query ──
  var leaderboardQuery = useQuery({
    queryKey: ['challenge-leaderboard', circleId, selectedChallenge],
    queryFn: function () {
      return apiGet(CIRCLES.CHALLENGE_LEADERBOARD(circleId, selectedChallenge));
    },
    enabled: !!selectedChallenge && showLeaderboard,
  });
  var leaderboard = (function () {
    var d = leaderboardQuery.data;
    return (d && d.results) || d || [];
  })();

  // ── Mutations ──
  var joinMut = useMutation({
    mutationFn: function (challengeId) {
      return apiPost(CIRCLES.CHALLENGE_JOIN(challengeId));
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['circle-challenges', circleId] });
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to join challenge');
    },
  });

  var progressMut = useMutation({
    mutationFn: function (data) {
      return apiPost(CIRCLES.CHALLENGE_PROGRESS(circleId, data.challengeId), {
        progress: data.progress,
      });
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['circle-challenges', circleId] });
    },
  });

  var createMut = useMutation({
    mutationFn: function (data) {
      return apiPost(CIRCLES.CHALLENGE_CREATE(circleId), data);
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['circle-challenges', circleId] });
      setShowCreateForm(false);
      setFormTitle('');
      setFormDesc('');
      setFormDuration('7');
      Alert.alert('Success', 'Challenge created!');
    },
    onError: function (err) {
      Alert.alert('Error', err.message || 'Failed to create challenge');
    },
  });

  var handleCreate = useCallback(function () {
    if (!formTitle.trim()) {
      Alert.alert('Required', 'Please enter a challenge title');
      return;
    }
    var dur = parseInt(formDuration, 10);
    if (isNaN(dur) || dur < 1) {
      Alert.alert('Invalid', 'Duration must be at least 1 day');
      return;
    }
    createMut.mutate({
      title: formTitle.trim(),
      description: formDesc.trim(),
      durationDays: dur,
    });
  }, [formTitle, formDesc, formDuration, createMut]);

  var handleShowLeaderboard = useCallback(function (challengeId) {
    setSelectedChallenge(challengeId);
    setShowLeaderboard(true);
  }, []);

  var renderChallenge = useCallback(function (info) {
    var ch = info.item;
    var isJoined = ch.isJoined != null ? ch.isJoined : (ch.is_joined || false);
    var progressPct = ch.myProgress || ch.progress || 0;
    var deadline = ch.endDate || ch.deadline || ch.endsAt;
    var isEnded = ch.status === 'completed' || ch.status === 'ended';

    return React.createElement(
      GlassCard,
      { style: { marginHorizontal: SPACING.lg } },
      // Header
      React.createElement(
        View,
        { style: styles.challengeHeader },
        React.createElement(
          View,
          { style: styles.challengeIconWrap },
          React.createElement(Icon, { name: 'target', size: 20, color: COLORS.purple }),
        ),
        React.createElement(
          View,
          { style: { flex: 1, marginLeft: 12 } },
          React.createElement(Text, { style: styles.challengeTitle }, ch.title),
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', marginTop: 4 } },
            React.createElement(Icon, { name: 'users', size: 12, color: COLORS.textMuted }),
            React.createElement(
              Text,
              { style: styles.challengeMeta },
              ' ' + (ch.participantCount || ch.participants || 0) + ' participants',
            ),
            deadline
              ? React.createElement(
                  Text,
                  { style: styles.challengeMeta },
                  ' \u00B7 ' + formatDeadline(deadline),
                )
              : null,
          ),
        ),
        !isEnded
          ? React.createElement(
              View,
              { style: [styles.statusBadge, isJoined ? styles.statusJoined : styles.statusOpen] },
              React.createElement(
                Text,
                { style: [styles.statusText, isJoined ? { color: COLORS.green } : { color: COLORS.blue }] },
                isJoined ? 'Joined' : 'Open',
              ),
            )
          : React.createElement(
              View,
              { style: [styles.statusBadge, { backgroundColor: 'rgba(156,163,175,0.12)' }] },
              React.createElement(Text, { style: [styles.statusText, { color: '#9CA3AF' }] }, 'Ended'),
            ),
      ),

      // Description
      ch.description
        ? React.createElement(Text, { style: styles.challengeDesc }, ch.description)
        : null,

      // Progress bar (if joined)
      isJoined && !isEnded
        ? React.createElement(
            View,
            { style: styles.progressSection },
            React.createElement(
              View,
              { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 } },
              React.createElement(Text, { style: styles.progressLabel }, 'Your Progress'),
              React.createElement(
                Text,
                { style: styles.progressValue },
                Math.round(progressPct) + '%',
              ),
            ),
            React.createElement(
              View,
              { style: styles.progressBarBg },
              React.createElement(View, {
                style: [
                  styles.progressBarFill,
                  { width: Math.min(progressPct, 100) + '%' },
                ],
              }),
            ),
          )
        : null,

      // Actions
      React.createElement(
        View,
        { style: styles.challengeActions },
        // Leaderboard button
        React.createElement(
          TouchableOpacity,
          {
            style: styles.actionBtn,
            onPress: function () { handleShowLeaderboard(ch.id); },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'View leaderboard for ' + ch.title,
          },
          React.createElement(Icon, { name: 'bar-chart-2', size: 16, color: COLORS.textSecondary }),
          React.createElement(Text, { style: styles.actionBtnText }, 'Leaderboard'),
        ),

        // Join / Update progress
        !isEnded && !isJoined
          ? React.createElement(
              TouchableOpacity,
              {
                style: styles.joinBtn,
                onPress: function () { joinMut.mutate(ch.id); },
                disabled: joinMut.isPending,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Join challenge ' + ch.title, accessibilityState: { disabled: joinMut.isPending },
              },
              React.createElement(Icon, { name: 'plus', size: 14, color: '#FFFFFF' }),
              React.createElement(Text, { style: styles.joinBtnText }, 'Join'),
            )
          : !isEnded && isJoined
            ? React.createElement(
                TouchableOpacity,
                {
                  style: styles.updateBtn,
                  onPress: function () {
                    var newProgress = Math.min((progressPct || 0) + 10, 100);
                    progressMut.mutate({ challengeId: ch.id, progress: newProgress });
                  },
                  accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Increase progress by 10 percent', accessibilityHint: 'Current progress is ' + Math.round(progressPct) + ' percent',
                },
                React.createElement(Icon, { name: 'trending-up', size: 14, color: COLORS.purple }),
                React.createElement(Text, { style: styles.updateBtnText }, '+10%'),
              )
            : null,
      ),
    );
  }, [joinMut, progressMut, handleShowLeaderboard]);

  var renderLeaderboardRow = useCallback(function (info) {
    var entry = info.item;
    var rank = info.index + 1;
    var user = entry.user || entry;
    var name = user.displayName || user.display_name || user.username || 'User';
    var progress = entry.progress || entry.score || 0;

    var rankColors = { 1: '#FCD34D', 2: '#C0C0C0', 3: '#CD7F32' };
    var rankColor = rankColors[rank] || COLORS.textMuted;

    return React.createElement(
      View,
      { style: styles.leaderRow },
      React.createElement(
        Text,
        { style: [styles.leaderRank, { color: rankColor }] },
        '#' + rank,
      ),
      React.createElement(Avatar, {
        name: name,
        src: user.avatar,
        size: 36,
        color: avatarColor(name),
      }),
      React.createElement(
        View,
        { style: { flex: 1, marginLeft: 10 } },
        React.createElement(Text, { style: styles.leaderName }, name),
      ),
      React.createElement(
        Text,
        { style: styles.leaderScore },
        Math.round(progress) + '%',
      ),
    );
  }, []);

  var keyExtractor = useCallback(function (item) {
    return String(item.id);
  }, []);

  var tabs = [
    { key: 'active', label: 'Active (' + activeChallenges.length + ')' },
    { key: 'past', label: 'Past (' + pastChallenges.length + ')' },
  ];

  return React.createElement(
    ScreenShell,
    null,
    React.createElement(GlassHeader, {
      title: 'Challenges',
      onBack: function () { navigation.goBack(); },
      rightActions: isAdmin
        ? [{
            icon: 'plus',
            onPress: function () { setShowCreateForm(true); },
          }]
        : undefined,
    }),

    // ── Tabs ──
    React.createElement(
      View,
      { style: styles.tabRow },
      tabs.map(function (tab) {
        var isActive = activeTab === tab.key;
        return React.createElement(
          TouchableOpacity,
          {
            key: tab.key,
            style: [styles.tabBtn, isActive && styles.tabBtnActive],
            onPress: function () { setActiveTab(tab.key); },
            accessible: true, accessibilityRole: 'tab', accessibilityLabel: tab.label, accessibilityState: { selected: isActive },
          },
          React.createElement(
            Text,
            { style: [styles.tabText, isActive && styles.tabTextActive] },
            tab.label,
          ),
        );
      }),
    ),

    // ── Challenges list ──
    challengesQuery.isLoading
      ? React.createElement(
          View,
          { style: styles.loadingWrap },
          React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
        )
      : React.createElement(FlatList, {
          data: challenges,
          renderItem: renderChallenge,
          keyExtractor: keyExtractor,
          contentContainerStyle: { paddingBottom: 100, paddingTop: 8 },
          showsVerticalScrollIndicator: false,
          ListEmptyComponent: React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Icon, { name: 'target', size: 48, color: COLORS.textMuted }),
            React.createElement(
              Text,
              { style: styles.emptyText },
              activeTab === 'active' ? 'No active challenges' : 'No past challenges',
            ),
            isAdmin && activeTab === 'active'
              ? React.createElement(
                  TouchableOpacity,
                  {
                    style: styles.createEmptyBtn,
                    onPress: function () { setShowCreateForm(true); },
                    accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Create Challenge',
                  },
                  React.createElement(Text, { style: styles.createEmptyBtnText }, 'Create Challenge'),
                )
              : null,
          ),
        }),

    // ── Create Challenge Modal ──
    React.createElement(
      Modal,
      {
        visible: showCreateForm,
        animationType: 'slide',
        transparent: false,
        onRequestClose: function () { setShowCreateForm(false); },
      },
      React.createElement(
        ScreenShell,
        null,
        React.createElement(GlassHeader, {
          title: 'Create Challenge',
          onBack: function () { setShowCreateForm(false); },
        }),
        React.createElement(
          ScrollView,
          {
            contentContainerStyle: { paddingBottom: 60 },
            keyboardShouldPersistTaps: 'handled',
          },
          // Title
          React.createElement(
            View,
            { style: styles.formField },
            React.createElement(Text, { style: styles.formLabel }, 'Challenge Title *'),
            React.createElement(TextInput, {
              style: styles.formInput,
              placeholder: 'e.g., 30-Day Fitness Sprint',
              placeholderTextColor: COLORS.textMuted,
              value: formTitle,
              onChangeText: setFormTitle,
              maxLength: 100,
              accessibilityLabel: 'Challenge title',
            }),
          ),
          // Description
          React.createElement(
            View,
            { style: styles.formField },
            React.createElement(Text, { style: styles.formLabel }, 'Description'),
            React.createElement(TextInput, {
              style: [styles.formInput, { minHeight: 80 }],
              placeholder: 'Describe the challenge rules and goals...',
              placeholderTextColor: COLORS.textMuted,
              value: formDesc,
              onChangeText: setFormDesc,
              multiline: true,
              maxLength: 500,
              textAlignVertical: 'top',
              accessibilityLabel: 'Challenge description',
            }),
          ),
          // Duration
          React.createElement(
            View,
            { style: styles.formField },
            React.createElement(Text, { style: styles.formLabel }, 'Duration (days) *'),
            React.createElement(
              View,
              { style: styles.durationRow },
              ['7', '14', '21', '30'].map(function (d) {
                var isActive = formDuration === d;
                return React.createElement(
                  TouchableOpacity,
                  {
                    key: d,
                    style: [styles.durationPill, isActive && styles.durationPillActive],
                    onPress: function () { setFormDuration(d); },
                    accessible: true, accessibilityRole: 'button', accessibilityLabel: d + ' days', accessibilityState: { selected: isActive },
                  },
                  React.createElement(
                    Text,
                    { style: [styles.durationPillText, isActive && styles.durationPillTextActive] },
                    d + 'd',
                  ),
                );
              }),
              React.createElement(TextInput, {
                style: styles.durationCustom,
                placeholder: 'Custom',
                placeholderTextColor: COLORS.textMuted,
                value: !['7', '14', '21', '30'].includes(formDuration) ? formDuration : '',
                onChangeText: setFormDuration,
                keyboardType: 'numeric',
                maxLength: 3,
                accessibilityLabel: 'Custom duration in days',
              }),
            ),
          ),
          // Submit
          React.createElement(
            TouchableOpacity,
            {
              style: [styles.createBtn, !formTitle.trim() && { opacity: 0.4 }],
              onPress: handleCreate,
              disabled: createMut.isPending || !formTitle.trim(),
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Create Challenge', accessibilityState: { disabled: createMut.isPending || !formTitle.trim() },
            },
            createMut.isPending
              ? React.createElement(ActivityIndicator, { size: 'small', color: '#FFFFFF' })
              : React.createElement(Text, { style: styles.createBtnText }, 'Create Challenge'),
          ),
        ),
      ),
    ),

    // ── Leaderboard Modal ──
    React.createElement(
      Modal,
      {
        visible: showLeaderboard,
        animationType: 'slide',
        transparent: false,
        onRequestClose: function () { setShowLeaderboard(false); },
      },
      React.createElement(
        ScreenShell,
        null,
        React.createElement(GlassHeader, {
          title: 'Leaderboard',
          onBack: function () { setShowLeaderboard(false); },
        }),
        leaderboardQuery.isLoading
          ? React.createElement(
              View,
              { style: styles.loadingWrap },
              React.createElement(ActivityIndicator, { size: 'large', color: COLORS.purple }),
            )
          : React.createElement(FlatList, {
              data: leaderboard,
              renderItem: renderLeaderboardRow,
              keyExtractor: function (item, idx) { return String(item.id || idx); },
              contentContainerStyle: { paddingBottom: 60 },
              showsVerticalScrollIndicator: false,
              ListEmptyComponent: React.createElement(
                View,
                { style: styles.emptyWrap },
                React.createElement(Text, { style: styles.emptyText }, 'No participants yet'),
              ),
            }),
      ),
    ),
  );
};

var styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.purple,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.purple + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  challengeMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusJoined: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  statusOpen: {
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  challengeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 10,
  },
  progressSection: {
    marginTop: 14,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.glassBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.purple,
    borderRadius: 3,
  },
  challengeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: COLORS.purple,
    borderRadius: 10,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.purple + '15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.purple + '30',
  },
  updateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
    marginLeft: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 16,
  },
  createEmptyBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.purple,
    borderRadius: 12,
  },
  createEmptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Create form
  formField: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
  },
  durationPillActive: {
    backgroundColor: COLORS.purple + '20',
    borderColor: COLORS.purple + '40',
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  durationPillTextActive: {
    color: COLORS.purple,
  },
  durationCustom: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  createBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Leaderboard
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  leaderRank: {
    fontSize: 16,
    fontWeight: '700',
    width: 36,
    textAlign: 'center',
  },
  leaderName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  leaderScore: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.purple,
  },
});

module.exports = CircleChallengesScreen;
