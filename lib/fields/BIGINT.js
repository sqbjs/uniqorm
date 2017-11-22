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
const INTEGER = require('./INTEGER');

/**
 * Expose `BIGINT`.
 */
module.exports = BIGINT;

/**
 *
 * @constructor
 * @extends INTEGER
 */
function BIGINT() {
  INTEGER.call(this);
}

const proto = BIGINT.prototype = {
  get jsType() {
    return 'Number';
  }
};
Object.setPrototypeOf(proto, INTEGER.prototype);
proto.constructor = BIGINT;

/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'BIGINT';
};
