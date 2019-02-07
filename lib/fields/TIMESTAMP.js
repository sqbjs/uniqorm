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
const {ValidationError} = require('../errors');
const fecha = require('fecha');

const TIMESTAMP_PATTERN = /^([0-9]{4}|2[0-9]{3})-?(0[1-9]|1[012])-?([123]0|[012][1-9]|31)(?:[ T]([01][0-9]|2[0-3]):?([0-5][0-9]):?([0-5][0-9])(?:\.(\d{1,6}))?)?$/;

/**
 *
 * @class
 * @extends DataField
 */
class TIMESTAMP extends DataField {

  /**
   * @param {string} name
   * @param {Model|string} model
   * @param {Object} [def]
   * @param {string} def.fieldName
   * @param {boolean} def.primaryKey
   * @param {boolean} def.notNull
   * @param {Date} def.defaultValue
   * @param {Date} def.minValue
   * @param {Date} def.max
   * @constructor
   * @override
   */
  constructor(name, model, def) {
    super(name, model, def);
    this.minValue = this._parseValue(def && def.minValue);
    this.maxValue = this._parseValue(def && def.maxValue);
  }

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
    value = this._parseValue(value);

    if (!(value instanceof Date))
      throw new ValidationError('"%s" accepts Date, Number or date formatted String type only', this.name)
          .set({
            reason: 'invalid_type',
            field: this.name
          });

    if (this.minValue && value.getTime() < this.minValue.getTime())
      throw new ValidationError('Value is out of range for field "%s". (actual: %s, min: %s)',
          this.name, this._formatDate(value), this._formatDate(this.minValue))
          .set({
            reason: 'out_of_range',
            field: this.name,
            actual: value,
            min: this.minValue
          });
    if (this.maxValue && value.getTime() > this.maxValue.getTime())
      throw new ValidationError('Value is out of range for field "%s". (actual: %s, max: %s)',
          this.name, this._formatDate(value), this._formatDate(this.maxValue))
          .set({
            reason: 'out_of_range',
            field: this.name,
            actual: value,
            max: this.maxValue
          });
    return value;
  }

  _parseValue(value) {
    if (value == null)
      return null;

    if (value instanceof Date)
      return value;

    if (typeof value === 'number')
      return new Date(value);

    if (value === 'NOW')
      return new Date();

    if (value === 'DATE') {
      value = new Date();
      value.setHours(0, 0, 0, 0);
      return value;
    }

    if (typeof value === 'string') {
      const m = String(value).match(TIMESTAMP_PATTERN);
      if (!m)
        throw new ValidationError('Invalid date format "%s" for field "%s"', value, this.name)
            .set({
              reason: 'invalid_format',
              field: this.name
            });
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

  // noinspection JSMethodCanBeStatic
  _formatDate(value) {
    return fecha.format(value, 'YYYY-MM-DD HH:mm:ss');
  }

}

/**
 * Expose `TIMESTAMP`.
 */
module.exports = TIMESTAMP;
