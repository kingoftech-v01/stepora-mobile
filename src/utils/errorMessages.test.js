/**
 * Tests for src/utils/errorMessages.js
 * Covers getUserMessage and logError with all error types, HTTP statuses,
 * subscription gating, quota limits, Django error humanization, and edge cases.
 */

// Mock logger to prevent console output and verify calls
jest.mock('./logger', function () {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  };
});

var errorMessages = require('./errorMessages');
var getUserMessage = errorMessages.getUserMessage;
var logError = errorMessages.logError;
var logger = require('./logger');

beforeEach(function () {
  jest.clearAllMocks();
});

describe('getUserMessage', function () {
  // ─── Null / undefined / falsy errors ─────────────────────────────

  describe('null/undefined errors', function () {
    it('returns default message when err is null', function () {
      expect(getUserMessage(null)).toBe('An unexpected error occurred.');
    });

    it('returns default message when err is undefined', function () {
      expect(getUserMessage(undefined)).toBe('An unexpected error occurred.');
    });

    it('returns custom fallback when err is null', function () {
      expect(getUserMessage(null, 'Custom fallback')).toBe('Custom fallback');
    });

    it('returns default fallback when err is falsy (0)', function () {
      expect(getUserMessage(0)).toBe('An unexpected error occurred.');
    });
  });

  // ─── Network / offline errors ─────────────────────────────────────

  describe('network/offline errors', function () {
    it('returns offline message when err.offline is true', function () {
      var err = { offline: true, message: 'Network error' };
      expect(getUserMessage(err)).toBe(
        'You appear to be offline. Check your connection and try again.',
      );
    });

    it('returns offline message for "network" in message', function () {
      var err = { message: 'Network request failed' };
      expect(getUserMessage(err)).toBe(
        'You appear to be offline. Check your connection and try again.',
      );
    });

    it('returns offline message for "fetch" in message', function () {
      var err = { message: 'Failed to fetch' };
      expect(getUserMessage(err)).toBe(
        'You appear to be offline. Check your connection and try again.',
      );
    });

    it('returns offline message for "load failed" in message', function () {
      var err = { message: 'Load failed' };
      expect(getUserMessage(err)).toBe(
        'You appear to be offline. Check your connection and try again.',
      );
    });
  });

  // ─── Subscription-gated 403 ──────────────────────────────────────

  describe('subscription-gated 403', function () {
    it('returns subscription message with feature name', function () {
      var err = {
        status: 403,
        message: 'Forbidden',
        body: {
          code: 'subscription_required',
          requiredTier: 'premium',
          featureName: 'AI Analysis',
        },
      };
      expect(getUserMessage(err)).toBe('AI Analysis requires a Premium subscription.');
    });

    it('returns generic subscription message without feature name', function () {
      var err = {
        status: 403,
        message: 'Forbidden',
        body: { code: 'subscription_required', requiredTier: 'pro' },
      };
      expect(getUserMessage(err)).toBe('This feature requires a Pro subscription.');
    });

    it('defaults tier to Premium when requiredTier missing', function () {
      var err = {
        status: 403,
        message: 'Forbidden',
        body: { code: 'subscription_required' },
      };
      expect(getUserMessage(err)).toBe('This feature requires a Premium subscription.');
    });

    it('does not trigger subscription path for regular 403', function () {
      var err = {
        status: 403,
        message: '',
        body: { code: 'other_code' },
      };
      // Should fall through to status-based message
      expect(getUserMessage(err)).toBe("You don't have permission to do that.");
    });
  });

  // ─── Daily quota 429 ──────────────────────────────────────────────

  describe('daily quota 429', function () {
    it('returns quota message for daily_quota_exceeded', function () {
      var err = {
        status: 429,
        message: 'Too many requests',
        body: { code: 'daily_quota_exceeded' },
      };
      expect(getUserMessage(err)).toBe(
        "You've reached your daily limit for this feature. It resets at midnight UTC.",
      );
    });

    it('returns generic 429 message for non-quota rate limit', function () {
      var err = { status: 429, message: '' };
      expect(getUserMessage(err)).toBe(
        'Too many requests. Please wait a moment and try again.',
      );
    });
  });

  // ─── Django/DRF error humanization ─────────────────────────────────

  describe('Django error humanization', function () {
    it('humanizes "unable to log in with provided credentials"', function () {
      var err = { message: 'Unable to log in with provided credentials.' };
      expect(getUserMessage(err)).toBe('Incorrect email or password.');
    });

    it('humanizes "no active account found"', function () {
      var err = { message: 'No active account found with the given credentials' };
      expect(getUserMessage(err)).toBe('No account found with this email.');
    });

    it('humanizes "password is too short"', function () {
      var err = { message: 'This password is too short.' };
      expect(getUserMessage(err)).toBe('Password must be at least 8 characters.');
    });

    it('humanizes "password is too common"', function () {
      var err = { message: 'This password is too common.' };
      expect(getUserMessage(err)).toBe(
        'This password is too easy to guess. Try something more unique.',
      );
    });

    it('humanizes "two password fields didn\'t match"', function () {
      var err = { message: "The two password fields didn't match." };
      expect(getUserMessage(err)).toBe("Passwords don't match.");
    });

    it('humanizes "already registered with this email"', function () {
      var err = { message: 'A user is already registered with this e-mail address.' };
      expect(getUserMessage(err)).toBe(
        'An account with this email already exists. Try signing in.',
      );
    });

    it('humanizes "user with this email already exists"', function () {
      var err = { message: 'user with this email already exists.' };
      expect(getUserMessage(err)).toBe(
        'An account with this email already exists. Try signing in.',
      );
    });

    it('humanizes "enter a valid email"', function () {
      var err = { message: 'Enter a valid email address.' };
      expect(getUserMessage(err)).toBe('Please enter a valid email address.');
    });

    it('humanizes "this field is required"', function () {
      var err = { message: 'This field is required.' };
      expect(getUserMessage(err)).toBe('Please fill in all required fields.');
    });

    it('humanizes "this field may not be blank"', function () {
      var err = { message: 'This field may not be blank.' };
      expect(getUserMessage(err)).toBe('Please fill in all required fields.');
    });

    it('humanizes "token invalid"', function () {
      var err = { message: 'Token is invalid or has expired.' };
      expect(getUserMessage(err)).toBe('This link has expired. Please request a new one.');
    });

    it('humanizes "account locked"', function () {
      var err = { message: 'Your account has been locked due to too many attempts.' };
      expect(getUserMessage(err)).toBe('Account temporarily locked. Please try again later.');
    });

    it('extracts message from Python ErrorDetail repr', function () {
      var err = {
        message:
          "ErrorDetail(string='Unable to log in with provided credentials.', code='authorization')",
      };
      expect(getUserMessage(err)).toBe('Incorrect email or password.');
    });

    it('returns null (falls through) for raw Python output like non_field_errors', function () {
      var err = { message: 'non_field_errors: something', status: 500 };
      expect(getUserMessage(err)).toBe(
        'Something went wrong on our end. Please try again later.',
      );
    });
  });

  // ─── HTTP status-based messages ────────────────────────────────────

  describe('HTTP status messages', function () {
    it('returns message for 400', function () {
      var err = { status: 400, message: '' };
      expect(getUserMessage(err)).toBe(
        'Something was wrong with your request. Please check your input.',
      );
    });

    it('returns message for 401', function () {
      var err = { status: 401 };
      expect(getUserMessage(err)).toBe('Your session has expired. Please log in again.');
    });

    it('returns message for 404', function () {
      var err = { status: 404 };
      expect(getUserMessage(err)).toBe('The requested resource was not found.');
    });

    it('returns message for 500', function () {
      var err = { status: 500 };
      expect(getUserMessage(err)).toBe(
        'Something went wrong on our end. Please try again later.',
      );
    });

    it('returns message for 502', function () {
      var err = { status: 502 };
      expect(getUserMessage(err)).toBe(
        'The service is temporarily unavailable. Please try again in a moment.',
      );
    });

    it('returns message for 503', function () {
      var err = { status: 503 };
      expect(getUserMessage(err)).toBe(
        'The service is under maintenance. Please try again later.',
      );
    });

    it('returns message for 504', function () {
      var err = { status: 504 };
      expect(getUserMessage(err)).toBe(
        'The server took too long to respond. Please try again.',
      );
    });
  });

  // ─── 400 with body detail and field errors ─────────────────────────

  describe('400 with body detail', function () {
    it('humanizes body.detail for 400 errors', function () {
      var err = {
        status: 400,
        message: '',
        body: { detail: 'Unable to log in with provided credentials.' },
      };
      expect(getUserMessage(err)).toBe('Incorrect email or password.');
    });

    it('humanizes first field error for 400', function () {
      var err = {
        status: 400,
        message: '',
        body: { email: 'invalid' },
        fieldErrors: { email: 'Enter a valid email address.' },
      };
      expect(getUserMessage(err)).toBe('Please enter a valid email address.');
    });

    it('falls back to generic 400 message when body detail not humanizable', function () {
      var err = {
        status: 400,
        message: '',
        body: { detail: 'ErrorDetail(password1=wrong)' },
      };
      expect(getUserMessage(err)).toBe(
        'Something was wrong with your request. Please check your input.',
      );
    });
  });

  // ─── Unknown status / fallback ─────────────────────────────────────

  describe('unknown status / fallback', function () {
    it('returns fallback for unknown status', function () {
      var err = { status: 999 };
      expect(getUserMessage(err)).toBe('An unexpected error occurred. Please try again.');
    });

    it('returns custom fallback for unknown status', function () {
      var err = { status: 999 };
      expect(getUserMessage(err, 'Custom error')).toBe('Custom error');
    });

    it('passes through non-DRF messages as-is', function () {
      var err = { message: 'Something specific happened' };
      expect(getUserMessage(err)).toBe('Something specific happened');
    });
  });
});

describe('logError', function () {
  it('logs error with context and status', function () {
    logError('TestContext', { status: 400, message: 'Bad request' });
    expect(logger.error).toHaveBeenCalledWith(
      '[TestContext]',
      'status=400',
      'Bad request',
    );
  });

  it('logs unknown error when message is missing', function () {
    logError('TestContext', { status: 500 });
    expect(logger.error).toHaveBeenCalledWith(
      '[TestContext]',
      'status=500',
      'unknown error',
    );
  });

  it('logs ? for status when status is missing', function () {
    logError('TestContext', { message: 'oops' });
    expect(logger.error).toHaveBeenCalledWith('[TestContext]', 'status=?', 'oops');
  });

  it('does nothing when err is null', function () {
    logError('TestContext', null);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does nothing when err is undefined', function () {
    logError('TestContext', undefined);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
