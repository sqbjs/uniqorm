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
const {ArgumentError} = require('errorex');

const TIMESTAMPTZ_PATTERN = /^(19[0-9]{2}|2[0-9]{3})-?(0[1-9]|1[012])-?([123]0|[012][1-9]|31)(?:[ T]([01][0-9]|2[0-3]):?([0-5][0-9]):?([0-5][0-9])(?:\.(\d{1,6}))?(?:([+-])([01][0-9]|2[0-3]):?([0-5][0-9])?)?)?$/;

/**
 *
 * @class
 * @extends DataField
 */
class TIMESTAMPTZ extends DataField {

  //noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get jsType() {
    return 'Date';
  }

  //noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'TIMESTAMPTZ';
  }

  /**
   *
   * @param {*} value
   * @return {Date|Null}
   */
  parseValue(value) {
    if (value == null)
      return null;
    if (value instanceof Date)
      return value;
    if (typeof value === 'number')
      return new Date(value);
    const m = String(value).match(TIMESTAMPTZ_PATTERN);
    if (!m)
      throw new ArgumentError('"%s" is not a valid date format', String(value));
    const s = m[1] + '-' + m[2] + '-' + m[3] + 'T' +
        (m[4] || '00') + ':' + (m[5] || '00') + ':' + (m[6] || '00') +
        (m[7] ? '.' + m[7] : '') +
        (m[9] ? ([m[8] + m[9]]) + ':' + (m[10] || '00') : '');
    return new Date(s);
  }

}

/**
 * Expose `TIMESTAMPTZ`.
 */
module.exports = TIMESTAMPTZ;
