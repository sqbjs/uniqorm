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
class TIME extends TIMESTAMP {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'TIME';
  }

  /**
   *
   * @param {*} value
   * @return {Date|Null}
   */
  _parseValue(value) {
    const d = super._parseValue(value);
    if (d)
      d.setUTCFullYear(0, 0, 0);
    return d;
  }

}

/**
 * Expose `TIME`.
 */
module.exports = TIME;
