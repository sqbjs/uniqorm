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
const TEXT = require('./TEXT');

/**
 *
 * @class
 * @extends TEXT
 */
class CLOB extends TEXT {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'CLOB';
  }

}

/**
 * Expose `CLOB`.
 */
module.exports = CLOB;
