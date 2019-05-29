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
const TEXT = require('./TEXT');
const {ValidationError} = require('../errors');

/**
 *
 * @class
 * @extends TEXT
 */
class VARCHAR extends TEXT {

  /**
   * @param {string} name
   * @param {Model|string} model
   * @param {Object} [def]
   * @param {string} def.fieldName
   * @param {boolean} def.primaryKey
   * @param {boolean} def.notNull
   * @param {number} def.defaultValue
   * @param {number} def.charLength
   * @constructor
   * @override
   */
  constructor(name, model, def) {
    super(name, model, def);
    this.charLength = def && def.charLength;
  }

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return this.charLength ?
        'VARCHAR(' + (this.charLength) + ')' : 'VARCHAR';
  }

  /**
   * @type {Number}
   * @override
   */
  get charLength() {
    return this._charLength;
  }

  /**
   * @param {Number} value
   * @override
   */
  set charLength(value) {
    this._charLength = value == null ? null :
        parseInt(value, 10) || null;
  }

  /**
   *
   * @override
   */
  _serialize(value) {
    const s = super.serialize(value);
    if (this.charLength)
      return s.substring(0, this.charLength);
    return s;
  }

  /**
   *
   * @override
   */
  _validate(value) {
    super._validate(value);
    if (value == null)
      return;
    value = String(value);
    // Validate char length
    if (this.charLength && value.length > this.charLength)
      throw new ValidationError('Value too large for field "%s" (actual: %d, maximum: %d)',
          this.name, value.length, this.charLength)
          .set({
            reason: 'value_too_large',
            field: this.name,
            actual: value.length,
            max: this.charLength
          });
  }

}

/**
 * Expose `VARCHAR`.
 */
module.exports = VARCHAR;
