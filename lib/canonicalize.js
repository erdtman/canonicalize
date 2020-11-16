/* jshint esversion: 6 */
/* jslint node: true */
'use strict';

module.exports = function serialize (object) {
  if (object === null || typeof object !== 'object' || object.toJSON != null) {
    return JSON.stringify(object);
  }

  if (Array.isArray(object)) {
    return '[' + object.reduce((t, cv, ci) => {
      const comma = ci === 0 ? '' : ',';
      const value = cv === undefined ? null : cv;
      return t + comma + serialize(value);
    }, '') + ']';
  }

  let atFirstKey = true;
  return '{' + Object.keys(object).sort().reduce((t, cv, ci) => {
    if (object[cv] === undefined) {
      return t;
    }
    const comma = atFirstKey ? '' : ',';
    atFirstKey = false;
    return t + comma + serialize(cv) + ':' + serialize(object[cv]);
  }, '') + '}';
};
