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
const {EventEmitter} = require('events');
const {ArgumentError} = require('errorex');
const Model = require('./Model');
const isPlainObject = require('putil-isplainobject');

/**
 * @class
 * @extends EventEmitter
 */
class Uniqorm extends EventEmitter {

  /**
   * @param {Object} [sqbPool]
   * @param {Object} [options]
   * @param {Boolean} options.silent
   * @constructor
   * @public
   */
  constructor(sqbPool, options) {
    super();
    if (sqbPool && typeof sqbPool.select !== 'function')
      throw new ArgumentError('First argument can be an SQB pool instance only');
    if (sqbPool)
      this.pool = sqbPool;
    this._models = new Map();
    this.options = options || {};
  }

  get models() {
    return this._models;
  }

  /**
   * Creates a new Model
   *
   * @param {Object} modelDef
   * @return {Model}
   * @public
   */
  define(modelDef) {
    if (!isPlainObject(modelDef))
      throw new ArgumentError('Model definition argument (modelDef) is empty or is not valid');

    if (this.models.get(modelDef.name))
      throw new ArgumentError('Model `%s` already exists', modelDef.name);

    const model = new Model(this, modelDef);
    this.models.set(modelDef.name, model);
    this.emit('define', model);
    return model;
  }

  /**
   * Returns Model Class
   *
   * @param {string} name
   * @return {Class<Model>}
   * @public
   */
  get(name) {
    const model = this.models.get(name);
    if (!model)
      throw new Error('Model "' + name + '" not found');
    return model;
  }

  bake() {
    for (const model of this.models.values()) {
      for (const association of model.associations.values()) {
        association.bake();
      }
    }
    for (const model of this.models.values())
      model.bake();
  }

}

/**
 * Expose `Uniqorm`.
 */
module.exports = Uniqorm;
