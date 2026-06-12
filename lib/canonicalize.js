export default function canonicalize (input) {
  return serialize(input, '', new Set());
}

function hasLoneSurrogate (value) {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);

    if (code >= 0xD800 && code <= 0xDBFF) {
      if (i === value.length - 1) {
        return true;
      }
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) {
        return true;
      }
      i++;
    } else if (code >= 0xDC00 && code <= 0xDFFF) {
      return true;
    }
  }

  return false;
}

function serialize (object, key, seen) {
  if (typeof object === 'number' && isNaN(object)) {
    throw new TypeError('NaN is not allowed');
  }

  if (typeof object === 'number' && !isFinite(object)) {
    throw new TypeError('Infinity is not allowed');
  }

  if (typeof object === 'bigint') {
    throw new TypeError('BigInt is not allowed');
  }

  if (typeof object === 'string' && hasLoneSurrogate(object)) {
    throw new TypeError('Lone surrogate is not allowed');
  }

  if (object === null || typeof object !== 'object') {
    return JSON.stringify(object);
  }

  const toJSON = object.toJSON;
  if (typeof toJSON === 'function') {
    if (seen.has(object)) {
      throw new TypeError('Circular reference detected');
    }
    seen.add(object);
    const result = serialize(toJSON.call(object, key), key, seen);
    seen.delete(object);
    return result;
  }

  if (object instanceof Number || object instanceof String || object instanceof Boolean) {
    return serialize(object.valueOf(), key, seen);
  }

  if (seen.has(object)) {
    throw new TypeError('Circular reference detected');
  }
  seen.add(object);

  let result;
  if (Array.isArray(object)) {
    const values = object.map((cv, index) => {
      const value = cv === undefined || typeof cv === 'symbol' || typeof cv === 'function' ? null : cv;
      return serialize(value, String(index), seen);
    });
    result = `[${values.join(',')}]`;
  } else {
    const parts = [];
    for (const name of Object.keys(object).sort()) {
      const value = object[name];
      if (value === undefined || typeof value === 'symbol' || typeof value === 'function') {
        continue;
      }
      parts.push(`${serialize(name, name, seen)}:${serialize(value, name, seen)}`);
    }
    result = `{${parts.join(',')}}`;
  }

  seen.delete(object);
  return result;
}
