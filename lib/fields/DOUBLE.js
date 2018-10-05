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

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get jsType() {
    return 'Number';
  }

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'DOUBLE';
  }

  /**
   *
   * @param {*} value
   * @return {Number|Null}
   */
  parseValue(value) {
    if (value == null)
      return null;
    value = parseFloat(value);
    return value || value === 0 ? value : null;
  }

}

/**
 * Expose `DOUBLE`.
 */
module.exports = DOUBLE;
