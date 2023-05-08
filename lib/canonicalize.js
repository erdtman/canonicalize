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

  if (typeof object === 'string' && !isWellFormed(object)) {
    throw new Error('Strings must be valid Unicode and not contain any surrogate pairs');
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

function isWellFormed (str) {
  if (typeof String.prototype.isWellFormed === 'function') {
    return str.isWellFormed();
  }

  // https://github.com/tc39/proposal-is-usv-string
  // https://github.com/zloirock/core-js/blob/d6ad38c/packages/core-js/modules/esnext.string.is-well-formed.js
  const length = str.length;
  for (let i = 0; i < length; i++) {
    const charCode = str.charCodeAt(i);
    // single UTF-16 code unit
    if ((charCode & 0xF800) !== 0xD800) continue;
    // unpaired surrogate
    if (charCode >= 0xDC00 || ++i >= length || (str.charCodeAt(i) & 0xFC00) !== 0xDC00) return false;
  }
  return true;
}
