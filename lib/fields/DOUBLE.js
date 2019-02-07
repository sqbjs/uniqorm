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
    this.minValue = this._parseValue(def && def.minValue);
    this.maxValue = this._parseValue(def && def.maxValue);
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
    value = this._parseValue(value);

    if (this.minValue != null && value < this.minValue)
      throw new ValidationError('Value is out of range for field "%s". (actual: %s, min: %s)',
          this.name, value, this.minValue)
          .set({
            reason: 'out_of_range',
            field: this.name,
            actual: value,
            min: this.minValue
          });
    if (this.maxValue != null && value > this.maxValue)
      throw new ValidationError('Value is out of range for field "%s". (actual: %s, max: %s)',
          this.name, value, this.maxValue)
          .set({
            reason: 'out_of_range',
            field: this.name,
            actual: value,
            max: this.maxValue
          });
    return super.parseValue(value);
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
    value = parseFloat(value);
    return value || value === 0 ? value : null;
  }

}

/**
 * Expose `DOUBLE`.
 */
module.exports = DOUBLE;
