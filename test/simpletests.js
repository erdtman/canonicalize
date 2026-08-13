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
});

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

describe('top-level scalars', () => {
  test('number', () => {
    const actual = canonicalize(42);
    const expected = '42';
    assert.equal(actual, expected);
  });

  test('string', () => {
    const actual = canonicalize('hi');
    const expected = '"hi"';
    assert.equal(actual, expected);
  });

  test('boolean', () => {
    const actual = canonicalize(true);
    const expected = 'true';
    assert.equal(actual, expected);
  });
});
