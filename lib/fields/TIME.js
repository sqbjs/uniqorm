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
class TIME extends TIMESTAMP {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'TIME';
  }

  /**
   *
   * @param {*} value
   * @return {Date|Null}
   */
  _parse(value) {
    const d = super._parse(value);
    if (d)
      d.setFullYear(1970, 0, 1);
    return d;
  }

  /**
   *
   * @override
   */
  _serialize(value) {
    const v = super._parse(value);
    return v ? fecha.format(v, 'HH:mm:ss' +
        (v.getMilliseconds() ? '.SSS' : '')) : v;
  }

}

/**
 * Expose `TIME`.
 */
module.exports = TIME;
