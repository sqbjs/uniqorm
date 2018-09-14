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
   * @type {Date}
   * @override
   */
  get defaultValue() {
    return super.defaultValue;
  }

  /**
   * @param {Date} value
   * @override
   */
  set defaultValue(value) {
    super.defaultValue = value;
    if (this.defaultValue instanceof Date)
      this.defaultValue.setHours(0, 0, 0, 0);
  }
}

/**
 * Expose `DATE`.
 */
module.exports = DATE;
