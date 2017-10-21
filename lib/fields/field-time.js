/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Module dependencies.
 * @private
 */
const TIMESTAMP = require('./field-timestamp');

/**
 * Expose `TIME`.
 */
module.exports = TIME;

/**
 *
 * @constructor
 * @extends TIMESTAMP
 */
function TIME() {
  TIMESTAMP.call(this);
}

const proto = TIME.prototype = {};
Object.setPrototypeOf(proto, TIMESTAMP.prototype);
proto.constructor = TIME;

/**
 * @param {*} value
 * @return {TIME}
 */
proto.setDefaultValue = function(value) {
  if (value) {
    value = value instanceof Date ? value : new Date(value);
    value.setFullYear(0, 0, 0);
  }
  TIMESTAMP.prototype.setDefaultValue.call(this, value);
  return this;
};

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'TIME';
};
