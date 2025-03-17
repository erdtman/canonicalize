#!/usr/bin/env node

'use strict';

const canonicalize = require('../');

let input = '';

process.stdin
  .on('data', (data) => input += data.toString())
  .on('end', () => {
    const output = canonicalize(JSON.parse(input));
    process.stdout.write(output, 'utf-8');
  });
