import { test } from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from '../lib/canonicalize.js';

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
  assert.equal(canonicalize([{ b: 123, a: 'string' }]), '[{"a":"string","b":123}]');
});

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

test('undefined', () => {
  assert.equal(canonicalize(undefined), undefined);
});

test('null', () => {
  assert.equal(canonicalize(null), 'null');
});

test('symbol', () => {
  assert.equal(canonicalize(Symbol('hello world')), undefined);
});

test('object with symbol value', () => {
  assert.equal(canonicalize({ test: Symbol('hello world') }), '{}');
});

test('object with number key', () => {
  assert.equal(canonicalize({ 42: 'foo' }), '{"42":"foo"}');
});

test('object with symbol key', () => {
  assert.equal(canonicalize({ [Symbol('hello world')]: 'foo' }), '{}');
});

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
