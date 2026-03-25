/**
 * AdNative — Inline card ad for React Native (hybrid: AdMob + self-promo).
 *
 * Displays ONLY for free-tier users. Blends with surrounding list items
 * using the glass morphism card style.
 *
 * When AdMob is enabled (adConfig.admobEnabled = true):
 *   - Renders a Google AdMob NativeAd (if the native module is available).
 *   - Falls back to self-promo card if the AdMob ad fails to load.
 *
 * When AdMob is disabled:
 *   - Renders the self-promo card with "Sponsored" label.
 *   - Tapping navigates to the Subscription screen.
 *
 * Note: react-native-google-mobile-ads does not include a built-in NativeAd
 * component out of the box. The AdMob native path is implemented as a
 * placeholder that falls back to self-promo until a native ad view is
 * integrated (e.g., via a custom native module or a future library update).
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

// ─── Try to import AdMob native ad ─────────────────────────────────
// Note: react-native-google-mobile-ads provides NativeAd in some versions.
// If not available, we always fall back to self-promo.
var NativeAd = null;
try {
  var admobModule = require('react-native-google-mobile-ads');
  // NativeAd may not be exported; guard accordingly
  if (admobModule.NativeAd) {
    NativeAd = admobModule.NativeAd;
  }
} catch (e) {
  // react-native-google-mobile-ads not installed — self-promo only
}

var NATIVE_ADS = [
  { text: 'Unlock unlimited AI coaching \u2014 Go Premium', icon: 'zap', color: BRAND.purple },
  { text: 'Remove ads + get streak freezes \u2014 Upgrade now', icon: 'shield', color: '#6366F1' },
  { text: 'Join Premium: Vision boards, unlimited dreams, no ads', icon: 'star', color: '#EC4899' },
  { text: 'Focus Timer Pro + Calendar Sync \u2014 Premium only', icon: 'clock', color: '#14B8A6' },
];

var STORAGE_KEY = 'dp-ad-native-idx';
var IMPRESSIONS_KEY = 'dp-ad-native-impressions';
var FIRST_SESSION_KEY = 'dp-first-session';

/**
 * Screen names where ads must NEVER appear (Apple 5.5 compliance).
 */
var BLOCKED_SCREENS = ['FocusTimer', 'Chat', 'AIChat', 'BuddyChat', 'CircleChat', 'Onboarding', 'OnboardingSubscription'];

var AdNative = function (props) {
  var style = props.style || null;
  var variant = typeof props.variant === 'number' ? props.variant : null;

  var navigation = useNavigation();
  var auth = useAuth();
  var [adIndex, setAdIndex] = useState(0);
  var [fallbackToPromo, setFallbackToPromo] = useState(false);
  var [blockedByPolicy, setBlockedByPolicy] = useState(false);

  // Determine if we should attempt AdMob native
  var shouldUseAdMob = AD_CONFIG.admobEnabled && NativeAd && !fallbackToPromo;

  // Apple 5.5: Check onboarding + first session + blocked screens
  useEffect(function () {
    if (auth.user && auth.user.hasOnboarded === false) {
      setBlockedByPolicy(true);
      return;
    }

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

    var currentRoute = navigation.getState && navigation.getState().routes;
    if (currentRoute && currentRoute.length > 0) {
      var activeRoute = currentRoute[currentRoute.length - 1];
      if (BLOCKED_SCREENS.indexOf(activeRoute.name) !== -1) {
        setBlockedByPolicy(true);
      }
    }
  }, [auth.user, navigation]);

  useEffect(function () {
    if (variant !== null) {
      setAdIndex(variant % NATIVE_ADS.length);
    } else {
      AsyncStorage.getItem(STORAGE_KEY).then(function (val) {
        var idx = parseInt(val || '0', 10);
        setAdIndex(idx % NATIVE_ADS.length);
        AsyncStorage.setItem(STORAGE_KEY, String(idx + 1));
      });
    }

    // Track impressions (self-promo only — AdMob tracks its own)
    if (auth.user && auth.isFreeTier && !shouldUseAdMob) {
      AsyncStorage.getItem(IMPRESSIONS_KEY).then(function (val) {
        var count = parseInt(val || '0', 10);
        AsyncStorage.setItem(IMPRESSIONS_KEY, String(count + 1));
      });
    }
  }, [variant, auth.user, auth.isFreeTier, shouldUseAdMob]);

  // Never show to premium/pro users
  if (!auth.user || !auth.isFreeTier) return null;
  // Apple 5.5: blocked by onboarding / first session / active workflow
  if (blockedByPolicy) return null;

  // ─── AdMob native ad ──────────────────────────────────────────────
  if (shouldUseAdMob) {
    var adUnitId = AD_CONFIG.getAdUnitId('native');

    return React.createElement(View, { style: [styles.admobContainer, style] },
      React.createElement(NativeAd, {
        adUnitId: adUnitId,
        requestOptions: {
          requestNonPersonalizedAdsOnly: true,
        },
        onAdLoaded: function () {
          console.log('[AdNative] AdMob native ad loaded');
        },
        onAdFailedToLoad: function (error) {
          console.warn('[AdNative] AdMob native ad failed to load, falling back to self-promo:', error);
          setFallbackToPromo(true);
        },
      })
    );
  }

  // ─── Self-promo card (fallback or default) ────────────────────────
  var ad = NATIVE_ADS[adIndex];

  return React.createElement(TouchableOpacity, {
    style: [styles.container, { borderColor: ad.color + '30' }, style],
    onPress: function () {
      navigation.navigate('Subscription');
    },
    activeOpacity: 0.8,
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: ad.text + '. Sponsored. Tap to upgrade.',
  },
    // Sponsored badge
    React.createElement(View, { style: styles.sponsoredBadge },
      React.createElement(Text, { style: styles.sponsoredText }, 'SPONSORED')
    ),

    // Content row
    React.createElement(View, { style: styles.contentRow },
      // Icon
      React.createElement(View, { style: [styles.iconWrap, { backgroundColor: ad.color + '18', borderColor: ad.color + '25' }] },
        React.createElement(Icon, { name: ad.icon, size: 22, color: ad.color })
      ),

      // Text
      React.createElement(View, { style: styles.textWrap },
        React.createElement(Text, { style: styles.adText, numberOfLines: 2 }, ad.text),
        React.createElement(View, { style: styles.ctaRow },
          React.createElement(Text, { style: [styles.ctaText, { color: ad.color }] }, 'Upgrade to remove ads'),
          React.createElement(Icon, { name: 'arrow-right', size: 12, color: ad.color })
        )
      )
    )
  );
};

var styles = StyleSheet.create({
  admobContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    borderRadius: RADIUS.md,
  },
  container: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  sponsoredBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm - 2,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  sponsoredText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm + 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  adText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

module.exports = AdNative;
