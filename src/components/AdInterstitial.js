/**
 * AdInterstitial — Full-screen interstitial ad for React Native (hybrid: AdMob + self-promo).
 *
 * Displays ONLY for free-tier users between screen transitions.
 * Shows every N navigations (default 5).
 *
 * When AdMob is enabled (adConfig.admobEnabled = true):
 *   - Preloads a Google AdMob InterstitialAd.
 *   - Shows the AdMob ad on the Nth navigation.
 *   - Falls back to self-promo interstitial if the AdMob ad fails to load.
 *
 * When AdMob is disabled:
 *   - Shows the self-promo interstitial with a 5-second countdown
 *     before the close button appears.
 */
var React = require('react');
var { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } = React;
var {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
} = require('react-native');
var AsyncStorage = require('@react-native-async-storage/async-storage').default;
var Icon = require('react-native-vector-icons/Feather').default;
var LinearGradient = null;
try {
  LinearGradient = require('react-native-linear-gradient').default;
} catch (e) {
  // LinearGradient not available — fallback to View
}
var { useAuth } = require('../context/AuthContext');
var { COLORS, SPACING, RADIUS } = require('../theme/tokens');
var { BRAND } = require('../styles/colors');
var AD_CONFIG = require('../services/adConfig');

// ─── Try to import AdMob interstitial ──────────────────────────────
var InterstitialAd = null;
var AdEventType = null;
try {
  var admobModule = require('react-native-google-mobile-ads');
  InterstitialAd = admobModule.InterstitialAd;
  AdEventType = admobModule.AdEventType;
} catch (e) {
  // react-native-google-mobile-ads not installed — self-promo only
}

var PROMO_SLIDES = [
  { text: 'Unlock unlimited AI coaching \u2014 Go Premium', icon: 'zap', gradient: [BRAND.purple, '#6D28D9'] },
  { text: 'Remove ads + get streak freezes \u2014 Upgrade now', icon: 'shield', gradient: ['#6366F1', '#4338CA'] },
  { text: 'Join Premium: Vision boards, unlimited dreams, no ads', icon: 'star', gradient: ['#EC4899', '#BE185D'] },
  { text: 'Focus Timer Pro + Calendar Sync \u2014 Premium only', icon: 'clock', gradient: ['#14B8A6', '#0F766E'] },
];

