/**
 * SubscriptionScreen — Subscription status & plan info for React Native.
 * Read-only: shows current plan, status, renewal, payment history.
 * No in-app purchases (Apple/Google compliance).
 * Users manage their subscription via the web platform.
 */
var React = require('react');
var { useState, useCallback } = React;
var {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { SUBSCRIPTIONS } = require('../../services/endpoints');
var { BRAND, adaptColor } = require('../../styles/colors');
var { dark: theme } = require('../../styles/theme');
var { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } = require('../../styles/tokens');
var GlassCard = require('../../components/GlassCard');
var GlassButton = require('../../components/GlassButton');
var { ScreenHeader, BackButton } = require('../../components/ScreenHeader');

// ─── Constants ──────────────────────────────────────────────────

var PLAN_ACCENTS = {
  free: { color: '#9CA3AF' },
  premium: { color: BRAND.purple },
  pro: { color: BRAND.yellow },
};

var TIER_ORDER = { free: 0, premium: 1, pro: 2 };

var FEATURE_ROWS = [
  { key: 'Active Dreams', get: function (p) { return p.hasUnlimitedDreams ? '\u221E' : String(p.dreamLimit || 3); } },
  { key: 'AI Coaching', get: function (p) { return !!p.hasAi; } },
  { key: 'Daily Check-ins', get: function () { return true; } },
  { key: 'Community Access', get: function () { return true; } },
  { key: 'Stats & Analytics', get: function (p) { return !!p.hasAi; } },
  { key: 'Unlimited Conversations', get: function (p) { return !!p.hasAi; } },
  { key: 'Buddy Matching', get: function (p) { return !!p.hasBuddy; } },
  { key: 'Store Access', get: function (p) { return !!p.hasLeague; } },
  { key: 'Custom Themes', get: function (p) { return !p.hasAds; } },
  { key: 'Priority Support', get: function (p) { return !!p.hasLeague; } },
  { key: 'Vision Board', get: function (p) { return !!p.hasVisionBoard; } },
  { key: 'Dream Collaboration', get: function (p) { return !!p.hasCircles; } },
];

var STATUS_LABELS = {
  active: { label: 'Active', color: BRAND.greenSolid },
  trialing: { label: 'Trial', color: BRAND.purple },
  past_due: { label: 'Past Due', color: BRAND.yellow },
  canceled: { label: 'Cancelled', color: BRAND.redSolid },
  incomplete: { label: 'Incomplete', color: BRAND.yellow },
};

function normalizePlan(raw) {
  return {
    slug: raw.slug,
    name: raw.name,
    price: parseFloat(raw.priceMonthly || 0),
    period: raw.isFree ? 'forever' : 'month',
    popular: raw.slug === 'premium',
    dreamLimit: raw.dreamLimit,
    hasAi: raw.hasAi,
    hasBuddy: raw.hasBuddy,
    hasCircles: raw.hasCircles,
    hasVisionBoard: raw.hasVisionBoard,
    hasLeague: raw.hasLeague,
    hasAds: raw.hasAds,
    hasUnlimitedDreams: raw.hasUnlimitedDreams,
    activePromotions: raw.activePromotions || [],
  };
}

// ─── Screen ─────────────────────────────────────────────────────

var SubscriptionScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();

  var [refreshing, setRefreshing] = useState(false);
  var [showPayments, setShowPayments] = useState(false);

  // ─── Queries ────────────────────────────────────────────────

  var plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: function () {
      return apiGet(SUBSCRIPTIONS.PLANS);
    },
  });

  var subQuery = useQuery({
    queryKey: ['subscription-current'],
    queryFn: function () {
      return apiGet(SUBSCRIPTIONS.CURRENT);
    },
  });

  var invoicesQuery = useQuery({
    queryKey: ['subscription-invoices'],
    queryFn: function () {
      return apiGet(SUBSCRIPTIONS.INVOICES);
    },
    enabled: showPayments,
  });

  var rawPlans = plansQuery.data;
  var plans = (
    Array.isArray(rawPlans) ? rawPlans : rawPlans && rawPlans.results ? rawPlans.results : []
  ).map(normalizePlan);

  var subscription = subQuery.data || null;
  var currentPlanSlug =
    subscription && subscription.plan && subscription.plan.slug ? subscription.plan.slug : 'free';
  var currentPlan = currentPlanSlug.toLowerCase();
  var hasActiveSubscription =
    subscription && (subscription.status === 'active' || subscription.status === 'trialing');
  var renewalDate =
    subscription && subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
      : null;
  var pendingPlan = subscription && subscription.pendingPlan ? subscription.pendingPlan : null;
  var cancelAtPeriodEnd = subscription && subscription.cancelAtPeriodEnd;
  var subscriptionStatus = subscription && subscription.status ? subscription.status : null;

  var isLoading = plansQuery.isLoading || subQuery.isLoading;
  var isError = plansQuery.isError || subQuery.isError;

  var invoicesRaw = invoicesQuery.data;
  var invoices = (
    Array.isArray(invoicesRaw)
      ? invoicesRaw
      : invoicesRaw && invoicesRaw.results
        ? invoicesRaw.results
        : []
  );

  // ─── Mutations ─────────────────────────────────────────────

  var changePlanMut = useMutation({
    mutationFn: function (planSlug) {
      return apiPost(SUBSCRIPTIONS.CHANGE_PLAN, { plan_slug: planSlug });
    },
    onSuccess: function (data) {
      // CRITICAL: API returns snake_case string values (camelCase transform only affects keys)
      if (data && data.action === 'downgrade_scheduled') {
        Alert.alert('Plan Change Scheduled', 'Your plan will be downgraded at the end of the current billing period.');
      } else if (data && data.action === 'upgraded') {
        Alert.alert('Plan Upgraded', 'Your plan has been upgraded successfully.');
      }
      subQuery.refetch();
    },
    onError: function (err) {
      Alert.alert('Change Failed', err.userMessage || err.message || 'Could not change plan.');
    },
  });

  var cancelPendingMut = useMutation({
    mutationFn: function () {
      return apiPost(SUBSCRIPTIONS.CANCEL_PENDING_CHANGE);
    },
    onSuccess: function () {
      subQuery.refetch();
    },
  });

  var reactivateMut = useMutation({
    mutationFn: function () {
      return apiPost(SUBSCRIPTIONS.REACTIVATE);
    },
    onSuccess: function () {
      subQuery.refetch();
    },
  });

  var onRefresh = useCallback(function () {
    setRefreshing(true);
    var queries = [plansQuery.refetch(), subQuery.refetch()];
    if (showPayments) queries.push(invoicesQuery.refetch());
    Promise.all(queries).finally(function () {
      setRefreshing(false);
    });
  }, [showPayments]);

  // ─── Render ─────────────────────────────────────────────────

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(ScreenHeader, {
      title: 'Subscription',
      left: React.createElement(BackButton, {
        onPress: function () {
          navigation.goBack();
        },
      }),
    }),

    React.createElement(
      ScrollView,
      {
        style: styles.scroll,
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        refreshControl: React.createElement(RefreshControl, {
          refreshing: refreshing,
          onRefresh: onRefresh,
          tintColor: BRAND.purple,
        }),
      },

      // Loading
      isLoading
        ? React.createElement(
            View,
            { style: styles.loadingWrap, accessibilityLiveRegion: 'polite' },
            React.createElement(ActivityIndicator, { size: 'large', color: BRAND.purple, accessibilityLabel: 'Loading subscription plans' }),
          )
        : null,

      // Error
      isError
        ? React.createElement(
            View,
            { style: styles.emptyWrap, accessibilityLiveRegion: 'assertive' },
            React.createElement(Text, { style: styles.emptyTitle, accessibilityRole: 'alert' }, 'Failed to load plans'),
            React.createElement(
              GlassButton,
              { variant: 'primary', onPress: onRefresh },
              'Retry',
            ),
          )
        : null,

      // ─── Current plan & status card ──────────────────────────
      !isLoading && !isError
        ? React.createElement(
            GlassCard,
            {
              padding: 20,
              mb: 20,
              style: {
                backgroundColor: 'rgba(252,211,77,0.06)',
                borderColor: 'rgba(252,211,77,0.15)',
              },
            },
            React.createElement(
              View,
              { style: styles.currentPlanRow },
              React.createElement(
                View,
                { style: styles.crownBadge },
                React.createElement(Text, { style: { fontSize: 16 } }, '\uD83D\uDC51'),
              ),
              React.createElement(
                View,
                { style: { marginLeft: 12, flex: 1 } },
                React.createElement(
                  Text,
                  { style: styles.currentPlanLabel },
                  'Current Plan',
                ),
                React.createElement(
                  Text,
                  { style: styles.currentPlanName },
                  currentPlan.toUpperCase(),
                ),
              ),
              subscriptionStatus && STATUS_LABELS[subscriptionStatus]
                ? React.createElement(
                    View,
                    {
                      style: [
                        styles.statusBadge,
                        { backgroundColor: STATUS_LABELS[subscriptionStatus].color + '18' },
                      ],
                    },
                    React.createElement(
                      Text,
                      {
                        style: [
                          styles.statusBadgeText,
                          { color: STATUS_LABELS[subscriptionStatus].color },
                        ],
                      },
                      STATUS_LABELS[subscriptionStatus].label,
                    ),
                  )
                : null,
            ),
            // Renewal info
            renewalDate && !cancelAtPeriodEnd
              ? React.createElement(
                  View,
                  { style: styles.renewalRow },
                  React.createElement(
                    Text,
                    { style: styles.renewalLabel },
                    'Renews:',
                  ),
                  React.createElement(
                    Text,
                    { style: styles.renewalValue },
                    renewalDate,
                  ),
                )
              : null,
          )
        : null,

      // ─── Pending downgrade banner ────────────────────────────
      !isLoading && !isError && pendingPlan
        ? React.createElement(
            GlassCard,
            {
              padding: 16,
              mb: 16,
              style: {
                backgroundColor: 'rgba(251,191,36,0.08)',
                borderColor: 'rgba(251,191,36,0.2)',
              },
            },
            React.createElement(
              View,
              null,
              React.createElement(
                Text,
                { style: styles.pendingTitle },
                '\u26A0\uFE0F Plan change scheduled',
              ),
              React.createElement(
                Text,
                { style: styles.pendingDesc },
                'Changing to ' + (pendingPlan.name || pendingPlan) + ' at end of billing period.',
              ),
              React.createElement(
                GlassButton,
                {
                  variant: 'secondary',
                  size: 'sm',
                  onPress: function () {
                    cancelPendingMut.mutate();
                  },
                  disabled: cancelPendingMut.isPending,
                  loading: cancelPendingMut.isPending,
                },
                'Cancel Change',
              ),
            ),
          )
        : null,

      // ─── Cancel at period end banner ─────────────────────────
      !isLoading && !isError && cancelAtPeriodEnd && !pendingPlan
        ? React.createElement(
            GlassCard,
            {
              padding: 16,
              mb: 16,
              style: {
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.2)',
              },
            },
            React.createElement(
              Text,
              { style: { color: BRAND.redSolid, fontWeight: FONT_WEIGHTS.semibold, marginBottom: 8 } },
              'Subscription cancelling',
            ),
            React.createElement(
              Text,
              { style: { color: theme.textSecondary, fontSize: 13, marginBottom: 12 } },
              'Your subscription will end on ' + (renewalDate || 'the next billing date') + '.',
            ),
            React.createElement(
              GlassButton,
              {
                variant: 'primary',
                size: 'sm',
                onPress: function () {
                  reactivateMut.mutate();
                },
                disabled: reactivateMut.isPending,
                loading: reactivateMut.isPending,
              },
              'Reactivate',
            ),
          )
        : null,

      // ─── Plan comparison cards (informational only) ──────────
      !isLoading && !isError
        ? plans.map(function (plan) {
            var accent = PLAN_ACCENTS[plan.slug] || PLAN_ACCENTS.free;
            var isCurrent = plan.slug === currentPlan;

            return React.createElement(
              GlassCard,
              {
                key: plan.slug,
                padding: 0,
                mb: 16,
                style: isCurrent
                  ? { borderColor: accent.color + '40', borderWidth: 2 }
                  : {},
              },
              // Popular badge
              plan.popular
                ? React.createElement(
                    View,
                    { style: [styles.popularBadge, { backgroundColor: accent.color }] },
                    React.createElement(
                      Text,
                      { style: styles.popularText },
                      '\u2B50 POPULAR',
                    ),
                  )
                : null,
              React.createElement(
                View,
                { style: { padding: 20 } },
                // Plan name
                React.createElement(
                  Text,
                  { style: [styles.planName, { color: accent.color }] },
                  plan.name,
                ),
                // Price
                React.createElement(
                  View,
                  { style: styles.planPriceRow },
                  React.createElement(
                    Text,
                    { style: styles.planPrice },
                    plan.price === 0 ? 'Free' : '\u20AC' + plan.price.toFixed(2),
                  ),
                  plan.price > 0
                    ? React.createElement(
                        Text,
                        { style: styles.planPeriod },
                        '/month',
                      )
                    : null,
                ),
                // Feature list
                FEATURE_ROWS.map(function (row) {
                  var value = row.get(plan);
                  var isBoolean = typeof value === 'boolean';
                  var hasFeature = isBoolean ? value : true;

                  return React.createElement(
                    View,
                    { key: row.key, style: styles.featureRow },
                    React.createElement(
                      Text,
                      { style: { fontSize: 14, color: hasFeature ? BRAND.greenSolid : theme.textMuted } },
                      hasFeature ? '\u2713' : '\u2717',
                    ),
                    React.createElement(
                      Text,
                      {
                        style: [
                          styles.featureLabel,
                          !hasFeature && { color: theme.textMuted, textDecorationLine: 'line-through' },
                        ],
                      },
                      row.key + (isBoolean ? '' : ': ' + value),
                    ),
                  );
                }),
                // Current plan indicator (no action buttons)
                React.createElement(
                  View,
                  { style: { marginTop: 16 } },
                  isCurrent
                    ? React.createElement(
                        GlassButton,
                        { variant: 'success', size: 'lg', fullWidth: true, disabled: true },
                        'Current Plan',
                      )
                    : null,
                ),
              ),
            );
          })
        : null,

      // ─── Manage on web notice ────────────────────────────────
      !isLoading && !isError
        ? React.createElement(
            GlassCard,
            {
              padding: 20,
              mb: 20,
              style: {
                backgroundColor: 'rgba(139,92,246,0.06)',
                borderColor: 'rgba(139,92,246,0.15)',
              },
            },
            React.createElement(
              Text,
              { style: styles.webNoticeTitle },
              '\uD83C\uDF10 Manage Your Subscription',
            ),
            React.createElement(
              Text,
              { style: styles.webNoticeText },
              'To upgrade, downgrade, or manage billing, use the web version of the platform where you originally subscribed.',
            ),
          )
        : null,

      // ─── Payment History ─────────────────────────────────────
      !isLoading && !isError
        ? React.createElement(
            GlassCard,
            { padding: 16, mb: 16 },
            React.createElement(
              TouchableOpacity,
              {
                style: styles.paymentHistoryHeader,
                activeOpacity: 0.7,
                onPress: function () {
                  setShowPayments(!showPayments);
                },
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: 'Payment History' + (showPayments ? ', expanded' : ', collapsed'),
                accessibilityState: { expanded: showPayments },
              },
              React.createElement(
                Text,
                { style: styles.sectionTitle },
                '\uD83D\uDCB3 Payment History',
              ),
              React.createElement(
                Text,
                { style: styles.expandArrow },
                showPayments ? '\u25B2' : '\u25BC',
              ),
            ),
            showPayments
              ? React.createElement(
                  View,
                  { style: { marginTop: 12 } },
                  invoicesQuery.isLoading
                    ? React.createElement(
                        View,
                        { style: { padding: 20, alignItems: 'center' } },
                        React.createElement(ActivityIndicator, { size: 'small', color: BRAND.purple }),
                      )
                    : invoices.length === 0
                      ? React.createElement(
                          View,
                          { style: { padding: 20, alignItems: 'center' } },
                          React.createElement(
                            Text,
                            { style: styles.noPaymentsText },
                            'No payment history yet.',
                          ),
                        )
                      : invoices.map(function (invoice, index) {
                          var date = invoice.date || invoice.createdAt || invoice.created;
                          var formattedDate = date ? new Date(date).toLocaleDateString() : '\u2014';
                          var amount = invoice.amountPaid || invoice.amount || invoice.total || 0;
                          var formattedAmount = typeof amount === 'number'
                            ? '\u20AC' + (amount / 100).toFixed(2)
                            : String(amount);
                          var planName = invoice.planName || invoice.description || invoice.lines?.[0]?.description || 'Subscription';
                          var status = invoice.status || 'paid';
                          var statusColor = status === 'paid' ? BRAND.greenSolid
                            : status === 'refunded' ? BRAND.purple
                            : BRAND.yellow;

                          return React.createElement(
                            View,
                            {
                              key: invoice.id || index,
                              style: [
                                styles.invoiceRow,
                                index < invoices.length - 1 && styles.invoiceRowBorder,
                              ],
                            },
                            React.createElement(
                              View,
                              { style: { flex: 1 } },
                              React.createElement(
                                Text,
                                { style: styles.invoicePlan },
                                planName,
                              ),
                              React.createElement(
                                Text,
                                { style: styles.invoiceDate },
                                formattedDate,
                              ),
                            ),
                            React.createElement(
                              View,
                              { style: { alignItems: 'flex-end' } },
                              React.createElement(
                                Text,
                                { style: styles.invoiceAmount },
                                formattedAmount,
                              ),
                              React.createElement(
                                View,
                                {
                                  style: [
                                    styles.invoiceStatusBadge,
                                    { backgroundColor: statusColor + '18' },
                                  ],
                                },
                                React.createElement(
                                  Text,
                                  {
                                    style: [
                                      styles.invoiceStatusText,
                                      { color: statusColor },
                                    ],
                                  },
                                  status.charAt(0).toUpperCase() + status.slice(1),
                                ),
                              ),
                            ),
                          );
                        }),
                )
              : null,
          )
        : null,

      React.createElement(View, { style: { height: 40 } }),
    ),
  );
};

