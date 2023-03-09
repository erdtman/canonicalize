/* jshint esversion: 6 */
/* jslint node: true */
'use strict';

JSON.canonicalize = require('../');
const test = require('ava');

test('empty array', t => {
  const input = [];
  const expected = '[]';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('one element array', t => {
  const input = [123];
  const expected = '[123]';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('multi element array', t => {
  const input = [123, 456, 'hello'];
  const expected = '[123,456,"hello"]';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('null and undefined values in array', t => {
  const input = [null, undefined, 'hello'];
  const expected = '[null,null,"hello"]';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('NaN in array', t => {
  try {
    const input = [NaN];
    JSON.canonicalize(input);
    t.fail();
  } catch (error) {
    t.is(error.message, 'NaN is not allowed');
    t.pass();
  }
});

test('NaN in object', t => {
  try {
    const input = { key: NaN };
    JSON.canonicalize(input);
    t.fail();
  } catch (error) {
    t.is(error.message, 'NaN is not allowed');
    t.pass();
  }
});

test('NaN single value', t => {
  try {
    const input = NaN;
    JSON.canonicalize(input);
    t.fail();
  } catch (error) {
    t.is(error.message, 'NaN is not allowed');
    t.pass();
  }
});

test('Infinity in array', t => {
  try {
    const input = [Infinity];
    JSON.canonicalize(input);
    t.fail();
  } catch (error) {
    t.is(error.message, 'Infinity is not allowed');
    t.pass();
  }
});

test('Infinity in object', t => {
  try {
    const input = { key: Infinity };
    JSON.canonicalize(input);
    t.fail();
  } catch (error) {
    t.is(error.message, 'Infinity is not allowed');
    t.pass();
  }
});

test('Infinity single value', t => {
  try {
    const input = -Infinity;
    JSON.canonicalize(input);
    t.fail();
  } catch (error) {
    t.is(error.message, 'Infinity is not allowed');
    t.pass();
  }
});

test('object in array', t => {
  const input = [{ b: 123, a: 'string' }];
  const expected = '[{"a":"string","b":123}]';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('empty object', t => {
  const input = {};
  const expected = '{}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('object with undefined value', t => {
  const input = { test: undefined };
  const expected = '{}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('object with null value', t => {
  const input = { test: null };
  const expected = '{"test":null}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('object with one property', t => {
  const input = { hello: 'world' };
  const expected = '{"hello":"world"}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('object with more than one property', t => {
  const input = { hello: 'world', number: 123 };
  const expected = '{"hello":"world","number":123}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('undefined', t => {
  const input = undefined;
  const expected = undefined;
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('null', t => {
  const input = null;
  const expected = 'null';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('symbol', t => {
  const input = Symbol('hello world');
  const expected = undefined;
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('object with symbol value', t => {
  const input = { test: Symbol('hello world') };
  const expected = '{}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('object with number key', t => {
  const input = { 42: 'foo' };
  const expected = '{"42":"foo"}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('object with symbol key', t => {
  const input = { [Symbol('hello world')]: 'foo' };
  const expected = '{}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});

test('object with toJSON', t => {
  const input = {
    a: 123,
    b: 456,
    toJSON: function () {
      return {
        b: this.b,
        a: this.a
      };
    }
  };
  const expected = '{"a":123,"b":456}';
  const actual = JSON.canonicalize(input);
  t.is(actual, expected);
});
