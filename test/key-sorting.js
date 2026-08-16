import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

describe('key sorting', () => {
  test('keys sort by UTF-16 code unit, not code point', () => {
    // U+FB33 is a higher code unit than the surrogates encoding U+1F600.
    const input = { '\uFB33': 1, '\u{1F600}': 2 };
    const actual = canonicalize(input);
    const expected = '{"\u{1F600}":2,"\uFB33":1}';
    assert.equal(actual, expected);
  });

  test('sorting uses unescaped names', () => {
    const input = { 1: 'one', '\r': 'cr' };
    const actual = canonicalize(input);
    const expected = '{"\\r":"cr","1":"one"}';
    assert.equal(actual, expected);
  });

  test('insertion order does not affect output', () => {
    const actual = canonicalize({ b: 1, a: 2 });
    const expected = canonicalize({ a: 2, b: 1 });
    assert.equal(actual, expected);
  });

  test('U+FFFF key sorts after astral key (code-unit order)', () => {
    // U+FFFF is the highest BMP code unit, yet must sort after U+1F600
    // because the surrogates encoding U+1F600 start at 0xD83D.
    const input = { '\uFFFF': 1, '\u{1F600}': 2 };
    const actual = canonicalize(input);
    const expected = '{"\u{1F600}":2,"\uFFFF":1}';
    assert.equal(actual, expected);
  });

  test('more than 200 keys uses the Array.sort fallback and stays sorted', () => {
    // 250 keys inserted in scrambled order; i*7 mod 250 is a permutation.
    const keys = [];
    for (let i = 0; i < 250; i++) {
      keys.push(`k${(i * 7) % 250}`);
    }
    const input = {};
    for (const key of keys) {
      input[key] = 1;
    }
    const actual = canonicalize(input);
    const expected = '{' + keys.slice().sort().map((key) => `"${key}":1`).join(',') + '}';
    assert.equal(actual, expected);
  });
});
