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
   *
   * @param {*} value
   * @return {String|Null}
   */
  parseValue(value) {
    return value == null ? null : String(value);
  }

}

/**
 * Expose `TEXT`.
 */
module.exports = TEXT;
