[![Build Status](https://travis-ci.org/erdtman/canonicalize.svg?branch=master)](https://travis-ci.org/erdtman/canonicalize)
[![Coverage Status](https://coveralls.io/repos/github/erdtman/canonicalize/badge.svg?branch=master)](https://coveralls.io/github/erdtman/canonicalize?branch=master)
# canonicalize
JSON canonicalize function. Creates crypto safe predictable canocalization of
JSON as defined by [draft-rundgren-json-canonicalization-scheme](https://cyberphone.github.io/doc/security/draft-rundgren-json-canonicalization-scheme.html)
## Usage
```js
JSON.canonicalize = require('canonicalize');

const json = {
  "1": {"f": {"f": "hi","F": 5} ,"\n": 56.0},
  "10": { },
  "": "empty",
  "a": { },
  "111": [ {"e": "yes","E": "no" } ],
  "A": { }
}

console.log(JSON.canonicalize(json));
```
## Install
```
npm install canonicalize --save
```
## Test
```
npm test
```
