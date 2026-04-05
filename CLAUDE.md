# Project conventions

## Tests

Always use explicit `actual` and `expected` variables in tests rather than inlining values directly into assertions. This improves readability.

```js
// preferred
const actual = canonicalize(input);
const expected = '{"a":1}';
assert.equal(actual, expected);

// avoid
assert.equal(canonicalize(input), '{"a":1}');
```
