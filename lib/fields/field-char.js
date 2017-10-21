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
const VARCHAR = require('./field-varchar');

/**
 * Expose `CHAR`.
 */
module.exports = CHAR;

/**
 *
 * @param {Number} length
 * @constructor
 * @extends VARCHAR
 */
function CHAR(length) {
  VARCHAR.call(this, length);
}

const proto = CHAR.prototype = {};
Object.setPrototypeOf(proto, VARCHAR.prototype);
proto.constructor = CHAR;

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'CHAR';
};
