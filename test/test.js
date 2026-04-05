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
  assert.equal(canonicalize(input), expected);
});

test('french', () => {
  const { input, expected } = testdata('french');
  assert.equal(canonicalize(input), expected);
});

test('structures', () => {
  const { input, expected } = testdata('structures');
  assert.equal(canonicalize(input), expected);
});

test('values', () => {
  const { input, expected } = testdata('values');
  assert.equal(canonicalize(input), expected);
});

test('weird', () => {
  const { input, expected } = testdata('weird');
  assert.equal(canonicalize(input), expected);
});
