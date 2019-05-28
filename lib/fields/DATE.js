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
const TIMESTAMP = require('./TIMESTAMP');
const fecha = require('fecha');

/**
 *
 * @class
 * @extends TIMESTAMP
 */
class DATE extends TIMESTAMP {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'DATE';
  }

  /**
   *
   * @override
   */
  _parse(value) {
    const d = super._parse(value);
    if (d)
      d.setHours(0, 0, 0, 0);
    return d;
  }

  // noinspection JSMethodCanBeStatic
  _serialize(value) {
    return fecha.format(value, 'YYYY-MM-DD');
  }

}

/**
 * Expose `DATE`.
 */
module.exports = DATE;
