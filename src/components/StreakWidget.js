/**
 * StreakWidget -- Animated streak counter for the mobile home dashboard.
 *
 * Glass-morphism card showing:
 *  1. Animated flame icon (scales with streak length)
 *  2. Current streak count + "day streak" label
 *  3. XP multiplier display (1.5x, 2x, 3x based on streak length)
 *  4. Mini 14-day heatmap as colored dots
 *  5. Longest streak stat
 *  6. Streak freeze indicator
 *  7. Milestone badges (7, 14, 30, 60, 90, 180, 365)
 */
var React = require('react');
var { useRef, useEffect, useState, useMemo } = React;
var {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} = require('react-native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../services/api');
var { USERS } = require('../services/endpoints');
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');
var Icon = require('react-native-vector-icons/Feather').default;

var MILESTONES = [7, 14, 30, 60, 90, 180, 365];

// ── Flame scale factor -- grows with streak length ──
var getFlameScale = function (streak) {
  if (streak >= 100) return 1.5;
  if (streak >= 50) return 1.35;
  if (streak >= 30) return 1.25;
  if (streak >= 14) return 1.15;
  if (streak >= 7) return 1.08;
  return 1;
};

// ── XP multiplier ──
var getXpMultiplier = function (streak) {
  if (streak >= 100) return 3.0;
  if (streak >= 30) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
};

// ── Border glow alpha ──
var getBorderAlpha = function (streak) {
  return Math.min(0.6, 0.1 + streak * 0.012);
};

// ── Card gradient alpha ──
var getGradientAlpha = function (streak) {
  return Math.min(0.12, 0.03 + streak * 0.003);
};

// ── Next milestone ──
var getNextMilestone = function (streak) {
  for (var i = 0; i < MILESTONES.length; i++) {
    if (streak < MILESTONES[i]) return MILESTONES[i];
  }
  return null;
};

// ── Milestone progress ──
var getMilestoneProgress = function (streak) {
  var next = getNextMilestone(streak);
  if (!next) return 1;
  var prev = 0;
  for (var i = MILESTONES.length - 1; i >= 0; i--) {
    if (MILESTONES[i] <= streak) {
      prev = MILESTONES[i];
      break;
    }
  }
  return (streak - prev) / (next - prev);
};

