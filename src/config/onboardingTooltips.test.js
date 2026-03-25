/**
 * Tests for src/config/onboardingTooltips.js
 * Validates tooltip configuration structure and helper functions.
 */

var ONBOARDING_TOOLTIPS = require('./onboardingTooltips');
var { getTooltipConfig, getTooltipCount } = require('./onboardingTooltips');

describe('onboardingTooltips.js', function () {
  describe('ONBOARDING_TOOLTIPS structure', function () {
    it('is a non-empty object', function () {
      expect(typeof ONBOARDING_TOOLTIPS).toBe('object');
      expect(Object.keys(ONBOARDING_TOOLTIPS).length).toBeGreaterThan(0);
    });

    it('every entry has an id, message, position, and target', function () {
      var screenNames = Object.keys(ONBOARDING_TOOLTIPS).filter(function (k) {
        // filter out exported helper functions
        return typeof ONBOARDING_TOOLTIPS[k] !== 'function';
      });

      screenNames.forEach(function (screenName) {
        var config = ONBOARDING_TOOLTIPS[screenName];
        var tooltips = Array.isArray(config) ? config : [config];

        tooltips.forEach(function (tip, idx) {
          expect(tip).toHaveProperty('id');
          expect(tip).toHaveProperty('message');
          expect(tip).toHaveProperty('position');
          expect(tip).toHaveProperty('target');

          expect(typeof tip.id).toBe('string');
          expect(tip.id.length).toBeGreaterThan(0);
          expect(typeof tip.message).toBe('string');
          expect(tip.message.length).toBeGreaterThan(0);
          expect(['top', 'bottom']).toContain(tip.position);
          expect(typeof tip.target).toBe('string');
          expect(tip.target.length).toBeGreaterThan(0);
        });
      });
    });

    it('all tooltip ids are unique', function () {
      var ids = [];
      var screenNames = Object.keys(ONBOARDING_TOOLTIPS).filter(function (k) {
        return typeof ONBOARDING_TOOLTIPS[k] !== 'function';
      });

      screenNames.forEach(function (screenName) {
        var config = ONBOARDING_TOOLTIPS[screenName];
        var tooltips = Array.isArray(config) ? config : [config];
        tooltips.forEach(function (tip) {
          ids.push(tip.id);
        });
      });

      var unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('includes expected screens', function () {
      expect(ONBOARDING_TOOLTIPS).toHaveProperty('HomeScreen');
      expect(ONBOARDING_TOOLTIPS).toHaveProperty('DreamsListScreen');
      expect(ONBOARDING_TOOLTIPS).toHaveProperty('CalendarScreen');
      expect(ONBOARDING_TOOLTIPS).toHaveProperty('ProfileScreen');
    });

    it('DreamDetailScreen has multiple tooltips', function () {
      expect(Array.isArray(ONBOARDING_TOOLTIPS.DreamDetailScreen)).toBe(true);
      expect(ONBOARDING_TOOLTIPS.DreamDetailScreen.length).toBeGreaterThan(1);
    });
  });

  describe('getTooltipConfig', function () {
    it('returns config for a known screen', function () {
      var config = getTooltipConfig('HomeScreen');
      expect(config).not.toBeNull();
      expect(config.id).toBe('home_welcome');
      expect(config.message).toBeTruthy();
    });

    it('returns null for unknown screen', function () {
      expect(getTooltipConfig('NonExistentScreen')).toBeNull();
    });

    it('returns first tooltip for array screens when no index', function () {
      var config = getTooltipConfig('DreamDetailScreen');
      expect(config).not.toBeNull();
      expect(config.id).toBe('dream_detail_checkin');
    });

    it('returns specific tooltip by index for array screens', function () {
      var config = getTooltipConfig('DreamDetailScreen', 1);
      expect(config).not.toBeNull();
      expect(config.id).toBe('dream_detail_calibrate');
    });

    it('returns null for out-of-bounds index', function () {
      var config = getTooltipConfig('DreamDetailScreen', 99);
      expect(config).toBeNull();
    });

    it('returns single tooltip for non-array screens regardless of index', function () {
      // Non-array screens should return the single config
      var config = getTooltipConfig('HomeScreen');
      expect(config).not.toBeNull();
      expect(config.id).toBe('home_welcome');
    });
  });

  describe('getTooltipCount', function () {
    it('returns 1 for single-tooltip screens', function () {
      expect(getTooltipCount('HomeScreen')).toBe(1);
      expect(getTooltipCount('DreamsListScreen')).toBe(1);
      expect(getTooltipCount('CalendarScreen')).toBe(1);
    });

    it('returns correct count for multi-tooltip screens', function () {
      expect(getTooltipCount('DreamDetailScreen')).toBe(2);
    });

    it('returns 0 for unknown screens', function () {
      expect(getTooltipCount('FakeScreen')).toBe(0);
    });
  });
});
