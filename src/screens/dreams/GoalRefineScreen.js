/**
 * GoalRefineScreen — Chat-like interface for AI-powered SMART goal refinement.
 * Shows AI questions one at a time with typing animation.
 * After ~5 questions, AI generates a refined SMART goal with milestones.
 * User can accept (saves to backend) or continue refining.
 */
var React = require('react');
var {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Animated,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useGoalRefineScreen = require('./useGoalRefineScreen');
var SubscriptionGate = require('../../components/SubscriptionGate');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');

/* ── Typing animation dots ── */
var TypingDots = function () {
  var dot1 = React.useRef(new Animated.Value(0.3)).current;
  var dot2 = React.useRef(new Animated.Value(0.3)).current;
  var dot3 = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(function () {
    var animate = function (dot, delay) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    };
    var a1 = animate(dot1, 0);
    var a2 = animate(dot2, 200);
    var a3 = animate(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return function () { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return React.createElement(View, { style: styles.typingDots },
    React.createElement(Icon, { name: 'zap', size: 12, color: COLORS.accent }),
    React.createElement(Animated.View, { style: [styles.dot, { opacity: dot1 }] }),
    React.createElement(Animated.View, { style: [styles.dot, { opacity: dot2 }] }),
    React.createElement(Animated.View, { style: [styles.dot, { opacity: dot3 }] })
  );
};

/* ── Main Screen ── */
var GoalRefineScreen = function () {
  var h = useGoalRefineScreen();

  /* ── Header ── */
  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Go back',
        hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(View, { style: styles.headerCenter },
        React.createElement(View, { style: styles.headerIconWrap },
          React.createElement(Icon, { name: 'zap', size: 16, color: COLORS.accent })
        ),
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: styles.headerTitle, numberOfLines: 1, accessibilityRole: 'header' }, 'Refine with AI'),
          h.goalTitle
            ? React.createElement(Text, { style: styles.headerSubtitle, numberOfLines: 1 }, h.goalTitle)
            : null
        )
      ),
      React.createElement(View, { style: { width: 36 } })
    );
  };

  /* ── Progress Steps ── */
  var renderProgress = function () {
    return React.createElement(View, { style: styles.progressRow,
      accessible: true,
      accessibilityRole: 'progressbar',
      accessibilityLabel: 'Step ' + (h.step + 1) + ' of ' + h.STEPS.length,
      accessibilityValue: { min: 0, max: h.STEPS.length - 1, now: h.step },
    },
      h.STEPS.map(function (label, i) {
        var isActive = i <= h.step;
        var isCurrent = i === h.step;
        return React.createElement(View, { key: label, style: styles.progressStep },
          React.createElement(View, { style: [
            styles.progressBar,
            isActive && styles.progressBarActive,
          ] }),
          React.createElement(Text, { style: [
            styles.progressLabel,
            isActive && styles.progressLabelActive,
            isCurrent && { fontWeight: '700' },
          ] }, label)
        );
      })
    );
  };

  /* ── Chat message bubble ── */
  var renderMessage = function (item) {
    var msg = item.item || item;
    var isUser = msg.role === 'user';
    var isError = msg.isError;

    return React.createElement(View, {
      style: [styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAi],
    },
      React.createElement(View, {
        style: [
          styles.msgBubble,
          isUser ? styles.msgBubbleUser : (isError ? styles.msgBubbleError : styles.msgBubbleAi),
        ],
      },
        !isUser
          ? React.createElement(View, { style: styles.aiLabel },
              React.createElement(Icon, { name: 'zap', size: 11, color: COLORS.accent }),
              React.createElement(Text, { style: styles.aiLabelText }, 'AI Coach')
            )
          : null,
        React.createElement(Text, { style: [
          styles.msgText,
          isError && { color: '#F87171' },
        ] }, msg.content)
      )
    );
  };

  /* ── Refined Goal Summary Card ── */
  var renderRefinedGoal = function () {
    if (!h.refinedGoal || !h.isComplete) return null;

    return React.createElement(View, { style: styles.refinedCard },
      /* Header */
      React.createElement(View, { style: styles.refinedHeader },
        React.createElement(View, { style: styles.refinedIconWrap },
          React.createElement(Icon, { name: 'target', size: 16, color: '#fff' })
        ),
        React.createElement(View, null,
          React.createElement(Text, { style: styles.refinedTitle }, 'Refined SMART Goal'),
          React.createElement(Text, { style: styles.refinedSubtitle }, 'Ready to apply')
        )
      ),

      /* Title + Description */
      React.createElement(View, { style: styles.refinedContent },
        React.createElement(Text, { style: styles.refinedGoalTitle }, h.refinedGoal.title),
        React.createElement(Text, { style: styles.refinedGoalDesc }, h.refinedGoal.description),
        h.refinedGoal.measurableTarget
          ? React.createElement(View, { style: styles.measureBadge },
              React.createElement(Icon, { name: 'bar-chart-2', size: 12, color: '#3B82F6' }),
              React.createElement(Text, { style: styles.measureText }, h.refinedGoal.measurableTarget)
            )
          : null,
        h.refinedGoal.timeline
          ? React.createElement(View, { style: styles.timelineBadge },
              React.createElement(Icon, { name: 'clock', size: 12, color: '#EF4444' }),
              React.createElement(Text, { style: styles.timelineText }, h.refinedGoal.timeline)
            )
          : null
      ),

      /* SMART Criteria */
      React.createElement(View, { style: styles.smartRow },
        h.SMART_CRITERIA.map(function (c) {
          return React.createElement(View, {
            key: c.key,
            style: [styles.smartBadge, { backgroundColor: c.color + '18', borderColor: c.color + '30' }],
          },
            React.createElement(Icon, { name: 'check-circle', size: 11, color: c.color }),
            React.createElement(Text, { style: [styles.smartBadgeText, { color: c.color }] }, c.label)
          );
        })
      ),

      /* Milestones */
      h.milestones && h.milestones.length > 0
        ? React.createElement(View, { style: styles.milestonesSection },
            React.createElement(View, { style: styles.milestonesSectionHeader },
              React.createElement(Icon, { name: 'award', size: 13, color: COLORS.accent }),
              React.createElement(Text, { style: styles.milestonesSectionTitle }, 'Suggested Milestones')
            ),
            h.milestones.map(function (ms, i) {
              return React.createElement(View, {
                key: i,
                style: [
                  styles.milestoneRow,
                  i < h.milestones.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
                ],
              },
                React.createElement(View, { style: styles.milestoneNum },
                  React.createElement(Text, { style: styles.milestoneNumText }, String(i + 1))
                ),
                React.createElement(View, { style: { flex: 1 } },
                  React.createElement(Text, { style: styles.milestoneTitle }, ms.title),
                  ms.targetDate
                    ? React.createElement(Text, { style: styles.milestoneDate }, ms.targetDate)
                    : null
                )
              );
            })
          )
        : null,

      /* Apply / Applied */
      !h.applied
        ? React.createElement(TouchableOpacity, {
            style: [styles.applyBtn, (h.isApplying) && { opacity: 0.6 }],
            onPress: h.handleApply,
            disabled: h.isApplying,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: h.isApplying ? 'Applying refinement' : 'Apply Refinement',
            accessibilityState: { disabled: h.isApplying, busy: h.isApplying },
          },
            h.isApplying
              ? React.createElement(ActivityIndicator, { size: 'small', color: '#fff' })
              : React.createElement(Icon, { name: 'zap', size: 14, color: '#fff' }),
            React.createElement(Text, { style: styles.applyBtnText },
              h.isApplying ? 'Applying...' : 'Apply Refinement'
            )
          )
        : React.createElement(View, { style: styles.appliedBanner },
            React.createElement(Icon, { name: 'check-circle', size: 16, color: BRAND.green }),
            React.createElement(Text, { style: styles.appliedText }, 'Goal Updated Successfully!')
          )
    );
  };

  /* ── FlatList data: messages + typing + refined card ── */
  var listData = h.messages.slice();
  if (h.isLoading) {
    listData = listData.concat([{ id: 'typing', role: 'typing' }]);
  }
  if (h.refinedGoal && h.isComplete) {
    listData = listData.concat([{ id: 'refined', role: 'refined' }]);
  }

  var renderItem = function (info) {
    var item = info.item;
    if (item.role === 'typing') {
      return React.createElement(View, { style: [styles.msgRow, styles.msgRowAi] },
        React.createElement(View, { style: styles.msgBubbleAi },
          React.createElement(TypingDots, null)
        )
      );
    }
    if (item.role === 'refined') {
      return renderRefinedGoal();
    }
    return renderMessage(info);
  };

  var keyExtractor = function (item) {
    return item.id || String(Math.random());
  };

  /* ── Input area ── */
  var renderInput = function () {
    if (h.applied) {
      return React.createElement(View, { style: styles.inputArea },
        React.createElement(TouchableOpacity, {
          style: styles.doneBtn,
          onPress: h.handleDone,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Done',
        },
          React.createElement(Icon, { name: 'check', size: 16, color: '#fff' }),
          React.createElement(Text, { style: styles.doneBtnText }, 'Done')
        )
      );
    }

    return React.createElement(View, { style: styles.inputArea },
      React.createElement(TextInput, {
        ref: h.inputRef,
        style: styles.textInput,
        value: h.input,
        onChangeText: h.setInput,
        placeholder: h.isComplete ? 'Continue or apply above...' : 'Type your response...',
        placeholderTextColor: COLORS.textMuted,
        multiline: true,
        editable: !h.isLoading,
        returnKeyType: 'send',
        blurOnSubmit: false,
        onSubmitEditing: h.handleSend,
        accessible: true,
        accessibilityLabel: 'Message input',
      }),
      React.createElement(TouchableOpacity, {
        style: [
          styles.sendBtn,
          (!h.input.trim() || h.isLoading) && styles.sendBtnDisabled,
        ],
        onPress: h.handleSend,
        disabled: !h.input.trim() || h.isLoading,
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Send message',
        accessibilityState: { disabled: !h.input.trim() || h.isLoading },
      },
        React.createElement(Icon, {
          name: 'send',
          size: 16,
          color: h.input.trim() && !h.isLoading ? '#fff' : COLORS.textMuted,
        })
      )
    );
  };

  /* ── Empty state (before first message) ── */
  var renderEmpty = function () {
    return React.createElement(View, { style: styles.emptyWrap },
      React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent }),
      React.createElement(Text, { style: styles.emptyText }, 'Starting AI refinement...')
    );
  };

  /* ── Main render ── */
  return React.createElement(SubscriptionGate, { requiredPlan: 'premium', featureName: 'Goal Refinement AI' },
    React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      renderProgress(),
      React.createElement(KeyboardAvoidingView, {
        style: styles.chatArea,
        behavior: Platform.OS === 'ios' ? 'padding' : undefined,
        keyboardVerticalOffset: Platform.OS === 'ios' ? 90 : 0,
      },
        React.createElement(FlatList, {
          ref: h.flatListRef,
          data: listData,
          renderItem: renderItem,
          keyExtractor: keyExtractor,
          style: styles.messagesList,
          contentContainerStyle: styles.messagesContent,
          showsVerticalScrollIndicator: false,
          ListEmptyComponent: renderEmpty,
          onContentSizeChange: function () { h.scrollToBottom(); },
        }),
        renderInput()
      )
    )
  );
};

