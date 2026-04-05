/**
 * Tests for src/services/stripe.js
 * This is a no-op stub (in-app payments disabled for store compliance).
 * Tests verify all functions are safe no-ops.
 */

var stripe = require('./stripe');

describe('stripe (disabled stub)', function () {
  describe('initializeStripe', function () {
    it('resolves to false', async function () {
      var result = await stripe.initializeStripe();
      expect(result).toBe(false);
    });
  });

  describe('presentPaymentSheet', function () {
    it('rejects with "not available" error', async function () {
      await expect(stripe.presentPaymentSheet()).rejects.toThrow(
        'In-app payments are not available',
      );
    });
  });

  describe('confirmSetupIntent', function () {
    it('rejects with "not available" error', async function () {
      await expect(stripe.confirmSetupIntent()).rejects.toThrow(
        'In-app payments are not available',
      );
    });
  });

  describe('handleURLCallback', function () {
    it('returns false', function () {
      expect(stripe.handleURLCallback()).toBe(false);
    });

    it('returns false regardless of arguments', function () {
      expect(stripe.handleURLCallback('some-url')).toBe(false);
    });
  });

  describe('getStripeProvider', function () {
    it('returns null', function () {
      expect(stripe.getStripeProvider()).toBeNull();
    });
  });

  describe('PUBLISHABLE_KEY', function () {
    it('is an empty string', function () {
      expect(stripe.PUBLISHABLE_KEY).toBe('');
    });
  });

  describe('exports', function () {
    it('exports all expected functions', function () {
      expect(typeof stripe.initializeStripe).toBe('function');
      expect(typeof stripe.presentPaymentSheet).toBe('function');
      expect(typeof stripe.confirmSetupIntent).toBe('function');
      expect(typeof stripe.handleURLCallback).toBe('function');
      expect(typeof stripe.getStripeProvider).toBe('function');
    });
  });
});
