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
const defineConst = require('putil-defineconst');
const Field = require('./Field');

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
  this.options = options || {
    caseSensitive: false,
    validateFields: true
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
  if (this.get(name))
    throw new ArgumentError('Model `%s` already exists', name);
  const modelCTor = extendModel(this, name, modelDef);
  var o = this.models;
  var v = modelCTor.prototype.schemaName;
  if (v) {
    o[v] = o[v] || {};
    o = o[v];
  }
  return o[modelCTor.prototype.tableName] = modelCTor;
};

/**
 * Creates all Model classes from a single definition object
 *
 * @param {Object} modelDefs
 * @public
 */
Uniqorm.prototype.defineAll = function(modelDefs) {
  const self = this;
  const modelKeys = Object.getOwnPropertyNames(modelDefs);
  /* Define models */
  modelKeys.forEach(function(n) {
    self.define(n, modelDefs[n]);
  });
  /* Define associations */
  modelKeys.forEach(function(n) {
    const def = modelDefs[n];
    if (def.foreignKeys && def.foreignKeys.length) {
      def.foreignKeys.forEach(function(o) {
        const fromModel = self.get(n);
        if (!fromModel)
          throw new ArgumentError('Unable to define foreign associations. Model (%s) not found', n);
        const toModel = self.get(o.model);
        if (!toModel)
          throw new ArgumentError('Unable to define foreign associations. Model (%s) not found', o.model);
        fromModel.belongsTo(toModel, o.from, o.to);
      });
    }
  });
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

function extendModel(orm, modelName, modelDef) {
  if (!modelName)
    throw new ArgumentError('`modelName` argument required');
  if (typeof modelDef !== 'object')
    throw new ArgumentError('`modelDef` argument is empty or is not valid');

  if (!(typeof modelName === 'string' && modelName.match(MODEL_NAME_PATTERN)))
    throw new ArgumentError('Invalid model name `%s`', modelName);

  const m = modelName.match(MODEL_NAME_PATTERN);
  const schemaName = modelDef.schemaName || m[1];
  const tableName = modelDef.tableName || m[2];
  var primaryKeys;
  if (modelDef.primaryKey && modelDef.primaryKey.columns) {
    const x = modelDef.primaryKey.columns;
    if (typeof x === 'string')
      primaryKeys = modelDef.primaryKey.columns.split(/\s*,\s*/);
    else if (Array.isArray(x)) primaryKeys = x;
    else throw new ArgumentError('Array of String type allowed for property "primaryKeys"');
  }
  const fields = buildFields(modelDef.fields, primaryKeys);

  /* Create model class */
  const className = camelCase(m[1].replace(/_/g, '')) +
      camelCase(m[2].replace(/_/g, '')) + 'Model';
  const _super = Model;
  const ctor = function Model() {
    _super.apply(this, arguments);
  };
  Object.assign(ctor, Model);
  ctor.prototype = Object.create(_super.prototype);
  ctor.prototype.constructor = ctor;
  defineConst(ctor, 'name', className, false);
  defineConst(ctor.prototype, {
    orm: orm,
    name: className,
    schemaName: schemaName,
    tableName: tableName,
    fields: fields,
    primaryKeys: primaryKeys,
    relations: []
  }, true);
  return ctor;
}

/**
 *
 * @param {Object} def
 * @param {Array} [primaryKeys]
 * @return {Object}
 */
function buildFields(def, primaryKeys) {
  if (!def)
    throw new ArgumentError('Definition does not have `fields` property');
  const fields = {};
  Object.getOwnPropertyNames(def).forEach(function(name) {
    const o = def[name];
    if (primaryKeys && primaryKeys.indexOf(name))
      o.primaryKey = true;
    const Ctor = Field.get(o.dataType);
    if (!Ctor)
      throw new ArgumentError('Unknown data type "' + o.dataType + '"');
    const f = fields[name] = Object.create(Ctor.prototype);
    Ctor.call(f, name, o);
  });
  return fields;
}

/**
 *
 * @param {String} s
 * @return {string}
 */
function camelCase(s) {
  return s.substring(0, 1).toUpperCase() + s.substring(1);
}
