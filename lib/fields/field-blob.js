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
 * Expose `BLOB`.
 */
module.exports = BLOB;

/**
 *
 * @constructor
 * @extends Field
 */
function BLOB() {
  Field.call(this);
}

const proto = BLOB.prototype = {
  get jsType() {
    return 'Buffer';
  }
};
Object.setPrototypeOf(proto, Field.prototype);
proto.constructor = BLOB;

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'BLOB';
};
