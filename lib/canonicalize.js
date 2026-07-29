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

export default function canonicalize (object, seen = new Set()) {
  if (typeof object === 'number' && isNaN(object)) {
    throw new Error('NaN is not allowed');
  }

  if (typeof object === 'number' && !isFinite(object)) {
    throw new Error('Infinity is not allowed');
  }

  if (typeof object === 'string' && hasLoneSurrogate(object)) {
    throw new Error('Lone surrogate is not allowed');
  }

  if (object === null || typeof object !== 'object') {
    return JSON.stringify(object);
  }

  if (typeof object.toJSON === 'function') {
    if (seen.has(object)) {
      throw new Error('Circular reference detected');
    }
    seen.add(object);
    const result = canonicalize(object.toJSON(), seen);
    seen.delete(object);
    return result;
  }

  if (seen.has(object)) {
    throw new Error('Circular reference detected');
  }
  seen.add(object);

  let result;
  if (Array.isArray(object)) {
    const values = object.map((cv) => {
      const value = cv === undefined || typeof cv === 'symbol' ? null : cv;
      return canonicalize(value, seen);
    });
    result = `[${values.join(',')}]`;
  } else {
    const parts = [];
    for (const key of Object.keys(object).sort()) {
      if (object[key] === undefined || typeof object[key] === 'symbol') {
        continue;
      }
      parts.push(`${canonicalize(key)}:${canonicalize(object[key], seen)}`);
    }
    result = `{${parts.join(',')}}`;
  }

  seen.delete(object);
  return result;
}
