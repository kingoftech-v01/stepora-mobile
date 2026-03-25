/**
 * OnboardingScreen — Multi-step onboarding flow (5 steps).
 * Step 1: Welcome + name input
 * Step 2: Avatar selection/upload
 * Step 3: Interest/category selection
 * Step 4: Notification permission request
 * Step 5: Subscription plan selection (redirect)
 */
var React = require('react');
var {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { SafeAreaView } = require('react-native-safe-area-context');
var useOnboardingScreen = require('./useOnboardingScreen');
var { COLORS, SPACING, RADIUS } = require('../../../theme/tokens');
var { BRAND } = require('../../../styles/colors');
var { dark } = require('../../../styles/theme');

var { width: SCREEN_WIDTH } = Dimensions.get('window');

var OnboardingScreen = function () {
  var h = useOnboardingScreen();

  // ─── Step Indicator ──────────────────────────────────────────

  var renderStepIndicator = function () {
    var dots = [];
    for (var i = 1; i <= h.totalSteps; i++) {
      dots.push(
        React.createElement(View, {
          key: i,
          style: [
            styles.dot,
            i === h.step && styles.dotActive,
            i < h.step && styles.dotCompleted,
          ],
        })
      );
    }
    return React.createElement(View, { style: styles.stepRow, accessible: true, accessibilityRole: 'progressbar', accessibilityValue: { min: 1, max: h.totalSteps, now: h.step }, accessibilityLabel: 'Step ' + h.step + ' of ' + h.totalSteps },
      React.createElement(Text, { style: styles.stepLabel, accessible: false },
        'Step ' + h.step + ' of ' + h.totalSteps
      ),
      React.createElement(View, { style: styles.dotsRow, importantForAccessibility: 'no-hide-descendants' }, dots)
    );
  };

  // ─── Step 1: Welcome + Name ──────────────────────────────────

  var renderStep1 = function () {
    return React.createElement(View, { style: styles.stepContent },
      React.createElement(View, { style: styles.iconCircle },
        React.createElement(Text, { style: styles.iconEmoji }, '\u2728')
      ),
      React.createElement(Text, { style: styles.stepTitle, accessibilityRole: 'header' }, 'Welcome to Stepora!'),
      React.createElement(Text, { style: styles.stepDesc },
        'Let\'s personalize your experience. What should we call you?'
      ),
      React.createElement(View, { style: styles.inputWrap },
        React.createElement(Text, { style: styles.inputLabel }, 'Your name'),
        React.createElement(TextInput, {
          style: styles.input,
          placeholder: 'Enter your name',
          placeholderTextColor: COLORS.textMuted,
          value: h.displayName,
          onChangeText: h.setDisplayName,
          autoCapitalize: 'words',
          autoFocus: true,
          returnKeyType: 'done',
          onSubmitEditing: h.goNext,
          accessible: true,
          accessibilityLabel: 'Your name',
          textContentType: 'name',
          autoComplete: 'name',
        })
      ),
      h.error ? React.createElement(View, { style: styles.errorBox, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' },
        React.createElement(Text, { style: styles.errorText }, h.error)
      ) : null
    );
  };

  // ─── Step 2: Avatar ──────────────────────────────────────────

  var renderStep2 = function () {
    return React.createElement(View, { style: styles.stepContent },
      React.createElement(View, { style: styles.iconCircle },
        React.createElement(Text, { style: styles.iconEmoji }, '\uD83D\uDCF7')
      ),
      React.createElement(Text, { style: styles.stepTitle, accessibilityRole: 'header' }, 'Add a Profile Photo'),
      React.createElement(Text, { style: styles.stepDesc },
        'Help others recognize you. You can always change this later.'
      ),
      // Avatar preview
      React.createElement(View, { style: styles.avatarWrap, accessible: true, accessibilityRole: 'image', accessibilityLabel: h.avatarUri ? 'Selected profile photo' : 'No profile photo selected' },
        h.avatarUri
          ? React.createElement(Image, {
              source: { uri: h.avatarUri },
              style: styles.avatarImage,
              accessible: false,
            })
          : React.createElement(View, { style: styles.avatarPlaceholder, accessible: false },
              React.createElement(Icon, { name: 'user', size: 48, color: COLORS.textMuted })
            )
      ),
      // Action buttons
      React.createElement(View, { style: styles.avatarActions },
        React.createElement(TouchableOpacity, {
          style: styles.avatarBtn,
          onPress: h.handlePickAvatar,
          activeOpacity: 0.7,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Choose photo from gallery',
        },
          React.createElement(Icon, { name: 'image', size: 20, color: BRAND.purple }),
          React.createElement(Text, { style: styles.avatarBtnText }, 'Gallery')
        ),
        React.createElement(TouchableOpacity, {
          style: styles.avatarBtn,
          onPress: h.handleTakePhoto,
          activeOpacity: 0.7,
          accessible: true,
          accessibilityRole: 'button',
          accessibilityLabel: 'Take photo with camera',
        },
          React.createElement(Icon, { name: 'camera', size: 20, color: BRAND.purple }),
          React.createElement(Text, { style: styles.avatarBtnText }, 'Camera')
        )
      ),
      h.error ? React.createElement(View, { style: styles.errorBox, accessibilityLiveRegion: 'assertive', accessibilityRole: 'alert' },
        React.createElement(Text, { style: styles.errorText }, h.error)
      ) : null
    );
  };

  // ─── Step 3: Interests ──────────────────────────────────────

  var renderStep3 = function () {
    return React.createElement(View, { style: styles.stepContent },
      React.createElement(View, { style: styles.iconCircle },
        React.createElement(Text, { style: styles.iconEmoji }, '\uD83C\uDFAF')
      ),
      React.createElement(Text, { style: styles.stepTitle, accessibilityRole: 'header' }, 'What are you into?'),
      React.createElement(Text, { style: styles.stepDesc },
        'Select up to 5 interests to personalize your dream suggestions.'
      ),
      React.createElement(View, { style: styles.interestsGrid },
        h.INTEREST_OPTIONS.map(function (opt) {
          var isSelected = h.selectedInterests.indexOf(opt.key) !== -1;
          return React.createElement(TouchableOpacity, {
            key: opt.key,
            style: [
              styles.interestChip,
              isSelected && styles.interestChipActive,
            ],
            onPress: function () { h.toggleInterest(opt.key); },
            activeOpacity: 0.7,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: opt.label + (isSelected ? ', selected' : ''),
            accessibilityState: { selected: isSelected },
          },
            React.createElement(Text, { style: styles.interestEmoji }, opt.emoji),
            React.createElement(Text, {
              style: [
                styles.interestLabel,
                isSelected && styles.interestLabelActive,
              ],
            }, opt.label),
            isSelected
              ? React.createElement(Icon, {
                  name: 'check',
                  size: 14,
                  color: '#fff',
                  style: { marginLeft: 4 },
                })
              : null
          );
        })
      ),
      React.createElement(Text, { style: styles.counterText, accessibilityLiveRegion: 'polite' },
        h.selectedInterests.length + '/5 selected'
      )
    );
  };

  // ─── Step 4: Notifications ──────────────────────────────────

  var renderStep4 = function () {
    return React.createElement(View, { style: styles.stepContent },
      React.createElement(View, { style: styles.iconCircle },
        React.createElement(Text, { style: styles.iconEmoji }, '\uD83D\uDD14')
      ),
      React.createElement(Text, { style: styles.stepTitle, accessibilityRole: 'header' }, 'Stay on Track'),
      React.createElement(Text, { style: styles.stepDesc },
        'Enable notifications to receive reminders, check-ins, and encouragement from your dream buddies.'
      ),
      // Benefits list
      React.createElement(View, { style: styles.benefitsList },
        [
          { icon: 'target', text: 'Daily goal reminders' },
          { icon: 'calendar', text: 'Check-in notifications' },
          { icon: 'users', text: 'Buddy encouragements' },
          { icon: 'award', text: 'Achievement alerts' },
        ].map(function (item, idx) {
          return React.createElement(View, { key: idx, style: styles.benefitRow },
            React.createElement(View, { style: styles.benefitIcon },
              React.createElement(Icon, { name: item.icon, size: 16, color: BRAND.purple })
            ),
            React.createElement(Text, { style: styles.benefitText }, item.text)
          );
        })
      ),
      h.notifGranted === true
        ? React.createElement(View, { style: styles.successBanner, accessibilityLiveRegion: 'polite', accessibilityRole: 'alert' },
            React.createElement(Icon, { name: 'check-circle', size: 20, color: BRAND.greenSolid }),
            React.createElement(Text, { style: styles.successText }, 'Notifications enabled!')
          )
        : h.notifGranted === false
          ? React.createElement(View, { style: styles.warningBanner },
              React.createElement(Icon, { name: 'alert-circle', size: 20, color: BRAND.yellow }),
              React.createElement(Text, { style: styles.warningText },
                'You can enable notifications later in Settings.'
              )
            )
          : React.createElement(TouchableOpacity, {
              style: styles.notifBtn,
              onPress: h.handleRequestNotifications,
              activeOpacity: 0.8,
              disabled: h.submitting,
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: 'Enable Notifications',
              accessibilityState: { disabled: h.submitting },
            },
              h.submitting
                ? React.createElement(ActivityIndicator, { color: '#fff', size: 'small' })
                : React.createElement(View, { style: styles.notifBtnContent },
                    React.createElement(Icon, { name: 'bell', size: 18, color: '#fff' }),
                    React.createElement(Text, { style: styles.notifBtnText }, 'Enable Notifications')
                  )
            )
    );
  };

  // ─── Step 5: Personality Quiz intro ─────────────────────────

  var renderStep5 = function () {
    return React.createElement(View, { style: styles.stepContent },
      React.createElement(View, { style: styles.iconCircle },
        React.createElement(Text, { style: styles.iconEmoji }, '\uD83D\uDE80')
      ),
      React.createElement(Text, { style: styles.stepTitle, accessibilityRole: 'header' }, 'Discover Your Dreamer Type'),
      React.createElement(Text, { style: styles.stepDesc },
        'Take a quick personality quiz to find your dreamer archetype and get personalized recommendations.'
      ),
      // Quiz preview cards
      React.createElement(View, { style: styles.planPreviewList },
        [
          { name: 'Visionary', emoji: '\u2B50', desc: 'Creative thinker, big-picture oriented', color: '#8B5CF6' },
          { name: 'Achiever', emoji: '\uD83C\uDFC6', desc: 'Goal-oriented, disciplined, results-driven', color: '#F59E0B' },
          { name: 'Explorer', emoji: '\uD83E\uDDED', desc: 'Adventurous spirit, lifelong learner', color: '#14B8A6' },
          { name: 'Collaborator', emoji: '\uD83E\uDD1D', desc: 'Team player, empathetic, community builder', color: '#EC4899' },
        ].map(function (archetype) {
          return React.createElement(View, {
            key: archetype.name,
            style: [styles.planPreviewCard, { borderColor: archetype.color + '30' }],
            accessible: true,
            accessibilityLabel: archetype.name + ' archetype, ' + archetype.desc,
          },
            React.createElement(Text, { style: { fontSize: 28 } }, archetype.emoji),
            React.createElement(View, { style: { flex: 1, marginLeft: 12 } },
              React.createElement(Text, { style: [styles.planPreviewName, { color: archetype.color }] }, archetype.name),
              React.createElement(Text, { style: styles.planPreviewDesc }, archetype.desc)
            ),
            React.createElement(Icon, { name: 'chevron-right', size: 16, color: COLORS.textMuted })
          );
        })
      )
    );
  };

  // ─── Footer buttons ─────────────────────────────────────────

  var renderFooter = function () {
    var showBack = h.step > 1;
    var showSkip = h.step !== 1;
    var nextLabel = h.step === 5 ? 'Take the Quiz' : 'Continue';
    if (h.step === 4 && h.notifGranted != null) nextLabel = 'Continue';

    return React.createElement(View, { style: styles.footer },
      // Back button
      showBack
        ? React.createElement(TouchableOpacity, {
            style: styles.backBtn,
            onPress: h.goBack,
            activeOpacity: 0.7,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Go back',
          },
            React.createElement(Icon, { name: 'arrow-left', size: 20, color: COLORS.text })
          )
        : React.createElement(View, { style: { width: 44 } }),
      // Next button
      React.createElement(TouchableOpacity, {
        style: [styles.nextBtn, h.submitting && styles.btnDisabled],
        onPress: h.goNext,
        activeOpacity: 0.8,
        disabled: h.submitting,
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: nextLabel,
        accessibilityState: { disabled: h.submitting },
      },
        h.submitting
          ? React.createElement(ActivityIndicator, { color: '#fff', size: 'small' })
          : React.createElement(View, { style: styles.nextBtnContent },
              React.createElement(Text, { style: styles.nextBtnText }, nextLabel),
              React.createElement(Icon, { name: 'arrow-right', size: 18, color: '#fff' })
            )
      ),
      // Skip
      showSkip
        ? React.createElement(TouchableOpacity, {
            style: styles.skipBtn,
            onPress: h.skipStep,
            activeOpacity: 0.7,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Skip this step',
          },
            React.createElement(Text, { style: styles.skipText }, 'Skip')
          )
        : React.createElement(View, { style: { width: 44 } })
    );
  };

  // ─── Main render ────────────────────────────────────────────

  var currentStep;
  if (h.step === 1) currentStep = renderStep1();
  else if (h.step === 2) currentStep = renderStep2();
  else if (h.step === 3) currentStep = renderStep3();
  else if (h.step === 4) currentStep = renderStep4();
  else currentStep = renderStep5();

  return React.createElement(SafeAreaView, { style: styles.container },
    React.createElement(KeyboardAvoidingView, {
      style: { flex: 1 },
      behavior: Platform.OS === 'ios' ? 'padding' : undefined,
    },
      React.createElement(ScrollView, {
        style: styles.scroll,
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled',
      },
        renderStepIndicator(),
        currentStep
      ),
      renderFooter()
    )
  );
};

// ─── Styles ─────────────────────────────────────────────────────

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
    paddingTop: SPACING.lg,
    paddingBottom: 20,
  },

  // Step indicator
  stepRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotActive: {
    width: 24,
    backgroundColor: BRAND.purple,
  },
  dotCompleted: {
    backgroundColor: BRAND.purple + '60',
  },

  // Step content
  stepContent: {
    alignItems: 'center',
    paddingTop: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
    marginBottom: 28,
  },

  // Input
  inputWrap: {
    width: '100%',
    maxWidth: 340,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
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
    maxWidth: 340,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.red,
    lineHeight: 19,
  },

  // Avatar
  avatarWrap: {
    marginBottom: 24,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: BRAND.purple + '40',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.glassBg,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  avatarBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Interests
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 360,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  interestChipActive: {
    backgroundColor: BRAND.purple + '25',
    borderColor: BRAND.purple + '60',
  },
  interestEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  interestLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  interestLabelActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  counterText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 16,
  },

  // Notifications
  benefitsList: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  notifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: 32,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
  },
  notifBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: RADIUS.md,
    padding: 14,
    width: '100%',
    maxWidth: 320,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.greenSolid,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.25)',
    borderRadius: RADIUS.md,
    padding: 14,
    width: '100%',
    maxWidth: 320,
  },
  warningText: {
    fontSize: 13,
    color: BRAND.yellow,
    flex: 1,
  },

  // Plan previews (step 5)
  planPreviewList: {
    width: '100%',
    gap: 12,
  },
  planPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  planPreviewName: {
    fontSize: 16,
    fontWeight: '700',
  },
  planPreviewDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    height: 48,
    paddingHorizontal: 28,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  nextBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  skipBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
});

module.exports = OnboardingScreen;
