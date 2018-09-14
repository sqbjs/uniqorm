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
    super.defaultValue = parseInt(value, 10) || null;
  }

}

/**
 * Expose `INTEGER`.
 */
module.exports = INTEGER;
