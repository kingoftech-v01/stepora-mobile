/**
 * ReferralScreen — Referral program with unique code, stats,
 * sharing options, and list of referred friends.
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Share,
  RefreshControl,
  Alert,
} = require('react-native');
// Clipboard: try @react-native-clipboard if available, else fallback to Share
var Clipboard = null;
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  // fallback handled in handleCopyLink
}
var { useNavigation } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet } = require('../../services/api');
var { SUBSCRIPTIONS } = require('../../services/endpoints');
var { BRAND } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS, SHADOWS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var GlassButton = require('../../components/GlassButton');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');
var Avatar = require('../../components/shared/Avatar');
var Icon = require('react-native-vector-icons/Feather').default;
var { COLORS, CONTACT_COLORS } = require('../../theme/tokens');

var getAvatarColor = function (name) {
  if (!name) return CONTACT_COLORS[0];
  var hash = 0;
  for (var i = 0; i < name.length; i++) hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
};

var HOW_IT_WORKS = [
  {
    step: 1,
    icon: 'share-2',
    title: 'Share Your Link',
    desc: 'Send your unique referral link to friends via any channel.',
    color: BRAND.purple,
  },
  {
    step: 2,
    icon: 'user-plus',
    title: 'Friend Signs Up',
    desc: 'Your friend creates an account using your referral link.',
    color: BRAND.teal,
  },
  {
    step: 3,
    icon: 'gift',
    title: 'Both Get Rewarded',
    desc: 'You and your friend each earn XP and bonus rewards!',
    color: BRAND.yellow,
  },
];

// ─── Screen ─────────────────────────────────────────────────────

var ReferralScreen = function () {
  var navigation = useNavigation();
  var [refreshing, setRefreshing] = useState(false);
  var [codeCopied, setCodeCopied] = useState(false);

  // ─── Queries ────────────────────────────────────────────────

  var referralQuery = useQuery({
    queryKey: ['referral-info'],
    queryFn: function () {
      return apiGet(SUBSCRIPTIONS.REFERRAL);
    },
  });

  var data = referralQuery.data || {};
  var referralCode = data.referralCode || data.code || '';
  var referralLink = data.referralLink || data.link || ('https://stepora.app/r/' + referralCode);
  var stats = data.stats || {};
  var totalReferrals = stats.total || stats.totalReferrals || data.totalReferrals || 0;
  var successfulReferrals = stats.successful || stats.successfulReferrals || data.successfulReferrals || 0;
  var pendingReferrals = stats.pending || stats.pendingReferrals || data.pendingReferrals || 0;
  var rewardsEarned = stats.rewardsEarned || data.rewardsEarned || data.totalRewards || 0;
  var referredFriends = data.referrals || data.referredFriends || data.friends || [];
  if (!Array.isArray(referredFriends)) referredFriends = [];

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    referralQuery.refetch().finally(function () {
      setRefreshing(false);
    });
  }, []);

  // ─── Share handlers ───────────────────────────────────────────

  var handleCopyLink = function () {
    if (Clipboard && Clipboard.setString) {
      try {
        Clipboard.setString(referralLink);
        setCodeCopied(true);
        setTimeout(function () { setCodeCopied(false); }, 2000);
        return;
      } catch (e) {
        // fall through to Share
      }
    }
    // Fallback: use Share API to let user copy
    Share.share({ message: referralLink }).then(function () {
      setCodeCopied(true);
      setTimeout(function () { setCodeCopied(false); }, 2000);
    }).catch(function () {});
  };

  var handleShareNative = function (method) {
    var message = 'Join me on Stepora and turn your dreams into reality! Use my referral code: ' + referralCode + '\n\n' + referralLink;

    Share.share({
      message: message,
      url: referralLink,
      title: 'Join Stepora',
    }).catch(function () {
      // User cancelled or error — silent
    });
  };

  // ─── Render ─────────────────────────────────────────────────

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(ScreenHeader, {
      title: 'Referral Program',
      left: React.createElement(BackButton, {
        onPress: function () { navigation.goBack(); },
      }),
    }),

    React.createElement(
      ScrollView,
      {
        style: styles.scroll,
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        refreshControl: React.createElement(RefreshControl, {
          refreshing: refreshing,
          onRefresh: onRefresh,
          tintColor: BRAND.purple,
        }),
      },

      // Loading
      referralQuery.isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap },
            React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple }),
          )
        : null,

      // Error
      referralQuery.isError
        ? React.createElement(
            View,
            { style: styles.emptyWrap },
            React.createElement(Text, { style: styles.emptyTitle }, 'Failed to load referral info'),
            React.createElement(
              GlassButton,
              { variant: 'primary', onPress: onRefresh },
              'Retry',
            ),
          )
        : null,

      // Content
      !referralQuery.isLoading && !referralQuery.isError
        ? React.createElement(
            View,
            null,

            // ── Hero section ──────────────────────────────
            React.createElement(
              GlassCard,
              {
                padding: 24,
                mb: 20,
                style: {
                  backgroundColor: 'rgba(139,92,246,0.06)',
                  borderColor: 'rgba(139,92,246,0.15)',
                  alignItems: 'center',
                },
              },
              React.createElement(
                View,
                { style: styles.heroIconWrap },
                React.createElement(Icon, { name: 'gift', size: 28, color: BRAND.purple }),
              ),
              React.createElement(
                Text,
                { style: styles.heroTitle },
                'Invite Friends, Earn Rewards',
              ),
              React.createElement(
                Text,
                { style: styles.heroDesc },
                'Share your unique referral code and earn XP for every friend that joins.',
              ),
            ),

            // ── Referral Code ───────────────────────────────
            React.createElement(
              GlassCard,
              { padding: 20, mb: 16 },
              React.createElement(
                Text,
                { style: styles.sectionTitle },
                'Your Referral Code',
              ),
              React.createElement(
                View,
                { style: styles.codeRow },
                React.createElement(
                  View,
                  { style: styles.codeBox },
                  React.createElement(
                    Text,
                    { style: styles.codeText },
                    referralCode || '------',
                  ),
                ),
                React.createElement(
                  TouchableOpacity,
                  {
                    style: [
                      styles.copyBtn,
                      codeCopied && { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
                    ],
                    onPress: handleCopyLink,
                    accessible: true, accessibilityRole: 'button', accessibilityLabel: codeCopied ? 'Referral link copied' : 'Copy referral link',
                  },
                  React.createElement(Icon, {
                    name: codeCopied ? 'check' : 'copy',
                    size: 18,
                    color: codeCopied ? BRAND.greenSolid : BRAND.purple,
                  }),
                ),
              ),
              // Share buttons
              React.createElement(
                Text,
                { style: styles.shareLabel },
                'Share via',
              ),
              React.createElement(
                View,
                { style: styles.shareRow },
                // Copy Link
                React.createElement(
                  TouchableOpacity,
                  { style: styles.shareBtn, onPress: handleCopyLink, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Copy referral link' },
                  React.createElement(
                    View,
                    { style: [styles.shareIconCircle, { backgroundColor: 'rgba(139,92,246,0.12)' }] },
                    React.createElement(Icon, { name: 'link', size: 16, color: BRAND.purple }),
                  ),
                  React.createElement(Text, { style: styles.shareBtnText }, 'Copy Link'),
                ),
                // WhatsApp
                React.createElement(
                  TouchableOpacity,
                  { style: styles.shareBtn, onPress: function () { handleShareNative('whatsapp'); }, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Share via WhatsApp' },
                  React.createElement(
                    View,
                    { style: [styles.shareIconCircle, { backgroundColor: 'rgba(37,211,102,0.12)' }] },
                    React.createElement(Icon, { name: 'message-circle', size: 16, color: '#25D366' }),
                  ),
                  React.createElement(Text, { style: styles.shareBtnText }, 'WhatsApp'),
                ),
                // SMS
                React.createElement(
                  TouchableOpacity,
                  { style: styles.shareBtn, onPress: function () { handleShareNative('sms'); }, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Share via SMS' },
                  React.createElement(
                    View,
                    { style: [styles.shareIconCircle, { backgroundColor: 'rgba(59,130,246,0.12)' }] },
                    React.createElement(Icon, { name: 'smartphone', size: 16, color: BRAND.blue }),
                  ),
                  React.createElement(Text, { style: styles.shareBtnText }, 'SMS'),
                ),
                // Email
                React.createElement(
                  TouchableOpacity,
                  { style: styles.shareBtn, onPress: function () { handleShareNative('email'); }, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Share via Email' },
                  React.createElement(
                    View,
                    { style: [styles.shareIconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }] },
                    React.createElement(Icon, { name: 'mail', size: 16, color: BRAND.redSolid }),
                  ),
                  React.createElement(Text, { style: styles.shareBtnText }, 'Email'),
                ),
              ),
            ),

            // ── Stats ───────────────────────────────────────
            React.createElement(
              View,
              { style: styles.statsGrid },
              // Total
              React.createElement(
                GlassCard,
                { padding: 16, mb: 0, style: styles.statCard },
                React.createElement(
                  Text,
                  { style: [styles.statValue, { color: BRAND.purple }] },
                  String(totalReferrals),
                ),
                React.createElement(
                  Text,
                  { style: styles.statLabel },
                  'Total',
                ),
              ),
              // Successful
              React.createElement(
                GlassCard,
                { padding: 16, mb: 0, style: styles.statCard },
                React.createElement(
                  Text,
                  { style: [styles.statValue, { color: BRAND.greenSolid }] },
                  String(successfulReferrals),
                ),
                React.createElement(
                  Text,
                  { style: styles.statLabel },
                  'Successful',
                ),
              ),
              // Pending
              React.createElement(
                GlassCard,
                { padding: 16, mb: 0, style: styles.statCard },
                React.createElement(
                  Text,
                  { style: [styles.statValue, { color: BRAND.yellow }] },
                  String(pendingReferrals),
                ),
                React.createElement(
                  Text,
                  { style: styles.statLabel },
                  'Pending',
                ),
              ),
              // Rewards
              React.createElement(
                GlassCard,
                { padding: 16, mb: 0, style: styles.statCard },
                React.createElement(
                  Text,
                  { style: [styles.statValue, { color: BRAND.teal }] },
                  '\u26A1 ' + String(rewardsEarned),
                ),
                React.createElement(
                  Text,
                  { style: styles.statLabel },
                  'XP Earned',
                ),
              ),
            ),

            // ── How It Works ──────────────────────────────────
            React.createElement(
              GlassCard,
              { padding: 20, mb: 16 },
              React.createElement(
                Text,
                { style: styles.sectionTitle },
                'How It Works',
              ),
              HOW_IT_WORKS.map(function (step) {
                return React.createElement(
                  View,
                  { key: step.step, style: styles.stepRow },
                  React.createElement(
                    View,
                    { style: [styles.stepCircle, { backgroundColor: step.color + '15', borderColor: step.color + '30' }] },
                    React.createElement(Icon, { name: step.icon, size: 18, color: step.color }),
                  ),
                  React.createElement(
                    View,
                    { style: { flex: 1, marginLeft: 14 } },
                    React.createElement(
                      Text,
                      { style: styles.stepTitle },
                      'Step ' + step.step + ': ' + step.title,
                    ),
                    React.createElement(
                      Text,
                      { style: styles.stepDesc },
                      step.desc,
                    ),
                  ),
                );
              }),
            ),

            // ── Referred Friends List ─────────────────────────
            React.createElement(
              GlassCard,
              { padding: 20, mb: 20 },
              React.createElement(
                Text,
                { style: styles.sectionTitle },
                'Referred Friends (' + referredFriends.length + ')',
              ),
              referredFriends.length === 0
                ? React.createElement(
                    View,
                    { style: styles.emptyFriendsWrap },
                    React.createElement(Icon, { name: 'users', size: 24, color: COLORS.textMuted }),
                    React.createElement(
                      Text,
                      { style: styles.emptyFriendsText },
                      'No referrals yet. Share your code to get started!',
                    ),
                  )
                : referredFriends.map(function (friend, idx) {
                    var name = friend.displayName || friend.username || friend.name || 'User';
                    var status = friend.status || 'pending';
                    var statusColor = status === 'active' || status === 'successful' || status === 'completed'
                      ? BRAND.greenSolid
                      : status === 'pending'
                        ? BRAND.yellow
                        : COLORS.textMuted;

                    return React.createElement(
                      View,
                      { key: friend.id || idx, style: styles.referralFriendRow },
                      React.createElement(Avatar, {
                        name: name,
                        src: friend.avatar || friend.avatarUrl || null,
                        size: 36,
                        color: getAvatarColor(name),
                      }),
                      React.createElement(
                        View,
                        { style: { flex: 1, marginLeft: 12 } },
                        React.createElement(
                          Text,
                          { style: styles.referralFriendName },
                          name,
                        ),
                        friend.joinedAt || friend.date
                          ? React.createElement(
                              Text,
                              { style: styles.referralFriendDate },
                              'Joined ' + new Date(friend.joinedAt || friend.date).toLocaleDateString(),
                            )
                          : null,
                      ),
                      React.createElement(
                        View,
                        {
                          style: [
                            styles.referralStatusBadge,
                            { backgroundColor: statusColor + '15', borderColor: statusColor + '30' },
                          ],
                        },
                        React.createElement(
                          Text,
                          { style: { fontSize: 10, fontWeight: FONT_WEIGHTS.semibold, color: statusColor, textTransform: 'capitalize' } },
                          status,
                        ),
                      ),
                    );
                  }),
            ),
          )
        : null,

      React.createElement(View, { style: { height: 40 } }),
    ),
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  loadingWrap: { padding: 60, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: FONT_WEIGHTS.semibold, color: theme.textTertiary, marginBottom: 16 },

  // Hero
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    marginBottom: 14,
  },

  // Referral code
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  codeBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  codeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: BRAND.purple,
    letterSpacing: 3,
  },
  copyBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shareLabel: {
    fontSize: FONT_SIZES.sm,
    color: theme.textMuted,
    marginBottom: 10,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareBtn: { alignItems: 'center' },
  shareIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shareBtnText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: theme.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // How it works
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    lineHeight: 19,
  },

  // Referred friends
  emptyFriendsWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyFriendsText: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  referralFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  referralFriendName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  referralFriendDate: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  referralStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
});

module.exports = ReferralScreen;
