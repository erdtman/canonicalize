import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import canonicalize from '../lib/canonicalize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputDir = join(__dirname, 'testdata/input');
const outputDir = join(__dirname, 'testdata/output');

function testdata(name) {
  const input = JSON.parse(readFileSync(join(inputDir, `${name}.json`), 'utf8'));
  const expected = readFileSync(join(outputDir, `${name}.json`), 'utf8').trim();
  return { input, expected };
}

test('arrays', () => {
  const { input, expected } = testdata('arrays');
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('french', () => {
  const { input, expected } = testdata('french');
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('structures', () => {
  const { input, expected } = testdata('structures');
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('values', () => {
  const { input, expected } = testdata('values');
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('unicode', () => {
  const { input, expected } = testdata('unicode');
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('weird', () => {
  const { input, expected } = testdata('weird');
  const actual = canonicalize(input);
  assert.equal(actual, expected);
});

test('idempotence: canonicalizing canonical output is a fixed point', () => {
  for (const name of ['arrays', 'french', 'structures', 'unicode', 'values', 'weird']) {
    const { input } = testdata(name);
    const once = canonicalize(input);
    const actual = canonicalize(JSON.parse(once));
    const expected = once;
    assert.equal(actual, expected, `not idempotent for ${name}`);
  }
});
