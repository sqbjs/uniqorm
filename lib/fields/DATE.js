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
class DATE extends TIMESTAMP {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'DATE';
  }

  /**
   *
   * @override
   */
  _parseValue(value) {
    const d = super._parseValue(value);
    if (d)
      d.setUTCHours(0, 0, 0, 0);
    return d;
  }

}

/**
 * Expose `DATE`.
 */
module.exports = DATE;
