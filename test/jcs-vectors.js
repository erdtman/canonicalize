import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import canonicalize from '../lib/canonicalize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vectorDir = join(__dirname, 'testdata', 'jcs');
const inputDir = join(vectorDir, 'input');
const outputDir = join(vectorDir, 'output');

for (const filename of ['structures.json', 'weird.json']) {
  test(`RFC 8785 input ${filename}`, () => {
    const input = JSON.parse(readFileSync(join(inputDir, filename), 'utf8'));
    const expected = readFileSync(join(outputDir, filename), 'utf8');
    const actual = canonicalize(input);
    assert.equal(actual, expected);
  });
}

function binary64FromBits(bits) {
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, BigInt(`0x${bits}`));
  return view.getFloat64(0);
}

// Source: cyberphone/json-canonicalization at 32a48195b9b20fe67b1795e39e4509f14d860b45.
// Archive: https://github.com/cyberphone/json-canonicalization/releases/download/es6testfile/es6testfile100m.txt.gz
// SHA-256: 545455ec9e74b68042c22a2607fb9d4a5f5fdb3c79f883ce864c75189a70705f.
// Scan all 100,000,000 source lines. The ordered eligible pool (N = 125,000) contains
// lines 1-100,000, plus independent Algorithm R reservoirs from later lines: 20,000
// finite values with |x| > 2^53
// and 5,000 subnormal values. Append the first cap candidates to each reservoir.
// For each later candidate count i at source line n, compute j = splitmix64(seed XOR n) mod i
// and replace slot j if j is below that category's cap.
// Seeds: 0x4a43532d494e5447 (large integers), 0x4a43532d5355424e (subnormals).
// splitmix64 uses unsigned 64-bit wraparound: z=x+0x9e3779b97f4a7c15;
// z=(z^(z>>30))*0xbf58476d1ce4e5b9; z=(z^(z>>27))*0x94d049bb133111eb; return z^(z>>31).
// Merge the reservoirs, deduplicate by source line, and sort by source line. Numeric rows
// retain source IDs; select pool[0..199], then pool[200 + floor((k + 0.5) * (N - 200) / 1,800)]
// for zero-based k = 0..1,799.
const numberRows = readFileSync(join(vectorDir, 'numbers.jsonl'), 'utf8')
  .trimEnd()
  .split('\n')
  .map(line => JSON.parse(line));
assert.equal(numberRows.length, 2000);

for (const { id, bits, expected } of numberRows) {
  test(`ES6 number vector ${id}`, () => {
    const input = binary64FromBits(bits);
    const actual = canonicalize(input);
    assert.equal(actual, expected, id);
  });
}

const rejectionCases = [
  {
    id: 'reject:lone-high-surrogate',
    json: String.raw`{"s":"\ud800"}`,
    expected: { message: 'Lone surrogate is not allowed' }
  },
  {
    id: 'reject:lone-low-surrogate',
    json: String.raw`{"s":"\udc00"}`,
    expected: { message: 'Lone surrogate is not allowed' }
  },
  {
    id: 'reject:number-out-of-range',
    json: String.raw`{"n":1e400}`,
    expected: { message: 'Infinity is not allowed' }
  }
];

for (const { id, json, expected } of rejectionCases) {
  test(`I-JSON rejection ${id}`, () => {
    const input = JSON.parse(json);
    assert.throws(() => canonicalize(input), expected, id);
  });
}

test.skip('reject duplicate-key JSON input (reject:duplicate-key)', {
  skip: 'README: JSON.parse resolves duplicate keys before canonicalize() receives the object.'
}, () => {});

test.skip('reject inexact-number JSON token (reject:number-inexact-binary64)', {
  skip: 'The value API receives a rounded JavaScript Number, not the original JSON token.'
}, () => {});
