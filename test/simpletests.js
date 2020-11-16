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
