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
const errorex = require('errorex');
const Model = require('./Model');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;
const MODEL_NAME_PATTERN = /^(?:([A-Za-z]\w*)\.)?([A-Za-z]\w*)?$/;

/**
 * Expose `Uniqorm`.
 */
module.exports = Uniqorm;

/**
 * @param {Object} [sqbPool]
 * @param {Object} options
 * @param {Boolean} options.caseSensitive
 * @constructor
 * @public
 */
function Uniqorm(sqbPool, options) {
  if (!(this instanceof Uniqorm)) {
    const o = Object.create(Uniqorm.prototype);
    Uniqorm.apply(o, arguments);
    return o;
  }

  if (!(sqbPool && typeof sqbPool.select === 'function')) {
    options = sqbPool;
    sqbPool = undefined;
  }
  if (sqbPool)
    this.pool = sqbPool;
  this.models = {};
  this.options = options || {};
  //this.options.caseSensitive = this.options.caseSensitive || false;
  this.options.validateFields = this.options.validateFields ||
      this.options.validateFields === undefined;
}

/**
 * Creates a new Model
 *
 * @param {String} name
 * @param {Object} modelDef
 * @return {Function}
 * @public
 */
Uniqorm.prototype.define = function(name, modelDef) {
  if (typeof name !== 'string')
    throw new ArgumentError('A string value required for model name');
  if (this.get(name))
    throw new ArgumentError('Model `%s` already exists', name);

  return this.models[name] = new Model(this, name, modelDef);
};

/**
 * Returns Model constructor
 *
 * @param {string} [modelName]
 * @return {Function|undefined}
 * @public
 */
Uniqorm.prototype.get = function(modelName) {
  if (!modelName)
    return undefined;
  const m = modelName.match(MODEL_NAME_PATTERN);
  if (!m)
    throw new ArgumentError('Invalid model modelName `%s`', modelName);
  var o = this.models;
  if (m[1])
    o = o[m[1]];
  return o && o[m[2]];
};
