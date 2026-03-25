/**
 * SubscriptionGate — Wraps premium features and shows a lock overlay
 * when the user's subscription tier is insufficient.
 *
 * Usage:
 *   <SubscriptionGate requiredPlan="premium">
 *     <SomePremiumComponent />
 *   </SubscriptionGate>
 *
 * Props:
 *   requiredPlan  - 'premium' | 'pro'
 *   children      - content to render when user has access
 *   featureName   - optional label shown in the lock overlay (e.g. "AI Coaching")
 *   compact       - optional boolean, renders a smaller inline lock instead of full overlay
 */
var React = require('react');
var { View, Text, StyleSheet } = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { useAuth } = require('../context/AuthContext');
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');

var PLAN_LABELS = {
  free: 'Free',
  premium: 'Premium',
  pro: 'Pro',
};

var SubscriptionGate = function (props) {
  var requiredPlan = props.requiredPlan || 'premium';
  var featureName = props.featureName || '';
  var compact = props.compact || false;
  var children = props.children;

  var auth = useAuth();
  var hasAccess = auth.hasSubscription(requiredPlan);

  if (hasAccess) {
    return children;
  }

  var planLabel = PLAN_LABELS[requiredPlan] || requiredPlan;

  // ── Compact inline lock ───────────────────────────────────
  if (compact) {
    var compactMsg = featureName
      ? featureName + ' requires ' + planLabel
      : planLabel + ' plan required';
    return React.createElement(
      View,
      {
        style: styles.compactWrap,
        accessible: true,
        accessibilityRole: 'alert',
        accessibilityLabel: compactMsg,
      },
      React.createElement(
        View,
        { style: styles.compactInner, accessible: false },
        React.createElement(Icon, { name: 'lock', size: 14, color: BRAND.purpleLight }),
        React.createElement(
          Text,
          { style: styles.compactText },
          compactMsg,
        ),
      ),
    );
  }

  // ── Full overlay lock ─────────────────────────────────────
  var overlayMsg = featureName
    ? 'This feature requires ' + planLabel + '. ' + featureName + ' is available on the ' + planLabel + ' plan.'
    : planLabel + ' Plan Required. Available with a ' + planLabel + ' subscription.';
  return React.createElement(
    View,
    {
      style: styles.container,
      accessible: true,
      accessibilityRole: 'alert',
      accessibilityLabel: overlayMsg,
    },
    // Blurred/dimmed children underneath
    React.createElement(
      View,
      { style: styles.blurredContent, pointerEvents: 'none', importantForAccessibility: 'no-hide-descendants' },
      children,
    ),
    // Lock overlay
    React.createElement(
      View,
      { style: styles.overlay, importantForAccessibility: 'no-hide-descendants' },
      React.createElement(
        View,
        { style: styles.lockCard },
        React.createElement(
          View,
          { style: styles.lockIconWrap },
          React.createElement(Icon, { name: 'lock', size: 24, color: BRAND.purpleLight }),
        ),
        React.createElement(
          Text,
          { style: styles.lockTitle },
          featureName
            ? 'This feature requires ' + planLabel
            : planLabel + ' Plan Required',
        ),
        featureName
          ? React.createElement(
              Text,
              { style: styles.lockFeature },
              featureName + ' is available on the ' + planLabel + ' plan.',
            )
          : null,
        React.createElement(
          View,
          { style: styles.webNotice },
          React.createElement(Icon, { name: 'star', size: 14, color: COLORS.textMuted }),
          React.createElement(
            Text,
            { style: styles.webNoticeText },
            'Available with a ' + planLabel + ' subscription',
          ),
        ),
      ),
    ),
  );
};

var styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  blurredContent: {
    opacity: 0.15,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,15,26,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  lockCard: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
  },
  lockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  lockFeature: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  webNoticeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  // Compact variant
  compactWrap: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
  },
  compactInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.purpleLight,
  },
});

module.exports = SubscriptionGate;
