import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import canonicalize from '../lib/canonicalize.js';

test('arrays', () => {
  const input = JSON.parse(readFileSync('test/testdata/input/arrays.json', 'utf8'));
  const expected = readFileSync('test/testdata/output/arrays.json', 'utf8').trim();
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('french', () => {
  const input = JSON.parse(readFileSync('test/testdata/input/french.json', 'utf8'));
  const expected = readFileSync('test/testdata/output/french.json', 'utf8').trim();
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('structures', () => {
  const input = JSON.parse(readFileSync('test/testdata/input/structures.json', 'utf8'));
  const expected = readFileSync('test/testdata/output/structures.json', 'utf8').trim();
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('values', () => {
  const input = JSON.parse(readFileSync('test/testdata/input/values.json', 'utf8'));
  const expected = readFileSync('test/testdata/output/values.json', 'utf8').trim();
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('weird', () => {
  const input = JSON.parse(readFileSync('test/testdata/input/weird.json', 'utf8'));
  const expected = readFileSync('test/testdata/output/weird.json', 'utf8').trim();
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});
