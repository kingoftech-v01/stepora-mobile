/**
 * DreamCreateScreen — 3-step wizard for creating a new dream.
 * Step 0: Title + Description + AI categorize
 * Step 1: Category selection grid
 * Step 2: Timeframe / custom date picker
 */
var React = require('react');
var {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useDreamCreateScreen = require('./useDreamCreateScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');
var { BRAND } = require('../../styles/colors');
var SubscriptionGate = require('../../components/SubscriptionGate');

var DreamCreateScreen = function () {
  var h = useDreamCreateScreen();

  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.step > 0 ? h.setStep(h.step - 1) : h.navigateBack(); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: h.step > 0 ? 'Previous step' : 'Go back',
        hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Create Dream'),
      React.createElement(View, { style: { width: 36 } })
    );
  };

  var renderProgressBar = function () {
    return React.createElement(View, { style: styles.progressTrack, accessible: true, accessibilityRole: 'progressbar', accessibilityValue: { min: 0, max: 100, now: Math.min(h.progressPercent, 100) }, accessibilityLabel: 'Step ' + (h.step + 1) + ' of 3' },
      React.createElement(View, {
        style: [styles.progressFill, { width: Math.min(h.progressPercent, 100) + '%' }],
      })
    );
  };

  var renderStepTitle = function () {
    var titles = ['What\'s Your Dream?', 'Choose a Category', 'Set Your Timeframe'];
    var subtitles = ['Describe your dream in detail', 'Pick the area of life', 'How long do you need?'];
    return React.createElement(View, { style: styles.stepTitleWrap },
      React.createElement(Text, { style: styles.stepTitle, accessibilityRole: 'header' }, titles[h.step]),
      React.createElement(Text, { style: styles.stepSubtitle }, subtitles[h.step])
    );
  };

  // Step 0: Details
  var renderDetailsStep = function () {
    return React.createElement(View, null,
      React.createElement(Text, { style: styles.inputLabel }, 'Dream Title'),
      React.createElement(TextInput, {
        style: [styles.input, { fontSize: 18, fontWeight: '600', minHeight: 56 }],
        value: h.title,
        onChangeText: h.setTitle,
        placeholder: 'e.g., Learn to play guitar',
        placeholderTextColor: COLORS.textMuted,
        multiline: true,
        accessible: true,
        accessibilityLabel: 'Dream Title',
      }),
      React.createElement(Text, { style: [styles.inputLabel, { marginTop: 18 }] }, 'Description'),
      React.createElement(TextInput, {
        style: [styles.input, { minHeight: 100, textAlignVertical: 'top' }],
        value: h.description,
        onChangeText: h.setDescription,
        placeholder: 'Describe what you want to achieve...',
        placeholderTextColor: COLORS.textMuted,
        multiline: true,
        accessible: true,
        accessibilityLabel: 'Dream Description',
      }),
      // AI auto-categorize button — gated to premium
      React.createElement(SubscriptionGate, { requiredPlan: 'premium', featureName: 'AI Auto-Categorize', compact: true },
        React.createElement(TouchableOpacity, {
          style: [styles.aiBtn, (h.aiLoading || !h.title.trim() || h.description.trim().length < 10) && { opacity: 0.5 }],
          onPress: h.handleAutoCategorize,
          disabled: h.aiLoading || !h.title.trim() || h.description.trim().length < 10,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: h.aiLoading ? 'Analyzing dream category' : 'AI Auto-Categorize',
          accessibilityState: { disabled: h.aiLoading || !h.title.trim() || h.description.trim().length < 10, busy: !!h.aiLoading },
        },
          h.aiLoading
            ? React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purpleLight })
            : React.createElement(Icon, { name: 'zap', size: 16, color: BRAND.purpleLight }),
          React.createElement(Text, { style: styles.aiBtnText },
            h.aiLoading ? 'Analyzing...' : 'AI Auto-Categorize'
          )
        )
      ),
      h.aiError
        ? React.createElement(View, { style: styles.aiErrorBox, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' },
            React.createElement(Text, { style: styles.aiErrorText }, h.aiError)
          )
        : null,
      h.aiSuggestion && !h.aiLoading
        ? React.createElement(View, { style: styles.aiSuggestionBox },
            React.createElement(View, { style: styles.aiSuggestionHeader },
              React.createElement(Icon, { name: 'star', size: 14, color: BRAND.purpleLight }),
              React.createElement(Text, { style: styles.aiSuggestionTitle }, 'AI Suggestion'),
              React.createElement(View, {
                style: [styles.confidenceBadge, {
                  backgroundColor: h.aiSuggestion.confidence >= 0.8 ? 'rgba(16,185,129,0.15)' : 'rgba(252,211,77,0.15)',
                }],
              },
                React.createElement(Text, {
                  style: { fontSize: 10, fontWeight: '600', color: h.aiSuggestion.confidence >= 0.8 ? '#10B981' : '#FCD34D' },
                }, Math.round(h.aiSuggestion.confidence * 100) + '% confident')
              )
            ),
            React.createElement(TouchableOpacity, {
              style: styles.applyBtn,
              onPress: h.handleApplyAiCategory,
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Apply AI suggested category',
            },
              React.createElement(Icon, { name: 'check', size: 14, color: '#fff' }),
              React.createElement(Text, { style: styles.applyBtnText }, 'Apply Category')
            )
          )
        : null
    );
  };

  // Step 1: Categories
  var renderCategoryStep = function () {
    return React.createElement(View, { style: styles.categoryGrid },
      h.CATEGORIES.map(function (cat) {
        var isSelected = h.category === cat.id;
        var isAiRec = h.aiSuggestion && h.aiSuggestion.category === cat.id;
        return React.createElement(TouchableOpacity, {
          key: cat.id,
          style: [
            styles.categoryCard,
            isSelected && { borderColor: cat.color + '55' },
            isAiRec && !isSelected && { borderColor: 'rgba(139,92,246,0.3)' },
          ],
          onPress: function () { h.setCategory(cat.id); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: cat.label + (isSelected ? ', selected' : '') + (isAiRec && !isSelected ? ', AI recommended' : ''),
          accessibilityState: { selected: isSelected },
        },
          isSelected
            ? React.createElement(View, { style: [styles.catCheckmark, { backgroundColor: cat.color }] },
                React.createElement(Icon, { name: 'check', size: 12, color: '#fff' })
              )
            : null,
          isAiRec && !isSelected
            ? React.createElement(View, { style: styles.catAiBadge },
                React.createElement(Icon, { name: 'star', size: 8, color: BRAND.purpleLight }),
                React.createElement(Text, { style: styles.catAiText }, 'AI')
              )
            : null,
          React.createElement(View, {
            style: [styles.catIconWrap, { backgroundColor: cat.color + '18', borderColor: cat.color + '30' }],
          },
            React.createElement(Icon, { name: cat.icon, size: 22, color: cat.color })
          ),
          React.createElement(Text, { style: styles.catLabel }, cat.label)
        );
      })
    );
  };

  // Step 2: Timeframe
  var renderTimeframeStep = function () {
    return React.createElement(View, null,
      React.createElement(View, { style: styles.timeframeRow },
        h.TIMEFRAMES.map(function (tf) {
          var isSelected = h.timeframe === tf.id && !h.showCustom;
          return React.createElement(TouchableOpacity, {
            key: tf.id,
            style: [styles.timeframePill, isSelected && styles.timeframePillActive],
            onPress: function () { h.setTimeframe(tf.id); h.setShowCustom(false); },
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: tf.label + (isSelected ? ', selected' : ''),
            accessibilityState: { selected: isSelected },
          },
            React.createElement(Text, {
              style: [styles.timeframeText, isSelected && styles.timeframeTextActive],
            }, tf.label)
          );
        })
      ),
      // Custom date toggle
      React.createElement(TouchableOpacity, {
        style: styles.customDateBtn,
        onPress: function () { h.setShowCustom(!h.showCustom); if (!h.showCustom) h.setTimeframe(null); },
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: h.showCustom ? 'Hide calendar' : 'Pick a custom date',
      },
        React.createElement(Icon, { name: 'calendar', size: 16, color: BRAND.purpleLight }),
        React.createElement(Text, { style: styles.customDateText },
          h.showCustom ? 'Hide calendar' : 'Pick a custom date'
        )
      ),
      // Calendar
      h.showCustom
        ? React.createElement(View, { style: styles.calendarCard },
            // Month nav
            React.createElement(View, { style: styles.calMonthNav },
              React.createElement(TouchableOpacity, { onPress: h.handleCalPrev, style: styles.calNavBtn },
                React.createElement(Icon, { name: 'chevron-left', size: 16, color: COLORS.textSecondary })
              ),
              React.createElement(Text, { style: styles.calMonthLabel },
                h.MONTHS[h.calMonth] + ' ' + h.calYear
              ),
              React.createElement(TouchableOpacity, { onPress: h.handleCalNext, style: styles.calNavBtn },
                React.createElement(Icon, { name: 'chevron-right', size: 16, color: COLORS.textSecondary })
              )
            ),
            // Day headers
            React.createElement(View, { style: styles.calDayHeaders },
              h.DAYS_LABELS.map(function (d) {
                return React.createElement(View, { key: d, style: styles.calDayHeaderCell },
                  React.createElement(Text, { style: styles.calDayHeaderText }, d)
                );
              })
            ),
            // Day cells
            React.createElement(View, { style: styles.calGrid },
              h.getCalendarCells().map(function (cell, i) {
                var sel = !cell.outside && h.isSelectedDate(cell.day);
                var td = !cell.outside && h.isTodayDate(cell.day);
                var past = !cell.outside && h.isPastDate(cell.day);
                return React.createElement(TouchableOpacity, {
                  key: i,
                  disabled: cell.outside || past,
                  style: [
                    styles.calCell,
                    sel && styles.calCellSelected,
                    td && !sel && styles.calCellToday,
                  ],
                  onPress: function () { if (!cell.outside && !past) h.handleSelectDate(cell.day); },
                },
                  React.createElement(Text, {
                    style: [
                      styles.calCellText,
                      cell.outside && { color: COLORS.textMuted },
                      past && { color: COLORS.textMuted },
                      sel && { color: '#fff', fontWeight: '700' },
                      td && !sel && { color: BRAND.purpleLight },
                    ],
                  }, String(cell.day))
                );
              })
            ),
            h.customDate
              ? React.createElement(View, { style: styles.selectedDateBanner },
                  React.createElement(Icon, { name: 'calendar', size: 14, color: BRAND.purpleLight }),
                  React.createElement(Text, { style: styles.selectedDateText },
                    h.MONTHS[h.customDate.month] + ' ' + h.customDate.day + ', ' + h.customDate.year
                  )
                )
              : null
          )
        : null,
      // Timeframe info
      (h.timeframe || h.customDate)
        ? React.createElement(View, { style: styles.timeframeInfo },
            React.createElement(Icon, { name: 'clock', size: 16, color: BRAND.purpleLight }),
            React.createElement(Text, { style: styles.timeframeInfoText },
              'Estimated ' +
              (h.timeframe === '1m' ? '4 weeks' : h.timeframe === '3m' ? '12 weeks' : h.timeframe === '6m' ? '26 weeks' : h.timeframe === '1y' ? '52 weeks' : 'custom period') +
              ' to achieve'
            )
          )
        : null
    );
  };

  var renderValidation = function () {
    if (!h.touched[h.step]) return null;
    var msg = h.getValidationMessage(h.step);
    if (!msg) return null;
    return React.createElement(View, { style: styles.validationBox, accessibilityLiveRegion: 'polite', accessibilityRole: 'alert' },
      React.createElement(Text, { style: styles.validationText }, msg)
    );
  };

  var renderServerError = function () {
    if (!h.serverError || h.step !== 2) return null;
    return React.createElement(View, { style: styles.serverErrorBox, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' },
      React.createElement(Text, { style: styles.serverErrorText }, h.serverError)
    );
  };

  var renderNavButtons = function () {
    return React.createElement(View, { style: styles.navButtons },
      h.step > 0
        ? React.createElement(TouchableOpacity, {
            style: styles.backButton,
            onPress: function () { h.setStep(h.step - 1); },
            disabled: h.submitting,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Back',
          },
            React.createElement(Icon, { name: 'arrow-left', size: 16, color: COLORS.text }),
            React.createElement(Text, { style: styles.backButtonText }, 'Back')
          )
        : null,
      React.createElement(TouchableOpacity, {
        style: [styles.nextButton, (!h.canNext() || h.submitting) && { opacity: 0.5 }],
        onPress: h.handleNext,
        disabled: !h.canNext() || h.submitting,
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: h.step === 2 ? 'Create Dream' : 'Next step',
        accessibilityState: { disabled: !h.canNext() || !!h.submitting, busy: !!h.submitting },
      },
        h.submitting
          ? React.createElement(ActivityIndicator, { size: 'small', color: '#fff' })
          : React.createElement(Text, { style: styles.nextButtonText },
              h.step === 2 ? 'Create Dream' : 'Next'
            ),
        !h.submitting && h.step < 2
          ? React.createElement(Icon, { name: 'arrow-right', size: 16, color: '#fff' })
          : null,
        !h.submitting && h.step === 2
          ? React.createElement(Icon, { name: 'star', size: 16, color: '#fff' })
          : null
      )
    );
  };

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(ScrollView, {
      style: styles.scroll,
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
      keyboardShouldPersistTaps: 'handled',
    },
      renderHeader(),
      renderProgressBar(),
      renderStepTitle(),
      h.step === 0 ? renderDetailsStep() : null,
      h.step === 1 ? renderCategoryStep() : null,
      h.step === 2 ? renderTimeframeStep() : null,
      renderValidation(),
      renderServerError(),
      renderNavButtons()
    )
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: COLORS.glassBorder, marginBottom: 28, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: BRAND.purple },
  stepTitleWrap: { marginBottom: 24 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  stepSubtitle: { fontSize: 14, color: COLORS.textTertiary, marginTop: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.lg, padding: 14, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  aiBtnText: { fontSize: 14, fontWeight: '600', color: BRAND.purpleLight },
  aiErrorBox: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
  aiErrorText: { fontSize: 13, color: '#F87171' },
  aiSuggestionBox: { marginTop: 14, padding: 16, borderRadius: 16, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  aiSuggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiSuggestionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1 },
  confidenceBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.accent },
  applyBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { width: '47%', backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 20, padding: 20, alignItems: 'center', gap: 12 },
  catCheckmark: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  catAiBadge: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  catAiText: { fontSize: 9, fontWeight: '700', color: BRAND.purpleLight },
  catIconWrap: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  timeframeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  timeframePill: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 50, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.glassBorder },
  timeframePillActive: { backgroundColor: BRAND.purple, borderColor: 'rgba(139,92,246,0.5)' },
  timeframeText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  timeframeTextActive: { color: '#fff' },
  customDateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  customDateText: { fontSize: 14, color: BRAND.purpleLight, fontWeight: '500' },
  calendarCard: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.xl, padding: 16, marginBottom: 16 },
  calMonthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  calNavBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  calMonthLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  calDayHeaders: { flexDirection: 'row', marginBottom: 6 },
  calDayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  calDayHeaderText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  calCellSelected: { backgroundColor: BRAND.purple },
  calCellToday: { backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  calCellText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  selectedDateBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 10, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)' },
  selectedDateText: { fontSize: 13, color: BRAND.purpleLight, fontWeight: '600' },
  timeframeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, padding: 14, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)' },
  timeframeInfoText: { fontSize: 13, color: COLORS.textSecondary },
  validationBox: { marginTop: 16, padding: 10, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
  validationText: { fontSize: 13, color: '#F87171', fontWeight: '500' },
  serverErrorBox: { marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  serverErrorText: { fontSize: 13, color: COLORS.red, lineHeight: 20 },
  navButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder },
  backButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  nextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: BRAND.purple },
  nextButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

module.exports = DreamCreateScreen;
