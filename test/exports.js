import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// These tests resolve the package by name rather than by relative path, so they
// exercise the "exports" map in package.json instead of bypassing it. Node
// resolves a package's own name from inside that package (self-reference), so
// no install step is needed.
describe('package exports', () => {
  test('the package can be required from CommonJS', () => {
    const require = createRequire(import.meta.url);
    // Without a "require" or "default" condition this throws
    // ERR_PACKAGE_PATH_NOT_EXPORTED, even though Node >=22.12 can require ESM.
    const actual = typeof require('canonicalize').default;
    const expected = 'function';
    assert.equal(actual, expected);
  });

  test('a required copy canonicalizes', () => {
    const require = createRequire(import.meta.url);
    const canonicalize = require('canonicalize').default;
    const actual = canonicalize({ b: 123, a: 'string' });
    const expected = '{"a":"string","b":123}';
    assert.equal(actual, expected);
  });

  test('the package can still be imported from ESM', async () => {
    const { default: canonicalize } = await import('canonicalize');
    const actual = canonicalize({ b: 123, a: 'string' });
    const expected = '{"a":"string","b":123}';
    assert.equal(actual, expected);
  });
});
