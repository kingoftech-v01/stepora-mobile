/**
 * DreamDetailScreen — Main dream view with milestones, goals, tasks.
 */
var React = require('react');
var { useState } = require('react');
var {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, ActivityIndicator, Animated,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useDreamDetailScreen = require('./useDreamDetailScreen');
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig, getTooltipCount } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { catSolid, BRAND } = require('../../styles/colors');
var RecurrencePicker = require('../../components/RecurrencePicker');

var DreamDetailScreen = function () {
  var h = useDreamDetailScreen();
  var [menuVisible, setMenuVisible] = useState(false);
  var [addModalVisible, setAddModalVisible] = useState(false);
  var [addModalType, setAddModalType] = useState(null); // 'goal' | 'task'
  var [addModalGoalId, setAddModalGoalId] = useState(null);
  var [recurrenceType, setRecurrenceType] = useState('none');
  var [recurrenceDays, setRecurrenceDays] = useState([]);
  var [recurrenceEndDate, setRecurrenceEndDate] = useState(null);
  var checkinRef = React.useRef(null);
  var tooltipCfg0 = getTooltipConfig('DreamDetailScreen', 0);
  var tooltipCfg1 = getTooltipConfig('DreamDetailScreen', 1);

  if (h.dreamQuery.isLoading) {
    return React.createElement(SafeAreaView, { style: styles.container },
      React.createElement(View, { style: styles.loadingWrap },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent })
      )
    );
  }

  if (h.dreamQuery.isError) {
    return React.createElement(SafeAreaView, { style: styles.container },
      React.createElement(View, { style: styles.errorWrap },
        React.createElement(Text, { style: styles.errorText }, 'Failed to load dream'),
        React.createElement(TouchableOpacity, {
          style: styles.retryBtn,
          onPress: function () { h.dreamQuery.refetch(); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Retry loading dream',
        },
          React.createElement(Text, { style: styles.retryBtnText }, 'Retry')
        )
      )
    );
  }

  var solidColor = catSolid(h.DREAM.category);

  // Progress ring SVG-like circle (simplified for RN — using View-based arc)
  var renderProgressCircle = function () {
    return React.createElement(View, {
      style: styles.progressCircleWrap,
      accessible: true,
      accessibilityRole: 'progressbar',
      accessibilityLabel: h.progress + '% complete',
      accessibilityValue: { min: 0, max: 100, now: h.progress },
    },
      React.createElement(View, { style: [styles.progressCircleOuter, { borderColor: solidColor + '30' }], accessible: false },
        React.createElement(View, { style: styles.progressCircleInner },
          React.createElement(Text, { style: [styles.progressPercent, { color: solidColor }] }, h.progress + '%'),
          React.createElement(Text, { style: styles.progressLabel }, 'Complete')
        )
      )
    );
  };

  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Go back',
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.headerTitle, numberOfLines: 1, accessibilityRole: 'header' }, h.DREAM.title || 'Dream'),
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { setMenuVisible(true); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'More options',
        accessibilityHint: 'Opens dream actions menu',
      },
        React.createElement(Icon, { name: 'more-vertical', size: 22, color: COLORS.text })
      )
    );
  };

  var renderCheckinBanner = function () {
    if (!h.pendingCheckin) return null;
    return React.createElement(TouchableOpacity, {
      ref: checkinRef,
      style: styles.checkinBanner,
      onPress: function () {
        h.navigation.navigate('CheckIn', { dreamId: h.id, checkinId: h.pendingCheckin.id });
      },
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: 'Check-in Available. Share your progress and get AI coaching',
    },
      React.createElement(Icon, { name: 'activity', size: 18, color: BRAND.purpleLight }),
      React.createElement(View, { style: { flex: 1, marginLeft: 12 } },
        React.createElement(Text, { style: styles.checkinBannerTitle }, 'Check-in Available'),
        React.createElement(Text, { style: styles.checkinBannerSub }, 'Share your progress and get AI coaching')
      ),
      React.createElement(Icon, { name: 'chevron-right', size: 16, color: COLORS.textMuted })
    );
  };

  var renderStatsRow = function () {
    return React.createElement(View, { style: styles.statsRow },
      [
        { icon: 'target', value: h.goals.length, label: 'Goals', color: solidColor },
        { icon: 'check-circle', value: h.doneTasks + '/' + h.totalTasks, label: 'Tasks', color: BRAND.green },
        { icon: 'flag', value: h.MILESTONES.length, label: 'Milestones', color: BRAND.yellow },
      ].map(function (s, i) {
        return React.createElement(View, {
          key: i,
          style: styles.statCard,
          accessible: true,
          accessibilityLabel: s.value + ' ' + s.label,
        },
          React.createElement(Icon, { name: s.icon, size: 16, color: s.color }),
          React.createElement(Text, { style: styles.statValue, accessible: false }, String(s.value)),
          React.createElement(Text, { style: styles.statLabel, accessible: false }, s.label)
        );
      })
    );
  };

  var renderMilestones = function () {
    if (h.MILESTONES.length === 0) return null;
    var shown = h.showAllMilestones ? h.MILESTONES : h.MILESTONES.slice(0, 3);
    return React.createElement(View, { style: styles.section },
      React.createElement(View, { style: styles.sectionHeader },
        React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, 'Milestones'),
        React.createElement(Text, { style: styles.sectionCount }, h.MILESTONES.length)
      ),
      shown.map(function (ms, i) {
        return React.createElement(View, { key: ms.id, style: styles.milestoneItem },
          React.createElement(View, { style: [styles.milestoneDot, ms.done && styles.milestoneDotDone] },
            ms.done
              ? React.createElement(Icon, { name: 'check', size: 10, color: '#fff' })
              : React.createElement(Text, { style: styles.milestoneNum }, String(i + 1))
          ),
          React.createElement(View, { style: { flex: 1, marginLeft: 12 } },
            React.createElement(Text, {
              style: [styles.milestoneLabel, ms.done && styles.milestoneLabelDone],
            }, ms.label),
            ms.description ? React.createElement(Text, {
              style: styles.milestoneDesc, numberOfLines: 2,
            }, ms.description) : null
          ),
          ms.active && !ms.done
            ? React.createElement(TouchableOpacity, {
                style: styles.completeBtn,
                onPress: function () { h.milestoneCompleteMut.mutate(ms.id); },
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: 'Complete milestone: ' + ms.label,
              },
                React.createElement(Icon, { name: 'check', size: 12, color: '#fff' })
              )
            : null
        );
      }),
      h.MILESTONES.length > 3
        ? React.createElement(TouchableOpacity, {
            style: styles.seeMoreBtn,
            onPress: function () { h.setShowAllMilestones(!h.showAllMilestones); },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: h.showAllMilestones ? 'Show fewer milestones' : 'See all ' + h.MILESTONES.length + ' milestones',
          },
            React.createElement(Text, { style: styles.seeMoreText },
              h.showAllMilestones ? 'Show Less' : 'See All (' + h.MILESTONES.length + ')'
            ),
            React.createElement(Icon, {
              name: h.showAllMilestones ? 'chevron-up' : 'chevron-down',
              size: 14, color: COLORS.accent,
            })
          )
        : null
    );
  };

  var renderGoals = function () {
    var shown = h.showAllGoals ? h.goals : h.goals.slice(0, 5);
    return React.createElement(View, { style: styles.section },
      React.createElement(View, { style: styles.sectionHeader },
        React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, 'Goals & Tasks'),
        React.createElement(View, { style: { flexDirection: 'row', gap: 8, alignItems: 'center' } },
          React.createElement(TouchableOpacity, {
            style: styles.addSmallBtn,
            onPress: function () {
              setAddModalType('goal');
              setAddModalGoalId(null);
              setAddModalVisible(true);
            },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Add goal',
          },
            React.createElement(Icon, { name: 'plus', size: 14, color: COLORS.accent })
          )
        )
      ),
      shown.map(function (g) {
        var isExpanded = h.expanded[g.id];
        var doneTasks = g.tasks.filter(function (tk) { return tk.completed; }).length;
        var totalTasks = g.tasks.length;
        return React.createElement(View, { key: g.id, style: styles.goalCard },
          React.createElement(TouchableOpacity, {
            style: styles.goalHeader,
            onPress: function () { h.toggleExpand(g.id); },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: g.title + ', ' + doneTasks + ' of ' + totalTasks + ' tasks done' + (g.completed ? ', completed' : ''),
            accessibilityHint: isExpanded ? 'Collapse tasks' : 'Expand tasks',
            accessibilityState: { expanded: !!isExpanded },
          },
            React.createElement(View, {
              style: [styles.goalDot, g.completed && { backgroundColor: BRAND.green }],
            },
              g.completed
                ? React.createElement(Icon, { name: 'check', size: 10, color: '#fff' })
                : null
            ),
            React.createElement(View, { style: { flex: 1, marginLeft: 10 } },
              React.createElement(Text, { style: styles.goalTitle }, g.title),
              React.createElement(Text, { style: styles.goalMeta }, doneTasks + '/' + totalTasks + ' tasks')
            ),
            React.createElement(TouchableOpacity, {
              style: styles.refineSmallBtn,
              onPress: function () {
                h.navigation.navigate('GoalRefine', {
                  goalId: g.id,
                  goalTitle: g.title,
                  goalDescription: g.description || '',
                  dreamId: h.id,
                });
              },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Refine goal with AI',
              hitSlop: { top: 4, bottom: 4, left: 4, right: 4 },
            },
              React.createElement(Icon, { name: 'zap', size: 12, color: COLORS.accent })
            ),
            React.createElement(Icon, {
              name: isExpanded ? 'chevron-up' : 'chevron-down',
              size: 16, color: COLORS.textMuted,
            })
          ),
          isExpanded
            ? React.createElement(View, { style: styles.tasksList },
                g.tasks.map(function (tk) {
                  return React.createElement(TouchableOpacity, {
                    key: tk.id,
                    style: styles.taskRow,
                    onPress: function () { h.toggleTask(g.id, tk.id); },
                    accessible: true,
                    accessibilityRole: 'checkbox',
                    accessibilityLabel: tk.title + (tk.xp ? ', ' + tk.xp + ' XP' : ''),
                    accessibilityState: { checked: !!tk.completed },
                  },
                    React.createElement(View, {
                      style: [styles.taskCheckbox, tk.completed && styles.taskCheckboxDone],
                    },
                      tk.completed
                        ? React.createElement(Icon, { name: 'check', size: 10, color: BRAND.green })
                        : null
                    ),
                    React.createElement(Text, {
                      style: [styles.taskTitle, tk.completed && styles.taskTitleDone],
                    }, tk.title),
                    tk.xp
                      ? React.createElement(Text, { style: styles.taskXp }, '+' + tk.xp + ' XP')
                      : null
                  );
                }),
                React.createElement(TouchableOpacity, {
                  style: styles.addTaskBtn,
                  onPress: function () {
                    setAddModalType('task');
                    setAddModalGoalId(g.id);
                    setAddModalVisible(true);
                  },
                  accessible: true,
                  accessibilityRole: 'button',
                  accessibilityLabel: 'Add Task',
                },
                  React.createElement(Icon, { name: 'plus', size: 12, color: COLORS.accent }),
                  React.createElement(Text, { style: styles.addTaskText }, 'Add Task')
                )
              )
            : null
        );
      }),
      h.goals.length > 5
        ? React.createElement(TouchableOpacity, {
            style: styles.seeMoreBtn,
            onPress: function () { h.setShowAllGoals(!h.showAllGoals); },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: h.showAllGoals ? 'Show fewer goals' : 'See all ' + h.goals.length + ' goals',
          },
            React.createElement(Text, { style: styles.seeMoreText },
              h.showAllGoals ? 'Show Less' : 'See All (' + h.goals.length + ')'
            )
          )
        : null
    );
  };

  var renderObstacles = function () {
    if (h.obstacles.length === 0) return null;
    return React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle, accessibilityRole: 'header' }, 'Obstacles'),
      h.obstacles.map(function (obs) {
        return React.createElement(View, { key: obs.id, style: styles.obstacleCard },
          React.createElement(Icon, { name: 'alert-triangle', size: 14, color: BRAND.yellow }),
          React.createElement(View, { style: { flex: 1, marginLeft: 10 } },
            React.createElement(Text, { style: styles.obstacleTitle }, obs.title),
            obs.description
              ? React.createElement(Text, { style: styles.obstacleDesc, numberOfLines: 2 }, obs.description)
              : null
          ),
          obs.status !== 'resolved'
            ? React.createElement(TouchableOpacity, {
                onPress: function () { h.resolveObstacleMut.mutate(obs.id); },
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: 'Resolve obstacle: ' + obs.title,
              },
                React.createElement(Icon, { name: 'check-circle', size: 18, color: BRAND.green })
              )
            : React.createElement(Icon, { name: 'check-circle', size: 18, color: COLORS.textMuted })
        );
      })
    );
  };

  // Add goal/task modal
  var renderAddModal = function () {
    var modalTypeLabel = addModalType === 'goal' ? 'Add Goal' : 'Add Task';
    return React.createElement(Modal, {
      visible: addModalVisible,
      transparent: true,
      animationType: 'fade',
      onRequestClose: function () { setAddModalVisible(false); },
    },
      React.createElement(View, { style: styles.modalOverlay },
        React.createElement(View, {
          style: styles.modalContent,
          accessibilityViewIsModal: true,
          accessibilityLabel: modalTypeLabel + ' dialog',
        },
          React.createElement(Text, { style: styles.modalTitle, accessibilityRole: 'header' },
            modalTypeLabel
          ),
          React.createElement(TextInput, {
            style: styles.modalInput,
            value: h.newTitle,
            onChangeText: h.setNewTitle,
            placeholder: 'Title',
            placeholderTextColor: COLORS.textMuted,
            autoFocus: true,
            accessible: true,
            accessibilityLabel: 'Title',
          }),
          React.createElement(TextInput, {
            style: [styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }],
            value: h.newDesc,
            onChangeText: h.setNewDesc,
            placeholder: 'Description (optional)',
            placeholderTextColor: COLORS.textMuted,
            multiline: true,
            accessible: true,
            accessibilityLabel: 'Description',
          }),
          addModalType === 'task'
            ? React.createElement(RecurrencePicker, {
                recurrenceType: recurrenceType,
                recurrenceDays: recurrenceDays,
                recurrenceEndDate: recurrenceEndDate,
                onRecurrenceTypeChange: setRecurrenceType,
                onRecurrenceDaysChange: setRecurrenceDays,
                onRecurrenceEndDateChange: setRecurrenceEndDate,
                style: { marginBottom: 12 },
              })
            : null,
          React.createElement(View, { style: styles.modalActions },
            React.createElement(TouchableOpacity, {
              style: styles.modalCancelBtn,
              onPress: function () { setAddModalVisible(false); h.setNewTitle(''); h.setNewDesc(''); setRecurrenceType('none'); setRecurrenceDays([]); setRecurrenceEndDate(null); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Cancel',
            },
              React.createElement(Text, { style: styles.modalCancelText }, 'Cancel')
            ),
            React.createElement(TouchableOpacity, {
              style: [styles.modalSubmitBtn, !h.newTitle.trim() && { opacity: 0.5 }],
              onPress: function () {
                if (addModalType === 'goal') h.handleAddGoal();
                else {
                  h.handleAddTask(addModalGoalId, {
                    recurrence_type: recurrenceType,
                    recurrence_days: recurrenceDays,
                    recurrence_end_date: recurrenceEndDate,
                  });
                  setRecurrenceType('none');
                  setRecurrenceDays([]);
                  setRecurrenceEndDate(null);
                }
                setAddModalVisible(false);
              },
              disabled: !h.newTitle.trim(),
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: modalTypeLabel,
              accessibilityState: { disabled: !h.newTitle.trim() },
            },
              React.createElement(Text, { style: styles.modalSubmitText },
                addModalType === 'goal' ? 'Add Goal' : 'Add Task'
              )
            )
          )
        )
      )
    );
  };

  // Menu modal
  var renderMenuModal = function () {
    return React.createElement(Modal, {
      visible: menuVisible,
      transparent: true,
      animationType: 'fade',
      onRequestClose: function () { setMenuVisible(false); },
    },
      React.createElement(TouchableOpacity, {
        style: styles.menuOverlay,
        activeOpacity: 1,
        onPress: function () { setMenuVisible(false); },
      },
        React.createElement(View, { style: styles.menuContent },
          h.menuItems.map(function (item, i) {
            return React.createElement(TouchableOpacity, {
              key: i,
              style: styles.menuItem,
              onPress: function () { setMenuVisible(false); item.action(); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: item.label,
            },
              React.createElement(Icon, { name: item.icon, size: 16, color: item.danger ? COLORS.red : COLORS.text }),
              React.createElement(Text, {
                style: [styles.menuItemText, item.danger && { color: COLORS.red }],
              }, item.label)
            );
          })
        )
      )
    );
  };

  // Delete confirm modal
  var renderDeleteConfirm = function () {
    return React.createElement(Modal, {
      visible: h.showDeleteConfirm,
      transparent: true,
      animationType: 'fade',
      onRequestClose: function () { h.setShowDeleteConfirm(false); },
    },
      React.createElement(View, { style: styles.modalOverlay },
        React.createElement(View, {
          style: styles.modalContent,
          accessibilityViewIsModal: true,
          accessibilityLabel: 'Delete Dream confirmation dialog',
        },
          React.createElement(Icon, { name: 'alert-triangle', size: 32, color: COLORS.red, style: { alignSelf: 'center', marginBottom: 16 } }),
          React.createElement(Text, { style: [styles.modalTitle, { textAlign: 'center' }], accessibilityRole: 'header' }, 'Delete Dream?'),
          React.createElement(Text, { style: styles.deleteConfirmText },
            'This will permanently delete "' + (h.DREAM.title || '') + '" and all its goals, tasks, and milestones.'
          ),
          React.createElement(View, { style: styles.modalActions },
            React.createElement(TouchableOpacity, {
              style: styles.modalCancelBtn,
              onPress: function () { h.setShowDeleteConfirm(false); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Cancel',
            },
              React.createElement(Text, { style: styles.modalCancelText }, 'Cancel')
            ),
            React.createElement(TouchableOpacity, {
              style: [styles.modalSubmitBtn, { backgroundColor: COLORS.red }],
              onPress: function () { h.deleteDreamMut.mutate(); h.setShowDeleteConfirm(false); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Delete dream permanently',
            },
              React.createElement(Text, { style: styles.modalSubmitText }, 'Delete')
            )
          )
        )
      )
    );
  };

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(ScrollView, {
      style: styles.scroll,
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
    },
      renderHeader(),
      // Dream info card
      React.createElement(View, { style: [styles.dreamInfoCard, { borderColor: solidColor + '20' }] },
        React.createElement(View, { style: [styles.colorStrip, { backgroundColor: solidColor }] }),
        React.createElement(View, { style: styles.dreamInfoContent },
          renderProgressCircle(),
          React.createElement(View, { style: styles.dreamMeta },
            React.createElement(Text, { style: styles.dreamMetaTitle, numberOfLines: 2 }, h.DREAM.title),
            h.DREAM.description
              ? React.createElement(Text, { style: styles.dreamMetaDesc, numberOfLines: 3 }, h.DREAM.description)
              : null,
            React.createElement(View, { style: styles.dreamMetaTags },
              React.createElement(View, { style: [styles.statusBadge, { backgroundColor: (h.STATUS_COLORS[h.DREAM.status] || solidColor) + '18' }] },
                React.createElement(Text, { style: [styles.statusText, { color: h.STATUS_COLORS[h.DREAM.status] || solidColor }] },
                  h.DREAM.status ? h.DREAM.status.charAt(0).toUpperCase() + h.DREAM.status.slice(1) : 'Active'
                )
              ),
              h.DREAM.category
                ? React.createElement(View, { style: [styles.catTagBadge, { backgroundColor: solidColor + '18' }] },
                    React.createElement(Text, { style: [styles.catTagText, { color: solidColor }] },
                      (h.DREAM.categoryLabel || h.DREAM.category)
                    )
                  )
                : null
            )
          )
        )
      ),
      renderCheckinBanner(),
      renderStatsRow(),
      renderMilestones(),
      renderGoals(),
      renderObstacles()
    ),
    renderMenuModal(),
    renderAddModal(),
    renderDeleteConfirm(),
    tooltipCfg0
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg0.id,
          message: tooltipCfg0.message,
          position: tooltipCfg0.position,
          targetRef: checkinRef,
        })
      : null,
    tooltipCfg1
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg1.id,
          message: tooltipCfg1.message,
          position: tooltipCfg1.position,
          targetY: 200,
        })
      : null
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 14, color: COLORS.red },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: RADIUS.md, backgroundColor: COLORS.accent },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  dreamInfoCard: { backgroundColor: COLORS.glassBg, borderRadius: RADIUS.xl, borderWidth: 1, marginBottom: SPACING.lg, overflow: 'hidden' },
  colorStrip: { height: 4 },
  dreamInfoContent: { flexDirection: 'row', padding: SPACING.lg, gap: 16 },
  progressCircleWrap: { alignItems: 'center', justifyContent: 'center' },
  progressCircleOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  progressCircleInner: { alignItems: 'center' },
  progressPercent: { fontSize: 18, fontWeight: '700' },
  progressLabel: { fontSize: 9, color: COLORS.textMuted },
  dreamMeta: { flex: 1 },
  dreamMetaTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  dreamMetaDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 8 },
  dreamMetaTags: { flexDirection: 'row', gap: 6 },
  statusBadge: { paddingVertical: 2, paddingHorizontal: 10, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '600' },
  catTagBadge: { paddingVertical: 2, paddingHorizontal: 10, borderRadius: 99 },
  catTagText: { fontSize: 10, fontWeight: '600' },
  checkinBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', borderRadius: RADIUS.lg, marginBottom: SPACING.lg },
  checkinBannerTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  checkinBannerSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  section: { marginBottom: SPACING.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sectionCount: { fontSize: 12, color: COLORS.textMuted, backgroundColor: COLORS.glassBg, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 99 },
  addSmallBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  milestoneItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  milestoneDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  milestoneDotDone: { backgroundColor: BRAND.green, borderColor: BRAND.green },
  milestoneNum: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  milestoneLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  milestoneLabelDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  milestoneDesc: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2, lineHeight: 16 },
  completeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: BRAND.green, alignItems: 'center', justifyContent: 'center' },
  seeMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 4, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.cardBg, gap: 6 },
  seeMoreText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  goalCard: { backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 8, overflow: 'hidden' },
  goalHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  goalDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.glassBg, borderWidth: 1.5, borderColor: COLORS.glassBorderLight, alignItems: 'center', justifyContent: 'center' },
  goalTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  goalMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  tasksList: { paddingHorizontal: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: COLORS.divider },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  taskCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.glassBorderLight, alignItems: 'center', justifyContent: 'center' },
  taskCheckboxDone: { borderColor: BRAND.green, backgroundColor: 'rgba(93,229,168,0.15)' },
  taskTitle: { flex: 1, fontSize: 12.5, color: COLORS.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskXp: { fontSize: 10, fontWeight: '600', color: BRAND.green },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addTaskText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  obstacleCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 8, gap: 10 },
  obstacleTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  obstacleDesc: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', maxWidth: 380, backgroundColor: '#1A1A2E', borderRadius: RADIUS.xl, padding: SPACING.xxl, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  modalInput: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: COLORS.text, marginBottom: SPACING.md },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: SPACING.sm },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modalSubmitBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.accent, alignItems: 'center' },
  modalSubmitText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  deleteConfirmText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, textAlign: 'center', marginBottom: SPACING.lg },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuContent: { backgroundColor: '#1A1A2E', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl, borderWidth: 1, borderColor: COLORS.glassBorder },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  menuItemText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  refineSmallBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
});

module.exports = DreamDetailScreen;