/* ═══════════════════════════════════════════════════════════════════
 * Styles
 * ═══════════════════════════════════════════════════════════════════ */
var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  headerSubtitle: { fontSize: 11, color: COLORS.textMuted, maxWidth: 200 },

  /* Progress */
  progressRow: {
    flexDirection: 'row', gap: 4,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  progressStep: { flex: 1, alignItems: 'center', gap: 4 },
  progressBar: {
    height: 4, width: '100%', borderRadius: 2,
    backgroundColor: COLORS.divider,
  },
  progressBarActive: {
    backgroundColor: COLORS.accent,
  },
  progressLabel: { fontSize: 9, fontWeight: '500', color: COLORS.textMuted, textAlign: 'center' },
  progressLabelActive: { color: COLORS.accent },

  /* Chat */
  chatArea: { flex: 1 },
  messagesList: { flex: 1 },
  messagesContent: { padding: SPACING.lg, paddingBottom: 8, gap: 12 },

  /* Message bubbles */
  msgRow: { flexDirection: 'row' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAi: { justifyContent: 'flex-start' },
  msgBubble: {
    maxWidth: '85%', padding: 12,
    borderRadius: 16,
  },
  msgBubbleUser: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    borderBottomRightRadius: 4,
  },
  msgBubbleAi: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    borderBottomLeftRadius: 4,
  },
  msgBubbleError: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
    borderBottomLeftRadius: 4,
  },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiLabelText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  msgText: { fontSize: 13, lineHeight: 20, color: COLORS.text },

  /* Typing indicator */
  typingDots: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 4, paddingHorizontal: 4,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.accent,
  },

  /* Refined Goal Card */
  refinedCard: {
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    borderRadius: 18, padding: 20, marginTop: 4,
  },
  refinedHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  refinedIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: BRAND.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  refinedTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  refinedSubtitle: { fontSize: 11, color: COLORS.textMuted },

  refinedContent: {
    padding: 14, borderRadius: 12,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    marginBottom: 12,
  },
  refinedGoalTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  refinedGoalDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  measureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, padding: 6, paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)',
  },
  measureText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  timelineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 6, padding: 6, paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.12)',
  },
  timelineText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },

  /* SMART criteria */
  smartRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  smartBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 20, borderWidth: 1,
  },
  smartBadgeText: { fontSize: 11, fontWeight: '600' },

  /* Milestones */
  milestonesSection: { marginBottom: 14 },
  milestonesSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8,
  },
  milestonesSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  milestoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
  },
  milestoneNum: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneNumText: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
  milestoneTitle: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  milestoneDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  /* Apply button */
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
  },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Applied banner */
  appliedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(93,229,168,0.1)',
    borderWidth: 1, borderColor: 'rgba(93,229,168,0.25)',
  },
  appliedText: { fontSize: 14, fontWeight: '700', color: BRAND.green },

  /* Input area */
  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
    backgroundColor: COLORS.bodyBg,
  },
  textInput: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.text,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: BRAND.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.glassBg,
  },

  /* Done button */
  doneBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
  },
  doneBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Empty state */
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});

module.exports = GoalRefineScreen;
