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
 * Expose `CHAR`.
 */
module.exports = CHAR;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends VARCHAR
 */
function CHAR(alias, def) {
  Field.apply(this, arguments);
  this._charLength = def.charLength;
  if (def.defaultValue)
    this._defaultValue = String(def.defaultValue);
}

CHAR.prototype = {
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
    return 'CHAR(' + (this._charLength) + ')';
  }
};

Object.setPrototypeOf(CHAR.prototype, Field.prototype);
CHAR.prototype.constructor = CHAR;
