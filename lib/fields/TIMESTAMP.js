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
const Field = require('../Field');

/**
 * Expose `TIMESTAMP`.
 */
module.exports = TIMESTAMP;

/**
 *
 * @constructor
 * @extends Field
 */
function TIMESTAMP() {
  Field.call(this);
}

const proto = TIMESTAMP.prototype = {
  get jsType() {
    return 'Date';
  }
};
Object.setPrototypeOf(proto, Field.prototype);
proto.constructor = TIMESTAMP;

/**
 * @param {*} value
 * @return {TIMESTAMP}
 */
proto.setDefaultValue = function(value) {
  Field.prototype.setDefaultValue.call(this,
      value !== undefined ?
          (value instanceof Date ? value : new Date(value)) : undefined);
  return this;
};

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'TIMESTAMP';
};
