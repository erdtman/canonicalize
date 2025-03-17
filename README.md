[![Build Status](https://app.travis-ci.com/erdtman/canonicalize.svg?branch=master)](https://app.travis-ci.com/erdtman/canonicalize)
[![Coverage Status](https://coveralls.io/repos/github/erdtman/canonicalize/badge.svg?branch=master)](https://coveralls.io/github/erdtman/canonicalize?branch=master)
# canonicalize
JSON canonicalize function. Creates crypto safe predictable canocalization of
JSON as defined by [RFC8785](https://tools.ietf.org/html/rfc8785)
## Usage
### Normal Example
```js
const canonicalize = require('canonicalize');
const  json = {
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
const canonicalize = require('canonicalize');
const  json = {
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
## Install
```
npm install canonicalize --save
```
## Test
```
npm test
```
