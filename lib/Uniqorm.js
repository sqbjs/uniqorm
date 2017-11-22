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
  this.options = options || {
    caseSensitive: false
  };
}

/**
 * Creates a new Model class and adds to list
 * If argument is a configuration object it extends a new Model class
 *
 * @param {String} name
 * @param {Object} modelDef
 * @return {Function}
 * @public
 */
Uniqorm.prototype.define = function(name, modelDef) {
  if (!name)
    throw new ArgumentError('`name` argument required');
  if (this.get(name))
    throw new ArgumentError('Model `%s` already exists', name);
  const modelCTor = Model.extend(name, modelDef);
  modelCTor.prototype.orm = this;
  if (modelCTor.prototype.ownerName)
    name = modelCTor.prototype.ownerName + '.' + name;
  name = this.options.caseSensitive ? name : name.toLocaleLowerCase();
  return this.models[name] = modelCTor;
};

/**
 * Returns Model constructor
 *
 * @param {string} [name]
 * @return {Function|undefined}
 * @public
 */
Uniqorm.prototype.get = function(name) {
  if (!name)
    return undefined;
  const n = this.options.caseSensitive ? name : name.toLocaleLowerCase();
  return this.models[n];
};

