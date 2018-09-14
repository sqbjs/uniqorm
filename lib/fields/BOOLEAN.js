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
const DataField = require('../DataField');

/**
 *
 * @class
 * @extends DataField
 */
class BOOLEAN extends DataField {

  /**
   *
   * @return {String}
   * @override
   */
  get jsType() {
    return 'Boolean';
  }

  /**
   *
   * @return {String}
   * @override
   */
  get sqlType() {
    return 'BOOLEAN';
  }

  /**
   * @type {Boolean}
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
    super.defaultValue = value == null ? null : !!value;
  }

}

/**
 * Expose `BOOLEAN`.
 */
module.exports = BOOLEAN;
