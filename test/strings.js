import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

describe('Unicode handling', () => {
  test('lone high surrogate in value throws', () => {
    const input = { key: '\uD800' };
    const expected = { message: 'Lone surrogate is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('lone low surrogate in value throws', () => {
    const input = { key: '\uDEAD' };
    const expected = { message: 'Lone surrogate is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('lone high surrogate before a non-low-surrogate throws', () => {
    const input = { key: '\uD800a' };
    const expected = { message: 'Lone surrogate is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('lone surrogate in object key throws', () => {
    const input = { ['\uD800']: 'value' };
    const expected = { message: 'Lone surrogate is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('valid surrogate pair is allowed', () => {
    const input = { key: '\uD83D\uDE00' };
    const actual = canonicalize(input);
    const expected = '{"key":"😀"}';
    assert.equal(actual, expected);
  });

  test('reversed surrogate pair throws', () => {
    const input = { key: '\uDC00\uD800' };
    const expected = { message: 'Lone surrogate is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('lone surrogate as array element throws', () => {
    const input = ['\uD800'];
    const expected = { message: 'Lone surrogate is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });
});

describe('string escaping', () => {
  test('C0 controls with shorthand escapes use them', () => {
    const input = '\b\t\n\f\r';
    const actual = canonicalize(input);
    const expected = '"\\b\\t\\n\\f\\r"';
    assert.equal(actual, expected);
  });

  test('other C0 controls use lowercase u-escapes', () => {
    const input = String.fromCharCode(0x00, 0x1f);
    const actual = canonicalize(input);
    const expected = '"\\u0000\\u001f"';
    assert.equal(actual, expected);
  });

  test('DEL and forward slash are not escaped', () => {
    const input = String.fromCharCode(0x7f) + '/';
    const actual = canonicalize(input);
    const expected = '"' + String.fromCharCode(0x7f) + '/"';
    assert.equal(actual, expected);
  });

  test('4999-char string takes the fast path unchanged', () => {
    const input = 'a'.repeat(4999);
    const actual = canonicalize(input);
    const expected = '"' + input + '"';
    assert.equal(actual, expected);
  });

  test('5000-char string takes the slow path with identical output', () => {
    const input = 'a'.repeat(5000);
    const actual = canonicalize(input);
    const expected = JSON.stringify(input);
    assert.equal(actual, expected);
  });

  test('long string with escapes matches JSON.stringify', () => {
    const input = ('x'.repeat(100) + '"\\\n').repeat(60);
    const actual = canonicalize(input);
    const expected = JSON.stringify(input);
    assert.equal(actual, expected);
  });

  test('lone surrogate in a long string is rejected on the slow path', () => {
    const input = 'a'.repeat(6000) + '\uD800';
    const expected = { message: 'Lone surrogate is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });
});
