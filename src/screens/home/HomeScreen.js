/**
 * HomeScreen — Dashboard showing greeting, daily tasks, active dreams,
 * streak counter, upcoming events, and quick actions.
 */
var React = require('react');
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} = require('react-native');
var { SafeAreaView } = require('react-native-safe-area-context');
var Icon = require('react-native-vector-icons/Feather').default;
var useHomeScreen = require('./useHomeScreen');
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');
var StreakWidget = require('../../components/StreakWidget');
var AdBanner = require('../../components/AdBanner');

var { width: SCREEN_WIDTH } = Dimensions.get('window');
var CARD_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;

// ─── Category color map ──────────────────────────────────────
var CAT_COLORS = {
  career: '#8B5CF6',
  hobbies: '#EC4899',
  health: '#10B981',
  finance: '#FCD34D',
  personal: '#6366F1',
  relationships: '#14B8A6',
};

function catColor(key) {
  return CAT_COLORS[key] || '#8B5CF6';
}

var HomeScreen = function () {
  var h = useHomeScreen();
  var headerRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('HomeScreen');

  // ─── Loading state ──────────────────────────────────────
  if (h.isLoading && !h.refreshing) {
    return React.createElement(SafeAreaView, { style: styles.container },
      React.createElement(View, { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
        React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple, accessibilityLabel: 'Loading home screen' })
      )
    );
  }

  // ─── Greeting header ──────────────────────────────────
  var renderHeader = function () {
    return React.createElement(View, { ref: headerRef, style: styles.headerRow },
      React.createElement(View, { style: { flex: 1 } },
        React.createElement(Text, { style: styles.greeting, accessibilityRole: 'header' }, h.greeting),
        React.createElement(Text, { style: styles.subGreeting },
          h.totalTasks > 0
            ? h.completedTasks + '/' + h.totalTasks + ' tasks done today'
            : 'Ready to make progress?'
        )
      ),
      React.createElement(TouchableOpacity, {
        style: styles.notifBtn,
        onPress: h.goToNotifications,
        activeOpacity: 0.7,
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Notifications',
        accessibilityHint: 'Opens notification center',
      },
        React.createElement(Icon, { name: 'bell', size: 20, color: COLORS.text })
      )
    );
  };

  // ─── Streak / XP banner (full StreakWidget) ───────────────────────────
  var renderStreak = function () {
    return React.createElement(StreakWidget, null);
  };

  // ─── Quick actions ────────────────────────────────────
  var renderQuickActions = function () {
    var actions = [
      { icon: 'plus-circle', label: 'New Dream', color: BRAND.purple, onPress: h.goToDreamCreate },
      { icon: 'check-circle', label: 'Check In', color: BRAND.teal, onPress: h.goToCheckIn },
      { icon: 'clock', label: 'Focus Timer', color: BRAND.pink, onPress: h.goToFocusTimer },
    ];

    return React.createElement(View, { style: styles.quickActionsRow },
      actions.map(function (action) {
        return React.createElement(TouchableOpacity, {
          key: action.label,
          style: styles.quickActionItem,
          onPress: action.onPress,
          activeOpacity: 0.7,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: action.label,
        },
          React.createElement(View, {
            style: [styles.quickActionIcon, { backgroundColor: action.color + '20', borderColor: action.color + '40' }],
            accessible: false,
          },
            React.createElement(Icon, { name: action.icon, size: 22, color: action.color })
          ),
          React.createElement(Text, { style: styles.quickActionLabel, accessible: false }, action.label)
        );
      })
    );
  };

  // ─── Today's tasks ───────────────────────────────────
  var renderTasks = function () {
    if (h.tasks.length === 0) {
      return React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, "Today's Tasks"),
        React.createElement(View, { style: styles.emptyCard },
          React.createElement(Icon, { name: 'check-circle', size: 28, color: COLORS.textMuted }),
          React.createElement(Text, { style: styles.emptyText }, 'No tasks scheduled for today'),
          React.createElement(Text, { style: styles.emptySubtext }, 'Create a dream to generate your plan')
        )
      );
    }

    return React.createElement(View, { style: styles.section },
      React.createElement(View, { style: styles.sectionHeader },
        React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, "Today's Tasks"),
        React.createElement(View, { style: styles.taskCountBadge },
          React.createElement(Text, { style: styles.taskCountText },
            h.completedTasks + '/' + h.totalTasks
          )
        )
      ),
      h.tasks.slice(0, 5).map(function (task, idx) {
        var isDone = task.isCompleted || task.completed;
        var taskName = task.title || task.name || 'Task';
        return React.createElement(View, {
          key: task.id || idx,
          style: styles.taskRow,
          accessible: true,
          accessibilityLabel: taskName + (isDone ? ', completed' : '') + (task.dreamTitle ? ', ' + task.dreamTitle : '') + (task.estimatedMinutes ? ', ' + task.estimatedMinutes + ' minutes' : ''),
        },
          React.createElement(View, {
            style: [
              styles.taskCheckbox,
              isDone && styles.taskCheckboxDone,
            ],
          },
            isDone
              ? React.createElement(Icon, { name: 'check', size: 12, color: '#fff' })
              : null
          ),
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, {
              style: [styles.taskTitle, isDone && styles.taskTitleDone],
              numberOfLines: 1,
            }, task.title || task.name || 'Task'),
            task.dreamTitle
              ? React.createElement(Text, { style: styles.taskDream, numberOfLines: 1 },
                  task.dreamTitle
                )
              : null
          ),
          task.estimatedMinutes
            ? React.createElement(Text, { style: styles.taskDuration },
                task.estimatedMinutes + ' min'
              )
            : null
        );
      })
    );
  };

  // ─── Active dreams progress ──────────────────────────
  var renderDreams = function () {
    if (h.dreams.length === 0) {
      return React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, 'Active Dreams'),
        React.createElement(TouchableOpacity, {
          style: styles.emptyDreamCard,
          onPress: h.goToDreamCreate,
          activeOpacity: 0.8,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Create Your First Dream',
          accessibilityHint: 'Set a goal and let AI create your personalized plan',
        },
          React.createElement(View, { style: styles.emptyDreamIcon },
            React.createElement(Text, { style: { fontSize: 28 } }, '\u2728')
          ),
          React.createElement(Text, { style: styles.emptyDreamTitle }, 'Create Your First Dream'),
          React.createElement(Text, { style: styles.emptyDreamSub },
            'Set a goal and let AI create your personalized plan'
          )
        )
      );
    }

    return React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, 'Active Dreams'),
      h.dreams.map(function (dream) {
        var progress = dream.progressPercentage || dream.progress || 0;
        var color = catColor(dream.category);
        return React.createElement(TouchableOpacity, {
          key: dream.id,
          style: styles.dreamCard,
          onPress: function () { h.goToDreamDetail(dream.id); },
          activeOpacity: 0.7,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: (dream.title || 'Dream') + ', ' + Math.round(progress) + '% complete',
          accessibilityHint: 'Opens dream details',
        },
          React.createElement(View, { style: styles.dreamCardHeader },
            React.createElement(View, {
              style: [styles.dreamCatDot, { backgroundColor: color }],
            }),
            React.createElement(Text, {
              style: styles.dreamTitle,
              numberOfLines: 1,
            }, (dream.emoji ? dream.emoji + ' ' : '') + (dream.title || 'Dream')),
            React.createElement(Text, { style: [styles.dreamPercent, { color: color }] },
              Math.round(progress) + '%'
            )
          ),
          // Progress bar
          React.createElement(View, {
            style: styles.progressBarBg,
            accessible: true,
            accessibilityRole: 'progressbar',
            accessibilityValue: { min: 0, max: 100, now: Math.round(progress) },
          },
            React.createElement(View, {
              style: [
                styles.progressBarFill,
                { width: Math.min(progress, 100) + '%', backgroundColor: color },
              ],
              accessible: false,
            })
          ),
          dream.nextTask
            ? React.createElement(View, { style: styles.nextTaskRow },
                React.createElement(Icon, { name: 'arrow-right', size: 12, color: COLORS.textMuted }),
                React.createElement(Text, {
                  style: styles.nextTaskText,
                  numberOfLines: 1,
                }, 'Next: ' + (dream.nextTask.title || dream.nextTask.name || ''))
              )
            : null
        );
      })
    );
  };

  // ─── Upcoming events ─────────────────────────────────
  var renderEvents = function () {
    if (h.events.length === 0) return null;

    return React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, 'Upcoming Events'),
      h.events.slice(0, 3).map(function (event, idx) {
        var eventName = event.title || event.name || 'Event';
        var eventTimeStr = formatTime(event.startTime || event.start || event.startAt);
        return React.createElement(View, {
          key: event.id || idx,
          style: styles.eventRow,
          accessible: true,
          accessibilityLabel: eventName + (eventTimeStr ? ' at ' + eventTimeStr : '') + (event.location ? ', ' + event.location : ''),
        },
          React.createElement(View, { style: styles.eventTimeWrap },
            React.createElement(Text, { style: styles.eventTime },
              formatTime(event.startTime || event.start || event.startAt)
            )
          ),
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, {
              style: styles.eventTitle,
              numberOfLines: 1,
            }, event.title || event.name || 'Event'),
            event.location
              ? React.createElement(Text, {
                  style: styles.eventLocation,
                  numberOfLines: 1,
                }, event.location)
              : null
          )
        );
      })
    );
  };

  // ─── Main render ──────────────────────────────────────

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(ScrollView, {
      style: styles.scroll,
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
      refreshControl: React.createElement(RefreshControl, {
        refreshing: h.refreshing,
        onRefresh: h.onRefresh,
        tintColor: BRAND.purple,
        colors: [BRAND.purple],
      }),
    },
      renderHeader(),
      renderStreak(),
      React.createElement(AdBanner, { key: 'home-ad-banner' }),
      renderQuickActions(),
      renderTasks(),
      renderDreams(),
      renderEvents()
    ),
    tooltipCfg
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg.id,
          message: tooltipCfg.message,
          position: tooltipCfg.position,
          targetRef: headerRef,
        })
      : null
  );
};

// ─── Helpers ──────────────────────────────────────────────────

function formatTime(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  var hours = d.getHours();
  var mins = d.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return hours + ':' + (mins < 10 ? '0' : '') + mins + ' ' + ampm;
}

// ─── Styles ─────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 100,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  taskCountBadge: {
    backgroundColor: COLORS.glassBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Tasks
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.glassBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  taskDream: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  taskDuration: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Empty states
  emptyCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Dreams
  emptyDreamCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    borderRadius: RADIUS.lg,
    padding: 28,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyDreamIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyDreamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyDreamSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  dreamCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 10,
  },
  dreamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dreamCatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  dreamTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  dreamPercent: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  nextTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextTaskText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },

  // Events
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 8,
    gap: 14,
  },
  eventTimeWrap: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    minWidth: 64,
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.purpleLight,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  eventLocation: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

module.exports = HomeScreen;
