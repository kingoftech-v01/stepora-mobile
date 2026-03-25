/**
 * CalibrationScreen — AI-powered calibration questions for dream plan generation.
 */
var React = require('react');
var {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useCalibrationScreen = require('./useCalibrationScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');

var CalibrationScreen = function () {
  var h = useCalibrationScreen();

  var renderHeader = function () {
    return React.createElement(View, { style: styles.header },
      React.createElement(TouchableOpacity, {
        style: styles.headerBtn,
        onPress: function () { h.navigation.goBack(); },
        accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Go back', hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
      },
        React.createElement(Icon, { name: 'arrow-left', size: 22, color: COLORS.text })
      ),
      React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Calibration'),
      React.createElement(View, { style: { width: 36 } })
    );
  };

  var renderProgressBar = function () {
    return React.createElement(View, { style: styles.progressTrack, accessible: true, accessibilityRole: 'progressbar', accessibilityLabel: 'Calibration progress ' + Math.round(h.progress) + '%', accessibilityValue: { min: 0, max: 100, now: Math.round(h.progress) } },
      React.createElement(View, { style: [styles.progressFill, { width: h.progress + '%' }] })
    );
  };

  // Loading state
  if (h.loadingQuestions) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap, accessibilityLiveRegion: 'polite' },
        React.createElement(View, { style: styles.loadingIcon },
          React.createElement(ActivityIndicator, { size: 'large', color: h.BRAND.purpleLight, accessibilityLabel: 'Preparing calibration' })
        ),
        React.createElement(Text, { style: styles.loadingText }, 'Preparing calibration...')
      )
    );
  }

  // Completed state
  if (h.completed) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(ScrollView, { contentContainerStyle: styles.centerContent },
        React.createElement(View, { style: styles.completedIcon },
          React.createElement(Icon, { name: 'star', size: 40, color: h.BRAND.purpleLight })
        ),
        React.createElement(Text, { style: styles.completedTitle, accessibilityRole: 'header' },
          h.generatingPlan ? 'Generating Your Plan...' : h.planError ? 'Plan Generation Failed' : 'Calibration Complete!'
        ),
        React.createElement(Text, { style: [styles.completedDesc, h.planError && { color: '#EF4444' }], accessibilityLiveRegion: 'polite', accessibilityRole: h.planError ? 'alert' : undefined },
          h.generatingPlan ? (h.planMessage || 'Our AI is building your personalized plan...') :
          h.planError ? h.planError : 'Your personalized plan is ready!'
        ),
        h.generatingPlan
          ? React.createElement(View, { style: styles.safeLeaveBox },
              React.createElement(Icon, { name: 'shield', size: 18, color: '#10B981' }),
              React.createElement(Text, { style: styles.safeLeaveText }, 'Safe to leave - your plan is generating in the background')
            )
          : null,
        // Stats
        React.createElement(View, { style: styles.statsRow },
          [
            { icon: 'target', label: 'Goals', value: h.planResult ? String(h.planResult.goals ? h.planResult.goals.length || h.planResult.goals : '--') : '--', color: '#8B5CF6' },
            { icon: 'zap', label: 'Tasks', value: h.planResult && h.planResult.tasks ? String(h.planResult.tasks) : '--', color: '#FCD34D' },
            { icon: 'star', label: 'Answered', value: String(Object.keys(h.answers).length || h.calibrationCount) + '/' + String(h.questions.length || h.calibrationCount), color: '#10B981' },
          ].map(function (s, i) {
            return React.createElement(View, { key: i, style: styles.statCard },
              React.createElement(Icon, { name: s.icon, size: 18, color: s.color }),
              React.createElement(Text, { style: styles.statValue }, s.value),
              React.createElement(Text, { style: styles.statLabel }, s.label)
            );
          })
        ),
        h.planError
          ? React.createElement(TouchableOpacity, {
              style: styles.primaryBtn,
              onPress: h.handleCalibrationComplete,
              disabled: h.generatingPlan,
              accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Retry plan generation', accessibilityState: { disabled: h.generatingPlan },
            },
              React.createElement(Text, { style: styles.primaryBtnText }, 'Retry Plan Generation')
            )
          : null,
        React.createElement(TouchableOpacity, {
          style: [styles.primaryBtn, h.planError && { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder }],
          onPress: function () { h.navigation.navigate(h.id ? 'DreamDetail' : 'DreamsList', h.id ? { id: h.id } : {}); },
          disabled: h.generatingPlan,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: h.generatingPlan ? 'Generating plan' : h.planError ? 'Go to dream' : 'View your plan', accessibilityState: { disabled: h.generatingPlan },
        },
          React.createElement(Text, { style: [styles.primaryBtnText, h.planError && { color: COLORS.text }] },
            h.generatingPlan ? 'Generating...' : h.planError ? 'Go to Dream' : 'View Your Plan'
          )
        )
      )
    );
  }

  // Question state
  if (!h.question) return null;

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(ScrollView, {
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
      keyboardShouldPersistTaps: 'handled',
    },
      renderHeader(),
      renderProgressBar(),
      // Question card
      React.createElement(View, {
        style: [styles.questionCard, { opacity: h.cardAnim && h.mounted ? 1 : 0 }],
      },
        React.createElement(View, { style: styles.botIcon },
          React.createElement(Icon, { name: 'cpu', size: 28, color: h.BRAND.purpleLight })
        ),
        React.createElement(Text, { style: styles.questionText, accessibilityRole: 'header' }, h.question.text),
        // Choice options
        h.question.type === 'choice'
          ? React.createElement(View, { style: styles.optionsList },
              h.question.options.map(function (option, i) {
                var isSelected = h.selectedOption === option;
                return React.createElement(TouchableOpacity, {
                  key: i,
                  style: [styles.optionBtn, isSelected && styles.optionBtnSelected],
                  onPress: function () { h.handleSelect(option); },
                  accessible: true, accessibilityRole: 'button', accessibilityLabel: option, accessibilityState: { selected: isSelected },
                },
                  React.createElement(Text, {
                    style: [styles.optionText, isSelected && styles.optionTextSelected],
                  }, option),
                  isSelected
                    ? React.createElement(View, { style: styles.optionCheck },
                        React.createElement(Icon, { name: 'check', size: 13, color: h.BRAND.purpleLight })
                      )
                    : null
                );
              })
            )
          : React.createElement(TextInput, {
              style: styles.textAnswer,
              value: h.textValue,
              onChangeText: h.setTextValue,
              placeholder: h.question.placeholder || 'Type your answer...',
              placeholderTextColor: COLORS.textMuted,
              multiline: true,
              textAlignVertical: 'top',
              accessibilityLabel: 'Your answer',
            })
      ),
      // Step dots
      React.createElement(View, { style: styles.dotsRow, accessible: true, accessibilityRole: 'progressbar', accessibilityLabel: 'Question ' + (h.currentQ + 1) + ' of ' + h.questions.length, accessibilityValue: { min: 1, max: h.questions.length, now: h.currentQ + 1 } },
        h.questions.map(function (_, i) {
          return React.createElement(View, {
            key: i,
            style: [
              styles.dot,
              i === h.currentQ && styles.dotActive,
              i < h.currentQ && styles.dotDone,
            ],
            importantForAccessibility: 'no',
          });
        })
      ),
      // Navigation
      React.createElement(View, { style: styles.navRow },
        React.createElement(TouchableOpacity, { style: styles.skipBtn, onPress: h.handleSkip, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Skip this question' },
          React.createElement(Icon, { name: 'skip-forward', size: 14, color: COLORS.textSecondary }),
          React.createElement(Text, { style: styles.skipText }, 'Skip')
        ),
        React.createElement(TouchableOpacity, {
          style: [styles.nextBtn, (!h.canProceed || h.submittingAnswer) && { opacity: 0.5 }],
          onPress: h.handleNext,
          disabled: !h.canProceed || h.submittingAnswer,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: h.submittingAnswer ? 'Submitting' : h.currentQ === h.questions.length - 1 ? 'Complete calibration' : 'Next question', accessibilityState: { disabled: !h.canProceed || h.submittingAnswer },
        },
          h.submittingAnswer
            ? React.createElement(ActivityIndicator, { size: 'small', color: '#fff' })
            : React.createElement(Text, { style: styles.nextBtnText },
                h.currentQ === h.questions.length - 1 ? 'Complete' : 'Next'
              ),
          !h.submittingAnswer
            ? React.createElement(Icon, { name: 'chevron-right', size: 16, color: '#fff' })
            : null
        )
      )
    )
  );
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 400 },
  centerContent: { alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  progressTrack: { height: 4, backgroundColor: COLORS.glassBorder, borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 2 },
  loadingIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  loadingText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  completedIcon: { width: 90, height: 90, borderRadius: 28, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  completedTitle: { fontSize: 26, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  completedDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300, marginBottom: 32 },
  safeLeaveBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', marginBottom: 24, maxWidth: 360, width: '100%' },
  safeLeaveText: { fontSize: 13, color: '#10B981', fontWeight: '500', flex: 1, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32, width: '100%', maxWidth: 360 },
  statCard: { flex: 1, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textTertiary },
  primaryBtn: { width: '100%', maxWidth: 360, paddingVertical: 16, borderRadius: 16, backgroundColor: COLORS.accent, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  questionCard: { marginTop: 24, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 24, padding: 28 },
  botIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  questionText: { fontSize: 20, fontWeight: '700', color: COLORS.text, lineHeight: 28, marginBottom: 24 },
  optionsList: { gap: 10 },
  optionBtn: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionBtnSelected: { borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.15)' },
  optionText: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  optionTextSelected: { fontWeight: '600', color: COLORS.text },
  optionCheck: { width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(139,92,246,0.3)', alignItems: 'center', justifyContent: 'center' },
  textAnswer: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 14, padding: 14, fontSize: 14, color: COLORS.text, minHeight: 120, lineHeight: 22 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.glassBorder },
  dotActive: { width: 24, backgroundColor: '#8B5CF6' },
  dotDone: { backgroundColor: '#8B5CF6' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  skipText: { fontSize: 13, color: COLORS.textSecondary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 20, borderRadius: RADIUS.md, backgroundColor: COLORS.accent },
  nextBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

module.exports = CalibrationScreen;
