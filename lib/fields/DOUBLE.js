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
 * Expose `DOUBLE`.
 */
module.exports = DOUBLE;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends Field
 */
function DOUBLE(alias, def) {
  Field.apply(this, arguments);
  if (def.defaultValue)
    this._defaultValue = parseFloat(def.defaultValue);
}

DOUBLE.prototype = {
  /**
   *
   * @return {string}
   */
  get jsType() {
    return 'Number';
  },
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'DOUBLE';
  }
};

Object.setPrototypeOf(DOUBLE.prototype, Field.prototype);
DOUBLE.prototype.constructor = DOUBLE;
