/**
 * AchievementsScreen -- React Native.
 * Gamification badges: grid view, categories, detail modal, XP summary.
 */
var React = require('react');
var {
  View, Text, TouchableOpacity, ScrollView, FlatList, Modal,
  StyleSheet, ActivityIndicator, Dimensions,
} = require('react-native');
var useAchievementsScreen = require('./useAchievementsScreen');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

var SCREEN_WIDTH = Dimensions.get('window').width;
var BADGE_SIZE = (SCREEN_WIDTH - 32 - 16) / 3; // 3 columns with 8px gap

/* ─── XP Summary Card ─────────────────────────────────────── */
function XPSummary(props) {
  var h = props.hook;
  return (
    <View style={styles.xpCard} accessible={true} accessibilityRole="summary" accessibilityLabel={'Level ' + h.level + ', ' + h.totalXp.toLocaleString() + ' XP total, ' + h.unlockedCount + ' of ' + h.totalCount + ' achievements unlocked'}>
      <View style={styles.xpRow}>
        {/* Level */}
        <View style={styles.levelCircle}>
          <Text style={styles.levelNum}>{h.level}</Text>
          <Text style={styles.levelLabel}>LEVEL</Text>
        </View>

        {/* XP info */}
        <View style={styles.xpInfo}>
          <Text style={styles.xpTotal}>{h.totalXp.toLocaleString()} XP</Text>
          <View style={styles.progressTrack} accessible={true} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(h.levelProgress * 100) }} accessibilityLabel={'Level progress, ' + Math.round(h.levelProgress * 100) + ' percent'}>
            <View style={[styles.progressFill, { width: (h.levelProgress * 100) + '%' }]} />
          </View>
          <Text style={styles.xpToNext}>{h.xpToNext} XP to next level</Text>
        </View>
      </View>

      {/* Achievement count */}
      <View style={styles.xpStatsRow}>
        <View style={styles.xpStat}>
          <Text style={styles.xpStatValue}>{h.unlockedCount}</Text>
          <Text style={styles.xpStatLabel}>Unlocked</Text>
        </View>
        <View style={styles.xpStatDivider} />
        <View style={styles.xpStat}>
          <Text style={styles.xpStatValue}>{h.totalCount}</Text>
          <Text style={styles.xpStatLabel}>Total</Text>
        </View>
        <View style={styles.xpStatDivider} />
        <View style={styles.xpStat}>
          <Text style={styles.xpStatValue}>
            {h.totalCount > 0 ? Math.round((h.unlockedCount / h.totalCount) * 100) : 0}%
          </Text>
          <Text style={styles.xpStatLabel}>Complete</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Category Filter Pills ───────────────────────────────── */
