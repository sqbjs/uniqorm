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
const Field = require('../field');

/**
 * Expose `VARCHAR`.
 */
module.exports = VARCHAR;

/**
 *
 * @param {Number} length
 * @constructor
 * @extends Field
 */
function VARCHAR(length) {
  Field.call(this);
  if (length !== undefined)
    this.setLength(parseInt(length));
}

const proto = VARCHAR.prototype = {
  get jsType() {
    return 'String';
  }
};
Object.setPrototypeOf(proto, Field.prototype);
proto.constructor = VARCHAR;

/**
 * @param {*} value
 * @return {VARCHAR}
 */
proto.setDefaultValue = function(value) {
  Field.prototype.setDefaultValue.call(this, value !== undefined ?
      String(value) : undefined);
  return this;
};

/**
 *
 * @param {int} [value = 1]
 * @return {VARCHAR}
 */
proto.setLength = function(value) {
  this._length = value ? parseInt(value) : 1;
  return this;
};

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'VARCHAR' + (this._length ? '(' + this._length + ')' : '');
};
