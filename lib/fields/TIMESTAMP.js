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
const {ValidationError} = require('../errors');
const fecha = require('fecha');

const TIMESTAMP_PATTERN = /^(\d{4})-?(0[1-9]|1[012])-?([123]0|[012][1-9]|31)T? ?(?:([01][0-9]|2[0-3]):?([0-5][0-9])(?::?([0-5][0-9]))?(?:\.?(\d+))?(?:(Z)|(?:([+-])([01]?[0-9]|2[0-3]):?([0-5][0-9])?))?)?$/;

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
   * @param {Date|Function} def.minValue
   * @param {Date|Function} def.maxValue
   * @constructor
   * @override
   */
  constructor(name, model, def) {
    super(name, model, def);
    if (def) {
      this.minValue = typeof def.minValue === 'function' ?
          def.minValue : this._parseValue(def.minValue);
      this.maxValue = typeof def.maxValue === 'function' ?
          def.maxValue : this._parseValue(def.maxValue);
    }
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

    if (this.minValue) {
      const minValue = typeof this.minValue === 'function' ?
          this._parseValue(this.minValue()) : this.minValue;

      if (value.getTime() < minValue.getTime())
        throw new ValidationError('Value is out of range for field "%s". (actual: %s, min: %s)',
            this.name, this._formatDate(value), this._formatDate(minValue))
            .set({
              reason: 'out_of_range',
              field: this.name,
              actual: value,
              min: minValue
            });
    }

    if (this.maxValue) {
      const maxValue = typeof this.maxValue === 'function' ?
          this._parseValue(this.maxValue()) : this.maxValue;

      if (value.getTime() > maxValue.getTime())
        throw new ValidationError('Value is out of range for field "%s". (actual: %s, max: %s)',
            this.name, this._formatDate(value), this._formatDate(maxValue))
            .set({
              reason: 'out_of_range',
              field: this.name,
              actual: value,
              max: maxValue
            });
    }
    return value;
  }

  /**
   *
   * @param {*} value
   * @return {null|Date}
   * @protected
   */
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
      let s = m[1] + '-' + m[2] + '-' + m[3];
      if (!m[4]) {
        s += 'T00:00:00';
      } else {
        s += 'T' + m[4] + ':' + m[5] + ':' + (m[6] || '00') +
            (m[7] ? '.' + m[7] : '');
        if (m[9]) {
          s += m[9] + (m[10] || '00') + ':' + (m[11] || '00');
        }
      }
      s += 'Z';
      return new Date(s);
    }
    throw new ValidationError('"%s" accepts Date, Number or date formatted String type only', this.name)
        .set({
          reason: 'invalid_type',
          field: this.name
        });
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
