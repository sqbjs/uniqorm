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
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends Field
 */
function CLOB(alias, def) {
  Field.apply(this, arguments);
}

CLOB.prototype = {
  /**
   *
   * @return {string}
   */
  get jsType() {
    return 'String';
  },
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'CLOB(' + (this._charLength) + ')';
  }
};

Object.setPrototypeOf(CLOB.prototype, Field.prototype);
CLOB.prototype.constructor = CLOB;
