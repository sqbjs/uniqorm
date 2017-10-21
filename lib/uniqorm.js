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
const Model = require('./model');

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
 * @param {Object} [db]
 * @param {Object} options
 * @param {Boolean} options.caseSensitive
 * @constructor
 * @public
 */
function Uniqorm(db, options) {
  if (!(this instanceof Uniqorm)) {
    const o = Object.create(Uniqorm.prototype);
    Uniqorm.apply(o, arguments);
    return o;
  }

  if (!(db && typeof db.select === 'function')) {
    options = db;
    db = undefined;
  }
  if (db)
    this.db = db;
  this.models = {};
  this.options = options || {
    caseSensitive: false
  };
}

const proto = Uniqorm.prototype = {};
proto.constructor = Uniqorm;

/**
 * Creates a new Model class and adds to list
 * If argument is a configuration object it extends a new Model class
 *
 * @param {String} name
 * @param {Object} modelDef
 * @return {Function}
 * @public
 */
proto.define = function(name, modelDef) {
  if (!name)
    throw new ArgumentError('`name` argument required');
  if (this.get(name))
    throw new ArgumentError('Model `%s` already exists', name);
  const modelCTor = Model.extend(name, modelDef);
  modelCTor.prototype.orm = this;
  if (modelCTor.prototype.schemaName)
    name = modelCTor.prototype.schemaName + '.' + name;
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
proto.get = function(name) {
  if (!name)
    return undefined;
  const n = this.options.caseSensitive ? name : name.toLocaleLowerCase();
  return this.models[n];
};

