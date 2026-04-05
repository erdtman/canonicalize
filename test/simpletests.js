import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

describe('arrays', () => {
  test('empty array', () => {
    assert.equal(canonicalize([]), '[]');
  });

  test('one element array', () => {
    assert.equal(canonicalize([123]), '[123]');
  });

  test('multi element array', () => {
    assert.equal(canonicalize([123, 456, 'hello']), '[123,456,"hello"]');
  });

  test('null and undefined values in array', () => {
    assert.equal(canonicalize([null, undefined, 'hello']), '[null,null,"hello"]');
  });

  test('object in array', () => {
    assert.equal(canonicalize([{ b: 123, a: 'string' }]), '[{"a":"string","b":123}]');
  });
});

describe('objects', () => {
  test('empty object', () => {
    assert.equal(canonicalize({}), '{}');
  });

  test('object with undefined value', () => {
    assert.equal(canonicalize({ test: undefined }), '{}');
  });

  test('object with null value', () => {
    assert.equal(canonicalize({ test: null }), '{"test":null}');
  });

  test('object with one property', () => {
    assert.equal(canonicalize({ hello: 'world' }), '{"hello":"world"}');
  });

  test('object with more than one property', () => {
    assert.equal(canonicalize({ hello: 'world', number: 123 }), '{"hello":"world","number":123}');
  });

  test('object with number key', () => {
    assert.equal(canonicalize({ 42: 'foo' }), '{"42":"foo"}');
  });

  test('object with symbol value', () => {
    assert.equal(canonicalize({ test: Symbol('hello world') }), '{}');
  });

  test('object with symbol key', () => {
    assert.equal(canonicalize({ [Symbol('hello world')]: 'foo' }), '{}');
  });
});

describe('primitive values', () => {
  test('undefined', () => {
    assert.equal(canonicalize(undefined), undefined);
  });

  test('null', () => {
    assert.equal(canonicalize(null), 'null');
  });

  test('symbol', () => {
    assert.equal(canonicalize(Symbol('hello world')), undefined);
  });
});

describe('NaN handling', () => {
  test('NaN in array', () => {
    assert.throws(() => canonicalize([NaN]), { message: 'NaN is not allowed' });
  });

  test('NaN in object', () => {
    assert.throws(() => canonicalize({ key: NaN }), { message: 'NaN is not allowed' });
  });

  test('NaN as top-level value', () => {
    assert.throws(() => canonicalize(NaN), { message: 'NaN is not allowed' });
  });
});

describe('Infinity handling', () => {
  test('Infinity in array', () => {
    assert.throws(() => canonicalize([Infinity]), { message: 'Infinity is not allowed' });
  });

  test('Infinity in object', () => {
    assert.throws(() => canonicalize({ key: Infinity }), { message: 'Infinity is not allowed' });
  });

  test('-Infinity as top-level value', () => {
    assert.throws(() => canonicalize(-Infinity), { message: 'Infinity is not allowed' });
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
    assert.equal(canonicalize(input), '{"a":123,"b":456}');
  });

  test('nested object with toJSON is serialized recursively', () => {
    const inner = { toJSON: () => ({ z: 1, a: 2 }) };
    assert.equal(canonicalize({ x: inner }), '{"x":{"a":2,"z":1}}');
  });

  test('toJSON returning NaN throws', () => {
    const input = { toJSON: () => NaN };
    assert.throws(() => canonicalize(input), { message: 'NaN is not allowed' });
  });
});
