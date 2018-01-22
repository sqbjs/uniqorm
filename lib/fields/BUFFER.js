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
 * Expose `BUFFER`.
 */
module.exports = BUFFER;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends BLOB
 */
function BUFFER(alias, def) {
  Field.apply(this, arguments);
}

BUFFER.prototype = {
  /**
   *
   * @return {string}
   */
  get jsType() {
    return 'Buffer';
  },

  /**
   *
   * @return {string}
   */
  get sqlType() {
    return 'BUFFER';
  }
};

Object.setPrototypeOf(BUFFER.prototype, Field.prototype);
BUFFER.prototype.constructor = BUFFER;
