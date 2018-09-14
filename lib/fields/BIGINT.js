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
 *
 * @class
 * @extends INTEGER
 */
class BIGINT extends INTEGER {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'BIGINT';
  }

}

/**
 * Expose `BIGINT`.
 */
module.exports = BIGINT;
