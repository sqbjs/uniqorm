/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://github.com/sqbjs/uniqorm
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
   * @param {String} def.foreignModel
   * @param {String} def.key
   * @param {String} def.foreignKey
   * @constructor
   */
  constructor(model, def) {

    if (!def.key)
      throw new ArgumentError('Invalid association definition for model "%s". You must provide "key" property.',
          model.name);

    if (!def.foreignModel)
      throw new ArgumentError('Invalid association definition for model "%s". You must provide "foreignModel" property.',
          model.name);

    if (!def.foreignKey)
      throw new ArgumentError('Invalid association definition or model "%s". You must provide "foreignKey" property.',
          model.name);

    this._model = model;
    this._name = def.name;
    this._key = def.key;
    this._foreignModel = def.foreignModel;
    this._foreignKey = def.foreignKey;
  }

  get orm() {
    return this.model.orm;
  }

  get name() {
    return this._name;
  }

  get model() {
    return this._model;
  }

  get key() {
    return this._key;
  }

  get foreignModel() {
    return this.orm.getModel(this._foreignModel);
  }

  get foreignKey() {
    return this._foreignKey;
  }

  toString() {
    return '[object ' + Object.getPrototypeOf(this).constructor.name + '(' +
        this.model.name + '.' + this.key + '>' +
        this._foreignModel + '.' + this.foreignKey + ')]';
  }

  inspect() {
    return this.toString();
  }
}

/**
 * Expose `Association`.
 */
module.exports = Association;
