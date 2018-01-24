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
 * Expose `BOOL`.
 */
module.exports = BOOL;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 */
function BOOL(alias, def) {
  Field.apply(this, arguments);
  if (def.defaultValue)
    this._defaultValue = Boolean(def.defaultValue);
}

BOOL.prototype = {
  /**
   *
   * @return {string}
   */
  get jsType() {
    return 'Boolean';
  },
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'BOOL';
  }
};

Object.setPrototypeOf(BOOL.prototype, Field.prototype);
BOOL.prototype.constructor = BOOL;
