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

const DATE_PATTERN = /^(19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)(?:[ T]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(?:\.(\d{1,6}))?)?$/;

/**
 *
 * @class
 * @extends DataField
 */
class TIMESTAMP extends DataField {

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
    return 'TIMESTAMP';
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
    if (isNumeric(value))
      return new Date(value);
    const m = String(value).match(DATE_PATTERN);
    if (!m)
      throw new ArgumentError('"%s" is not a valid date format', String(value));
    return new Date(
        parseInt(m[1], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[3], 10),
        parseInt(m[4], 10) || 0,
        parseInt(m[5], 10) || 0,
        parseInt(m[6], 10) || 0,
        parseInt(m[7], 10) || 0
    );
  }

}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Expose `TIMESTAMP`.
 */
module.exports = TIMESTAMP;
