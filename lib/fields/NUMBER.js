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
const DOUBLE = require('../fields/DOUBLE');

/**
 *
 * @class
 * @extends DOUBLE
 */
class NUMBER extends DOUBLE {

  /**
   * @param {string} name
   * @param {Model|string} model
   * @param {Object} [def]
   * @param {string} def.fieldName
   * @param {boolean} def.primaryKey
   * @param {boolean} def.notNull
   * @param {number} def.defaultValue
   * @param {number} def.precision
   * @param {number} def.scale
   * @constructor
   * @override
   */
  constructor(name, model, def) {
    super(name, model, def);
    this.precision = def && def.precision;
    this.scale = def && def.scale;
  }

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'NUMBER(' + this.precision + ',' + this.scale + ')';
  }

  /**
   * @type {number}
   */
  get precision() {
    return this._precision;
  }

  /**
   * @param {number} value
   */
  set precision(value) {
    this._precision = parseInt(value, 10) || 18;
  }

  /**
   * @type {number}
   */
  get scale() {
    return this._scale;
  }

  /**
   * @param {number} value
   */
  set scale(value) {
    this._scale = value == null ? 2 :
        parseInt(value, 10) || 0;
  }

}

/**
 * Expose `NUMBER`.
 */
module.exports = NUMBER;
