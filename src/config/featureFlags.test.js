/**
 * Tests for src/config/featureFlags.js
 * Covers FEATURES object, isEnabled function for all flags and unknown flags.
 */

var featureFlags = require('./featureFlags');

describe('featureFlags', function () {
  describe('FEATURES', function () {
    it('has GOOGLE_AUTH flag set to false', function () {
      expect(featureFlags.FEATURES.GOOGLE_AUTH).toBe(false);
    });

    it('has GOOGLE_CALENDAR flag set to false', function () {
      expect(featureFlags.FEATURES.GOOGLE_CALENDAR).toBe(false);
    });

    it('has SEARCH flag set to false', function () {
      expect(featureFlags.FEATURES.SEARCH).toBe(false);
    });

    it('has MESSAGES flag set to false', function () {
      expect(featureFlags.FEATURES.MESSAGES).toBe(false);
    });

    it('contains exactly 4 flags', function () {
      expect(Object.keys(featureFlags.FEATURES)).toHaveLength(4);
    });
  });

  describe('isEnabled', function () {
    it('returns false for GOOGLE_AUTH', function () {
      expect(featureFlags.isEnabled('GOOGLE_AUTH')).toBe(false);
    });

    it('returns false for GOOGLE_CALENDAR', function () {
      expect(featureFlags.isEnabled('GOOGLE_CALENDAR')).toBe(false);
    });

    it('returns false for SEARCH', function () {
      expect(featureFlags.isEnabled('SEARCH')).toBe(false);
    });

    it('returns false for MESSAGES', function () {
      expect(featureFlags.isEnabled('MESSAGES')).toBe(false);
    });

    it('returns false for unknown feature flag', function () {
      expect(featureFlags.isEnabled('NONEXISTENT_FLAG')).toBe(false);
    });

    it('returns false for undefined feature', function () {
      expect(featureFlags.isEnabled(undefined)).toBe(false);
    });

    it('returns false for null feature', function () {
      expect(featureFlags.isEnabled(null)).toBe(false);
    });

    it('returns true when a flag is manually set to true', function () {
      // Temporarily set a flag
      var original = featureFlags.FEATURES.SEARCH;
      featureFlags.FEATURES.SEARCH = true;

      expect(featureFlags.isEnabled('SEARCH')).toBe(true);

      // Restore
      featureFlags.FEATURES.SEARCH = original;
    });
  });

  describe('exports', function () {
    it('exports FEATURES object', function () {
      expect(typeof featureFlags.FEATURES).toBe('object');
    });

    it('exports isEnabled function', function () {
      expect(typeof featureFlags.isEnabled).toBe('function');
    });
  });
});
