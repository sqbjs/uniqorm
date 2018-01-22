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
 * Expose `INTEGER`.
 */
module.exports = INTEGER;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends Field
 */
function INTEGER(alias, def) {
  Field.apply(this, arguments);
  if (def.defaultValue)
    this._defaultValue = parseInt(def.defaultValue, 10);
}

INTEGER.prototype = {
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
    return 'INTEGER';
  }
};

Object.setPrototypeOf(INTEGER.prototype, Field.prototype);
INTEGER.prototype.constructor = INTEGER;
