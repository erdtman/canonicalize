#!/usr/bin/env node

import canonicalize from '../lib/canonicalize.js';

let input = '';

process.stdin
  .on('data', (data) => { input += data.toString(); })
  .on('end', () => {
    const output = canonicalize(JSON.parse(input));
    process.stdout.write(output, 'utf-8');
  });