function CategoryFilter(props) {
  var h = props.hook;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {h.CATEGORIES.map(function (cat) {
        var isActive = h.selectedCategory === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterPill, isActive && styles.filterPillActive]}
            onPress={function () { h.setSelectedCategory(cat.id); }}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel={cat.label + ' category'}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/* ─── Badge Item (Grid) ───────────────────────────────────── */
function BadgeItem(props) {
  var ach = props.achievement;
  var h = props.hook;
  var progress = h.getProgressPercent(ach);
  var isLocked = !ach.unlocked;

  return (
    <TouchableOpacity
      style={[styles.badgeCard, isLocked && styles.badgeLocked]}
      onPress={function () { h.handleSelectAchievement(ach); }}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={ach.title + ', ' + (ach.unlocked ? 'Unlocked' : ach.progress + ' of ' + ach.maxProgress) + ', plus ' + ach.xp + ' XP'}
      accessibilityHint="Double tap to view achievement details"
    >
      {/* Icon */}
      <View style={[styles.badgeIconWrap, isLocked && styles.badgeIconLocked]}>
        <Text style={[styles.badgeEmoji, isLocked && styles.badgeEmojiLocked]}>
          {ach.icon}
        </Text>
      </View>

      {/* Title */}
      <Text style={[styles.badgeTitle, isLocked && styles.badgeTitleLocked]} numberOfLines={2}>
        {ach.title}
      </Text>

      {/* Progress bar */}
      <View style={styles.badgeProgressTrack}>
        <View
          style={[
            styles.badgeProgressFill,
            { width: (progress * 100) + '%' },
            ach.unlocked && styles.badgeProgressComplete,
          ]}
        />
      </View>

      {/* Progress text */}
      <Text style={styles.badgeProgressText}>
        {ach.unlocked ? 'Unlocked' : ach.progress + '/' + ach.maxProgress}
      </Text>

      {/* XP badge */}
      <View style={[styles.xpBadge, ach.unlocked && styles.xpBadgeUnlocked]}>
        <Text style={[styles.xpBadgeText, ach.unlocked && styles.xpBadgeTextUnlocked]}>
          +{ach.xp} XP
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Detail Modal ────────────────────────────────────────── */
function DetailModal(props) {
  var h = props.hook;
  var ach = h.selectedAchievement;
  if (!ach) return null;

  var progress = h.getProgressPercent(ach);

  return (
    <Modal
      visible={h.showDetail}
      transparent
      animationType="fade"
      onRequestClose={h.handleCloseDetail}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={h.handleCloseDetail}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Close achievement details"
      >
        <View style={styles.modalContent} accessibilityViewIsModal={true}>
          {/* Badge icon large */}
          <View style={[styles.modalIconWrap, ach.unlocked && styles.modalIconUnlocked]}>
            <Text style={styles.modalEmoji}>{ach.icon}</Text>
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>{ach.title}</Text>
          <Text style={styles.modalDesc}>{ach.description}</Text>

          {/* Status */}
          <View style={[styles.modalStatusBadge, ach.unlocked ? styles.modalStatusUnlocked : styles.modalStatusLocked]}>
            <Text style={[styles.modalStatusText, ach.unlocked ? styles.modalStatusTextUnlocked : styles.modalStatusTextLocked]}>
              {ach.unlocked ? 'Unlocked' : 'Locked'}
            </Text>
          </View>

          {/* Unlock date */}
          {ach.unlocked && ach.unlockedAt ? (
            <Text style={styles.modalDate}>
              Earned on {h.formatDate(ach.unlockedAt)}
            </Text>
          ) : null}

          {/* Progress */}
          <View style={styles.modalProgressSection}>
            <View style={styles.modalProgressHeader}>
              <Text style={styles.modalProgressLabel}>Progress</Text>
              <Text style={styles.modalProgressValue}>
                {ach.unlocked ? ach.maxProgress : ach.progress} / {ach.maxProgress}
              </Text>
            </View>
            <View style={styles.modalProgressTrack} accessible={true} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} accessibilityLabel={'Achievement progress, ' + Math.round(progress * 100) + ' percent'}>
              <View
                style={[
                  styles.modalProgressFill,
                  { width: (progress * 100) + '%' },
                  ach.unlocked && styles.modalProgressComplete,
                ]}
              />
            </View>
          </View>

          {/* XP Reward */}
          <View style={styles.modalXpRow}>
            <Text style={styles.modalXpLabel}>XP Reward</Text>
            <Text style={styles.modalXpValue}>+{ach.xp} XP</Text>
          </View>

          {/* Category */}
          <View style={styles.modalXpRow}>
            <Text style={styles.modalXpLabel}>Category</Text>
            <Text style={styles.modalCategoryText}>
              {ach.category.charAt(0).toUpperCase() + ach.category.slice(1)}
            </Text>
          </View>

          {/* How to unlock (if locked) */}
          {!ach.unlocked ? (
            <View style={styles.howToUnlock}>
              <Text style={styles.howToTitle}>How to unlock</Text>
              <Text style={styles.howToText}>{ach.description}</Text>
              <Text style={styles.howToProgress}>
                {Math.round(progress * 100)}% complete — keep going!
              </Text>
            </View>
          ) : null}

          {/* Close */}
          <TouchableOpacity style={styles.modalCloseBtn} onPress={h.handleCloseDetail} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */
function AchievementsScreen() {
  var h = useAchievementsScreen();

  if (h.loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator color={BRAND.purple} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={function () { h.navigation.goBack(); }} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>{'<-'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Achievements</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Error */}
        {h.error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{h.error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={h.fetchAchievements} activeOpacity={0.7} accessible={true} accessibilityRole="button" accessibilityLabel="Retry loading achievements">
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* XP Summary */}
        <XPSummary hook={h} />

        {/* Category Filter */}
        <CategoryFilter hook={h} />

        {/* Badge Grid */}
        {h.achievements.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>No achievements in this category</Text>
            <Text style={styles.emptyDesc}>Switch categories or start completing goals to earn badges</Text>
          </View>
        ) : (
          <View style={styles.badgeGrid}>
            {h.achievements.map(function (ach) {
              return <BadgeItem key={ach.id} achievement={ach} hook={h} />;
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Detail Modal */}
      <DetailModal hook={h} />
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bgDeep },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  centerWrap: { flex: 1, backgroundColor: BRAND.bgDeep, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backText: { fontSize: 14, color: dark.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dark.text },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  errorText: { fontSize: 13, color: BRAND.redSolid, flex: 1 },
  retryBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: BRAND.purple, marginLeft: 10 },
  retryText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  // XP Summary
  xpCard: {
    backgroundColor: dark.glassBg, borderRadius: 20,
    borderWidth: 1, borderColor: dark.glassBorder,
    padding: 20, marginBottom: 14,
  },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  levelCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 2.5, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  levelNum: { fontSize: 22, fontWeight: '800', color: BRAND.purpleLight },
  levelLabel: { fontSize: 8, fontWeight: '700', color: dark.textMuted, letterSpacing: 1 },
  xpInfo: { flex: 1 },
  xpTotal: { fontSize: 20, fontWeight: '800', color: dark.text, marginBottom: 6 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: dark.glassBorder, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: BRAND.purple },
  xpToNext: { fontSize: 11, color: dark.textMuted },
  xpStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  xpStat: { flex: 1, alignItems: 'center' },
  xpStatValue: { fontSize: 18, fontWeight: '800', color: dark.text },
  xpStatLabel: { fontSize: 11, color: dark.textTertiary, marginTop: 2 },
  xpStatDivider: { width: 1, height: 28, backgroundColor: dark.divider },

  // Category filter
  filterRow: { paddingBottom: 14, gap: 6 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: dark.glassBg, borderWidth: 1, borderColor: dark.glassBorder,
  },
  filterPillActive: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)' },
  filterText: { fontSize: 13, fontWeight: '500', color: dark.textSecondary },
  filterTextActive: { fontWeight: '600', color: BRAND.purple },

  // Badge grid
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Badge card
  badgeCard: {
    width: BADGE_SIZE, backgroundColor: dark.glassBg,
    borderRadius: 16, borderWidth: 1, borderColor: dark.glassBorder,
    padding: 12, alignItems: 'center',
  },
  badgeLocked: { opacity: 0.6 },
  badgeIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  badgeIconLocked: { backgroundColor: 'rgba(255,255,255,0.04)' },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: { opacity: 0.4 },
  badgeTitle: { fontSize: 11, fontWeight: '600', color: dark.text, textAlign: 'center', marginBottom: 6, height: 28 },
  badgeTitleLocked: { color: dark.textMuted },
  badgeProgressTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: dark.glassBorder, overflow: 'hidden', marginBottom: 4 },
  badgeProgressFill: { height: '100%', borderRadius: 2, backgroundColor: BRAND.purple },
  badgeProgressComplete: { backgroundColor: '#5DE5A8' },
  badgeProgressText: { fontSize: 10, color: dark.textMuted, marginBottom: 4 },
  xpBadge: {
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  xpBadgeUnlocked: { backgroundColor: 'rgba(93,229,168,0.12)' },
  xpBadgeText: { fontSize: 9, fontWeight: '700', color: dark.textMuted },
  xpBadgeTextUnlocked: { color: '#5DE5A8' },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: dark.textSecondary, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: dark.textMuted, textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', maxWidth: 360,
    backgroundColor: BRAND.bgMid, borderRadius: 24,
    borderWidth: 1, borderColor: dark.glassBorder, padding: 24,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 2, borderColor: dark.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  modalIconUnlocked: {
    backgroundColor: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.3)',
  },
  modalEmoji: { fontSize: 36 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: dark.text, marginBottom: 6, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: dark.textTertiary, textAlign: 'center', lineHeight: 20, marginBottom: 12 },

  // Status badge
  modalStatusBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 10, marginBottom: 8, borderWidth: 1 },
  modalStatusUnlocked: { backgroundColor: 'rgba(93,229,168,0.12)', borderColor: 'rgba(93,229,168,0.3)' },
  modalStatusLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: dark.glassBorder },
  modalStatusText: { fontSize: 12, fontWeight: '700' },
  modalStatusTextUnlocked: { color: '#5DE5A8' },
  modalStatusTextLocked: { color: dark.textMuted },
  modalDate: { fontSize: 12, color: dark.textTertiary, marginBottom: 14 },

  // Modal progress
  modalProgressSection: { width: '100%', marginBottom: 14 },
  modalProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  modalProgressLabel: { fontSize: 12, fontWeight: '600', color: dark.textSecondary },
  modalProgressValue: { fontSize: 12, fontWeight: '600', color: dark.text },
  modalProgressTrack: { height: 8, borderRadius: 4, backgroundColor: dark.glassBorder, overflow: 'hidden' },
  modalProgressFill: { height: '100%', borderRadius: 4, backgroundColor: BRAND.purple },
  modalProgressComplete: { backgroundColor: '#5DE5A8' },

  // Modal XP
  modalXpRow: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: dark.divider,
  },
  modalXpLabel: { fontSize: 13, color: dark.textSecondary },
  modalXpValue: { fontSize: 13, fontWeight: '700', color: BRAND.purple },
  modalCategoryText: { fontSize: 13, fontWeight: '600', color: dark.text },

  // How to unlock
  howToUnlock: {
    width: '100%', backgroundColor: 'rgba(139,92,246,0.06)',
    borderRadius: 12, padding: 14, marginTop: 14,
  },
  howToTitle: { fontSize: 13, fontWeight: '700', color: dark.textSecondary, marginBottom: 4 },
  howToText: { fontSize: 12, color: dark.textPrimary, lineHeight: 18, marginBottom: 4 },
  howToProgress: { fontSize: 12, fontWeight: '600', color: BRAND.purple },

  // Modal close
  modalCloseBtn: {
    width: '100%', height: 44, borderRadius: 12,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  modalCloseText: { fontSize: 14, fontWeight: '500', color: dark.textSecondary },
});

module.exports = AchievementsScreen;
