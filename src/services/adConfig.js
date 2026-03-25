/**
 * adConfig — Central configuration for ad display (Google AdMob + self-promo fallback).
 *
 * Toggle `admobEnabled` to true once real AdMob ad unit IDs are configured
 * in the AdMob dashboard. Until then, self-promo ads are shown.
 *
 * Test ad unit IDs are provided by Google for development/testing and will
 * always serve a test ad — never use them in production builds.
 */

var AD_CONFIG = {
  // ─── Master toggle ───────────────────────────────────────────────
  // Set to true when real AdMob ad unit IDs are configured.
  // When false, all ad components fall back to self-promo ads.
  admobEnabled: false,

  // ─── Production ad unit IDs ──────────────────────────────────────
  // Replace these placeholders with real IDs from your AdMob dashboard.
  bannerAdUnit: '__ADMOB_BANNER_ID__',
  interstitialAdUnit: '__ADMOB_INTERSTITIAL_ID__',
  nativeAdUnit: '__ADMOB_NATIVE_ID__',

  // ─── Test ad unit IDs (Google official test IDs) ─────────────────
  testBannerAdUnit: 'ca-app-pub-3940256099942544/6300978111',
  testInterstitialAdUnit: 'ca-app-pub-3940256099942544/1033173712',
  testNativeAdUnit: 'ca-app-pub-3940256099942544/2247696110',

  // ─── Derived flags ───────────────────────────────────────────────
  get useSelfPromo() {
    return !this.admobEnabled;
  },

  /**
   * Returns the appropriate ad unit ID for a given placement.
   * In __DEV__ mode, always returns the test ID to avoid invalid traffic.
   * @param {'banner'|'interstitial'|'native'} placement
   * @returns {string}
   */
  getAdUnitId: function (placement) {
    var testIds = {
      banner: AD_CONFIG.testBannerAdUnit,
      interstitial: AD_CONFIG.testInterstitialAdUnit,
      native: AD_CONFIG.testNativeAdUnit,
    };
    var prodIds = {
      banner: AD_CONFIG.bannerAdUnit,
      interstitial: AD_CONFIG.interstitialAdUnit,
      native: AD_CONFIG.nativeAdUnit,
    };

    // Always use test IDs in development to avoid AdMob policy violations
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      return testIds[placement] || testIds.banner;
    }
    return prodIds[placement] || prodIds.banner;
  },
};

module.exports = AD_CONFIG;
