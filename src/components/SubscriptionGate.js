/**
 * SubscriptionGate — Wraps premium features and shows a lock overlay
 * when the user's subscription tier is insufficient.
 *
 * Usage:
 *   <SubscriptionGate required="premium">
 *     <SomePremiumComponent />
 *   </SubscriptionGate>
 *
 * Props:
 *   required      - 'premium' | 'pro' (also accepts legacy 'requiredPlan')
 *   children      - content to render when user has access
 *   feature       - optional label shown in the lock overlay (e.g. "AI Coaching")
 *                   (also accepts legacy 'featureName')
 *   compact       - optional boolean, renders a smaller inline lock instead of full overlay
 */
var React = require('react');
var { View, Text, TouchableOpacity, StyleSheet } = require('react-native');
var Icon = require('react-native-vector-icons/Feather').default;
var { useNavigation } = require('@react-navigation/native');
var { useAuth } = require('../context/AuthContext');
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');

var PLAN_LABELS = {
  free: 'Free',
  premium: 'Premium',
  pro: 'Pro',
};

var SubscriptionGate = function (props) {
  // Support both prop naming conventions (required/requiredPlan, feature/featureName)
  var requiredPlan = props.required || props.requiredPlan || 'premium';
  var featureName = props.feature || props.featureName || '';
  var compact = props.compact || false;
  var children = props.children;

  var navigation = useNavigation();
  var auth = useAuth();
  var hasAccess = auth.hasSubscription(requiredPlan);

  if (hasAccess) {
    return children;
  }

  var planLabel = PLAN_LABELS[requiredPlan] || requiredPlan;

  var handleUpgrade = function () {
    try {
      navigation.navigate('Subscription');
    } catch (e) {
      // Subscription screen not available in nav tree
    }
  };

  // ── Compact inline lock ───────────────────────────────────
  if (compact) {
    var compactMsg = featureName
      ? featureName + ' requires ' + planLabel
      : planLabel + ' plan required';
    return React.createElement(
      TouchableOpacity,
      {
        style: styles.compactWrap,
        onPress: handleUpgrade,
        activeOpacity: 0.7,
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: compactMsg + '. Tap to upgrade.',
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
        // Upgrade button (matches web's navigation to /subscription)
        React.createElement(
          TouchableOpacity,
          {
            style: styles.upgradeBtn,
            onPress: handleUpgrade,
            activeOpacity: 0.85,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Upgrade to ' + planLabel,
          },
          React.createElement(Icon, { name: 'sparkles', size: 14, color: '#fff' }),
          React.createElement(
            Text,
            { style: styles.upgradeBtnText },
            'Upgrade to ' + planLabel,
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
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  lockFeature: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 24,
    backgroundColor: BRAND.purple,
    marginTop: 8,
    width: '100%',
    shadowColor: BRAND.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
