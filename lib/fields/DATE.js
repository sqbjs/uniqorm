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
 * Expose `DATE`.
 */
module.exports = DATE;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends TIMESTAMP
 */
function DATE(alias, def) {
  TIMESTAMP.apply(this, arguments);
  if (this._defaultValue)
    this._defaultValue.setHours(0, 0, 0, 0);
}

DATE.prototype = {
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'DATE';
  }
};

Object.setPrototypeOf(DATE.prototype, TIMESTAMP.prototype);
DATE.prototype.constructor = DATE;
