[![CI](https://github.com/erdtman/canonicalize/actions/workflows/ci.yml/badge.svg)](https://github.com/erdtman/canonicalize/actions/workflows/ci.yml)
# canonicalize
JSON canonicalize function. Creates crypto safe predictable canonicalization of
JSON as defined by [RFC8785](https://tools.ietf.org/html/rfc8785).

TypeScript type definitions are included.

This package is ESM-only as of version 3. It requires Node.js 18 or later;
`require('canonicalize')` works on Node.js versions with `require(esm)` support
(20.19+, 22.12+).

## Usage
### Normal Example
```js
import canonicalize from 'canonicalize';
const json = {
	"from_account": "543 232 625-3",
	"to_account": "321 567 636-4",
	"amount": 500,
	"currency": "USD"
}
console.log(canonicalize(json));
// output: {"amount":500,"currency":"USD","from_account":"543 232 625-3","to_account":"321 567 636-4"}
```
### Crazy Example
```js
import canonicalize from 'canonicalize';
const json = {
	"1": {"f": {"f":  "hi","F":  5} ,"\n":  56.0},
	"10": { },
	"":  "empty",
	"a": { },
	"111": [ {"e":  "yes","E":  "no" } ],
	"A": { }
}
console.log(canonicalize(json));
// output: {"":"empty","1":{"\n":56,"f":{"F":5,"f":"hi"}},"10":{},"111":[{"E":"no","e":"yes"}],"A":{},"a":{}}
```
### Via CLI
The function can be executed directly using npx without explicit installation. This allows JSON files and arbitrary input to be canonicalized with standard input/output:
```bash
# Input from file
npx canonicalize < input.json > output.json

# Input from string
echo '{
	"from_account": "543 232 625-3",
	"to_account": "321 567 636-4",
	"amount": 500,
	"currency": "USD"
}' | npx canonicalize > simple-data.json

# Input from web API
curl --silent https://pokeapi.co/api/v2/pokemon/pikachu | npx canonicalize > pikachu.json
```
## API
`canonicalize(input)` returns the canonical JSON string, or `undefined` when
the input itself is not serializable (`undefined`, a symbol or a function).

The serialization matches `JSON.stringify` semantics: `toJSON` methods are
honored, property getters are invoked exactly once, non-serializable values
(`undefined`, symbols, functions) are omitted from objects and become `null`
in arrays, and boxed primitives (`new Number(...)` etc.) are unwrapped.

A `TypeError` is thrown for values that cannot be represented in canonical
JSON: `NaN`, `Infinity`, `BigInt`, strings containing lone surrogates
(required by RFC 8785 §3.2.2.2) and circular references. Deeply nested input
can throw a `RangeError`, just like `JSON.stringify`.

Note: the CLI writes the canonical form without a trailing newline, so the
output bytes can be hashed or signed as-is.

## Install
As a library:
```
npm install canonicalize --save
```
As a CLI tool:
```
npm install -g canonicalize
canonicalize < input.json > output.json
```
## Test
```
npm test
```
