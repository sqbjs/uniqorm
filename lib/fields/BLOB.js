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
const BUFFER = require('./BUFFER');

/**
 * Expose `BLOB`.
 */
module.exports = BLOB;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends Field
 */
function BLOB(alias, def) {
  BUFFER.apply(this, arguments);
}

BLOB.prototype = {
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'BLOB';
  }
};
Object.setPrototypeOf(BLOB.prototype, BUFFER.prototype);
BLOB.prototype.constructor = BLOB;
