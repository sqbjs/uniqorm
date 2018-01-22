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
 * Expose `TIMESTAMP`.
 */
module.exports = TIMESTAMP;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends Field
 */
function TIMESTAMP(alias, def) {
  Field.apply(this, arguments);
  if (def.defaultValue)
    this._defaultValue = def.defaultValue instanceof Date ?
        def.defaultValue : new Date(def.defaultValue);
}

TIMESTAMP.prototype = {
  /**
   *
   * @return {string}
   */
  get jsType() {
    return 'Date';
  },
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'TIMESTAMP';
  }
};

Object.setPrototypeOf(TIMESTAMP.prototype, Field.prototype);
TIMESTAMP.prototype.constructor = TIMESTAMP;
