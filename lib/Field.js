/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 *
 * @class
 * @abstract
 */
class Field {

  /**
   * @param {string} name
   * @param {Model|string} model
   * @param {Object} [def]
   * @constructor
   */
  constructor(name, model, def) {
    this._name = name;
    this._model = null;
    if (typeof model === 'object')
      this._model = model;
    else this._modelName = model;
    this._def = def || {};
  }

  /**
   * @type {Uniqorm}
   */
  get orm() {
    return this._model.orm;
  }

  /**
   * @type {Model}
   */
  get model() {
    if (!this._model)
      throw new Error('Unable to access "model" property. You must call orm.bake() first.');
    return this._model;
  }

  /**
   * @type {string}
   */
  get name() {
    return this._name;
  }

  bake() {
    if (this._modelName)
      this._model = this.orm.get(this._modelName);
  }

}

/**
 * Expose `Field`.
 */
module.exports = Field;
