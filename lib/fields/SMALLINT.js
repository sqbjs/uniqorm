/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://github.com/sqbjs/uniqorm
 */

/**
 * Module dependencies.
 * @private
 */
const INTEGER = require('./INTEGER');

/**
 *
 * @class
 * @extends INTEGER
 */
class SMALLINT extends INTEGER {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'SMALLINT';
  }
}

/**
 * Expose `SMALLINT`.
 */
module.exports = SMALLINT;
