/**
 * Tests for src/services/transforms.js
 * Covers snakeToCamel and camelToSnake with flat objects, nested objects,
 * arrays, primitives, special types (Date, null, undefined), and edge cases.
 */

var transforms = require('./transforms');
var snakeToCamel = transforms.snakeToCamel;
var camelToSnake = transforms.camelToSnake;

describe('snakeToCamel', function () {
  // ─── Primitives / null / undefined ────────────────────────────

  it('returns null as-is', function () {
    expect(snakeToCamel(null)).toBeNull();
  });

  it('returns undefined as-is', function () {
    expect(snakeToCamel(undefined)).toBeUndefined();
  });

  it('returns string as-is', function () {
    expect(snakeToCamel('hello_world')).toBe('hello_world');
  });

  it('returns number as-is', function () {
    expect(snakeToCamel(42)).toBe(42);
  });

  it('returns boolean as-is', function () {
    expect(snakeToCamel(true)).toBe(true);
  });

  // ─── Flat objects ─────────────────────────────────────────────

  it('converts snake_case keys to camelCase', function () {
    expect(snakeToCamel({ first_name: 'John', last_name: 'Doe' })).toEqual({
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('keeps already-camelCase keys unchanged', function () {
    expect(snakeToCamel({ firstName: 'John' })).toEqual({ firstName: 'John' });
  });

  it('converts keys with multiple underscores', function () {
    expect(snakeToCamel({ created_at_date: '2026-01-01' })).toEqual({
      createdAtDate: '2026-01-01',
    });
  });

  it('does not modify string values (only keys)', function () {
    expect(snakeToCamel({ action: 'downgrade_scheduled' })).toEqual({
      action: 'downgrade_scheduled',
    });
  });

  // ─── Nested objects ───────────────────────────────────────────

  it('recursively converts nested objects', function () {
    var input = {
      user_profile: {
        first_name: 'Jane',
        account_info: {
          is_active: true,
        },
      },
    };
    expect(snakeToCamel(input)).toEqual({
      userProfile: {
        firstName: 'Jane',
        accountInfo: {
          isActive: true,
        },
      },
    });
  });

  // ─── Arrays ───────────────────────────────────────────────────

  it('converts objects inside arrays', function () {
    var input = [{ user_name: 'a' }, { user_name: 'b' }];
    expect(snakeToCamel(input)).toEqual([{ userName: 'a' }, { userName: 'b' }]);
  });

  it('returns array of primitives as-is', function () {
    expect(snakeToCamel([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('handles empty array', function () {
    expect(snakeToCamel([])).toEqual([]);
  });

  // ─── Special types ────────────────────────────────────────────

  it('returns Date instances as-is', function () {
    var d = new Date('2026-01-01');
    expect(snakeToCamel(d)).toBe(d);
  });

  it('handles empty object', function () {
    expect(snakeToCamel({})).toEqual({});
  });

  // ─── Keys with numbers ────────────────────────────────────────

  it('converts keys with numbers after underscore', function () {
    expect(snakeToCamel({ level_2_score: 10 })).toEqual({ level2Score: 10 });
  });
});

describe('camelToSnake', function () {
  // ─── Primitives / null / undefined ────────────────────────────

  it('returns null as-is', function () {
    expect(camelToSnake(null)).toBeNull();
  });

  it('returns undefined as-is', function () {
    expect(camelToSnake(undefined)).toBeUndefined();
  });

  it('returns string as-is', function () {
    expect(camelToSnake('helloWorld')).toBe('helloWorld');
  });

  it('returns number as-is', function () {
    expect(camelToSnake(42)).toBe(42);
  });

  // ─── Flat objects ─────────────────────────────────────────────

  it('converts camelCase keys to snake_case', function () {
    expect(camelToSnake({ firstName: 'John', lastName: 'Doe' })).toEqual({
      first_name: 'John',
      last_name: 'Doe',
    });
  });

  it('keeps already-snake_case keys unchanged', function () {
    expect(camelToSnake({ first_name: 'John' })).toEqual({ first_name: 'John' });
  });

  it('does not modify string values (only keys)', function () {
    expect(camelToSnake({ action: 'downgradeScheduled' })).toEqual({
      action: 'downgradeScheduled',
    });
  });

  // ─── Nested objects ───────────────────────────────────────────

  it('recursively converts nested objects', function () {
    var input = {
      userProfile: {
        firstName: 'Jane',
        accountInfo: {
          isActive: true,
        },
      },
    };
    expect(camelToSnake(input)).toEqual({
      user_profile: {
        first_name: 'Jane',
        account_info: {
          is_active: true,
        },
      },
    });
  });

  // ─── Arrays ───────────────────────────────────────────────────

  it('converts objects inside arrays', function () {
    var input = [{ userName: 'a' }, { userName: 'b' }];
    expect(camelToSnake(input)).toEqual([{ user_name: 'a' }, { user_name: 'b' }]);
  });

  it('handles empty array', function () {
    expect(camelToSnake([])).toEqual([]);
  });

  // ─── Special types ────────────────────────────────────────────

  it('returns Date instances as-is', function () {
    var d = new Date('2026-01-01');
    expect(camelToSnake(d)).toBe(d);
  });

  it('handles empty object', function () {
    expect(camelToSnake({})).toEqual({});
  });
});

describe('roundtrip', function () {
  it('snake -> camel -> snake returns original', function () {
    var original = { first_name: 'John', last_name: 'Doe', is_active: true };
    expect(camelToSnake(snakeToCamel(original))).toEqual(original);
  });

  it('camel -> snake -> camel returns original', function () {
    var original = { firstName: 'John', lastName: 'Doe', isActive: true };
    expect(snakeToCamel(camelToSnake(original))).toEqual(original);
  });
});
