import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

describe('arrays', () => {
  test('empty array', () => {
    const actual = canonicalize([]);
    const expected = '[]';
    assert.equal(actual, expected);
  });

  test('one element array', () => {
    const actual = canonicalize([123]);
    const expected = '[123]';
    assert.equal(actual, expected);
  });

  test('multi element array', () => {
    const actual = canonicalize([123, 456, 'hello']);
    const expected = '[123,456,"hello"]';
    assert.equal(actual, expected);
  });

  test('null and undefined values in array', () => {
    const actual = canonicalize([null, undefined, 'hello']);
    const expected = '[null,null,"hello"]';
    assert.equal(actual, expected);
  });

  test('object in array', () => {
    const actual = canonicalize([{ b: 123, a: 'string' }]);
    const expected = '[{"a":"string","b":123}]';
    assert.equal(actual, expected);
  });
});

describe('objects', () => {
  test('empty object', () => {
    const actual = canonicalize({});
    const expected = '{}';
    assert.equal(actual, expected);
  });

  test('object with undefined value', () => {
    const actual = canonicalize({ test: undefined });
    const expected = '{}';
    assert.equal(actual, expected);
  });

  test('object with null value', () => {
    const actual = canonicalize({ test: null });
    const expected = '{"test":null}';
    assert.equal(actual, expected);
  });

  test('object with one property', () => {
    const actual = canonicalize({ hello: 'world' });
    const expected = '{"hello":"world"}';
    assert.equal(actual, expected);
  });

  test('object with more than one property', () => {
    const actual = canonicalize({ hello: 'world', number: 123 });
    const expected = '{"hello":"world","number":123}';
    assert.equal(actual, expected);
  });

  test('object with number key', () => {
    const actual = canonicalize({ 42: 'foo' });
    const expected = '{"42":"foo"}';
    assert.equal(actual, expected);
  });

  test('object with symbol value', () => {
    const actual = canonicalize({ test: Symbol('hello world') });
    const expected = '{}';
    assert.equal(actual, expected);
  });

  test('object with symbol key', () => {
    const actual = canonicalize({ [Symbol('hello world')]: 'foo' });
    const expected = '{}';
    assert.equal(actual, expected);
  });
});

describe('primitive values', () => {
  test('undefined', () => {
    const actual = canonicalize(undefined);
    const expected = undefined;
    assert.equal(actual, expected);
  });

  test('null', () => {
    const actual = canonicalize(null);
    const expected = 'null';
    assert.equal(actual, expected);
  });

  test('symbol', () => {
    const actual = canonicalize(Symbol('hello world'));
    const expected = undefined;
    assert.equal(actual, expected);
  });
});

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

  test('toJSON returning self throws', () => {
    const input = {};
    input.toJSON = () => input;
    const expected = { message: 'Circular reference detected' };
    assert.throws(() => canonicalize(input), expected);
  });
});

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
