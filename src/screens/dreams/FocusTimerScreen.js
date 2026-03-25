/**
 * FocusTimerScreen — Pomodoro-style focus timer with dream/task association,
 * session counter, preset durations, and background timer with notification.
 */
var React = require('react');
var {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useFocusTimerScreen = require('./useFocusTimerScreen');
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');
var { catSolid } = require('../../styles/colors');

var { width: SCREEN_WIDTH } = Dimensions.get('window');
var TIMER_SIZE = Math.min(SCREEN_WIDTH - 80, 260);

var FocusTimerScreen = function () {
  var h = useFocusTimerScreen();
  var headerRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('FocusTimerScreen');

  // ─── Header ──────────────────────────────────────────────────

  var renderHeader = function () {
    return React.createElement(View, { ref: headerRef, style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back', hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Focus Timer'),
      React.createElement(View, { style: styles.sessionBadge, accessible: true, accessibilityLabel: h.sessionsCompleted + ' sessions completed' },
        React.createElement(Icon, { name: 'target', size: 12, color: BRAND.purple }),
        React.createElement(Text, { style: styles.sessionBadgeText }, String(h.sessionsCompleted))
      )
    );
  };

  // ─── Preset selector ────────────────────────────────────────

  var renderPresets = function () {
    if (h.isRunning) return null;
    return React.createElement(View, { style: styles.presetsRow },
      h.PRESET_DURATIONS.map(function (preset) {
        var isActive = h.selectedPreset === preset.key;
        return React.createElement(TouchableOpacity, {
          key: preset.key,
          style: [styles.presetChip, isActive && styles.presetChipActive],
          onPress: function () { h.selectPreset(preset.key); },
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: preset.label, accessibilityState: { selected: isActive },
        },
          React.createElement(Text, {
            style: [styles.presetText, isActive && styles.presetTextActive],
          }, preset.label)
        );
      }),
      React.createElement(TouchableOpacity, {
        style: [styles.presetChip, h.selectedPreset === 'custom' && styles.presetChipActive],
        onPress: function () {
          h.selectPreset('custom');
          h.setCustomDuration(h.customMinutes);
        },
        activeOpacity: 0.7,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Custom duration', accessibilityState: { selected: h.selectedPreset === 'custom' },
      },
        React.createElement(Text, {
          style: [styles.presetText, h.selectedPreset === 'custom' && styles.presetTextActive],
        }, 'Custom')
      )
    );
  };

  // ─── Custom duration input ──────────────────────────────────

  var renderCustomInput = function () {
    if (h.selectedPreset !== 'custom' || h.isRunning) return null;
    return React.createElement(View, { style: styles.customRow },
      React.createElement(TouchableOpacity, {
        style: styles.customBtn,
        onPress: function () {
          h.setCustomDuration(Math.max(1, h.customMinutes - 5));
        },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Decrease duration by 5 minutes',
      },
        React.createElement(Icon, { name: 'minus', size: 18, color: COLORS.text })
      ),
      React.createElement(View, { style: styles.customInputWrap },
        React.createElement(TextInput, {
          style: styles.customInput,
          value: String(h.customMinutes),
          onChangeText: function (val) { h.setCustomDuration(val); },
          keyboardType: 'number-pad',
          maxLength: 3,
          accessibilityLabel: 'Custom duration in minutes',
        }),
        React.createElement(Text, { style: styles.customLabel, accessible: false }, 'minutes')
      ),
      React.createElement(TouchableOpacity, {
        style: styles.customBtn,
        onPress: function () {
          h.setCustomDuration(Math.min(120, h.customMinutes + 5));
        },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Increase duration by 5 minutes',
      },
        React.createElement(Icon, { name: 'plus', size: 18, color: COLORS.text })
      )
    );
  };

  // ─── Circular Timer ─────────────────────────────────────────

  var renderTimerCircle = function () {
    var preset = h.PRESET_DURATIONS.find(function (p) { return p.key === h.selectedPreset; });
    var totalDuration = h.isBreak
      ? (preset ? preset.breakTime : 5 * 60)
      : (preset ? preset.work : h.customMinutes * 60);
    var progress = totalDuration > 0 ? (totalDuration - h.timeLeft) / totalDuration : 0;
    var timerColor = h.isBreak ? BRAND.teal : BRAND.purple;

    return React.createElement(View, { style: styles.timerOuter },
      // Outer ring
      React.createElement(View, {
        style: [styles.timerRingBg, {
          width: TIMER_SIZE,
          height: TIMER_SIZE,
          borderRadius: TIMER_SIZE / 2,
          borderColor: COLORS.glassBorder,
        }],
      }),
      // Progress ring
      React.createElement(View, {
        style: [styles.timerRingFill, {
          width: TIMER_SIZE,
          height: TIMER_SIZE,
          borderRadius: TIMER_SIZE / 2,
          borderColor: timerColor,
          borderTopColor: progress > 0.25 ? timerColor : 'transparent',
          borderRightColor: progress > 0.5 ? timerColor : 'transparent',
          borderBottomColor: progress > 0.75 ? timerColor : 'transparent',
          borderLeftColor: progress > 0 ? timerColor : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }],
      }),
      // Inner glow
      React.createElement(View, {
        style: [styles.timerInner, {
          width: TIMER_SIZE - 24,
          height: TIMER_SIZE - 24,
          borderRadius: (TIMER_SIZE - 24) / 2,
          shadowColor: timerColor,
        }],
        accessible: true, accessibilityRole: 'timer', accessibilityLabel: h.formatTimer(h.timeLeft) + ', ' + (h.isBreak ? 'break' : h.isRunning ? 'focusing' : 'ready'), accessibilityLiveRegion: 'polite',
      },
        React.createElement(Text, { style: styles.timerText, accessible: false }, h.formatTimer(h.timeLeft)),
        React.createElement(Text, { style: [styles.timerLabel, { color: timerColor }], accessible: false },
          h.isBreak ? 'BREAK' : h.isRunning ? 'FOCUSING' : 'READY'
        )
      )
    );
  };

  // ─── Controls ───────────────────────────────────────────────

  var renderControls = function () {
    return React.createElement(View, { style: styles.controlsSection },
      React.createElement(View, { style: styles.controlsRow },
        // Reset
        React.createElement(TouchableOpacity, {
          style: styles.ctrlBtn,
          onPress: h.resetTimer,
          activeOpacity: 0.7,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Reset timer',
        },
          React.createElement(View, { style: styles.ctrlBtnCircle },
            React.createElement(Icon, { name: 'rotate-ccw', size: 20, color: COLORS.textMuted })
          ),
          React.createElement(Text, { style: styles.ctrlLabel, accessible: false }, 'Reset')
        ),
        // Play/Pause
        !h.isRunning
          ? React.createElement(TouchableOpacity, {
              style: styles.playBtn,
              onPress: h.startTimer,
              activeOpacity: 0.8,
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Start focus timer',
            },
              React.createElement(Icon, { name: 'play', size: 28, color: '#fff', style: { marginLeft: 3 } })
            )
          : h.isPaused
            ? React.createElement(TouchableOpacity, {
                style: styles.playBtn,
                onPress: h.resumeTimer,
                activeOpacity: 0.8,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Resume timer',
              },
                React.createElement(Icon, { name: 'play', size: 28, color: '#fff', style: { marginLeft: 3 } })
              )
            : React.createElement(TouchableOpacity, {
                style: [styles.playBtn, { backgroundColor: BRAND.orange }],
                onPress: h.pauseTimer,
                activeOpacity: 0.8,
                accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Pause timer',
              },
                React.createElement(Icon, { name: 'pause', size: 28, color: '#fff' })
              ),
        // Skip (during break)
        React.createElement(TouchableOpacity, {
          style: styles.ctrlBtn,
          onPress: h.isBreak ? h.resetTimer : h.pauseTimer,
          activeOpacity: 0.7,
          disabled: !h.isRunning,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: h.isBreak ? 'Skip break' : 'Stop timer', accessibilityState: { disabled: !h.isRunning },
        },
          React.createElement(View, {
            style: [styles.ctrlBtnCircle, !h.isRunning && { opacity: 0.3 }],
          },
            React.createElement(Icon, {
              name: h.isBreak ? 'skip-forward' : 'square',
              size: 20,
              color: COLORS.textMuted,
            })
          ),
          React.createElement(Text, { style: styles.ctrlLabel, accessible: false },
            h.isBreak ? 'Skip' : 'Stop'
          )
        )
      )
    );
  };

  // ─── Dream/task association ─────────────────────────────────

  var renderDreamSelector = function () {
    if (h.isRunning) return null;
    var selectedDream = h.dreams.find(function (d) { return d.id === h.selectedDreamId; });
    return React.createElement(View, { style: styles.dreamSection },
      React.createElement(Text, { style: styles.sectionLabel, accessibilityRole: 'header' }, 'Associate with'),
      React.createElement(TouchableOpacity, {
        style: styles.dreamSelector,
        onPress: function () { h.setShowDreamPicker(true); },
        activeOpacity: 0.7,
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Associate with a dream, currently: ' + (h.dreams.find(function (d) { return d.id === h.selectedDreamId; }) ? h.dreams.find(function (d) { return d.id === h.selectedDreamId; }).title : 'none'), accessibilityHint: 'Double tap to select a dream',
      },
        React.createElement(Icon, { name: 'target', size: 16, color: BRAND.purple }),
        React.createElement(Text, {
          style: styles.dreamSelectorText,
          numberOfLines: 1,
        },
          selectedDream ? selectedDream.title : 'Select a dream or task...'
        ),
        React.createElement(Icon, { name: 'chevron-down', size: 16, color: COLORS.textMuted })
      )
    );
  };

  // ─── Stats row ──────────────────────────────────────────────

  var renderStats = function () {
    return React.createElement(View, { style: styles.statsRow },
      React.createElement(View, { style: styles.statCard },
        React.createElement(Icon, { name: 'target', size: 16, color: BRAND.purple }),
        React.createElement(Text, { style: styles.statValue }, String(h.sessionsCompleted)),
        React.createElement(Text, { style: styles.statLabel }, 'Sessions')
      ),
      React.createElement(View, { style: styles.statCard },
        React.createElement(Icon, { name: 'clock', size: 16, color: BRAND.teal }),
        React.createElement(Text, { style: styles.statValue }, h.formatTotalTime(h.totalFocusTime)),
        React.createElement(Text, { style: styles.statLabel }, 'Total Focus')
      ),
      React.createElement(View, { style: styles.statCard },
        React.createElement(Icon, { name: 'trending-up', size: 16, color: BRAND.greenSolid }),
        React.createElement(Text, { style: styles.statValue },
          String(h.stats.todaySessions || h.sessionsCompleted)
        ),
        React.createElement(Text, { style: styles.statLabel }, 'Today')
      )
    );
  };

  // ─── Dream picker modal ─────────────────────────────────────

  var renderDreamPickerModal = function () {
    if (!h.showDreamPicker) return null;
    return React.createElement(Modal, {
      visible: true,
      animationType: 'slide',
      transparent: true,
      onRequestClose: function () { h.setShowDreamPicker(false); },
    },
      React.createElement(View, { style: styles.pickerOverlay },
        React.createElement(View, { style: styles.pickerContent, accessibilityViewIsModal: true },
          React.createElement(View, { style: styles.pickerHeader },
            React.createElement(Text, { style: styles.pickerTitle, accessibilityRole: 'header' }, 'Select a Dream'),
            React.createElement(TouchableOpacity, {
              onPress: function () { h.setShowDreamPicker(false); },
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Close dream picker', hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
            },
              React.createElement(Icon, { name: 'x', size: 22, color: COLORS.text })
            )
          ),
          // None option
          React.createElement(TouchableOpacity, {
            style: styles.pickerItem,
            onPress: function () {
              h.setSelectedDreamId(null);
              h.setSelectedTaskId(null);
              h.setShowDreamPicker(false);
            },
            accessible: true, accessibilityRole: 'button', accessibilityLabel: 'No association, general focus',
          },
            React.createElement(Icon, { name: 'minus-circle', size: 16, color: COLORS.textMuted }),
            React.createElement(Text, { style: styles.pickerItemText }, 'No association (general focus)')
          ),
          React.createElement(FlatList, {
            data: h.dreams,
            keyExtractor: function (item) { return String(item.id); },
            renderItem: function (info) {
              var dream = info.item;
              var color = catSolid(dream.category);
              var isSelected = h.selectedDreamId === dream.id;
              return React.createElement(TouchableOpacity, {
                style: [styles.pickerItem, isSelected && styles.pickerItemSelected],
                onPress: function () {
                  h.setSelectedDreamId(dream.id);
                  h.setShowDreamPicker(false);
                },
                accessible: true, accessibilityRole: 'button', accessibilityLabel: dream.title, accessibilityState: { selected: isSelected },
              },
                React.createElement(View, { style: [styles.pickerDot, { backgroundColor: color }] }),
                React.createElement(Text, {
                  style: [styles.pickerItemText, isSelected && { color: BRAND.purple }],
                  numberOfLines: 1,
                }, dream.title),
                isSelected
                  ? React.createElement(Icon, { name: 'check', size: 16, color: BRAND.purple })
                  : null
              );
            },
            style: { maxHeight: 300 },
          }),
          React.createElement(View, { style: { height: 20 } })
        )
      )
    );
  };

  // ─── Recent sessions ────────────────────────────────────────

  var renderHistory = function () {
    if (h.history.length === 0) return null;
    return React.createElement(View, { style: styles.historySection },
      React.createElement(Text, { style: styles.sectionLabel, accessibilityRole: 'header' }, 'Recent Sessions'),
      h.history.slice(0, 5).map(function (session, idx) {
        var duration = session.durationSeconds || session.duration || 0;
        var mins = Math.round(duration / 60);
        var date = session.completedAt || session.createdAt || '';
        var dateObj = date ? new Date(date) : new Date();
        var timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        var dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return React.createElement(View, { key: session.id || idx, style: styles.historyItem },
          React.createElement(View, { style: styles.historyDot }),
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, { style: styles.historyTitle },
              (session.dreamTitle || 'Focus session') + ' \u2022 ' + mins + ' min'
            ),
            React.createElement(Text, { style: styles.historyDate }, dateStr + ' at ' + timeStr)
          )
        );
      })
    );
  };

  // ─── Main render ─────────────────────────────────────────────

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(ScrollView, {
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
    },
      renderHeader(),
      renderPresets(),
      renderCustomInput(),
      renderTimerCircle(),
      renderControls(),
      renderDreamSelector(),
      renderStats(),
      renderHistory()
    ),
    renderDreamPickerModal(),
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

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  sessionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.purple,
  },

  // Presets
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: SPACING.lg,
    marginBottom: 16,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  presetChipActive: {
    backgroundColor: BRAND.purple,
    borderColor: BRAND.purple,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  presetTextActive: {
    fontWeight: '700',
    color: '#fff',
  },

  // Custom input
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: SPACING.lg,
  },
  customBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInputWrap: {
    alignItems: 'center',
  },
  customInput: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    minWidth: 60,
  },
  customLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: -2,
  },

  // Timer
  timerOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    height: TIMER_SIZE,
  },
  timerRingBg: {
    position: 'absolute',
    borderWidth: 6,
  },
  timerRingFill: {
    position: 'absolute',
    borderWidth: 6,
  },
  timerInner: {
    backgroundColor: COLORS.bodyBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },

  // Controls
  controlsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  ctrlBtn: {
    alignItems: 'center',
    gap: 6,
  },
  ctrlBtnCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  // Dream selector
  dreamSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  dreamSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  dreamSelectorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SPACING.lg,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // History
  historySection: {
    paddingHorizontal: SPACING.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.purple + '60',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Dream picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: COLORS.bodyBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  pickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickerItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
});

module.exports = FocusTimerScreen;
