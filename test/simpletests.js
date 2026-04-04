import { test } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

test('empty array', () => {
  const input = [];
  const expected = '[]';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('one element array', () => {
  const input = [123];
  const expected = '[123]';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('multi element array', () => {
  const input = [123, 456, 'hello'];
  const expected = '[123,456,"hello"]';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('null and undefined values in array', () => {
  const input = [null, undefined, 'hello'];
  const expected = '[null,null,"hello"]';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('NaN in array', () => {
  assert.throws(() => canonicalize([NaN]), { message: 'NaN is not allowed' });
});

test('NaN in object', () => {
  assert.throws(() => canonicalize({ key: NaN }), { message: 'NaN is not allowed' });
});

test('NaN single value', () => {
  assert.throws(() => canonicalize(NaN), { message: 'NaN is not allowed' });
});

test('Infinity in array', () => {
  assert.throws(() => canonicalize([Infinity]), { message: 'Infinity is not allowed' });
});

test('Infinity in object', () => {
  assert.throws(() => canonicalize({ key: Infinity }), { message: 'Infinity is not allowed' });
});

test('Infinity single value', () => {
  assert.throws(() => canonicalize(-Infinity), { message: 'Infinity is not allowed' });
});

test('object in array', () => {
  const input = [{ b: 123, a: 'string' }];
  const expected = '[{"a":"string","b":123}]';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('empty object', () => {
  const input = {};
  const expected = '{}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('object with undefined value', () => {
  const input = { test: undefined };
  const expected = '{}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('object with null value', () => {
  const input = { test: null };
  const expected = '{"test":null}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('object with one property', () => {
  const input = { hello: 'world' };
  const expected = '{"hello":"world"}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('object with more than one property', () => {
  const input = { hello: 'world', number: 123 };
  const expected = '{"hello":"world","number":123}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('undefined', () => {
  const input = undefined;
  const expected = undefined;
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('null', () => {
  const input = null;
  const expected = 'null';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('symbol', () => {
  const input = Symbol('hello world');
  const expected = undefined;
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('object with symbol value', () => {
  const input = { test: Symbol('hello world') };
  const expected = '{}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('object with number key', () => {
  const input = { 42: 'foo' };
  const expected = '{"42":"foo"}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('object with symbol key', () => {
  const input = { [Symbol('hello world')]: 'foo' };
  const expected = '{}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('object with toJSON', () => {
  const input = {
    a: 123,
    b: 456,
    toJSON: function () {
      return { b: this.b, a: this.a };
    }
  };
  const expected = '{"a":123,"b":456}';
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});
