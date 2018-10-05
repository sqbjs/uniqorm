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
   * @param {*} value
   * @return {Date|Null}
   */
  parseValue(value) {
    const d = super.parseValue(value);
    if (d)
      d.setHours(0, 0, 0, 0);
    return d;
  }

}

/**
 * Expose `DATE`.
 */
module.exports = DATE;
