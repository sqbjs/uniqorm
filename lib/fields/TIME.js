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
const TIMESTAMP = require('./TIMESTAMP');

/**
 * Expose `TIME`.
 */
module.exports = TIME;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends TIMESTAMP
 */
function TIME(alias, def) {
  TIMESTAMP.apply(this, arguments);
  if (this._defaultValue)
    this._defaultValue.setFullYear(0, 0, 0);
}

TIME.prototype = {
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'TIME';
  }
};

Object.setPrototypeOf(TIME.prototype, TIMESTAMP.prototype);
TIME.prototype.constructor = TIME;
