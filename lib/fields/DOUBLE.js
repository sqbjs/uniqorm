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

/**
 *
 * @class
 * @extends DataField
 */
class DOUBLE extends DataField {

  /**
   * @param {string} name
   * @param {Model|string} model
   * @param {Object} [def]
   * @param {string} def.fieldName
   * @param {boolean} def.primaryKey
   * @param {boolean} def.notNull
   * @param {number} def.defaultValue
   * @param {number} def.minValue
   * @param {number} def.maxValue
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

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get jsType() {
    return 'Number';
  }

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'DOUBLE';
  }

  /**
   *
   * @param {*} value
   * @return {Number|Null}
   */
  parseValue(value) {
    if (value == null)
      return null;
    const v = this._parseValue(value);

    if (isNaN(v))
      throw new ValidationError('"%s" is not a valid number value for field "%s"',
          value, this.name)
          .set({
            reason: 'invalid_format',
            field: this.name
          });

    if (this.minValue) {
      const minValue = typeof this.minValue === 'function' ?
          this._parseValue(this.minValue()) : this.minValue;

      if (minValue != null && v < minValue)
        throw new ValidationError('Value is out of range for field "%s". (actual: %s, min: %s)',
            this.name, v, minValue)
            .set({
              reason: 'out_of_range',
              field: this.name,
              actual: v,
              min: minValue
            });
    }

    if (this.maxValue) {
      const maxValue = typeof this.maxValue === 'function' ?
          this._parseValue(this.maxValue()) : this.maxValue;

      if (maxValue != null && v > maxValue)
        throw new ValidationError('Value is out of range for field "%s". (actual: %s, max: %s)',
            this.name, v, maxValue)
            .set({
              reason: 'out_of_range',
              field: this.name,
              actual: v,
              max: maxValue
            });
    }

    return super.parseValue(v);
  }

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @param {*} value
   * @return {Number|Null}
   */
  _parseValue(value) {
    if (value == null)
      return null;
    return parseFloat(value);
  }

}

/**
 * Expose `DOUBLE`.
 */
module.exports = DOUBLE;
