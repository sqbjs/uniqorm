/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Module dependencies
 * @private
 */
const {ArgumentError} = require('errorex');

/**
 *
 * @class
 */
class Association {

  /**
   *
   * @param {Model} model
   * @param {Object} def
   * @param {String} [def.name]
   * @param {String} def.model
   * @param {String} def.key
   * @param {String} def.foreignKey
   * @constructor
   */
  constructor(model, def) {

    if (!def.key)
      throw new ArgumentError('Invalid association definition for model "%s". You must provide "key" property.',
          def.model.name);

    if (!def.model)
      throw new ArgumentError('Invalid association definition for model "%s". You must provide "model" property.',
          def.model.name);

    if (!def.foreignKey)
      throw new ArgumentError('Invalid association definition or model "%s". You must provide "foreignKey" property.',
          def.model.name);

    this._model = model;
    this._def = def;
  }

  get name() {
    return this._def.name;
  }

  get orm() {
    return this.model.orm;
  }

  get model() {
    return this._model;
  }

  get key() {
    return this._def.key;
  }

  get foreignModel() {
    if (!this._foreignModel)
      throw new Error('Unable to access foreign model. You must call orm.bake() first.');
    return this._foreignModel;
  }

  get foreignKey() {
    return this._def.foreignKey;
  }

  bake() {
    this._foreignModel = this.orm.get(this._def.model);
  }

  toString() {
    return '[object ' + Object.getPrototypeOf(this).constructor.name + '(' +
        this.model.name + '.' + this.key + ' > ' +
        this._def.model + '.' + this.foreignKey + ')]';
  }

  inspect() {
    return this.toString();
  }
}

/**
 * Expose `Association`.
 */
module.exports = Association;
