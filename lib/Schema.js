/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

const {ErrorEx} = require('errorex');

/**
 *
 * @class
 */
class Schema {

  /**
   * @param {Uniqorm} orm
   * @param {string} name
   * @param {boolean} isDefault
   * @constructor
   */
  constructor(orm, name, isDefault) {
    this._orm = orm;
    this._name = name;
    this._models = {};
    this._isDefault = !!isDefault;
  }

  /**
   *
   * @return {Uniqorm}
   */
  get orm() {
    return this._orm;
  }

  /**
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * @type {string}
   */
  get isDefault() {
    return this._isDefault;
  }

  /**
   * @type {Object}
   */
  get models() {
    return this._models;
  }

  /**
   * Returns Model
   *
   * @param {string} modelName
   * @return {Model}
   * @public
   */
  getModel(modelName) {
    const model = this.models[modelName];
    if (!model)
      throw new ErrorEx('Schema "%s" has no model named "%s"', this.name, modelName);
    return model;
  }

}

/**
 * Expose `Schema`.
 */
module.exports = Schema;
