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
class TEXT extends DataField {

  //noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get jsType() {
    return 'String';
  }

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'TEXT';
  }

  /**
   * @type {String}
   * @override
   */
  get defaultValue() {
    return super.defaultValue;
  }

  /**
   * @param {String} value
   * @override
   */
  set defaultValue(value) {
    super.defaultValue = value == null ? null : String(value);
  }

}

/**
 * Expose `TEXT`.
 */
module.exports = TEXT;
