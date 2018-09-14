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
const BUFFER = require('./BUFFER');

/**
 *
 * @class
 * @extends BUFFER
 */
class BLOB extends BUFFER {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'BLOB';
  }

}

/**
 * Expose `BLOB`.
 */
module.exports = BLOB;
