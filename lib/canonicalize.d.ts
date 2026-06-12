/**
 * Serializes the input to its RFC 8785 (JSON Canonicalization Scheme)
 * canonical JSON representation.
 *
 * @param input The value to canonicalize.
 * @returns The canonical JSON string, or `undefined` when the input itself
 * is not serializable (`undefined`, a symbol or a function).
 * @throws {TypeError} If the input contains `NaN`, `Infinity`, a `BigInt`
 * or a circular reference.
 */
declare function canonicalize(input: unknown): string | undefined;
export default canonicalize;
