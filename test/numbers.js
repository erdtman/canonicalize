import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

describe('NaN handling', () => {
  test('NaN in array', () => {
    const expected = { message: 'NaN is not allowed' };
    assert.throws(() => canonicalize([NaN]), expected);
  });

  test('NaN in object', () => {
    const expected = { message: 'NaN is not allowed' };
    assert.throws(() => canonicalize({ key: NaN }), expected);
  });

  test('NaN as top-level value', () => {
    const expected = { message: 'NaN is not allowed' };
    assert.throws(() => canonicalize(NaN), expected);
  });
});

describe('Infinity handling', () => {
  test('Infinity in array', () => {
    const expected = { message: 'Infinity is not allowed' };
    assert.throws(() => canonicalize([Infinity]), expected);
  });

  test('Infinity in object', () => {
    const expected = { message: 'Infinity is not allowed' };
    assert.throws(() => canonicalize({ key: Infinity }), expected);
  });

  test('-Infinity as top-level value', () => {
    const expected = { message: 'Infinity is not allowed' };
    assert.throws(() => canonicalize(-Infinity), expected);
  });
});

describe('number serialization', () => {
  const cases = [
    [1e21, '1e+21'],
    [1e20, '100000000000000000000'],
    [1e-7, '1e-7'],
    [0.000001, '0.000001'],
    [-0, '0'],
    [5e-324, '5e-324'],
    [1.7976931348623157e308, '1.7976931348623157e+308'],
    [1 / 3, '0.3333333333333333'],
    // eslint-disable-next-line no-loss-of-precision
    [333333333.33333329, '333333333.3333333'],
    [9007199254740991, '9007199254740991']
  ];
  for (const [input, expected] of cases) {
    test(`serializes as ${expected}`, () => {
      const actual = canonicalize(input);
      assert.equal(actual, expected);
    });
  }
});
