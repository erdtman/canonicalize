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
    const expected = { name: 'TypeError', message: 'NaN is not allowed' };
    assert.throws(() => canonicalize([NaN]), expected);
  });

  test('NaN in object', () => {
    const expected = { name: 'TypeError', message: 'NaN is not allowed' };
    assert.throws(() => canonicalize({ key: NaN }), expected);
  });

  test('NaN as top-level value', () => {
    const expected = { name: 'TypeError', message: 'NaN is not allowed' };
    assert.throws(() => canonicalize(NaN), expected);
  });
});

describe('Infinity handling', () => {
  test('Infinity in array', () => {
    const expected = { name: 'TypeError', message: 'Infinity is not allowed' };
    assert.throws(() => canonicalize([Infinity]), expected);
  });

  test('Infinity in object', () => {
    const expected = { name: 'TypeError', message: 'Infinity is not allowed' };
    assert.throws(() => canonicalize({ key: Infinity }), expected);
  });

  test('-Infinity as top-level value', () => {
    const expected = { name: 'TypeError', message: 'Infinity is not allowed' };
    assert.throws(() => canonicalize(-Infinity), expected);
  });
});

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
    const expected = { name: 'TypeError', message: 'NaN is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('toJSON returning self throws', () => {
    const input = {};
    input.toJSON = () => input;
    const expected = { name: 'TypeError', message: 'Circular reference detected' };
    assert.throws(() => canonicalize(input), expected);
  });
});

describe('circular references', () => {
  test('object referencing itself throws', () => {
    const input = {};
    input.self = input;
    const expected = { name: 'TypeError', message: 'Circular reference detected' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('array referencing itself throws', () => {
    const input = [];
    input.push(input);
    const expected = { name: 'TypeError', message: 'Circular reference detected' };
    assert.throws(() => canonicalize(input), expected);
  });

  test('nested circular reference throws', () => {
    const a = {};
    const b = { a };
    a.b = b;
    const expected = { name: 'TypeError', message: 'Circular reference detected' };
    assert.throws(() => canonicalize(a), expected);
  });

  test('same object referenced twice (non-circular) is allowed', () => {
    const shared = { z: 1 };
    const actual = canonicalize({ x: shared, y: shared });
    const expected = '{"x":{"z":1},"y":{"z":1}}';
    assert.equal(actual, expected);
  });
});

describe('function values', () => {
  test('function in object is omitted', () => {
    const actual = canonicalize({ a: function () {}, b: 1 });
    const expected = '{"b":1}';
    assert.equal(actual, expected);
  });

  test('function in array becomes null', () => {
    const actual = canonicalize([function () {}, 1]);
    const expected = '[null,1]';
    assert.equal(actual, expected);
  });

  test('function as top-level value', () => {
    const actual = canonicalize(function () {});
    const expected = undefined;
    assert.equal(actual, expected);
  });
});

describe('property getters', () => {
  test('getter is invoked exactly once', () => {
    let calls = 0;
    const input = {
      get a () {
        calls += 1;
        return calls;
      }
    };
    const actual = canonicalize(input);
    const expected = '{"a":1}';
    assert.equal(actual, expected);
    assert.equal(calls, 1);
  });
});

describe('boxed primitives', () => {
  test('boxed number is unwrapped', () => {
    const actual = canonicalize(new Number(5));
    const expected = '5';
    assert.equal(actual, expected);
  });

  test('boxed string is unwrapped', () => {
    const actual = canonicalize(new String('x'));
    const expected = '"x"';
    assert.equal(actual, expected);
  });

  test('boxed boolean is unwrapped', () => {
    const actual = canonicalize(new Boolean(false));
    const expected = 'false';
    assert.equal(actual, expected);
  });

  test('boxed NaN throws', () => {
    const expected = { name: 'TypeError', message: 'NaN is not allowed' };
    assert.throws(() => canonicalize(new Number(NaN)), expected);
  });
});

describe('BigInt handling', () => {
  test('BigInt as top-level value throws', () => {
    const expected = { name: 'TypeError', message: 'BigInt is not allowed' };
    assert.throws(() => canonicalize(10n), expected);
  });

  test('BigInt in object throws', () => {
    const expected = { name: 'TypeError', message: 'BigInt is not allowed' };
    assert.throws(() => canonicalize({ key: 10n }), expected);
  });
});

describe('number serialization (RFC 8785)', () => {
  test('negative zero', () => {
    const actual = canonicalize(-0);
    const expected = '0';
    assert.equal(actual, expected);
  });

  test('large number uses exponent notation', () => {
    const actual = canonicalize(1e21);
    const expected = '1e+21';
    assert.equal(actual, expected);
  });

  test('small number uses exponent notation', () => {
    const actual = canonicalize(1e-7);
    const expected = '1e-7';
    assert.equal(actual, expected);
  });

  test('smallest non-exponent fraction', () => {
    const actual = canonicalize(0.000001);
    const expected = '0.000001';
    assert.equal(actual, expected);
  });

  test('precision is limited to shortest round-trip form', () => {
    const actual = canonicalize(Number('333333333.33333329'));
    const expected = '333333333.3333333';
    assert.equal(actual, expected);
  });

  test('whole number stays without fraction', () => {
    const actual = canonicalize(56.0);
    const expected = '56';
    assert.equal(actual, expected);
  });
});

describe('string serialization', () => {
  test('lone surrogate in top-level string throws', () => {
    const input = '\uDEAD';
    const expected = { message: 'Lone surrogate is not allowed' };
    assert.throws(() => canonicalize(input), expected);
  });
});

describe('toJSON key argument', () => {
  test('top-level toJSON receives empty string key', () => {
    const input = { toJSON: (key) => key };
    const actual = canonicalize(input);
    const expected = '""';
    assert.equal(actual, expected);
  });

  test('toJSON in object receives property name', () => {
    const input = { x: { toJSON: (key) => key } };
    const actual = canonicalize(input);
    const expected = '{"x":"x"}';
    assert.equal(actual, expected);
  });

  test('toJSON in array receives index as string', () => {
    const input = [{ toJSON: (key) => key }];
    const actual = canonicalize(input);
    const expected = '["0"]';
    assert.equal(actual, expected);
  });

  test('Date is serialized via toJSON', () => {
    const actual = canonicalize({ date: new Date(0) });
    const expected = '{"date":"1970-01-01T00:00:00.000Z"}';
    assert.equal(actual, expected);
  });
});

describe('public API', () => {
  test('second argument is ignored', () => {
    const actual = canonicalize({ b: 1, a: 2 }, 'garbage');
    const expected = '{"a":2,"b":1}';
    assert.equal(actual, expected);
  });
});
