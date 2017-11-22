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
const BLOB = require('./BLOB');

/**
 * Expose `BUFFER`.
 */
module.exports = BUFFER;

/**
 *
 * @constructor
 * @extends BLOB
 */
function BUFFER() {
  BLOB.call(this);
}

const proto = BUFFER.prototype = {
  get jsType() {
    return 'Buffer';
  }
};
Object.setPrototypeOf(proto, BLOB.prototype);
proto.constructor = BUFFER;

/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'BUFFER';
};
