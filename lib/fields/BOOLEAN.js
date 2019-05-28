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
const DataField = require('../DataField');

/**
 *
 * @class
 * @extends DataField
 */
class BOOLEAN extends DataField {

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {String}
   * @override
   */
  get jsType() {
    return 'Boolean';
  }

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {String}
   * @override
   */
  get sqlType() {
    return 'BOOLEAN';
  }

  /**
   *
   * @override
   */
  _parse(value) {
    return value == null ? null : !!value;
  }

}

/**
 * Expose `BOOLEAN`.
 */
module.exports = BOOLEAN;