// ─── Styles ─────────────────────────────────────────────────────

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  loadingWrap: {
    padding: 60,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.textTertiary,
    marginBottom: 16,
  },
  currentPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanLabel: {
    fontSize: FONT_SIZES.sm,
    color: theme.textTertiary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  currentPlanName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: BRAND.yellow,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  renewalLabel: {
    fontSize: FONT_SIZES.sm,
    color: theme.textTertiary,
    marginRight: 6,
  },
  renewalValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.textSecondary,
  },
  pendingTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    marginBottom: 4,
  },
  pendingDesc: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  popularBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#fff',
    letterSpacing: 1,
  },
  planName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 8,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: theme.text,
  },
  planPeriod: {
    fontSize: FONT_SIZES.sm,
    color: theme.textMuted,
    marginLeft: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  featureLabel: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
  },
  webNoticeTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: theme.text,
    marginBottom: 8,
  },
  webNoticeText: {
    fontSize: FONT_SIZES.sm,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  paymentHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandArrow: {
    fontSize: 12,
    color: theme.textMuted,
  },
  noPaymentsText: {
    fontSize: FONT_SIZES.sm,
    color: theme.textMuted,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  invoiceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  invoicePlan: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    color: theme.text,
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 12,
    color: theme.textMuted,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.bold,
    color: theme.text,
    marginBottom: 4,
  },
  invoiceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  invoiceStatusText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

module.exports = SubscriptionScreen;
