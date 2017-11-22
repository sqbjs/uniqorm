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
const TIMESTAMP = require('./TIMESTAMP');

/**
 * Expose `DATE`.
 */
module.exports = DATE;

/**
 *
 * @constructor
 * @extends TIMESTAMP
 */
function DATE() {
  TIMESTAMP.call(this);
}

const proto = DATE.prototype = {};
Object.setPrototypeOf(proto, TIMESTAMP.prototype);
proto.constructor = DATE;

/**
 * @param {*} value
 * @return {TIMESTAMP}
 */
proto.setDefaultValue = function(value) {
  if (value) {
    value = value instanceof Date ? value : new Date(value);
    value.setHours(0, 0, 0, 0);
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
  return 'DATE';
};
