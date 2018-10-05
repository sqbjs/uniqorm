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
class INTEGER extends DataField {

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
    return 'INTEGER';
  }

  /**
   *
   * @param {*} value
   * @return {Int|Null}
   */
  parseValue(value) {
    if (value == null)
      return null;
    value = parseInt(value, 10);
    return value || value === 0 ? value : null;
  }

}

/**
 * Expose `INTEGER`.
 */
module.exports = INTEGER;