var StreakWidget = function (props) {
  var onPress = props.onPress;

  // ── Animations ──
  var flameAnim = useRef(new Animated.Value(1)).current;
  var pulseAnim = useRef(new Animated.Value(1)).current;
  var fadeAnim = useRef(new Animated.Value(0)).current;
  var glowAnim = useRef(new Animated.Value(0.6)).current;

  // ── API Query ──
  var streakQuery = useQuery({
    queryKey: ['streak-details'],
    queryFn: function () {
      return apiGet(USERS.STREAK_DETAILS);
    },
    staleTime: 1000 * 60 * 5,
  });

  var data = streakQuery.data;

  // ── Streak Freeze Mutation ──
  var qc = useQueryClient();
  var freezeMut = useMutation({
    mutationFn: function () {
      return apiPost(USERS.STREAK_FREEZE);
    },
    onSuccess: function () {
      qc.invalidateQueries({ queryKey: ['streak-details'] });
    },
  });

  // ── Start animations on mount ──
  useEffect(function () {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Flame flicker loop
    var flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1.08,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 1.06,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0.98,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();

    // Today dot pulse
    var pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Glow loop
    var glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return function () {
      flameLoop.stop();
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, []);

  // Don't render while loading or on error
  if (streakQuery.isLoading || streakQuery.isError || !data) return null;

  var currentStreak = data.currentStreak || 0;
  var longestStreak = data.longestStreak || 0;
  var history = data.streakHistory || [];
  var streakFrozen = data.streakFrozen || false;
  var freezeCount = data.freezeCount || 0;
  var freezeAvailable = data.freezeAvailable || false;
  var xpMultiplier = getXpMultiplier(currentStreak);
  var flameScale = getFlameScale(currentStreak);
  var borderAlpha = getBorderAlpha(currentStreak);
  var gradientAlpha = getGradientAlpha(currentStreak);
  var nextMilestone = getNextMilestone(currentStreak);
  var milestoneProgress = getMilestoneProgress(currentStreak);

  // ── Day labels for the 14-day heatmap ──
  var dayLabels = useMemo(function () {
    var labels = [];
    var now = new Date();
    for (var di = 13; di >= 0; di--) {
      var d = new Date(now);
      d.setDate(d.getDate() - di);
      labels.push(['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()]);
    }
    return labels;
  }, []);

  // ── Reached milestones ──
  var reachedMilestones = useMemo(function () {
    return MILESTONES.filter(function (m) { return currentStreak >= m; });
  }, [currentStreak]);

  var flameAnimScale = Animated.multiply(flameAnim, flameScale);

  var containerStyle = [
    styles.container,
    {
      borderColor: 'rgba(249,115,22,' + borderAlpha + ')',
    },
  ];

  var Wrapper = onPress ? TouchableOpacity : View;
  var wrapperProps = onPress
    ? { style: containerStyle, onPress: onPress, activeOpacity: 0.85 }
    : { style: containerStyle };

  return React.createElement(Animated.View, { style: { opacity: fadeAnim } },
    React.createElement(Wrapper, Object.assign({}, wrapperProps, {
      accessible: true,
      accessibilityLabel: currentStreak + ' day streak' +
        (xpMultiplier > 1 ? ', ' + xpMultiplier + 'x XP multiplier' : '') +
        ', longest ' + longestStreak + ' days',
    }),

      // Warm gradient overlay
      React.createElement(View, {
        style: [styles.gradientOverlay, {
          backgroundColor: 'rgba(249,115,22,' + gradientAlpha + ')',
        }],
      }),

      React.createElement(View, { style: styles.content },

        // ── Top row: flame + streak number ──
        React.createElement(View, { style: styles.topRow },

          // Flame icon container
          React.createElement(View, { style: styles.flameWrap },
            // Outer glow
            currentStreak > 0
              ? React.createElement(Animated.View, {
                  style: [styles.glowRing, {
                    opacity: glowAnim,
                    shadowOpacity: Math.min(0.4, 0.08 + currentStreak * 0.008),
                    shadowRadius: 12 + currentStreak * 0.5,
                  }],
                })
              : null,
            // Flame icon
            React.createElement(Animated.View, {
              style: {
                transform: [{ scale: flameAnimScale }],
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
              React.createElement(Text, {
                style: [styles.flameEmoji, {
                  textShadowColor: currentStreak > 0 ? 'rgba(249,115,22,0.5)' : 'transparent',
                  textShadowRadius: currentStreak > 0 ? 8 : 0,
                }],
              }, '\uD83D\uDD25')
            )
          ),

          // Streak number + label
          React.createElement(View, { style: { flex: 1, minWidth: 0 } },
            React.createElement(View, { style: styles.streakNumberRow },
              React.createElement(Text, {
                style: [styles.streakNumber, {
                  color: currentStreak > 0 ? COLORS.text : COLORS.textMuted,
                }],
              }, String(currentStreak)),
              React.createElement(Text, { style: styles.streakLabel }, 'day streak')
            ),

            // XP multiplier badge
            xpMultiplier > 1
              ? React.createElement(View, { style: styles.xpMultBadge },
                  React.createElement(Icon, { name: 'zap', size: 11, color: '#FCD34D' }),
                  React.createElement(Text, { style: styles.xpMultText },
                    xpMultiplier + 'x XP'
                  )
                )
              : null,

            // Freeze indicator
            streakFrozen
              ? React.createElement(View, { style: styles.freezeBadge },
                  React.createElement(Icon, { name: 'shield', size: 11, color: '#3B82F6' }),
                  React.createElement(Text, { style: styles.freezeText }, 'Freeze active')
                )
              : null
          ),

          // Longest streak badge
          longestStreak > 0
            ? React.createElement(View, { style: styles.bestBadge },
                React.createElement(Icon, { name: 'trending-up', size: 14, color: COLORS.purple }),
                React.createElement(Text, { style: styles.bestValue }, String(longestStreak)),
                React.createElement(Text, { style: styles.bestLabel }, 'best')
              )
            : null
        ),

        // ── Next milestone progress ──
        nextMilestone
          ? React.createElement(View, { style: styles.milestoneSection },
              React.createElement(View, { style: styles.milestoneRow },
                React.createElement(Text, { style: styles.milestoneLabel },
                  'Next: ' + nextMilestone + ' days'
                ),
                React.createElement(Text, { style: styles.milestonePercent },
                  Math.round(milestoneProgress * 100) + '%'
                )
              ),
              React.createElement(View, { style: styles.milestoneTrack },
                React.createElement(View, {
                  style: [styles.milestoneFill, {
                    width: Math.min(milestoneProgress * 100, 100) + '%',
                  }],
                })
              )
            )
          : null,

        // ── Milestone badges ──
        reachedMilestones.length > 0
          ? React.createElement(View, { style: styles.badgesRow },
              reachedMilestones.map(function (m) {
                return React.createElement(View, {
                  key: m,
                  style: styles.milestoneBadge,
                },
                  React.createElement(Text, { style: styles.milestoneBadgeText },
                    m >= 365 ? '1Y' : m + 'd'
                  )
                );
              })
            )
          : null,

        // ── 14-day heatmap dots ──
        React.createElement(View, { style: styles.heatmapSection },
          React.createElement(View, { style: styles.heatmapHeader },
            React.createElement(Text, { style: styles.heatmapTitle }, 'Last 14 days'),
            freezeAvailable
              ? React.createElement(View, { style: styles.freezeCountRow },
                  React.createElement(Icon, { name: 'shield', size: 10, color: COLORS.textMuted }),
                  React.createElement(Text, { style: styles.freezeCountText },
                    freezeCount + ' freeze' + (freezeCount !== 1 ? 's' : '') + ' left'
                  )
                )
              : null
          ),

          // Day labels
          React.createElement(View, { style: styles.dayLabelsRow },
            dayLabels.map(function (label, i) {
              return React.createElement(Text, {
                key: i,
                style: styles.dayLabelText,
              }, label);
            })
          ),

          // Dots row
          React.createElement(View, { style: styles.dotsRow },
            history.map(function (active, i) {
              var isToday = i === history.length - 1;
              var isActive = active === 1;

              var dotStyle = [
                styles.dot,
                isActive ? styles.dotActive : styles.dotInactive,
                isToday && styles.dotToday,
              ];

              if (isToday) {
                return React.createElement(Animated.View, {
                  key: i,
                  style: [dotStyle, { transform: [{ scale: pulseAnim }] }],
                });
              }

              return React.createElement(View, {
                key: i,
                style: dotStyle,
              });
            })
          ),

          // ── Streak Freeze Button ──
          streakFrozen && freezeAvailable && !freezeMut.isSuccess
            ? React.createElement(TouchableOpacity, {
                style: styles.freezeBtn,
                onPress: function () { freezeMut.mutate(); },
                disabled: freezeMut.isPending,
                activeOpacity: 0.8,
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: freezeMut.isPending ? 'Activating streak freeze' : 'Use Streak Freeze',
              },
                React.createElement(Icon, { name: 'shield', size: 14, color: '#3B82F6' }),
                React.createElement(Text, { style: styles.freezeBtnText },
                  freezeMut.isPending ? 'Activating...' : 'Use Streak Freeze'
                )
              )
            : null
        )
      )
    )
  );
};

// ─── Styles ─────────────────────────────────────────────────
var styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.lg,
  },
  content: {
    position: 'relative',
    padding: 20,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },

  // Flame
  flameWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
  },
  flameEmoji: {
    fontSize: 28,
  },

  // Streak number
  streakNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // XP multiplier badge
  xpMultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.18)',
    alignSelf: 'flex-start',
  },
  xpMultText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },

  // Freeze badge
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
    alignSelf: 'flex-start',
  },
  freezeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Best badge
  bestBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
  },
  bestValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  bestLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Milestone progress bar
  milestoneSection: {
    marginBottom: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  milestonePercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
  },
  milestoneTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  milestoneFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F97316',
  },

  // Milestone badges
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  milestoneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.18)',
  },
  milestoneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F97316',
  },

  // 14-day heatmap
  heatmapSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heatmapTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  freezeCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  freezeCountText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  dayLabelText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 100,
    maxWidth: 24,
  },
  dotActive: {
    backgroundColor: '#F97316',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dotInactive: {
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  dotToday: {
    borderWidth: 2,
    borderColor: 'rgba(249,115,22,0.6)',
  },
  freezeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  freezeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

module.exports = StreakWidget;
