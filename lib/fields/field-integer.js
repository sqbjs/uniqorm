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
 * Expose `INTEGER`.
 */
module.exports = INTEGER;

/**
 *
 * @constructor
 * @extends Field
 */
function INTEGER() {
  Field.call(this);
}

const proto = INTEGER.prototype = {
  get jsType() {
    return 'Number';
  }
};
Object.setPrototypeOf(proto, Field.prototype);
proto.constructor = INTEGER;

//noinspection JSCheckFunctionSignatures
/**
 *
 * @param {int} value
 * @return {INTEGER}
 * @override
 */
proto.setDefaultValue = function(value) {
  Field.prototype.setDefaultValue.call(this, value !== undefined ?
      parseInt(value) : undefined);
  return this;
};

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'INTEGER';
};
