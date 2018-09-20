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
   * @constructor
   */
  constructor(name, model) {
    this._name = name;
    this._model = model;
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
    return this._model;
  }

  /**
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   *
   * @protected
   */
  prepare() {
    // Do nothing
  }

}

/**
 * Expose `Field`.
 */
module.exports = Field;
