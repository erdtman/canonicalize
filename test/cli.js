import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = join(dirname(fileURLToPath(import.meta.url)), '../bin/canonicalize.js');

function run (input) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin]);
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (data) => { stdout += data; });
    child.stderr.setEncoding('utf8').on('data', (data) => { stderr += data; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}

describe('CLI', () => {
  test('canonicalizes JSON from stdin', async () => {
    const { code, stdout } = await run('{"b": 2, "a": 1}');
    const actual = stdout;
    const expected = '{"a":1,"b":2}';
    assert.equal(actual, expected);
    assert.equal(code, 0);
  });

  test('multibyte character split across stream chunks is decoded correctly', async () => {
    // Pad with leading whitespace so the two-byte character straddles the
    // 64 KiB stream read boundary and is guaranteed to arrive in two chunks.
    const input = Buffer.from(' '.repeat(65529) + '{"a":"é"}', 'utf8');
    const { code, stdout } = await run(input);
    const actual = stdout;
    const expected = '{"a":"é"}';
    assert.equal(actual, expected);
    assert.equal(code, 0);
  });

  test('invalid JSON exits with an error', async () => {
    const { code, stderr } = await run('not json');
    assert.equal(code, 1);
    assert.match(stderr, /^Error: /);
  });

  test('non-serializable JSON exits with an error', async () => {
    const { code, stderr } = await run('1e400');
    const actual = stderr;
    const expected = 'Error: Infinity is not allowed\n';
    assert.equal(actual, expected);
    assert.equal(code, 1);
  });
});
