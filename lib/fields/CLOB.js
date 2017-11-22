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
 * Expose `CLOB`.
 */
module.exports = CLOB;

/**
 *
 * @constructor
 * @extends Field
 */
function CLOB() {
  Field.call(this);
}

const proto = CLOB.prototype = {
  get jsType() {
    return 'String';
  }
};
Object.setPrototypeOf(proto, Field.prototype);
proto.constructor = CLOB;

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'CLOB';
};
