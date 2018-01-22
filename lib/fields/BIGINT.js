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
const INTEGER = require('../fields/INTEGER');

/**
 * Expose `BIGINT`.
 */
module.exports = BIGINT;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends INTEGER
 */
function BIGINT(alias, def) {
  INTEGER.apply(this, arguments);
}

BIGINT.prototype = {
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'BIGINT';
  }
};

Object.setPrototypeOf(BIGINT.prototype, INTEGER.prototype);
BIGINT.prototype.constructor = BIGINT;
