/**
 * MicroStartScreen — Quick-start small goals (5-minute tasks) with timer and XP rewards.
 */
var React = require('react');
var {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useMicroStartScreen = require('./useMicroStartScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

var { width: SCREEN_WIDTH } = Dimensions.get('window');
var TIMER_SIZE = 200;

var MicroStartScreen = function () {
  var h = useMicroStartScreen();
  var rewardAnim = React.useRef(new Animated.Value(0)).current;

  // XP reward animation
  React.useEffect(function () {
    if (h.showReward) {
      Animated.sequence([
        Animated.spring(rewardAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.delay(1500),
        Animated.timing(rewardAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [h.showReward]);

  // ─── Header ──────────────────────────────────────────────────

  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back', hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Micro Start'),
      React.createElement(View, { style: styles.xpBadge, accessible: true, accessibilityLabel: h.totalXpEarned + ' XP earned', accessibilityLiveRegion: 'polite' },
        React.createElement(Icon, { name: 'zap', size: 14, color: BRAND.yellow }),
        React.createElement(Text, { style: styles.xpBadgeText }, '+' + h.totalXpEarned + ' XP')
      )
    );
  };

  // ─── Timer view (when a micro-goal is active) ───────────────

  var renderTimer = function () {
    if (!h.activeMicro) return null;
    var micro = h.activeMicro;
    var totalDuration = micro.duration || 300;
    var progress = totalDuration > 0 ? (totalDuration - h.timeLeft) / totalDuration : 0;
    var circumference = 2 * Math.PI * (TIMER_SIZE / 2 - 12);
    var strokeOffset = circumference * (1 - progress);

    return React.createElement(View, { style: styles.timerSection },
      // Active micro info
      React.createElement(Text, { style: styles.timerEmoji, accessible: false, importantForAccessibility: 'no' }, micro.emoji),
      React.createElement(Text, { style: styles.timerMicroTitle, accessibilityRole: 'header' }, micro.title),
      // Circular timer
      React.createElement(View, { style: styles.timerWrap },
        // Background circle
        React.createElement(View, { style: styles.timerCircle },
          // Progress ring (simple view-based since SVG may not be available)
          React.createElement(View, {
            style: [styles.timerProgressBg, {
              width: TIMER_SIZE,
              height: TIMER_SIZE,
              borderRadius: TIMER_SIZE / 2,
              borderWidth: 6,
              borderColor: COLORS.glassBorder,
            }],
          }),
          React.createElement(View, {
            style: [styles.timerProgressFill, {
              width: TIMER_SIZE,
              height: TIMER_SIZE,
              borderRadius: TIMER_SIZE / 2,
              borderWidth: 6,
              borderColor: BRAND.purple,
              borderTopColor: progress > 0.25 ? BRAND.purple : 'transparent',
              borderRightColor: progress > 0.5 ? BRAND.purple : 'transparent',
              borderBottomColor: progress > 0.75 ? BRAND.purple : 'transparent',
              borderLeftColor: progress > 0 ? BRAND.purple : 'transparent',
              transform: [{ rotate: '-90deg' }],
            }],
          }),
          // Time display
          React.createElement(View, { style: styles.timerTextWrap, accessible: true, accessibilityRole: 'timer', accessibilityLabel: h.formatTimer(h.timeLeft) + ', ' + (h.isPaused ? 'paused' : h.isRunning ? 'in progress' : 'ready'), accessibilityLiveRegion: 'polite' },
            React.createElement(Text, { style: styles.timerText, accessible: false }, h.formatTimer(h.timeLeft)),
            React.createElement(Text, { style: styles.timerSubtext, accessible: false },
              h.isPaused ? 'PAUSED' : h.isRunning ? 'IN PROGRESS' : 'READY'
            )
          )
        )
      ),
      // Controls
      React.createElement(View, { style: styles.controlsRow },
        React.createElement(TouchableOpacity, {
          style: styles.controlBtn,
          onPress: h.handleSkip,
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Skip this micro-goal',
        },
          React.createElement(Icon, { name: 'skip-forward', size: 20, color: COLORS.textMuted }),
          React.createElement(Text, { style: styles.controlLabel, accessible: false }, 'Skip')
        ),
        h.isRunning && !h.isPaused
          ? React.createElement(TouchableOpacity, {
              style: styles.controlBtnPrimary,
              onPress: h.pauseTimer,
              activeOpacity: 0.8,
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Pause timer',
            },
              React.createElement(Icon, { name: 'pause', size: 24, color: '#fff' })
            )
          : h.isPaused
            ? React.createElement(TouchableOpacity, {
                style: styles.controlBtnPrimary,
                onPress: h.resumeTimer,
                activeOpacity: 0.8,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Resume timer',
              },
                React.createElement(Icon, { name: 'play', size: 24, color: '#fff' })
              )
            : React.createElement(TouchableOpacity, {
                style: styles.controlBtnPrimary,
                onPress: function () { h.startMicro(h.activeMicro); },
                activeOpacity: 0.8,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Start timer',
              },
                React.createElement(Icon, { name: 'play', size: 24, color: '#fff' })
              ),
        React.createElement(TouchableOpacity, {
          style: styles.controlBtn,
          onPress: h.handleComplete,
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Mark as done',
        },
          React.createElement(Icon, { name: 'check', size: 20, color: BRAND.greenSolid }),
          React.createElement(Text, { style: [styles.controlLabel, { color: BRAND.greenSolid }], accessible: false }, 'Done')
        )
      ),
      // Reset button
      React.createElement(TouchableOpacity, {
        style: styles.resetBtn,
        onPress: h.resetTimer,
        activeOpacity: 0.7,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Cancel and go back to list',
      },
        React.createElement(Text, { style: styles.resetText }, 'Cancel & go back to list')
      )
    );
  };

  // ─── XP Reward Animation ────────────────────────────────────

  var renderReward = function () {
    if (!h.showReward) return null;
    return React.createElement(Animated.View, {
      style: [
        styles.rewardOverlay,
        {
          opacity: rewardAnim,
          transform: [{
            scale: rewardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          }],
        },
      ],
      accessibilityViewIsModal: true,
      accessibilityLiveRegion: 'assertive',
    },
      React.createElement(View, { style: styles.rewardCard, accessible: true, accessibilityRole: 'alert', accessibilityLabel: 'Great Job! You earned ' + h.lastRewardXp + ' XP. Keep going, every small step counts.' },
        React.createElement(Text, { style: styles.rewardEmoji, accessible: false }, '\uD83C\uDF89'),
        React.createElement(Text, { style: styles.rewardTitle, accessible: false }, 'Great Job!'),
        React.createElement(View, { style: styles.rewardXpRow, accessible: false },
          React.createElement(Icon, { name: 'zap', size: 24, color: BRAND.yellow }),
          React.createElement(Text, { style: styles.rewardXpText }, '+' + h.lastRewardXp + ' XP')
        ),
        React.createElement(Text, { style: styles.rewardDesc, accessible: false }, 'Keep going! Every small step counts.')
      )
    );
  };

  // ─── Micro-goal card ────────────────────────────────────────

  var renderMicroCard = function (info) {
    var micro = info.item;
    var isCompleted = h.completedMicros.indexOf(micro.id) !== -1;
    var durationMins = Math.ceil((micro.duration || 300) / 60);

    return React.createElement(TouchableOpacity, {
      style: [styles.microCard, isCompleted && styles.microCardCompleted],
      onPress: isCompleted ? undefined : function () { h.startMicro(micro); },
      activeOpacity: isCompleted ? 1 : 0.7,
      disabled: isCompleted,
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: micro.title + ', ' + durationMins + ' minutes, ' + micro.xp + ' XP' + (isCompleted ? ', completed' : ''),
      accessibilityHint: isCompleted ? '' : 'Double tap to start this micro-goal',
      accessibilityState: { disabled: isCompleted },
    },
      React.createElement(Text, { style: styles.microEmoji, accessible: false }, micro.emoji),
      React.createElement(View, { style: styles.microInfo, accessible: false },
        React.createElement(Text, {
          style: [styles.microTitle, isCompleted && styles.microTitleCompleted],
          numberOfLines: 2,
        }, micro.title),
        React.createElement(View, { style: styles.microMeta },
          React.createElement(Icon, { name: 'clock', size: 10, color: COLORS.textMuted }),
          React.createElement(Text, { style: styles.microMetaText }, durationMins + ' min'),
          React.createElement(Icon, { name: 'zap', size: 10, color: BRAND.yellow }),
          React.createElement(Text, { style: [styles.microMetaText, { color: BRAND.yellow }] },
            '+' + micro.xp + ' XP'
          )
        )
      ),
      isCompleted
        ? React.createElement(View, { style: styles.completedBadge, importantForAccessibility: 'no' },
            React.createElement(Icon, { name: 'check', size: 16, color: BRAND.greenSolid })
          )
        : React.createElement(Icon, { name: 'play-circle', size: 22, color: BRAND.purple })
    );
  };

  // ─── Empty state ─────────────────────────────────────────────

  var renderEmpty = function () {
    return React.createElement(View, { style: styles.emptyWrap },
      React.createElement(Text, { style: { fontSize: 36, marginBottom: 16 } }, '\uD83C\uDF1F'),
      React.createElement(Text, { style: styles.emptyTitle }, 'All Done!'),
      React.createElement(Text, { style: styles.emptyDesc },
        'You\'ve completed all available micro-goals. Check back later for more!'
      )
    );
  };

  // ─── Section headers ────────────────────────────────────────

  var renderListHeader = function () {
    return React.createElement(View, null,
      renderHeader(),
      // Motivational banner
      React.createElement(View, { style: styles.banner },
        React.createElement(Text, { style: styles.bannerEmoji }, '\u26A1'),
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: styles.bannerTitle }, 'Quick Wins'),
          React.createElement(Text, { style: styles.bannerDesc },
            'Start with a small task to build momentum. Each one earns XP!'
          )
        )
      ),
      // Completed count
      h.completedMicros.length > 0
        ? React.createElement(View, { style: styles.progressBar, accessible: true, accessibilityRole: 'progressbar', accessibilityLabel: h.completedMicros.length + ' of ' + h.allMicros.length + ' completed', accessibilityValue: { min: 0, max: h.allMicros.length, now: h.completedMicros.length } },
            React.createElement(View, { style: styles.progressTrack, importantForAccessibility: 'no' },
              React.createElement(View, {
                style: [styles.progressFill, {
                  width: Math.round((h.completedMicros.length / h.allMicros.length) * 100) + '%',
                }],
              })
            ),
            React.createElement(Text, { style: styles.progressLabel, accessible: false },
              h.completedMicros.length + '/' + h.allMicros.length + ' completed'
            )
          )
        : null,
      // Section label
      h.userMicros.length > 0
        ? React.createElement(Text, { style: styles.sectionLabel, accessibilityRole: 'header' }, 'Your Tasks')
        : React.createElement(Text, { style: styles.sectionLabel, accessibilityRole: 'header' }, 'Suggested Micro-Goals')
    );
  };

  // ─── Loading ─────────────────────────────────────────────────

  if (h.tasksQuery.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap, accessibilityLiveRegion: 'polite' },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent, accessibilityLabel: 'Loading micro-goals' })
      )
    );
  }

  // ─── Main render ─────────────────────────────────────────────

  // If a micro is active, show the timer view
  if (h.activeMicro && !h.showReward) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      renderTimer()
    );
  }

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(FlatList, {
      data: h.allMicros,
      keyExtractor: function (item) { return String(item.id); },
      renderItem: renderMicroCard,
      ListHeaderComponent: renderListHeader,
      ListEmptyComponent: renderEmpty,
      contentContainerStyle: styles.listContent,
      showsVerticalScrollIndicator: false,
    }),
    renderReward()
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(252,211,77,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.25)',
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.yellow,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },
  bannerEmoji: {
    fontSize: 28,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  bannerDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Progress bar
  progressBar: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.glassBorder,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND.purple,
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
  },

  // Section label
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Micro card
  microCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  microCardCompleted: {
    opacity: 0.5,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  microEmoji: {
    fontSize: 28,
  },
  microInfo: {
    flex: 1,
    minWidth: 0,
  },
  microTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  microTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  microMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  microMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginRight: 8,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Timer section
  timerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timerEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  timerMicroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  timerWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  timerCircle: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerProgressBg: {
    position: 'absolute',
  },
  timerProgressFill: {
    position: 'absolute',
  },
  timerTextWrap: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  controlBtnPrimary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  resetBtn: {
    marginTop: 32,
  },
  resetText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },

  // Reward overlay
  rewardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardCard: {
    backgroundColor: COLORS.bodyBg,
    borderWidth: 1,
    borderColor: BRAND.purple + '40',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 260,
  },
  rewardEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  rewardXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(252,211,77,0.12)',
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  rewardXpText: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.yellow,
  },
  rewardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Center
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

module.exports = MicroStartScreen;
