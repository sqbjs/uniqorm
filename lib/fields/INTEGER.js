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
const DOUBLE = require('./DOUBLE');

/**
 *
 * @class
 * @extends DataField
 */
class INTEGER extends DOUBLE {

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
   * @return {Number|Null}
   */
  _parseValue(value) {
    value = super._parseValue(value);
    if (value)
      value = Math.trunc(value);
    return value;
  }

}

/**
 * Expose `INTEGER`.
 */
module.exports = INTEGER;
