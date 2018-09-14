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
class DOUBLE extends DataField {

  /**
   *
   * @return {string}
   * @override
   */
  get jsType() {
    return 'Number';
  }

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'DOUBLE';
  }

  /**
   * @type {Number}
   * @override
   */
  get defaultValue() {
    return super.defaultValue;
  }

  /**
   * @param {Number} value
   * @override
   */
  set defaultValue(value) {
    super.defaultValue = parseFloat(value) || null;
  }

}

/**
 * Expose `DOUBLE`.
 */
module.exports = DOUBLE;
