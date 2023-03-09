/* jshint esversion: 6 */
/* jslint node: true */
'use strict';

module.exports = function serialize (object) {
  if (typeof object === 'number' && isNaN(object)) {
    throw new Error('NaN is not allowed');
  }

  if (typeof object === 'number' && !isFinite(object)) {
    throw new Error('Infinity is not allowed');
  }

  if (object === null || typeof object !== 'object') {
    return JSON.stringify(object);
  }

  if (object.toJSON instanceof Function) {
    return serialize(object.toJSON());
  }

  if (Array.isArray(object)) {
    const values = object.reduce((t, cv, ci) => {
      const comma = ci === 0 ? '' : ',';
      const value = cv === undefined || typeof cv === 'symbol' ? null : cv;
      return `${t}${comma}${serialize(value)}`;
    }, '');
    return `[${values}]`;
  }

  const values = Object.keys(object).sort().reduce((t, cv) => {
    if (object[cv] === undefined ||
        typeof object[cv] === 'symbol') {
      return t;
    }
    const comma = t.length === 0 ? '' : ',';
    return `${t}${comma}${serialize(cv)}:${serialize(object[cv])}`;
  }, '');
  return `{${values}}`;
};
