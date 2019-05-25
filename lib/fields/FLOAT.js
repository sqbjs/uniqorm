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
const DOUBLE = require('./DOUBLE');

/**
 *
 * @class
 * @extends DOUBLE
 */
class FLOAT extends DOUBLE {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'FLOAT';
  }

}

/**
 * Expose `FLOAT`.
 */
module.exports = FLOAT;
