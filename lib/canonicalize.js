// Characters JSON.stringify must escape (control characters, double quote,
// backslash) plus all surrogate code units. A string containing none of these
// serializes as itself in quotes, and cannot contain a lone surrogate — so one
// regex scan replaces both the isWellFormed() and JSON.stringify() passes.
const NEEDS_SLOW_PATH = /["\\\u0000-\u001f\uD800-\uDFFF]/; // eslint-disable-line no-control-regex

function serializeString (value) {
  // The length cap bounds the cost of a failed pre-scan; for very long strings
  // JSON.stringify's native scan is the better bet.
  if (value.length < 5000 && !NEEDS_SLOW_PATH.test(value)) {
    return '"' + value + '"';
  }
  if (!value.isWellFormed()) {
    throw new Error('Lone surrogate is not allowed');
  }
  return JSON.stringify(value);
}

function serializePrimitive (value) {
  switch (typeof value) {
    case 'number':
      if (isNaN(value)) {
        throw new Error('NaN is not allowed');
      }
      if (!isFinite(value)) {
        throw new Error('Infinity is not allowed');
      }
      // For finite numbers String(value) would give identical output, but
      // JSON.stringify benchmarks faster on V8.
      return JSON.stringify(value);
    case 'string':
      return serializeString(value);
    case 'boolean':
      return value ? 'true' : 'false';
    default:
      // null, or values JSON.stringify maps to undefined (undefined,
      // functions, symbols).
      return JSON.stringify(value);
  }
}

// Insertion sort beats Array.prototype.sort for the small key counts typical
// of JSON objects; `>` on strings matches sort()'s default code-unit order.
function sortKeys (keys) {
  if (keys.length > 200) {
    return keys.sort();
  }
  for (let i = 1; i < keys.length; i++) {
    const key = keys[i];
    let position = i;
    while (position !== 0 && keys[position - 1] > key) {
      keys[position] = keys[position - 1];
      position--;
    }
    keys[position] = key;
  }
  return keys;
}

// Resolves a value to either its serialized primitive form (a string — or
// undefined, for values JSON.stringify drops) or a frame describing the
// container to descend into. Callers distinguish the two cases with
// `typeof result !== 'object'`.
//
// toJSON results are unwrapped here, and the wrapper objects stay in `seen`
// until the resolved subtree is fully serialized, so cycles introduced via
// toJSON are still detected.
function enterValue (value, seen) {
  let wrappers = null;
  while (value !== null && typeof value === 'object' && typeof value.toJSON === 'function') {
    if (seen.has(value)) {
      throw new Error('Circular reference detected');
    }
    seen.add(value);
    (wrappers ??= []).push(value);
    value = value.toJSON();
  }

  // Boxed Number/String/Boolean objects serialize as their primitive values,
  // mirroring how JSON.stringify treats them.
  if (value instanceof Number || value instanceof String || value instanceof Boolean) {
    value = value.valueOf();
  }

  if (value === null || typeof value !== 'object') {
    if (wrappers !== null) {
      for (const wrapper of wrappers) seen.delete(wrapper);
    }
    return serializePrimitive(value);
  }

  if (seen.has(value)) {
    throw new Error('Circular reference detected');
  }
  seen.add(value);

  return {
    container: value,
    // null marks an array frame; object frames carry their sorted keys.
    keys: Array.isArray(value) ? null : sortKeys(Object.keys(value)),
    // Next child to serialize; the frame resumes here after a nested
    // container's subtree completes.
    index: 0,
    // Whether no member has been emitted yet (controls comma placement).
    first: true,
    // toJSON wrappers to release from `seen` when this frame completes.
    wrappers
  };
}

export default function canonicalize (object) {
  if (object === null || typeof object !== 'object') {
    return serializePrimitive(object);
  }

  const seen = new Set();
  const root = enterValue(object, seen);
  if (typeof root !== 'object') {
    // A toJSON chain resolved the input to a primitive.
    return root;
  }

  let result = root.keys === null ? '[' : '{';
  const stack = [root];

  // Depth-first serialization with an explicit stack instead of recursion, so
  // nesting depth is bounded by heap size rather than call-stack size. The top
  // frame is the container currently being serialized: primitive children are
  // appended inline, while a nested container pushes a new frame and jumps
  // back to the outer loop. Because frame.index was already advanced, the
  // parent resumes at its next child once the subtree is done. Opening
  // brackets are emitted when a frame is pushed, closing brackets when it
  // completes.
  outer:
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const container = frame.container;

    // keys === null marks an array frame; otherwise keys holds the object's
    // sorted property names. Either way the iteration counter lives on the
    // frame itself (frame.index), so when a frame is resumed after a nested
    // container completes, the while condition continues at the first
    // unserialized child instead of restarting from the beginning.
    if (frame.keys === null) {
      while (frame.index < container.length) {
        const i = frame.index++;
        if (i > 0) {
          result += ',';
        }
        const element = container[i];
        // Inside arrays, JSON.stringify serializes values with no JSON
        // representation (undefined, symbols, functions) as null.
        const value = element === undefined || typeof element === 'symbol' || typeof element === 'function' ? null : element;
        if (value === null || typeof value !== 'object') {
          result += serializePrimitive(value);
          continue;
        }
        const child = enterValue(value, seen);
        if (typeof child !== 'object') {
          // A toJSON chain resolved the child to an already-serialized
          // primitive — or, when child is undefined, to a value with no JSON
          // representation, which becomes null inside arrays.
          result += child === undefined ? 'null' : child;
          continue;
        }
        result += child.keys === null ? '[' : '{';
        stack.push(child);
        continue outer;
      }
      result += ']';
    } else {
      const keys = frame.keys;
      while (frame.index < keys.length) {
        const key = keys[frame.index++];
        const value = container[key];
        // Inside objects, JSON.stringify omits properties whose value has no
        // JSON representation (undefined, symbols, functions).
        if (value === undefined || typeof value === 'symbol' || typeof value === 'function') {
          continue;
        }
        if (value === null || typeof value !== 'object') {
          // Commas are tracked with a flag rather than the key index: a
          // skipped key must not leave a stray comma behind.
          if (frame.first) {
            frame.first = false;
          } else {
            result += ',';
          }
          result += serializeString(key) + ':' + serializePrimitive(value);
          continue;
        }
        // The child must be resolved before the key is emitted: a toJSON
        // returning a value with no JSON representation drops the whole
        // property.
        const child = enterValue(value, seen);
        if (child === undefined) {
          continue;
        }
        if (frame.first) {
          frame.first = false;
        } else {
          result += ',';
        }
        result += serializeString(key) + ':';
        if (typeof child !== 'object') {
          result += child;
          continue;
        }
        result += child.keys === null ? '[' : '{';
        stack.push(child);
        continue outer;
      }
      result += '}';
    }

    // Frame complete. The container leaves `seen` so that a later, sibling
    // reference to the same object is not mistaken for a cycle.
    seen.delete(container);
    if (frame.wrappers !== null) {
      for (const wrapper of frame.wrappers) seen.delete(wrapper);
    }
    stack.pop();
  }

  return result;
}
