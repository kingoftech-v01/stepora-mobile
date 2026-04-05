/**
 * Tests for src/utils/sanitize.js
 * Covers isValidEmail, sanitizeText, and validateRequired with valid,
 * invalid, and edge-case inputs.
 */

var sanitize = require('./sanitize');

describe('isValidEmail', function () {
  it('returns true for valid email', function () {
    expect(sanitize.isValidEmail('user@example.com')).toBe(true);
  });

  it('returns true for email with subdomain', function () {
    expect(sanitize.isValidEmail('user@mail.example.co.uk')).toBe(true);
  });

  it('returns true for email with plus addressing', function () {
    expect(sanitize.isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('returns true for email with leading/trailing spaces (trims)', function () {
    expect(sanitize.isValidEmail('  user@example.com  ')).toBe(true);
  });

  it('returns false for empty string', function () {
    expect(sanitize.isValidEmail('')).toBe(false);
  });

  it('returns false for null', function () {
    expect(sanitize.isValidEmail(null)).toBe(false);
  });

  it('returns false for undefined', function () {
    expect(sanitize.isValidEmail(undefined)).toBe(false);
  });

  it('returns false for non-string', function () {
    expect(sanitize.isValidEmail(123)).toBe(false);
  });

  it('returns false for email without @', function () {
    expect(sanitize.isValidEmail('userexample.com')).toBe(false);
  });

  it('returns false for email without domain', function () {
    expect(sanitize.isValidEmail('user@')).toBe(false);
  });

  it('returns false for email without TLD', function () {
    expect(sanitize.isValidEmail('user@example')).toBe(false);
  });

  it('returns false for email with spaces in local part', function () {
    expect(sanitize.isValidEmail('us er@example.com')).toBe(false);
  });
});

describe('sanitizeText', function () {
  it('returns cleaned text', function () {
    expect(sanitize.sanitizeText('Hello World')).toBe('Hello World');
  });

  it('strips dangerous characters: < > " \' ` ; \\', function () {
    expect(sanitize.sanitizeText('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
  });

  it('trims whitespace', function () {
    expect(sanitize.sanitizeText('  hello  ')).toBe('hello');
  });

  it('truncates to maxLen', function () {
    expect(sanitize.sanitizeText('abcdefghij', 5)).toBe('abcde');
  });

  it('returns empty string for null', function () {
    expect(sanitize.sanitizeText(null)).toBe('');
  });

  it('returns empty string for undefined', function () {
    expect(sanitize.sanitizeText(undefined)).toBe('');
  });

  it('returns empty string for non-string', function () {
    expect(sanitize.sanitizeText(42)).toBe('');
  });

  it('returns empty string for empty string', function () {
    expect(sanitize.sanitizeText('')).toBe('');
  });

  it('returns empty string for whitespace-only string', function () {
    expect(sanitize.sanitizeText('   ')).toBe('');
  });

  it('handles maxLen of 0 (no truncation since falsy)', function () {
    expect(sanitize.sanitizeText('abc', 0)).toBe('abc');
  });

  it('handles text shorter than maxLen', function () {
    expect(sanitize.sanitizeText('hi', 100)).toBe('hi');
  });

  it('strips all backslashes', function () {
    expect(sanitize.sanitizeText('a\\b\\c')).toBe('abc');
  });
});

describe('validateRequired', function () {
  it('returns empty array when all fields present', function () {
    expect(sanitize.validateRequired({ name: 'John', email: 'a@b.c' })).toEqual([]);
  });

  it('returns missing field names for undefined values', function () {
    expect(sanitize.validateRequired({ name: undefined, email: 'a@b.c' })).toEqual([
      'name',
    ]);
  });

  it('returns missing field names for null values', function () {
    expect(sanitize.validateRequired({ name: null })).toEqual(['name']);
  });

  it('returns missing field names for empty string values', function () {
    expect(sanitize.validateRequired({ name: '', email: 'a@b.c' })).toEqual(['name']);
  });

  it('returns missing field names for whitespace-only strings', function () {
    expect(sanitize.validateRequired({ name: '   ' })).toEqual(['name']);
  });

  it('does not flag non-string falsy values like 0 and false', function () {
    expect(sanitize.validateRequired({ count: 0, active: false })).toEqual([]);
  });

  it('returns multiple missing fields', function () {
    var result = sanitize.validateRequired({ a: '', b: null, c: 'ok' });
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).not.toContain('c');
  });

  it('returns empty array for empty object', function () {
    expect(sanitize.validateRequired({})).toEqual([]);
  });
});
