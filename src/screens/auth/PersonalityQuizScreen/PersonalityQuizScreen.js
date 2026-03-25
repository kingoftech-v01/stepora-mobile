/**
 * PersonalityQuizScreen — Multi-step personality assessment quiz.
 * Shows progress bar, question cards with option selection,
 * and a results screen with personality type details.
 */
var React = require('react');
var {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} = require('react-native');
var { SafeAreaView } = require('react-native-safe-area-context');
var Icon = require('react-native-vector-icons/Feather').default;
var usePersonalityQuizScreen = require('./usePersonalityQuizScreen');
var { COLORS, SPACING, RADIUS } = require('../../../theme/tokens');
var { BRAND } = require('../../../styles/colors');

var { width: SCREEN_WIDTH } = Dimensions.get('window');

var PersonalityQuizScreen = function () {
  var h = usePersonalityQuizScreen();

  // ─── Progress bar ────────────────────────────────────
  var renderProgressBar = function () {
    return React.createElement(View, { style: styles.progressWrap },
      React.createElement(View, { style: styles.progressHeader },
        h.currentQ > 0 && !h.showResult
          ? React.createElement(TouchableOpacity, {
              style: styles.progressBackBtn,
              onPress: h.goBack,
              activeOpacity: 0.7,
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Go back to previous question',
              hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
            },
              React.createElement(Icon, { name: 'arrow-left', size: 18, color: COLORS.text })
            )
          : React.createElement(View, { style: { width: 36 } }),
        React.createElement(Text, { style: styles.progressLabel },
          h.showResult ? 'Results' : 'Question ' + (h.currentQ + 1) + ' of ' + h.totalQuestions
        ),
        React.createElement(View, { style: { width: 36 } })
      ),
      React.createElement(View, { style: styles.progressBarBg, accessible: true, accessibilityRole: 'progressbar', accessibilityValue: { min: 0, max: 100, now: h.showResult ? 100 : h.progress }, accessibilityLabel: h.showResult ? 'Quiz complete' : 'Question ' + (h.currentQ + 1) + ' of ' + h.totalQuestions },
        React.createElement(View, {
          style: [
            styles.progressBarFill,
            { width: (h.showResult ? 100 : h.progress) + '%' },
          ],
        })
      )
    );
  };

  // ─── Loading state (quiz submitting) ─────────────────
  if (h.loading && !h.showResult) {
    return React.createElement(SafeAreaView, { style: styles.container },
      renderProgressBar(),
      React.createElement(View, { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
        React.createElement(View, { style: styles.loadingIcon, importantForAccessibility: 'no' },
          React.createElement(Text, { style: { fontSize: 40 } }, '\u2728')
        ),
        React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple, accessibilityLabel: 'Analyzing your personality' }),
        React.createElement(Text, { style: styles.loadingText }, 'Analyzing your personality...'),
        React.createElement(Text, { style: styles.loadingSubtext }, 'This will take just a moment')
      )
    );
  }

  // ─── Results screen ──────────────────────────────────
  if (h.showResult) {
    var cfg = h.cfg;
    return React.createElement(SafeAreaView, { style: styles.container },
      renderProgressBar(),
      React.createElement(ScrollView, {
        style: styles.scroll,
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
      },
        // Type icon
        React.createElement(View, {
          style: [styles.resultIconWrap, { backgroundColor: cfg.color + '20', borderColor: cfg.color + '40' }],
        },
          React.createElement(Icon, { name: cfg.icon, size: 36, color: cfg.color })
        ),
        // Title
        React.createElement(Text, { style: [styles.resultTitle, { color: cfg.color }], accessibilityRole: 'header' }, cfg.title),
        React.createElement(Text, { style: styles.resultDesc }, cfg.description),
        // Traits
        React.createElement(View, { style: styles.traitsWrap },
          React.createElement(Text, { style: styles.traitsLabel, accessibilityRole: 'header' }, 'Your Key Traits'),
          cfg.traits.map(function (trait, idx) {
            return React.createElement(View, {
              key: idx,
              style: styles.traitRow,
            },
              React.createElement(View, {
                style: [styles.traitDot, { backgroundColor: cfg.color }],
              }),
              React.createElement(Text, { style: styles.traitText }, trait)
            );
          })
        ),
        // Stats from result
        h.result && h.result.percentile
          ? React.createElement(View, { style: styles.statCard },
              React.createElement(Icon, { name: 'bar-chart-2', size: 16, color: BRAND.purple }),
              React.createElement(Text, { style: styles.statText },
                'Top ' + h.result.percentile + '% of dreamers share your type'
              )
            )
          : null,
        // Error
        h.error
          ? React.createElement(View, { style: styles.errorBox, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' },
              React.createElement(Text, { style: styles.errorText }, h.error)
            )
          : null
      ),
      // Continue button
      React.createElement(View, { style: styles.footer },
        React.createElement(TouchableOpacity, {
          style: [styles.continueBtn, { backgroundColor: cfg.color }],
          onPress: h.handleContinue,
          activeOpacity: 0.8,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Start Your Journey',
        },
          React.createElement(View, { style: styles.continueBtnContent },
            React.createElement(Text, { style: styles.continueBtnText }, 'Start Your Journey'),
            React.createElement(Icon, { name: 'arrow-right', size: 18, color: '#fff' })
          )
        )
      )
    );
  }

  // ─── Question screen ─────────────────────────────────
  var question = h.question;
  if (!question) return null;

  return React.createElement(SafeAreaView, { style: styles.container },
    renderProgressBar(),
    React.createElement(ScrollView, {
      style: styles.scroll,
      contentContainerStyle: styles.questionScrollContent,
      showsVerticalScrollIndicator: false,
    },
      // Question text
      React.createElement(View, { style: styles.questionWrap },
        React.createElement(View, { style: styles.questionNumberBadge },
          React.createElement(Text, { style: styles.questionNumber }, h.currentQ + 1 + '')
        ),
        React.createElement(Text, { style: styles.questionText, accessibilityRole: 'header' }, question.question)
      ),
      // Options
      React.createElement(View, { style: styles.optionsWrap },
        question.options.map(function (option, idx) {
          var isSelected = h.answers[h.currentQ] === idx;
          return React.createElement(TouchableOpacity, {
            key: idx,
            style: [
              styles.optionCard,
              isSelected && styles.optionCardSelected,
            ],
            onPress: function () { h.handleAnswer(idx); },
            activeOpacity: 0.7,
            disabled: h.loading,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: option.text + (isSelected ? ', selected' : ''),
            accessibilityState: { selected: isSelected, disabled: h.loading },
          },
            React.createElement(View, {
              style: [
                styles.optionIconWrap,
                isSelected && styles.optionIconWrapSelected,
              ],
            },
              React.createElement(Icon, {
                name: option.icon,
                size: 20,
                color: isSelected ? '#fff' : COLORS.textSecondary,
              })
            ),
            React.createElement(Text, {
              style: [
                styles.optionText,
                isSelected && styles.optionTextSelected,
              ],
            }, option.text),
            isSelected
              ? React.createElement(Icon, { name: 'check', size: 18, color: BRAND.purple })
              : null
          );
        })
      ),
      // Error
      h.error
        ? React.createElement(View, { style: styles.errorBox, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' },
            React.createElement(Text, { style: styles.errorText }, h.error)
          )
        : null
    )
  );
};

// ─── Styles ─────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  questionScrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Progress
  progressWrap: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.purple,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Question
  questionWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  questionNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.purple + '20',
    borderWidth: 1,
    borderColor: BRAND.purple + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.purple,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  // Options
  optionsWrap: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 14,
  },
  optionCardSelected: {
    backgroundColor: BRAND.purple + '15',
    borderColor: BRAND.purple + '40',
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrapSelected: {
    backgroundColor: BRAND.purple,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  optionTextSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },

  // Result
  resultIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  resultDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28,
    maxWidth: 340,
  },

  // Traits
  traitsWrap: {
    width: '100%',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 16,
  },
  traitsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 14,
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  traitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  traitText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Stat
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: 14,
    width: '100%',
  },
  statText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Footer
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  continueBtn: {
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 19,
  },
});

module.exports = PersonalityQuizScreen;
