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
const Field = require('../Field');

/**
 * Expose `NUMBER`.
 */
module.exports = NUMBER;

/**
 *
 * @param {Number} precision
 * @param {Number} scale
 * @constructor
 * @extends Field
 */
function NUMBER(precision, scale) {
  Field.call(this);
  if (!precision)
    this.setPrecision(precision);
  if (!scale)
    this.setPrecision(scale);
}

const proto = NUMBER.prototype = {
  get jsType() {
    return 'Number';
  },

  /**
   * @type {int}
   */
  get precision() {
    return this._precision;
  },

  /**
   * @param {int} val
   */
  set precision(val) {
    this._precision = parseInt(val);
  },

  /**
   * @type {int}
   */
  get scale() {
    return this._scale;
  },

  /**
   * @param {int} val
   */
  set scale(val) {
    this._scale = parseInt(val) || 0;
  }
};
Object.setPrototypeOf(proto, Field.prototype);
proto.constructor = NUMBER;

//noinspection JSCheckFunctionSignatures
/**
 *
 * @param {Number} value
 * @return {NUMBER}
 * @override
 */
proto.setDefaultValue = function(value) {
  Field.prototype.setDefaultValue.call(this, value !== undefined ?
      parseFloat(value) : undefined);
  return this;
};

/**
 *
 * @param {int} [value = 18]
 * @return {NUMBER}
 */
proto.setPrecision = function(value) {
  this.precision = value !== undefined ? value : 18;
  return this;
};

/**
 *
 * @param {int} [value = 0]
 * @return {NUMBER}
 */
proto.setScale = function(value) {
  this.scale = value !== undefined ? value : 0;
  return this;
};

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @return {string}
 * @public
 */
proto.toSql = function() {
  return 'NUMBER' + (this._precision || this._scale ?
      '(' + (this._precision || 18) + ',' + (this._scale || 0) +
      ')' : '');
};
