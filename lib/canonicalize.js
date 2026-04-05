export default function serialize (object, seen = new Set()) {
  if (typeof object === 'number' && isNaN(object)) {
    throw new Error('NaN is not allowed');
  }

  if (typeof object === 'number' && !isFinite(object)) {
    throw new Error('Infinity is not allowed');
  }

  if (object === null || typeof object !== 'object') {
    return JSON.stringify(object);
  }

  if (typeof object.toJSON === 'function') {
    if (seen.has(object)) {
      throw new Error('Circular reference detected');
    }
    seen.add(object);
    const result = serialize(object.toJSON(), seen);
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
      return serialize(value, seen);
    });
    result = `[${values.join(',')}]`;
  } else {
    const parts = [];
    for (const key of Object.keys(object).sort()) {
      if (object[key] === undefined || typeof object[key] === 'symbol') {
        continue;
      }
      parts.push(`${serialize(key)}:${serialize(object[key], seen)}`);
    }
    result = `{${parts.join(',')}}`;
  }

  seen.delete(object);
  return result;
}
