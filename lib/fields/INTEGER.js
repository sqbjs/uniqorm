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
   * @override
   */
  _parse(value) {
    return value == null ? null : Math.trunc(super._parse(value));
  }

}

/**
 * Expose `INTEGER`.
 */
module.exports = INTEGER;
