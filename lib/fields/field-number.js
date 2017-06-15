/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const Field = require('../field');


/**
 * @class
 */
class NUMBER extends Field {

  constructor(precision, scale) {
    super(precision);
    if (typeof precision === 'object') {
      this.setPrecision(precision.precision);
      this.setScale(precision.scale);
      this.setUnsigned(precision.unsigned);
    } else {
      if (!precision)
        this.setPrecision(precision);
      if (!scale)
        this.setPrecision(scale);
    }
  }

  /**
   * @type {int}
   */
  get precision() {
    return this._precision;
  }

  /**
   * @param {int} val
   */
  set precision(val) {
    this._precision = parseInt(val);
  }

  /**
   * @type {int}
   */
  get scale() {
    return this._scale;
  }

  /**
   * @param {int} val
   */
  set scale(val) {
    this._scale = parseInt(val) || 0;
  }

  /**
   * @type {boolean}
   */
  get unsigned() {
    return this._unsigned;
  }

  /**
   * @param {boolean} val
   */
  set unsigned(val) {
    this._unsigned = val;
  }

  //noinspection JSCheckFunctionSignatures
  /**
   *
   * @param {Number} value
   * @return {NUMBER}
   * @override
   */
  setDefaultValue(value) {
    super.setDefaultValue(parseFloat(value));
    return this;
  }

  /**
   *
   * @param {int} [value = 18]
   * @return {NUMBER}
   */
  setPrecision(value = 18) {
    this.precision = value;
    return this;
  }

  /**
   *
   * @param {int} [value = 0]
   * @return {NUMBER}
   */
  setScale(value = 0) {
    this.scale = value;
    return this;
  }

  /**
   *
   * @param {boolean} [value = true]
   * @return {NUMBER}
   */
  setUnsigned(value = true) {
    this.unsigned = value;
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string}
   * @public
   */
  toSql() {
    return 'NUMBER' + (this._precision || this._scale ?
            '(' + (this._precision || 18) + ',' + (this._scale || 0) +
            ')' : '');
  }
}

module.exports = NUMBER;
