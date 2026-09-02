[![CI](https://github.com/erdtman/canonicalize/actions/workflows/ci.yml/badge.svg)](https://github.com/erdtman/canonicalize/actions/workflows/ci.yml)
# canonicalize
JSON canonicalize function. Creates crypto safe predictable canonicalization of
JSON as defined by [RFC8785](https://tools.ietf.org/html/rfc8785).

TypeScript type definitions are included.

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
## Best practices for signature schemes
Here follows an example of how untrusted input can be processed and validated
before being treated as safe.

A signature covers the canonical form, not the bytes on the wire. Erasing
differences that carry no meaning — key order, whitespace, `1e2` versus
`100` — is what canonicalization is for, and a signature ignoring those is
working as intended. What deserves attention is what JSON.parse discards
before canonicalize() ever runs: duplicate property names are resolved
silently, so a malformed document is reduced to a well-formed one and the
signature vouches for something the sender did not transmit.

```js
import canonicalize from 'canonicalize';

// The received document is untrusted until validateSignature succeeds
const untrustedInputText = /* raw document as received */;
const inputSignature = /* detached signature as received */;

// Duplicate property names are resolved here, last-one-wins, by JSON.parse —
// before canonicalize() ever sees the data. To reject documents that carried
// duplicates on the wire, inspect untrustedInputText before this line.
const untrustedInputObject = JSON.parse(untrustedInputText);

const canonicalText = canonicalize(untrustedInputObject);
const isValid = validateSignature(canonicalText, inputSignature);

if (isValid) {
  // canonicalText is the only artifact the signature covers.
  //
  // untrustedInputObject is not that artifact. It was derived from
  // untrustedInputText and was never validated. It is parsable, but it is not
  // what was signed — do not treat the two as interchangeable.
  const validatedInput = JSON.parse(canonicalText);

  // From here on, operate on validatedInput.
}
```

Forwarding `untrustedInputText` downstream passes on bytes an attacker could
have altered while verification still succeeded; a consumer that resolves
duplicate property names first-one-wins will then read a different document
than the one you validated.

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
