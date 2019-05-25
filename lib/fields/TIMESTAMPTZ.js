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
const TIMESTAMP = require('./TIMESTAMP');

/**
 *
 * @class
 * @extends TIMESTAMP
 */
class TIMESTAMPTZ extends TIMESTAMP {

  //noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'TIMESTAMPTZ';
  }

}

/**
 * Expose `TIMESTAMPTZ`.
 */
module.exports = TIMESTAMPTZ;
