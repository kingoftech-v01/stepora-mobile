/**
 * ProfileScreen -- React Native.
 * Ported from ProfileMobile.jsx (web app).
 */
var React = require('react');
var {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} = require('react-native');
var useProfileScreen = require('./useProfileScreen');
var OnboardingTooltip = require('../../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../../config/onboardingTooltips');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');
var CalendarHeatmap = require('../../../components/CalendarHeatmap');
var { OfflineDataBanner } = require('../../../components/shared/OfflineBanner');

function ProfileScreen() {
  var h = useProfileScreen();
  var statsRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('ProfileScreen');

  if (h.isLoadingData) {
    return (
      <View style={styles.centerWrap} accessibilityLiveRegion="polite">
        <ActivityIndicator color={BRAND.purple} size="large" accessibilityLabel="Loading profile" />
      </View>
    );
  }

  var profileHasCache = h.isErrorData && h.user && (h.user.email || h.user.username);
  if (h.isErrorData && !profileHasCache) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.errorMsg} accessibilityRole="alert">{h.errorMessage}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={h.retryAll} accessible={true} accessibilityRole="button" accessibilityLabel="Retry loading profile">
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {profileHasCache ? <OfflineDataBanner /> : null}
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">{h.t('nav.profile')}</Text>
        <TouchableOpacity onPress={function () { h.navigation.navigate('Settings'); }} accessible={true} accessibilityRole="button" accessibilityLabel="Settings">
          <Text style={styles.settingsText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + Info */}
      <View style={styles.avatarCard}>
        <View style={styles.avatarCircle} accessible={true} accessibilityRole="image" accessibilityLabel={(h.displayName || 'User') + ' avatar'}>
          <Text style={styles.avatarInitial} accessible={false}>
            {h.displayName ? h.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.levelBadge} accessible={true} accessibilityLabel={'Level ' + h.level}>
          <Text style={styles.levelBadgeText}>{h.t('profile.levelShort')}{h.level}</Text>
        </View>
        <TouchableOpacity
          style={styles.editAvatarBtn}
          onPress={function () { h.navigation.navigate('EditProfile'); }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editAvatarText}>✏️</Text>
        </TouchableOpacity>
        <Text style={styles.userName}>{h.displayName}</Text>
        {h.isPremium ? (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>👑 {h.subscriptionLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.userEmail}>{h.email}</Text>
      </View>

      {/* Stats row */}
      <View ref={statsRef} style={styles.statsRow}>
        {/* XP */}
        <View style={styles.statCard} accessible={true} accessibilityLabel={'Level ' + h.level + ', ' + h.xp.toLocaleString() + ' XP, ' + h.xpToNext + ' XP to next level'}>
          <Text style={styles.statLabel} accessible={false}>⚡ Level {h.level}</Text>
          <Text style={styles.statValue} accessible={false}>{h.xp.toLocaleString()} XP</Text>
          <Text style={styles.statSub} accessible={false}>{h.xp % 100} / 100 to next</Text>
          <View style={styles.progressTrack} accessible={true} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(h.lvlProgress * 100) }}>
            <View style={[styles.progressFill, { width: (h.lvlProgress * 100) + '%' }]} />
          </View>
          <Text style={styles.statSub} accessible={false}>{h.xpToNext} XP to next</Text>
        </View>

        {/* Streak + Tasks */}
        <View style={styles.statCard}>
          <View style={styles.miniStatRow}>
            <View style={styles.miniStat} accessible={true} accessibilityLabel={h.streak + ' day streak'}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(246,154,154,0.12)' }]} accessible={false}>
                <Text style={styles.miniEmoji}>🔥</Text>
              </View>
              <Text style={styles.miniValue} accessible={false}>{h.streak}</Text>
              <Text style={styles.miniLabel} accessible={false}>{h.t('profile.streak')}</Text>
            </View>
            <View style={styles.miniStat} accessible={true} accessibilityLabel={(h.userStats.total_tasks_completed || h.userStats.totalTasksCompleted || 0) + ' tasks completed'}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(139,92,246,0.12)' }]} accessible={false}>
                <Text style={styles.miniEmoji}>📈</Text>
              </View>
              <Text style={styles.miniValue} accessible={false}>{h.userStats.total_tasks_completed || h.userStats.totalTasksCompleted || 0}</Text>
              <Text style={styles.miniLabel} accessible={false}>{h.t('profile.tasksDone')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Activity Heatmap */}
      <CalendarHeatmap days={365} />

      {/* Skills */}
      {h.skills && h.skills.length > 0 ? (
        <View style={styles.skillsCard}>
          <Text style={styles.sectionTitle}>{h.t('profile.skillRadar')}</Text>
          {h.skills.map(function (s, i) {
            var prog = s.maxXp > 0 ? s.xp / s.maxXp : 0;
            return (
              <View key={i} style={i < h.skills.length - 1 ? { marginBottom: 12 } : null}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillLabel}>{s.label}</Text>
                  <View style={[styles.skillLevelBadge, { backgroundColor: s.color + '12' }]}>
                    <Text style={[styles.skillLevelText, { color: s.color }]}>{h.t('profile.levelShort')}{s.level}</Text>
                  </View>
                </View>
                <View style={styles.skillTrack}>
                  <View style={[styles.skillFill, { width: (prog * 100) + '%', backgroundColor: s.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Achievements */}
      {h.achievements && h.achievements.length > 0 ? (
        <View style={styles.achievementsCard}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>{h.t('profile.achievements')}</Text>
            <TouchableOpacity onPress={function () { h.navigation.navigate('Achievements'); }}>
              <Text style={styles.seeAllText}>{h.t('profile.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesRow}>
            {h.achievements.map(function (a, i) {
              return (
                <View key={i} style={styles.badgeItem}>
                  <View style={[styles.badgeIcon, { backgroundColor: a.color + '10', borderColor: a.color + '15' }]}>
                    <Text style={{ fontSize: 20 }}>🏆</Text>
                  </View>
                  <Text style={styles.badgeLabel} numberOfLines={2}>{a.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Menu items */}
      <View style={styles.menuCard}>
        {h.MENU.map(function (item, i) {
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, i < h.MENU.length - 1 && styles.menuItemBorder]}
              onPress={function () { h.navigation.navigate(item.route); }}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={item.label + (item.isNotif && h.notifUnread > 0 ? ', ' + h.notifUnread + ' unread' : '')}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.color + '15' }]}>
                <View style={[styles.menuDot, { backgroundColor: item.color }]} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.isNotif && h.notifUnread > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{h.notifUnread}</Text>
                </View>
              ) : null}
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Renew date */}
      {h.isPremium && h.renewDate ? (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: dark.textMuted }}>
            {h.subscriptionLabel} {h.t('profile.renews')} {h.renewDate}
          </Text>
        </View>
      ) : null}

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={h.handleSignOut} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel={h.t('settings.signOut')}>
        <Text style={styles.signOutText}>{h.t('settings.signOut')}</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
      {tooltipCfg
        ? React.createElement(OnboardingTooltip, {
            id: tooltipCfg.id,
            message: tooltipCfg.message,
            position: tooltipCfg.position,
            targetRef: statsRef,
          })
        : null}
    </ScrollView>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  centerWrap: { flex: 1, backgroundColor: BRAND.bgDeep, alignItems: 'center', justifyContent: 'center' },
  errorMsg: { fontSize: 14, color: dark.textTertiary, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND.purple },
  retryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },
  settingsText: { fontSize: 22 },
  avatarCard: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 20, alignItems: 'center', marginBottom: 10, position: 'relative' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 2.5, borderColor: 'rgba(139,92,246,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarInitial: { fontSize: 30, fontWeight: '800', color: BRAND.purpleLight },
  levelBadge: { position: 'absolute', top: 12, right: 16, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: BRAND.purpleDark },
  levelBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  editAvatarBtn: { position: 'absolute', top: 80, right: '38%', width: 26, height: 26, borderRadius: 13, backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.glassBorder, alignItems: 'center', justifyContent: 'center' },
  editAvatarText: { fontSize: 11 },
  userName: { fontSize: 16, fontWeight: '700', color: dark.text },
  premiumBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(252,211,77,0.12)', borderWidth: 1, borderColor: 'rgba(252,211,77,0.2)', marginTop: 4 },
  premiumText: { fontSize: 10, fontWeight: '700', color: BRAND.yellow },
  userEmail: { fontSize: 11, color: dark.textTertiary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: dark.glassBg, borderRadius: 16, borderWidth: 1, borderColor: dark.glassBorder, padding: 16 },
  statLabel: { fontSize: 12, fontWeight: '600', color: dark.textSecondary, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: dark.text, marginBottom: 2 },
  statSub: { fontSize: 11, color: dark.textMuted, marginBottom: 6 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: dark.glassBorder, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: BRAND.purple },
  miniStatRow: { flexDirection: 'row', gap: 12 },
  miniStat: { flex: 1 },
  miniIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  miniEmoji: { fontSize: 18 },
  miniValue: { fontSize: 20, fontWeight: '800', color: dark.text },
  miniLabel: { fontSize: 11, color: dark.textTertiary },
  menuCard: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, overflow: 'hidden', marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 18, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: dark.divider },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuDot: { width: 10, height: 10, borderRadius: 5 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: dark.text },
  unreadBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.12)' },
  unreadText: { fontSize: 12, fontWeight: '600', color: BRAND.redSolid },
  chevron: { fontSize: 20, color: dark.textMuted },
  signOutBtn: { height: 48, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  signOutText: { fontSize: 15, fontWeight: '600', color: BRAND.redSolid },
  // Skills
  skillsCard: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: dark.text, marginBottom: 14 },
  skillHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  skillLabel: { fontSize: 12, fontWeight: '600', color: dark.text },
  skillLevelBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  skillLevelText: { fontSize: 11, fontWeight: '700' },
  skillTrack: { height: 4, borderRadius: 2, backgroundColor: dark.surface, overflow: 'hidden' },
  skillFill: { height: '100%', borderRadius: 2 },
  // Achievements
  achievementsCard: { backgroundColor: dark.glassBg, borderRadius: 20, borderWidth: 1, borderColor: dark.glassBorder, padding: 18, marginBottom: 10 },
  achievementsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  seeAllText: { fontSize: 12, color: BRAND.purpleLight, fontWeight: '500' },
  badgesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badgeItem: { alignItems: 'center', width: 60 },
  badgeIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  badgeLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center', color: dark.textSecondary, lineHeight: 12 },
});

module.exports = ProfileScreen;
