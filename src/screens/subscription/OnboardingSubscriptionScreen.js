/**
 * OnboardingSubscriptionScreen — Plan overview during onboarding (step 5/5).
 * Informational only: shows plan cards with feature highlights.
 * No in-app purchases (Apple/Google compliance).
 * Users can continue with Free or skip.
 */
var React = require('react');
var { useState } = React;
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery } = require('@tanstack/react-query');
var { apiGet } = require('../../services/api');
var { SUBSCRIPTIONS } = require('../../services/endpoints');
var { BRAND } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var GlassButton = require('../../components/GlassButton');

// ─── Plan highlights ────────────────────────────────────────────

var PLAN_HIGHLIGHTS = {
  free: [
    'Up to 3 active dreams',
    'Daily check-ins',
    'Community access',
  ],
  premium: [
    'Unlimited dreams',
    'AI coaching & analytics',
    'Buddy matching',
    'Custom themes',
    'No ads',
  ],
  pro: [
    'Everything in Premium',
    'Dream circles',
    'Vision board',
    'Priority support',
    'API access',
  ],
};

var PLAN_ICONS = {
  free: '\uD83C\uDF31',
  premium: '\uD83D\uDE80',
  pro: '\uD83D\uDC51',
};

var PLAN_COLORS = {
  free: '#9CA3AF',
  premium: BRAND.purple,
  pro: BRAND.yellow,
};

// ─── Screen ─────────────────────────────────────────────────────

var OnboardingSubscriptionScreen = function (props) {
  var navigation = useNavigation();
  var onComplete = props.onComplete || props.route && props.route.params && props.route.params.onComplete;
  var [selectedPlan, setSelectedPlan] = useState(null);

  var plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: function () {
      return apiGet(SUBSCRIPTIONS.PLANS);
    },
  });

  var rawPlans = plansQuery.data;
  var plans = (
    Array.isArray(rawPlans) ? rawPlans : rawPlans && rawPlans.results ? rawPlans.results : []
  ).map(function (raw) {
    return {
      slug: raw.slug,
      name: raw.name,
      price: parseFloat(raw.priceMonthly || 0),
      isFree: raw.isFree || raw.slug === 'free',
    };
  });

  var handleContinueFree = function () {
    if (onComplete) onComplete();
  };

  var handleSkip = function () {
    if (onComplete) onComplete();
  };

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(
      ScrollView,
      {
        style: styles.scroll,
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
      },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          Text,
          { style: styles.title },
          'Choose Your Plan',
        ),
        React.createElement(
          Text,
          { style: styles.subtitle },
          'Start free and explore. Premium plans can be managed from the web when you are ready.',
        ),
      ),

      // Loading
      plansQuery.isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap },
            React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple }),
          )
        : null,

      // Plan cards (informational only)
      !plansQuery.isLoading
        ? plans.map(function (plan) {
            var color = PLAN_COLORS[plan.slug] || PLAN_COLORS.free;
            var icon = PLAN_ICONS[plan.slug] || '\uD83D\uDCE6';
            var highlights = PLAN_HIGHLIGHTS[plan.slug] || [];
            var isSelected = selectedPlan === plan.slug;
            var isPopular = plan.slug === 'premium';

            return React.createElement(
              TouchableOpacity,
              {
                key: plan.slug,
                style: [
                  styles.planCard,
                  isSelected && { borderColor: color + '60', borderWidth: 2 },
                  isPopular && styles.popularCard,
                ],
                activeOpacity: 0.8,
                onPress: function () {
                  setSelectedPlan(plan.slug);
                },
                accessible: true, accessibilityRole: 'radio', accessibilityLabel: plan.name + ' plan, ' + (plan.price === 0 ? 'Free forever' : plan.price.toFixed(2) + ' euros per month'), accessibilityState: { selected: isSelected },
              },
              // Popular badge
              isPopular
                ? React.createElement(
                    View,
                    { style: [styles.popularBadge, { backgroundColor: color }] },
                    React.createElement(
                      Text,
                      { style: styles.popularText },
                      'RECOMMENDED',
                    ),
                  )
                : null,
              // Plan header
              React.createElement(
                View,
                { style: styles.planHeader },
                React.createElement(
                  Text,
                  { style: { fontSize: 32 } },
                  icon,
                ),
                React.createElement(
                  View,
                  { style: { marginLeft: 12, flex: 1 } },
                  React.createElement(
                    Text,
                    { style: [styles.planName, { color: color }] },
                    plan.name,
                  ),
                  React.createElement(
                    Text,
                    { style: styles.planPrice },
                    plan.price === 0
                      ? 'Free forever'
                      : '\u20AC' + plan.price.toFixed(2) + '/month',
                  ),
                ),
              ),
              // Highlights
              highlights.map(function (h, i) {
                return React.createElement(
                  View,
                  { key: i, style: styles.highlightRow },
                  React.createElement(
                    Text,
                    { style: { color: color, fontSize: 14 } },
                    '\u2713',
                  ),
                  React.createElement(
                    Text,
                    { style: styles.highlightText },
                    h,
                  ),
                );
              }),
              // Free plan: "Continue Free" button. Paid plans: no action button.
              plan.isFree
                ? React.createElement(
                    View,
                    { style: { marginTop: 16 } },
                    React.createElement(
                      GlassButton,
                      {
                        variant: 'primary',
                        fullWidth: true,
                        onPress: handleContinueFree,
                      },
                      'Continue Free',
                    ),
                  )
                : null,
            );
          })
        : null,

      // Web notice for paid plans
      !plansQuery.isLoading
        ? React.createElement(
            View,
            { style: styles.webNotice },
            React.createElement(
              Text,
              { style: styles.webNoticeText },
              'Premium plans can be managed from the web',
            ),
          )
        : null,

      // Skip link
      React.createElement(
        TouchableOpacity,
        {
          style: styles.skipBtn,
          onPress: handleSkip,
          accessible: true, accessibilityRole: 'button', accessibilityLabel: 'Skip plan selection for now',
        },
        React.createElement(
          Text,
          { style: styles.skipText },
          'Skip for now',
        ),
      ),

      React.createElement(View, { style: { height: 40 } }),
    ),
  );
};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  loadingWrap: {
    padding: 60,
    alignItems: 'center',
  },
  planCard: {
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: RADIUS.xxl,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  popularCard: {
    borderColor: BRAND.purple + '30',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#fff',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  planPrice: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    marginTop: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  highlightText: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    flex: 1,
  },
  webNotice: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  webNoticeText: {
    fontSize: FONT_SIZES.sm,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  skipText: {
    fontSize: FONT_SIZES.md,
    color: theme.textMuted,
    textDecorationLine: 'underline',
  },
});

module.exports = OnboardingSubscriptionScreen;
