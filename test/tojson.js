import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

describe('toJSON', () => {
  test('object with toJSON', () => {
    const input = {
      a: 123,
      b: 456,
      toJSON: function () {
        return { b: this.b, a: this.a };
      }
    };
    const actual = canonicalize(input);
    const expected = '{"a":123,"b":456}';
    assert.equal(actual, expected);
  });

  test('nested object with toJSON is serialized recursively', () => {
    const inner = { toJSON: () => ({ z: 1, a: 2 }) };
    const actual = canonicalize({ x: inner });
    const expected = '{"x":{"a":2,"z":1}}';
    assert.equal(actual, expected);
  });

  test('toJSON returning NaN throws', () => {
    const input = { toJSON: () => NaN };
    const expected = { message: 'NaN is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('toJSON resolving to a primitive inside an array', () => {
    const input = [{ toJSON: () => 1 }, 2];
    const actual = canonicalize(input);
    const expected = '[1,2]';
    assert.equal(actual, expected);
  });

  test('top-level toJSON resolving to a primitive returns its serialization', () => {
    const input = { toJSON: () => 42 };
    const actual = canonicalize(input);
    const expected = '42';
    assert.equal(actual, expected);
  });

  test('toJSON returning self throws', () => {
    const input = {};
    input.toJSON = () => input;
    const expected = { message: 'Circular reference detected' };
    assert.throws(() => canonicalize(input), expected);
  });
});
