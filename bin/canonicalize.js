#!/usr/bin/env node

import canonicalize from '../lib/canonicalize.js';

if (process.stdin.isTTY) {
  process.stderr.write('Usage: canonicalize < input.json\n');
  process.stderr.write('Reads JSON on stdin and writes the RFC 8785 canonical form to stdout.\n');
  process.exit(1);
}

let input = '';

process.stdin.setEncoding('utf8');
process.stdin
  .on('data', (chunk) => { input += chunk; })
  .on('end', () => {
    try {
      const output = canonicalize(JSON.parse(input));
      process.stdout.write(output);
    } catch (e) {
      process.stderr.write(`Error: ${e.message}\n`);
      process.exit(1);
    }
  });
