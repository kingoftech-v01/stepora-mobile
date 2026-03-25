/**
 * CheckInScreen — Periodic dream check-in with questionnaire and AI coaching results.
 */
var React = require('react');
var {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useCheckInScreen = require('./useCheckInScreen');
var { COLORS, SPACING, RADIUS } = require('../../theme/tokens');

var CheckInScreen = function () {
  var h = useCheckInScreen();

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
      React.createElement(Text, { style: styles.headerTitle, accessibilityRole: 'header' }, 'Check-in'),
      React.createElement(View, { style: { width: 36 } })
    );
  };

  // Loading
  if (h.step === 'loading') {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap, accessibilityLiveRegion: 'polite' },
        React.createElement(ActivityIndicator, { size: 'large', color: COLORS.accent, accessibilityLabel: 'Loading check-in' }),
        React.createElement(Text, { style: styles.loadingText }, 'Loading...')
      )
    );
  }

  // Error
  if (h.step === 'error') {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap, accessibilityLiveRegion: 'assertive' },
        React.createElement(Text, { style: { color: COLORS.red, fontSize: 14 }, accessibilityRole: 'alert' }, 'Failed to load check-in'),
        React.createElement(TouchableOpacity, {
          style: styles.primaryBtn,
          onPress: function () { h.navigation.navigate('DreamDetail', { id: h.dreamId }); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Go Back',
        },
          React.createElement(Text, { style: styles.primaryBtnText }, 'Go Back')
        )
      )
    );
  }

  // Intro
  if (h.step === 'intro' && h.checkin) {
    var paceStatus = h.checkin.paceStatus;
    var pc = paceStatus ? (h.PACE_STYLES[paceStatus] || h.PACE_STYLES.on_track) : null;
    return React.createElement(SafeAreaView, { style: styles.container },
      React.createElement(ScrollView, { contentContainerStyle: styles.introContent },
        renderHeader(),
        React.createElement(View, { style: styles.introIconWrap },
          React.createElement(Icon, { name: 'activity', size: 36, color: '#C4B5FD' })
        ),
        React.createElement(Text, { style: styles.introTitle }, 'Time for a Check-in'),
        React.createElement(Text, { style: styles.introDesc },
          h.checkin.openingMessage || 'Let\'s review your progress and adjust your plan.'
        ),
        pc
          ? React.createElement(View, { style: [styles.paceCard, { backgroundColor: pc.bg, borderColor: pc.border }] },
              React.createElement(Icon, { name: 'trending-up', size: 18, color: pc.color }),
              React.createElement(View, { style: { flex: 1, marginLeft: 12 } },
                React.createElement(Text, { style: [styles.paceLabel, { color: pc.color }] }, pc.label),
                h.checkin.paceSummary ? React.createElement(Text, { style: styles.paceSummary }, h.checkin.paceSummary) : null
              )
            )
          : null,
        React.createElement(View, { style: styles.infoCard },
          React.createElement(Icon, { name: 'list', size: 16, color: COLORS.accent }),
          React.createElement(Text, { style: styles.infoText }, h.questions.length + ' questions'),
          React.createElement(Text, { style: styles.infoDuration }, '~' + Math.ceil(h.questions.length * 0.5) + ' min')
        ),
        React.createElement(TouchableOpacity, {
          style: styles.primaryBtn,
          onPress: function () { h.setStep('question'); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Begin Check-in',
        },
          React.createElement(Text, { style: styles.primaryBtnText }, 'Begin Check-in'),
          React.createElement(Icon, { name: 'chevron-right', size: 16, color: '#fff' })
        )
      )
    );
  }

  // Question
  if (h.step === 'question' && h.question) {
    return React.createElement(SafeAreaView, { style: styles.container },
      React.createElement(ScrollView, {
        contentContainerStyle: styles.scrollContent,
        keyboardShouldPersistTaps: 'handled',
      },
        renderHeader(),
        // Progress bar
        React.createElement(View, { style: styles.progressTrack },
          React.createElement(View, { style: [styles.progressFill, { width: h.progress + '%' }] })
        ),
        // Question card
        React.createElement(View, { style: [styles.questionCard, { opacity: h.cardAnim && h.mounted ? 1 : 0 }] },
          React.createElement(View, { style: styles.coachBadge },
            React.createElement(Icon, { name: 'cpu', size: 16, color: '#C4B5FD' }),
            React.createElement(Text, { style: styles.coachText }, 'AI COACH')
          ),
          React.createElement(Text, { style: styles.questionText }, h.question.text),
          // Choice
          h.question.type === 'choice'
            ? React.createElement(View, { style: { gap: 8 } },
                h.question.options.map(function (opt) {
                  var selected = h.answers[h.question.id] === opt;
                  return React.createElement(TouchableOpacity, {
                    key: opt,
                    style: [styles.choiceBtn, selected && styles.choiceBtnSelected],
                    onPress: function () { h.setAnswer(h.question.id, opt); },
                    accessible: true,
                    accessibilityRole: 'button',
                    accessibilityLabel: opt + (selected ? ', selected' : ''),
                    accessibilityState: { selected: selected },
                  },
                    React.createElement(Text, { style: [styles.choiceText, selected && styles.choiceTextSelected] }, opt)
                  );
                })
              )
            : null,
          // Text
          h.question.type === 'text'
            ? React.createElement(TextInput, {
                style: styles.textAnswer,
                value: h.answers[h.question.id] || '',
                onChangeText: function (val) { h.setAnswer(h.question.id, val); },
                multiline: true,
                placeholder: h.question.placeholder || 'Type your answer...',
                placeholderTextColor: COLORS.textMuted,
                textAlignVertical: 'top',
                accessible: true,
                accessibilityLabel: 'Your answer',
              })
            : null
        ),
        // Dots
        React.createElement(View, { style: styles.dotsRow },
          h.questions.map(function (q, i) {
            return React.createElement(View, {
              key: q.id,
              style: [styles.dot, i === h.currentQ && styles.dotActive, i < h.currentQ && styles.dotDone],
            });
          })
        ),
        React.createElement(TouchableOpacity, {
          style: [styles.primaryBtn, (!h.canProceed && h.question.isRequired) && { opacity: 0.5 }],
          onPress: h.handleNext,
          disabled: !h.canProceed && h.question.isRequired,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: h.currentQ >= h.questions.length - 1 ? 'Submit check-in' : 'Next question',
          accessibilityState: { disabled: !h.canProceed && h.question.isRequired },
        },
          React.createElement(Text, { style: styles.primaryBtnText },
            h.currentQ >= h.questions.length - 1 ? 'Submit' : 'Next'
          ),
          React.createElement(Icon, {
            name: h.currentQ >= h.questions.length - 1 ? 'check' : 'chevron-right',
            size: 16, color: '#fff',
          })
        ),
        !h.question.isRequired
          ? React.createElement(TouchableOpacity, { style: styles.skipLink, onPress: h.handleNext, accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Skip question' },
              React.createElement(Text, { style: styles.skipLinkText }, 'Skip')
            )
          : null
      )
    );
  }

  // Polling
  if (h.step === 'polling') {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderHeader(),
      React.createElement(View, { style: styles.centerWrap },
        React.createElement(View, { style: styles.pollingIcon },
          React.createElement(Icon, { name: 'star', size: 32, color: '#C4B5FD' })
        ),
        React.createElement(Text, { style: styles.pollingTitle }, 'Analyzing Your Responses'),
        React.createElement(Text, { style: styles.pollingDesc }, 'Our AI coach is reviewing your progress...'),
        React.createElement(View, { style: styles.infoCard },
          React.createElement(Icon, { name: 'clock', size: 14, color: COLORS.textMuted }),
          React.createElement(Text, { style: styles.infoText }, 'Safe to leave - processing continues in background')
        )
      )
    );
  }

  // Results
  if (h.step === 'results' && h.result) {
    var pace = h.result.paceStatus || 'on_track';
    var paceStyle = h.PACE_STYLES[pace] || h.PACE_STYLES.on_track;
    return React.createElement(SafeAreaView, { style: styles.container },
      React.createElement(ScrollView, { contentContainerStyle: styles.scrollContent },
        renderHeader(),
        // Pace badge
        React.createElement(View, { style: styles.paceBadgeWrap },
          React.createElement(View, { style: [styles.paceBadge, { backgroundColor: paceStyle.bg, borderColor: paceStyle.border }] },
            React.createElement(Icon, { name: 'trending-up', size: 18, color: paceStyle.color }),
            React.createElement(Text, { style: [styles.paceBadgeText, { color: paceStyle.color }] }, paceStyle.label)
          )
        ),
        // Coaching message
        h.result.coachingMessage
          ? React.createElement(View, { style: styles.coachingCard },
              React.createElement(View, { style: styles.coachingHeader },
                React.createElement(Icon, { name: 'star', size: 16, color: '#C4B5FD' }),
                React.createElement(Text, { style: styles.coachingLabel }, 'COACHING')
              ),
              React.createElement(Text, { style: styles.coachingText }, h.result.coachingMessage)
            )
          : null,
        // Stats
        React.createElement(View, { style: styles.statsRow },
          [
            { icon: 'target', value: h.result.tasksCreated || 0, label: 'Tasks Created', color: COLORS.accent },
            { icon: 'star', value: h.result.milestonesAdjusted || 0, label: 'Milestones', color: '#FCD34D' },
            { icon: 'zap', value: h.questions.length, label: 'Answered', color: '#5DE5A8' },
          ].map(function (s, i) {
            return React.createElement(View, { key: i, style: styles.statCard },
              React.createElement(Icon, { name: s.icon, size: 16, color: s.color }),
              React.createElement(Text, { style: styles.statValue }, String(s.value)),
              React.createElement(Text, { style: styles.statLabel }, s.label)
            );
          })
        ),
        React.createElement(TouchableOpacity, {
          style: styles.primaryBtn,
          onPress: function () { h.navigation.navigate('DreamDetail', { id: h.dreamId }); },
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Back to Dream',
        },
          React.createElement(Text, { style: styles.primaryBtnText }, 'Back to Dream')
        )
      )
    );
  }

  return null;
};

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bodyBg },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  introContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100, alignItems: 'center' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: 12, width: '100%' },
  headerBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  introIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, marginTop: 24 },
  introTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  introDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300, marginBottom: 24 },
  paceCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 16, width: '100%' },
  paceLabel: { fontSize: 13, fontWeight: '700' },
  paceSummary: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.md, marginBottom: 24, width: '100%' },
  infoText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  infoDuration: { fontSize: 12, color: COLORS.textMuted },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.accent, width: '100%' },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  progressTrack: { height: 3, backgroundColor: COLORS.glassBorder, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: '#8B5CF6' },
  questionCard: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 20, padding: 24, marginBottom: 16 },
  coachBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  coachText: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.5 },
  questionText: { fontSize: 16, fontWeight: '600', color: COLORS.text, lineHeight: 24, marginBottom: 20 },
  choiceBtn: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.cardBg },
  choiceBtnSelected: { borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.15)' },
  choiceText: { fontSize: 14, color: COLORS.text },
  choiceTextSelected: { fontWeight: '600', color: COLORS.accent },
  textAnswer: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 14, padding: 14, fontSize: 14, color: COLORS.text, minHeight: 100, lineHeight: 22 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.divider },
  dotActive: { width: 20, backgroundColor: COLORS.accent },
  dotDone: { backgroundColor: '#5DE5A8' },
  skipLink: { alignItems: 'center', paddingVertical: 10, marginTop: 8 },
  skipLinkText: { fontSize: 13, color: COLORS.textMuted },
  pollingIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', alignItems: 'center', justifyContent: 'center' },
  pollingTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  pollingDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  paceBadgeWrap: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  paceBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 16, borderWidth: 1 },
  paceBadgeText: { fontSize: 16, fontWeight: '700' },
  coachingCard: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.lg, padding: 20, marginBottom: 16 },
  coachingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  coachingLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.5 },
  coachingText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.md, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12 },
});

module.exports = CheckInScreen;
