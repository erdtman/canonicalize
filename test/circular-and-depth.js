import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

describe('circular references', () => {
  test('object referencing itself throws', () => {
    const input = {};
    input.self = input;
    const expected = { message: 'Circular reference detected' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('array referencing itself throws', () => {
    const input = [];
    input.push(input);
    const expected = { message: 'Circular reference detected' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('nested circular reference throws', () => {
    const a = {};
    const b = { a };
    a.b = b;
    const expected = { message: 'Circular reference detected' };
    assert.throws(() => canonicalize(a), expected);
  });

  test('same object referenced twice (non-circular) is allowed', () => {
    const shared = { z: 1 };
    const actual = canonicalize({ x: shared, y: shared });
    const expected = '{"x":{"z":1},"y":{"z":1}}';
    assert.equal(actual, expected);
  });
});

describe('deep nesting', () => {
  test('deeply nested arrays do not overflow the call stack', () => {
    const depth = 100000;
    let input = [];
    for (let i = 0; i < depth; i++) {
      input = [input];
    }
    const actual = canonicalize(input);
    const expected = '['.repeat(depth + 1) + ']'.repeat(depth + 1);
    assert.equal(actual, expected);
  });

  test('deeply nested objects do not overflow the call stack', () => {
    const depth = 100000;
    let input = {};
    for (let i = 0; i < depth; i++) {
      input = { a: input };
    }
    const actual = canonicalize(input);
    const expected = '{"a":'.repeat(depth) + '{}' + '}'.repeat(depth);
    assert.equal(actual, expected);
  });
});