var COUNTDOWN_SECONDS = 5;
var DEFAULT_FREQUENCY = 5;
var NAV_KEY = 'dp-interstitial-nav-count';
var IMPRESSIONS_KEY = 'dp-interstitial-impressions';
var FIRST_SESSION_KEY = 'dp-first-session';
var { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Screen names where interstitials must NEVER appear (Apple 5.5 compliance).
 */
var BLOCKED_SCREENS = ['FocusTimer', 'Chat', 'AIChat', 'BuddyChat', 'CircleChat', 'Onboarding', 'OnboardingSubscription'];

/**
 * Use via ref: call ref.current.onNavigate() on each screen focus.
 * The component will auto-show the interstitial every N navigations.
 */
var AdInterstitial = forwardRef(function (props, ref) {
  var frequency = props.frequency || DEFAULT_FREQUENCY;
  var onUpgrade = props.onUpgrade || null;

  var auth = useAuth();
  var [visible, setVisible] = useState(false);
  var [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  var [canClose, setCanClose] = useState(false);
  var [slideIndex, setSlideIndex] = useState(0);
  var timerRef = useRef(null);
  var fadeAnim = useRef(new Animated.Value(0)).current;

  // ─── AdMob interstitial management ─────────────────────────────
  var admobInterstitialRef = useRef(null);
  var admobReadyRef = useRef(false);
  var admobFailedRef = useRef(false);

  var canUseAdMob = AD_CONFIG.admobEnabled && InterstitialAd && AdEventType;

  // Preload AdMob interstitial
  useEffect(function () {
    if (!canUseAdMob) return;
    if (!auth.user || !auth.isFreeTier) return;

    var adUnitId = AD_CONFIG.getAdUnitId('interstitial');
    var interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    var unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, function () {
      console.log('[AdInterstitial] AdMob interstitial loaded');
      admobReadyRef.current = true;
      admobFailedRef.current = false;
    });

    var unsubError = interstitial.addAdEventListener(AdEventType.ERROR, function (error) {
      console.warn('[AdInterstitial] AdMob interstitial failed to load:', error);
      admobReadyRef.current = false;
      admobFailedRef.current = true;
    });

    var unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, function () {
      console.log('[AdInterstitial] AdMob interstitial closed — reloading');
      admobReadyRef.current = false;
      // Reload for next time
      interstitial.load();
    });

    admobInterstitialRef.current = interstitial;
    interstitial.load();

    return function () {
      unsubLoaded();
      unsubError();
      unsubClosed();
      admobInterstitialRef.current = null;
      admobReadyRef.current = false;
    };
  }, [canUseAdMob, auth.user, auth.isFreeTier]);

  useImperativeHandle(ref, function () {
    return {
      onNavigate: function (screenName) {
        if (!auth.user || !auth.isFreeTier) return;

        // Apple 5.5: No ads during onboarding
        if (auth.user.onboardingCompleted === false) return;

        // Apple 5.5: No ads on blocked screens (focus timer, chat, onboarding)
        if (screenName && BLOCKED_SCREENS.indexOf(screenName) !== -1) return;

        // Apple 5.5: No ads in first session (1 hour)
        AsyncStorage.getItem(FIRST_SESSION_KEY).then(function (fsVal) {
          if (!fsVal) {
            AsyncStorage.setItem(FIRST_SESSION_KEY, String(Date.now()));
            return; // first session — suppress
          }
          var ts = parseInt(fsVal, 10);
          if (Date.now() - ts < 3600000) return; // within 1st hour

          AsyncStorage.getItem(NAV_KEY).then(function (val) {
            var navCount = parseInt(val || '0', 10) + 1;
            AsyncStorage.setItem(NAV_KEY, String(navCount));

            if (navCount % frequency === 0) {
              // ─── Try AdMob first ─────────────────────────────
              if (canUseAdMob && admobReadyRef.current && admobInterstitialRef.current) {
                admobInterstitialRef.current.show().catch(function (err) {
                  console.warn('[AdInterstitial] AdMob show failed, falling back to self-promo:', err);
                  _showSelfPromo();
                });
                return;
              }

              // ─── Self-promo fallback ─────────────────────────
              _showSelfPromo();
            }
          });
        });

        function _showSelfPromo() {
          var idx = Math.floor(Math.random() * PROMO_SLIDES.length);
          setSlideIndex(idx);
          setCountdown(COUNTDOWN_SECONDS);
          setCanClose(false);
          setVisible(true);

          // Track impression
          AsyncStorage.getItem(IMPRESSIONS_KEY).then(function (v) {
            var c = parseInt(v || '0', 10);
            AsyncStorage.setItem(IMPRESSIONS_KEY, String(c + 1));
          });

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      },
    };
  });

  // Countdown
  useEffect(function () {
    if (!visible) return;

    timerRef.current = setInterval(function () {
      setCountdown(function (prev) {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return function () {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  var handleClose = useCallback(function () {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(function () {
      setVisible(false);
    });
    if (timerRef.current) clearInterval(timerRef.current);
  }, [fadeAnim]);

  var handleUpgrade = useCallback(function () {
    setVisible(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (onUpgrade) onUpgrade();
  }, [onUpgrade]);

  if (!auth.user || !auth.isFreeTier) return null;
  if (!visible) return null;

  var slide = PROMO_SLIDES[slideIndex];
  var HeroContainer = LinearGradient || View;
  var heroProps = LinearGradient
    ? { colors: slide.gradient, style: styles.hero }
    : { style: [styles.hero, { backgroundColor: slide.gradient[0] }] };

  return React.createElement(Modal, {
    visible: visible,
    transparent: true,
    animationType: 'none',
    statusBarTranslucent: true,
  },
    React.createElement(Animated.View, { style: [styles.overlay, { opacity: fadeAnim }] },
      React.createElement(View, { style: styles.card },
        // Hero
        React.createElement(HeroContainer, heroProps,
          // Close / countdown
          React.createElement(View, { style: styles.countdownWrap },
            canClose
              ? React.createElement(TouchableOpacity, {
                  style: styles.closeBtn,
                  onPress: handleClose,
                  accessible: true,
                  accessibilityLabel: 'Close ad',
                  accessibilityRole: 'button',
                },
                  React.createElement(Icon, { name: 'x', size: 16, color: '#fff' })
                )
              : React.createElement(View, { style: styles.countdownBadge },
                  React.createElement(Text, { style: styles.countdownText }, countdown)
                )
          ),

          // Icon
          React.createElement(View, { style: styles.heroIcon },
            React.createElement(Icon, { name: slide.icon, size: 32, color: '#fff' })
          ),

          // Title
          React.createElement(Text, { style: styles.heroTitle }, slide.text),
          React.createElement(Text, { style: styles.heroSubtitle }, 'Go Premium \u2014 No More Ads')
        ),

        // CTA section
        React.createElement(View, { style: styles.ctaSection },
          React.createElement(TouchableOpacity, {
            style: styles.upgradeBtn,
            onPress: handleUpgrade,
            activeOpacity: 0.85,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Go Premium, no more ads',
          },
            React.createElement(Icon, { name: 'award', size: 18, color: '#fff' }),
            React.createElement(Text, { style: styles.upgradeBtnText }, 'Go Premium')
          ),

          canClose
            ? React.createElement(TouchableOpacity, {
                style: styles.dismissBtn,
                onPress: handleClose,
                accessible: true,
                accessibilityLabel: 'Close',
                accessibilityRole: 'button',
              },
                React.createElement(Text, { style: styles.dismissBtnText }, 'Close')
              )
            : null,

          React.createElement(Text, { style: styles.sponsoredLabel }, 'Sponsored')
        )
      )
    )
  );
});

var styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  hero: {
    paddingVertical: SPACING.xxxl + 8,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
  },
  countdownWrap: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.sm,
    maxWidth: 280,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  ctaSection: {
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.cardBg,
  },
  upgradeBtn: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: BRAND.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  dismissBtn: {
    width: '100%',
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  sponsoredLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    opacity: 0.6,
    marginTop: SPACING.xs,
  },
});

module.exports = AdInterstitial;
