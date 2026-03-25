/**
 * CalendarScreen — Main calendar view with monthly grid and daily events.
 */
var React = require('react');
var {
  View, Text, TextInput, ScrollView, FlatList, TouchableOpacity,
  Modal, StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useCalendarScreen = require('./useCalendarScreen');
var SubscriptionBanner = require('../../components/SubscriptionBanner');
var SubscriptionGate = require('../../components/SubscriptionGate');
var OnboardingTooltip = require('../../components/OnboardingTooltip');
var { getTooltipConfig } = require('../../config/onboardingTooltips');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { OfflineDataBanner } = require('../../components/shared/OfflineBanner');

var EventCard = function (props) {
  var evt = props.evt;
  var evtKey = props.evtKey;
  var h = props.h;
  var eventLabel = evt.title + (evt.time ? ', ' + evt.time : '') + (evt.done ? ', completed' : '') + (evt.isDeadline ? ', deadline' : '') + (evt.dream ? ', ' + evt.dream : '');
  return React.createElement(View, { style: styles.eventCard, accessible: true, accessibilityLabel: eventLabel },
    React.createElement(View, { style: [styles.eventStrip, { backgroundColor: evt.color }] }),
    evt.type === 'task'
      ? React.createElement(TouchableOpacity, {
          style: [styles.eventCheck, evt.done && styles.eventCheckDone],
          onPress: function () { h.toggleTask(evtKey, evt.id); },
          accessible: true,
          accessibilityRole: 'checkbox',
          accessibilityState: { checked: !!evt.done },
          accessibilityLabel: (evt.done ? 'Mark incomplete' : 'Mark complete') + ', ' + evt.title,
        },
          evt.done ? React.createElement(Icon, { name: 'check', size: 13, color: '#5DE5A8' }) : null
        )
      : React.createElement(View, { style: [styles.eventTypeIcon, { backgroundColor: evt.color + '15' }] },
          React.createElement(Icon, { name: 'clock', size: 12, color: evt.color })
        ),
    React.createElement(View, { style: { flex: 1, marginLeft: 12 }, accessible: false },
      React.createElement(Text, {
        style: [styles.eventTitle, evt.done && styles.eventTitleDone],
        numberOfLines: 1,
      }, evt.title),
      React.createElement(View, { style: styles.eventMeta },
        React.createElement(Text, { style: styles.eventTime }, evt.time),
        evt.isDeadline
          ? React.createElement(View, { style: styles.deadlineBadge },
              React.createElement(Text, { style: styles.deadlineText }, 'DEADLINE')
            )
          : null,
        evt.dream
          ? React.createElement(Text, { style: [styles.eventDream, { color: evt.color }] }, evt.dream)
          : null
      )
    ),
    React.createElement(TouchableOpacity, {
      style: styles.deleteBtn,
      onPress: function () { h.setConfirmDel({ key: evtKey, id: evt.id, title: evt.title }); },
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: 'Delete ' + evt.title,
      hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    },
      React.createElement(Icon, { name: 'trash-2', size: 14, color: 'rgba(239,68,68,0.8)' })
    )
  );
};

var CalendarScreen = function () {
  var h = useCalendarScreen();
  var timeBlockRef = React.useRef(null);
  var tooltipCfg = getTooltipConfig('CalendarScreen');

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
      React.createElement(View, { style: styles.headerTitleWrap },
        React.createElement(Icon, { name: 'calendar', size: 18, color: COLORS.accent }),
        React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Calendar')
      ),
      React.createElement(View, { style: styles.headerRight },
        React.createElement(TouchableOpacity, { style: styles.todayBtn, onPress: h.goToday, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go to today' },
          React.createElement(Text, { style: styles.todayBtnText }, 'Today')
        ),
        React.createElement(TouchableOpacity, {
          style: styles.headerBtn,
          onPress: function () { h.setNewTitle(''); h.setAddEvt(true); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Add new task',
          hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
        },
          React.createElement(Icon, { name: 'plus', size: 20, color: COLORS.text })
        )
      )
    );
  };

  var renderQuickAccess = function () {
    return React.createElement(View, { style: styles.quickRow },
      React.createElement(TouchableOpacity, {
        ref: timeBlockRef,
        style: styles.quickCard,
        onPress: function () { h.navigation.navigate('TimeBlocks'); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Time Blocks',
      },
        React.createElement(Icon, { name: 'layout', size: 16, color: COLORS.accent }),
        React.createElement(Text, { style: styles.quickText }, 'Time Blocks')
      ),
      React.createElement(SubscriptionGate, { requiredPlan: 'premium', featureName: 'Google Calendar Sync', compact: true },
        React.createElement(TouchableOpacity, {
          style: styles.quickCard,
          onPress: function () { h.navigation.navigate('GoogleCalendarConnect'); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Google Calendar Sync',
        },
          React.createElement(Icon, { name: 'link', size: 16, color: COLORS.accent }),
          React.createElement(Text, { style: styles.quickText }, 'Google Sync')
        )
      )
    );
  };

  var renderMonthNav = function () {
    return React.createElement(View, { style: styles.monthNav },
      React.createElement(TouchableOpacity, { style: styles.navBtn, onPress: h.prevMonth, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Previous month', hitSlop: { top: 6, bottom: 6, left: 6, right: 6 } },
        React.createElement(Icon, { name: 'chevron-left', size: 20, color: COLORS.textSecondary })
      ),
      React.createElement(Text, { style: styles.monthLabel, accessibilityRole: 'header' }, h.MONTHS[h.viewM] + ' ' + h.viewY),
      React.createElement(TouchableOpacity, { style: styles.navBtn, onPress: h.nextMonth, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Next month', hitSlop: { top: 6, bottom: 6, left: 6, right: 6 } },
        React.createElement(Icon, { name: 'chevron-right', size: 20, color: COLORS.textSecondary })
      )
    );
  };

  var renderCalendarGrid = function () {
    return React.createElement(View, { style: styles.calendarCard },
      // Day headers
      React.createElement(View, { style: styles.dayHeaders },
        h.DAYS.map(function (d) {
          return React.createElement(View, { key: d, style: styles.dayHeaderCell },
            React.createElement(Text, { style: styles.dayHeaderText }, d)
          );
        })
      ),
      // Cells
      React.createElement(View, { style: styles.calGrid },
        h.cells.map(function (d, i) {
          if (d === null) return React.createElement(View, { key: 'e' + i, style: styles.calCell });
          var k = h.getKey(h.viewY, h.viewM, d);
          var hasEvt = h.events[k] && h.events[k].length > 0;
          var evtColors = (h.events[k] || []).slice(0, 3).map(function (e) { return e.color; });
          var evtCount = (h.events[k] || []).length;
          var cellLabel = d + (h.isToday(d) ? ', today' : '') + (h.isSel(d) ? ', selected' : '') + (evtCount > 0 ? ', ' + evtCount + ' event' + (evtCount > 1 ? 's' : '') : '');
          return React.createElement(TouchableOpacity, {
            key: d,
            style: [
              styles.calCell,
              h.isSel(d) && styles.calCellSel,
              h.isToday(d) && !h.isSel(d) && styles.calCellToday,
            ],
            onPress: function () { h.setSelDay(d); },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: cellLabel,
            accessibilityState: { selected: h.isSel(d) },
          },
            React.createElement(Text, {
              style: [
                styles.calCellText,
                h.isSel(d) && styles.calCellTextSel,
                h.isToday(d) && !h.isSel(d) && styles.calCellTextToday,
              ],
            }, String(d)),
            hasEvt
              ? React.createElement(View, { style: styles.evtDots },
                  evtColors.map(function (c, j) {
                    return React.createElement(View, { key: j, style: [styles.evtDot, { backgroundColor: c }] });
                  })
                )
              : null
          );
        })
      )
    );
  };

  var renderEvents = function () {
    if (h.isLoading) {
      return React.createElement(View, { style: { padding: 20, alignItems: 'center' }, accessibilityLiveRegion: 'polite' },
        React.createElement(ActivityIndicator, { size: 'small', color: COLORS.accent, accessibilityLabel: 'Loading events' })
      );
    }

    if (h.selDay === null) {
      // Show today + tomorrow
      return [
        { label: 'Today', evts: h.todayEvents, key: h.todayKey, isToday: true },
        { label: 'Tomorrow', evts: h.tomorrowEvents, key: h.tomorrowKey, isToday: false },
      ].map(function (item) {
        return React.createElement(View, { key: item.label, style: { marginBottom: 12 } },
          React.createElement(View, { style: styles.evtSectionHeader },
            React.createElement(View, { style: [styles.evtDotLabel, { backgroundColor: item.isToday ? h.BRAND.green : h.BRAND.purpleLight }] }),
            React.createElement(Text, { style: styles.evtSectionTitle, accessibilityRole: 'header' }, item.label),
            React.createElement(Text, { style: styles.evtCount }, item.evts.length + ' items')
          ),
          item.evts.length === 0
            ? React.createElement(View, { style: styles.noEventsCard },
                React.createElement(Text, { style: styles.noEventsText }, 'No tasks scheduled')
              )
            : item.evts.map(function (evt) {
                return React.createElement(EventCard, { key: evt.id, evt: evt, evtKey: item.key, h: h });
              })
        );
      });
    }

    // Selected day
    return React.createElement(View, null,
      React.createElement(View, { style: styles.evtSectionHeader },
        React.createElement(Text, { style: styles.evtSectionTitle, accessibilityRole: 'header' },
          h.isToday(h.selDay) ? 'Today' : new Date(h.viewY, h.viewM, h.selDay).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
        ),
        React.createElement(TouchableOpacity, { onPress: function () { h.setSelDay(null); }, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Clear date selection' },
          React.createElement(Text, { style: { fontSize: 12, color: COLORS.textTertiary } }, 'Clear')
        ),
        React.createElement(Text, { style: styles.evtCount }, h.selEvents.length + ' items')
      ),
      h.selEvents.length === 0
        ? React.createElement(View, { style: styles.noEventsCard },
            React.createElement(Icon, { name: 'calendar', size: 28, color: COLORS.textMuted }),
            React.createElement(Text, { style: styles.noEventsText }, 'No tasks for this day'),
            React.createElement(TouchableOpacity, {
              style: styles.addEvtSmallBtn,
              onPress: function () { h.setNewTitle(''); h.setAddEvt(true); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Add Task',
            },
              React.createElement(Icon, { name: 'plus', size: 12, color: COLORS.accent }),
              React.createElement(Text, { style: styles.addEvtSmallText }, 'Add Task')
            )
          )
        : h.selEvents.map(function (evt) {
            return React.createElement(EventCard, { key: evt.id, evt: evt, evtKey: h.selKey, h: h });
          })
    );
  };

  // Delete confirm modal
  var renderDeleteModal = function () {
    return React.createElement(Modal, {
      visible: !!h.confirmDel, transparent: true, animationType: 'fade',
      onRequestClose: function () { h.setConfirmDel(null); },
    },
      React.createElement(View, { style: styles.modalOverlay },
        React.createElement(View, { style: styles.modalContent, accessibilityViewIsModal: true },
          React.createElement(View, { style: styles.modalHeader },
            React.createElement(Icon, { name: 'trash-2', size: 18, color: 'rgba(239,68,68,0.8)' }),
            React.createElement(Text, { style: styles.modalTitle, accessibilityRole: 'header' }, 'Delete Task')
          ),
          React.createElement(Text, { style: styles.modalDesc },
            'Delete "' + (h.confirmDel ? h.confirmDel.title : '') + '"?'
          ),
          React.createElement(View, { style: styles.modalActions },
            React.createElement(TouchableOpacity, {
              style: styles.modalCancelBtn,
              onPress: function () { h.setConfirmDel(null); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Cancel',
            },
              React.createElement(Text, { style: styles.modalCancelText }, 'Cancel')
            ),
            React.createElement(TouchableOpacity, {
              style: styles.modalDeleteBtn,
              onPress: function () { if (h.confirmDel) h.deleteEvent(h.confirmDel.key, h.confirmDel.id); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Delete task',
            },
              React.createElement(Text, { style: styles.modalDeleteText }, 'Delete')
            )
          )
        )
      )
    );
  };

  // Add event modal
  var renderAddModal = function () {
    return React.createElement(Modal, {
      visible: h.addEvt, transparent: true, animationType: 'fade',
      onRequestClose: function () { h.setAddEvt(false); },
    },
      React.createElement(View, { style: styles.modalOverlay },
        React.createElement(View, { style: styles.modalContent, accessibilityViewIsModal: true },
          React.createElement(Text, { style: styles.modalTitle, accessibilityRole: 'header' }, 'New Task'),
          React.createElement(Text, { style: styles.modalLabel }, 'Title'),
          React.createElement(TextInput, {
            style: styles.modalInput,
            value: h.newTitle,
            onChangeText: h.setNewTitle,
            placeholder: 'Task name...',
            placeholderTextColor: COLORS.textMuted,
            autoFocus: true,
            accessible: true,
            accessibilityLabel: 'Task title',
          }),
          React.createElement(Text, { style: styles.modalLabel }, 'Date'),
          React.createElement(View, { style: styles.modalDateDisplay },
            React.createElement(Icon, { name: 'calendar', size: 14, color: COLORS.accent }),
            React.createElement(Text, { style: styles.modalDateText },
              new Date(h.viewY, h.viewM, h.selDay || h.TODAY.d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            )
          ),
          React.createElement(Text, { style: styles.modalLabel }, 'Time'),
          React.createElement(TextInput, {
            style: styles.modalInput,
            value: h.newTime,
            onChangeText: h.setNewTime,
            placeholder: '9:00 AM',
            placeholderTextColor: COLORS.textMuted,
            accessible: true,
            accessibilityLabel: 'Task time',
          }),
          React.createElement(View, { style: styles.modalActions },
            React.createElement(TouchableOpacity, {
              style: styles.modalCancelBtn,
              onPress: function () { h.setAddEvt(false); },
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Cancel',
            },
              React.createElement(Text, { style: styles.modalCancelText }, 'Cancel')
            ),
            React.createElement(TouchableOpacity, {
              style: [styles.modalSubmitBtn, !h.newTitle.trim() && { opacity: 0.5 }],
              onPress: h.handleAddEvt,
              disabled: !h.newTitle.trim(),
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Create task',
              accessibilityState: { disabled: !h.newTitle.trim() },
            },
              React.createElement(Text, { style: styles.modalSubmitText }, 'Create')
            )
          )
        )
      )
    );
  };

  var calendarHasError = h.tasksQuery.isError && h.todayQuery.isError;
  var calendarHasCache = calendarHasError && Object.keys(h.events).length > 0;
  if (calendarHasError && !calendarHasCache) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center' }, accessibilityLiveRegion: 'assertive' },
        React.createElement(Text, { style: { color: COLORS.red, fontSize: 14 }, accessibilityRole: 'alert' }, 'Failed to load calendar'),
        React.createElement(TouchableOpacity, {
          style: { marginTop: 16, padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.accent },
          onPress: function () { h.tasksQuery.refetch(); h.todayQuery.refetch(); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Retry loading calendar',
        },
          React.createElement(Text, { style: { color: '#fff', fontWeight: '600' } }, 'Retry')
        )
      )
    );
  }

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(ScrollView, {
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
    },
      renderHeader(),
      calendarHasCache ? React.createElement(OfflineDataBanner, null) : null,
      React.createElement(SubscriptionBanner, null),
      renderQuickAccess(),
      renderMonthNav(),
      renderCalendarGrid(),
      renderEvents()
    ),
    renderDeleteModal(),
    renderAddModal(),
    tooltipCfg
      ? React.createElement(OnboardingTooltip, {
          id: tooltipCfg.id,
          message: tooltipCfg.message,
          position: tooltipCfg.position,
          targetRef: timeBlockRef,
        })
      : null
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: 10 },
  headerBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accentSoft, backgroundColor: COLORS.accentSoft },
  todayBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.md },
  quickText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  navBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  calendarCard: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.lg, padding: 12, marginBottom: 16 },
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  dayHeaderText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm, gap: 3 },
  calCellSel: { backgroundColor: 'rgba(139,92,246,0.2)' },
  calCellToday: { backgroundColor: 'rgba(93,229,168,0.08)' },
  calCellText: { fontSize: 13, fontWeight: '400', color: COLORS.textPrimary },
  calCellTextSel: { color: COLORS.accent, fontWeight: '700' },
  calCellTextToday: { color: '#5DE5A8', fontWeight: '700' },
  evtDots: { flexDirection: 'row', gap: 2 },
  evtDot: { width: 4, height: 4, borderRadius: 2 },
  evtSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  evtDotLabel: { width: 8, height: 8, borderRadius: 4 },
  evtSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  evtCount: { fontSize: 11, color: COLORS.textSecondary },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.md, marginBottom: 8, gap: 12 },
  eventStrip: { width: 4, alignSelf: 'stretch', minHeight: 40, borderRadius: 2 },
  eventCheck: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: COLORS.glassBorderLight, alignItems: 'center', justifyContent: 'center' },
  eventCheckDone: { borderColor: '#5DE5A8', backgroundColor: 'rgba(93,229,168,0.2)' },
  eventTypeIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  eventTitleDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  eventTime: { fontSize: 12, color: COLORS.textSecondary },
  deadlineBadge: { paddingVertical: 1, paddingHorizontal: 6, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.12)' },
  deadlineText: { fontSize: 10, fontWeight: '700', color: COLORS.red },
  eventDream: { fontSize: 12, fontWeight: '500' },
  deleteBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.06)', alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  noEventsCard: { alignItems: 'center', padding: 20, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.md, marginBottom: 8, gap: 8 },
  noEventsText: { fontSize: 13, color: COLORS.textMuted },
  addEvtSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 14, borderRadius: RADIUS.sm, backgroundColor: COLORS.accentSoft },
  addEvtSmallText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', maxWidth: 380, backgroundColor: '#1A1A2E', borderRadius: RADIUS.xl, padding: SPACING.xxl, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  modalDesc: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20, marginBottom: SPACING.lg },
  modalLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  modalInput: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.md, padding: 10, fontSize: 14, color: COLORS.text, marginBottom: 12 },
  modalDateDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 12 },
  modalDateText: { fontSize: 14, color: COLORS.textPrimary },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modalDeleteBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.red, alignItems: 'center' },
  modalDeleteText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalSubmitBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.accent, alignItems: 'center' },
  modalSubmitText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

module.exports = CalendarScreen;
