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
const INTEGER = require('./INTEGER');

/**
 * Expose `SMALLINT`.
 */
module.exports = SMALLINT;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends Field
 */
function SMALLINT(alias, def) {
  INTEGER.apply(this, arguments);
}

SMALLINT.prototype = {
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'SMALLINT';
  }
};

Object.setPrototypeOf(SMALLINT.prototype, INTEGER.prototype);
SMALLINT.prototype.constructor = SMALLINT;
