import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

describe('values with no JSON representation', () => {
  test('function-valued property is skipped', () => {
    const input = { a: () => {}, b: 1 };
    const actual = canonicalize(input);
    const expected = '{"b":1}';
    assert.equal(actual, expected);
  });

  test('function in array becomes null', () => {
    const input = [1, () => {}, 2];
    const actual = canonicalize(input);
    const expected = '[1,null,2]';
    assert.equal(actual, expected);
  });

  test('toJSON returning undefined skips the property', () => {
    const input = { a: { toJSON: () => undefined }, b: 1 };
    const actual = canonicalize(input);
    const expected = '{"b":1}';
    assert.equal(actual, expected);
  });

  test('toJSON returning undefined in array becomes null', () => {
    const input = [1, { toJSON: () => undefined }, 2];
    const actual = canonicalize(input);
    const expected = '[1,null,2]';
    assert.equal(actual, expected);
  });

  test('top-level function returns undefined', () => {
    const actual = canonicalize(() => {});
    const expected = undefined;
    assert.equal(actual, expected);
  });

  test('BigInt throws', () => {
    const input = { a: 1n };
    assert.throws(() => canonicalize(input), TypeError);
  });
});

describe('boxed primitives', () => {
  test('boxed Number is unwrapped', () => {
    const input = { a: new Number(5) };
    const actual = canonicalize(input);
    const expected = '{"a":5}';
    assert.equal(actual, expected);
  });

  test('boxed String is unwrapped', () => {
    const input = { a: new String('x') };
    const actual = canonicalize(input);
    const expected = '{"a":"x"}';
    assert.equal(actual, expected);
  });

  test('boxed Boolean is unwrapped', () => {
    const input = { a: new Boolean(true) };
    const actual = canonicalize(input);
    const expected = '{"a":true}';
    assert.equal(actual, expected);
  });

  test('boxed NaN throws', () => {
    const input = { a: new Number(NaN) };
    const expected = { message: 'NaN is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });
});

describe('unusual objects and arrays', () => {
  test('sparse array holes become null', () => {
    // eslint-disable-next-line no-sparse-arrays
    const input = [1, , 3];
    const actual = canonicalize(input);
    const expected = '[1,null,3]';
    assert.equal(actual, expected);
  });

  test('null-prototype object', () => {
    const input = Object.assign(Object.create(null), { b: 1, a: 2 });
    const actual = canonicalize(input);
    const expected = '{"a":2,"b":1}';
    assert.equal(actual, expected);
  });

  test('inherited properties are not serialized', () => {
    const input = Object.create({ inherited: 1 });
    input.own = 2;
    const actual = canonicalize(input);
    const expected = '{"own":2}';
    assert.equal(actual, expected);
  });

  test('non-enumerable properties are not serialized', () => {
    const input = { visible: 1 };
    Object.defineProperty(input, 'hidden', { value: 2, enumerable: false });
    const actual = canonicalize(input);
    const expected = '{"visible":1}';
    assert.equal(actual, expected);
  });
});
