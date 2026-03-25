/**
 * AdBanner — Horizontal banner ad for React Native (hybrid: AdMob + self-promo).
 *
 * Displays ONLY for free-tier users. Premium/Pro users never see this.
 *
 * When AdMob is enabled (adConfig.admobEnabled = true):
 *   - Renders a Google AdMob BannerAd.
 *   - Falls back to self-promo banner if the AdMob ad fails to load.
 *
 * When AdMob is disabled:
 *   - Renders the self-promo banner (upgrade CTA).
 *
 * Glass morphism styling consistent with the app dark theme.
 * Tapping the self-promo banner navigates to the Subscription screen.
 */
var React = require('react');
var { useState, useEffect } = React;
var { View, Text, TouchableOpacity, StyleSheet } = require('react-native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var Icon = require('react-native-vector-icons/Feather').default;
var { useNavigation } = require('@react-navigation/native');
var { useAuth } = require('../context/AuthContext');
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');
var AD_CONFIG = require('../services/adConfig');

// ─── Try to import AdMob banner ────────────────────────────────────
var BannerAd = null;
var BannerAdSize = null;
try {
  var admobModule = require('react-native-google-mobile-ads');
  BannerAd = admobModule.BannerAd;
  BannerAdSize = admobModule.BannerAdSize;
} catch (e) {
  // react-native-google-mobile-ads not installed — self-promo only
}

var PROMO_MESSAGES = [
  { text: 'Unlock unlimited AI coaching \u2014 Go Premium', icon: 'zap', color: BRAND.purple },
  { text: 'Remove ads + get streak freezes \u2014 Upgrade now', icon: 'shield', color: '#6366F1' },
  { text: 'Join Premium: Vision boards, unlimited dreams, no ads', icon: 'star', color: '#EC4899' },
  { text: 'Focus Timer Pro + Calendar Sync \u2014 Premium only', icon: 'clock', color: '#14B8A6' },
];

var STORAGE_KEY = 'dp-ad-banner-idx';
var IMPRESSIONS_KEY = 'dp-ad-banner-impressions';
var FIRST_SESSION_KEY = 'dp-first-session';

/**
 * Screen names where ads must NEVER appear (Apple 5.5 compliance):
 * - Active workflows: focus timer, active chat, onboarding
 */
var BLOCKED_SCREENS = ['FocusTimer', 'Chat', 'AIChat', 'BuddyChat', 'CircleChat', 'Onboarding', 'OnboardingSubscription'];

var AdBanner = function (props) {
  var style = props.style || null;
  var onDismiss = props.onDismiss || null;

  var navigation = useNavigation();
  var auth = useAuth();
  var [promoIndex, setPromoIndex] = useState(0);
  var [visible, setVisible] = useState(true);
  var [fallbackToPromo, setFallbackToPromo] = useState(false);
  var [blockedByPolicy, setBlockedByPolicy] = useState(false);

  // Determine if we should attempt AdMob
  var shouldUseAdMob = AD_CONFIG.admobEnabled && BannerAd && BannerAdSize && !fallbackToPromo;

  // Apple 5.5: Check onboarding + first session + blocked screens
  useEffect(function () {
    // No ads during onboarding
    if (auth.user && auth.user.onboardingCompleted === false) {
      setBlockedByPolicy(true);
      return;
    }

    // No ads in first session (1 hour)
    AsyncStorage.getItem(FIRST_SESSION_KEY).then(function (val) {
      if (!val) {
        AsyncStorage.setItem(FIRST_SESSION_KEY, String(Date.now()));
        setBlockedByPolicy(true);
        return;
      }
      var ts = parseInt(val, 10);
      if (Date.now() - ts < 3600000) {
        setBlockedByPolicy(true);
      }
    });

    // No ads on blocked screens
    var currentRoute = navigation.getState && navigation.getState().routes;
    if (currentRoute && currentRoute.length > 0) {
      var activeRoute = currentRoute[currentRoute.length - 1];
      if (BLOCKED_SCREENS.indexOf(activeRoute.name) !== -1) {
        setBlockedByPolicy(true);
      }
    }
  }, [auth.user, navigation]);

  useEffect(function () {
    AsyncStorage.getItem(STORAGE_KEY).then(function (val) {
      var idx = parseInt(val || '0', 10);
      setPromoIndex(idx % PROMO_MESSAGES.length);
      AsyncStorage.setItem(STORAGE_KEY, String(idx + 1));
    });
  }, []);

  // Track impressions (self-promo only — AdMob tracks its own)
  useEffect(function () {
    if (visible && auth.user && auth.isFreeTier && !shouldUseAdMob) {
      AsyncStorage.getItem(IMPRESSIONS_KEY).then(function (val) {
        var count = parseInt(val || '0', 10);
        AsyncStorage.setItem(IMPRESSIONS_KEY, String(count + 1));
      });
    }
  }, [visible, auth.user, auth.isFreeTier, shouldUseAdMob]);

  // Never show to premium/pro users
  if (!auth.user || !auth.isFreeTier) return null;
  if (!visible) return null;
  // Apple 5.5: blocked by onboarding / first session / active workflow
  if (blockedByPolicy) return null;

  // ─── AdMob banner ─────────────────────────────────────────────────
  if (shouldUseAdMob) {
    var adUnitId = AD_CONFIG.getAdUnitId('banner');

    return React.createElement(View, { style: [styles.admobContainer, style] },
      React.createElement(BannerAd, {
        unitId: adUnitId,
        size: BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
        requestOptions: {
          requestNonPersonalizedAdsOnly: true,
        },
        onAdLoaded: function () {
          console.log('[AdBanner] AdMob banner loaded');
        },
        onAdFailedToLoad: function (error) {
          console.warn('[AdBanner] AdMob banner failed to load, falling back to self-promo:', error);
          setFallbackToPromo(true);
        },
      })
    );
  }

  // ─── Self-promo banner (fallback or default) ─────────────────────
  var promo = PROMO_MESSAGES[promoIndex];

  return React.createElement(TouchableOpacity, {
    style: [styles.container, style],
    onPress: function () {
      navigation.navigate('Subscription');
    },
    activeOpacity: 0.8,
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: promo.text + '. Tap to upgrade.',
  },
    // Accent bar
    React.createElement(View, { style: [styles.accentBar, { backgroundColor: promo.color }] }),

    // Icon
    React.createElement(View, { style: [styles.iconWrap, { backgroundColor: promo.color + '20', borderColor: promo.color + '30' }] },
      React.createElement(Icon, { name: promo.icon, size: 16, color: promo.color })
    ),

    // Text
    React.createElement(View, { style: styles.textWrap },
      React.createElement(Text, { style: styles.promoText, numberOfLines: 2 }, promo.text),
      React.createElement(View, { style: styles.ctaRow },
        React.createElement(Text, { style: styles.sponsoredLabel }, 'Sponsored'),
        React.createElement(Text, { style: [styles.upgradeText, { color: promo.color }] }, 'Upgrade'),
        React.createElement(Icon, { name: 'arrow-right', size: 10, color: promo.color })
      )
    ),

    // Close button — Apple 5.5: min 44x44 tap target
    onDismiss
      ? React.createElement(TouchableOpacity, {
          style: styles.closeBtn,
          onPress: function (e) {
            setVisible(false);
            if (onDismiss) onDismiss();
          },
          accessible: true,
          accessibilityLabel: 'Close ad',
          accessibilityRole: 'button',
        },
          React.createElement(Icon, { name: 'x', size: 14, color: COLORS.textMuted })
        )
      : null
  );
};

var styles = StyleSheet.create({
  admobContainer: {
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderRadius: RADIUS.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  promoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sponsoredLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  upgradeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

module.exports = AdBanner;
