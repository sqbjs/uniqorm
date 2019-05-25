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
const Field = require('./Field');
const {makeArray} = require('./helpers');
const {ArgumentError} = require('errorex');

/**
 *
 * @class
 * @extends Field
 */
class CalculatedField extends Field {

  /**
   * @param {string} name
   * @param {Model|string} model
   * @param {Object} [def]
   * @param {Function} [def.calc]
   * @param {Array<String>|string} [def.requires]
   * @constructor
   * @override
   */
  constructor(name, model, def) {
    super(name, model);
    if (!(def.calculate && typeof def.calculate === 'function'))
      throw new ArgumentError('You must provide a Function for "calculate" option');
    this._calculate = def.calculate;
    this._requires = makeArray(def.requires);
  }

  /**
   * @type {null|Function}
   */
  get calculate() {
    return this._calculate;
  }

  /**
   *
   * @return {Array<String>}
   */
  get requires() {
    return this._requires;
  }

}

/**
 * Expose `CalculatedField`.
 */
module.exports = CalculatedField;
