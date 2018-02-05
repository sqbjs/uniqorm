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
const sqb = require('sqb');
const defineConst = require('putil-defineconst');
const Field = require('./Field');
const modelFind = require('./model/_find');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;
const MODEL_NAME_PATTERN = /^(?:([A-Za-z]\w*)\.)?([A-Za-z]\w*)?$/;

/**
 * Expose `Model`.
 */
module.exports = Model;

/**
 * @param {Uniqorm} owner
 * @param {String} name
 * @param {Object} def
 * @param {Object} def.fields
 * @constructor
 */
function Model(owner, name, def) {
  if (!name)
    throw new ArgumentError('`name` argument required');
  if (!(typeof name === 'string' && name.match(MODEL_NAME_PATTERN)))
    throw new ArgumentError('Invalid model name `%s`', name);

  if (typeof def !== 'object')
    throw new ArgumentError('`def` argument is empty or is not valid');

  if (typeof def.tableName !== 'string')
    throw new ArgumentError('`def.tableName` argument is empty or is not valid');

  if (typeof def.fields !== 'object')
    throw new ArgumentError('`def.fields` argument is empty or is not valid');

  var primaryKeys;
  const x = def.primaryKey.columns;
  if (x) {
    primaryKeys = typeof x === 'string' ? x.split(/\s*,\s*/) : x;
    if (!Array.isArray(x))
      throw new ArgumentError('Array of String type allowed for property "primaryKeys"');
  }
  const fields = buildFields(def.fields, primaryKeys);
  defineConst(this, {
    name: name,
    owner: owner,
    schemaName: def.schemaName || undefined,
    tableName: def.tableName,
    fields: fields,
    primaryKeys: primaryKeys
  });
}

Model.prototype.Op = sqb.Op;

/**
 * Searches for one specific element in the database
 *
 * @param {Object} [dbobj] SQB pool or SQB connection
 * @param {Object} [options]
 * @param {Function} [callback]
 * @return {Promise|Undefined}
 */
Model.prototype.findOne = modelFind.findOne;

/**
 * Searches for multiple elements in the database
 *
 * @param {Object} [dbobj] SQB pool or SQB connection
 * @param {Object} [options]
 * @param {Function} [callback]
 * @return {Promise|Undefined}
 */
Model.prototype.findAll = modelFind.findAll;

/**
 * Creates a Cursor that searches for multiple elements in the database
 *
 * @param {Object} [dbobj] SQB pool or SQB connection
 * @param {Object} [options]
 * @param {Function} [callback]
 * @return {Promise|Undefined}
 */
Model.prototype.findCursor = modelFind.findCursor;

/*
 *
 * @param other
 * @param from
 * @param to
 */
Model.belongsTo = function(other, from, to) {
  /*
  if (!(other && typeof other.prototype.findOne === 'function'))
    throw new ArgumentError('Foreign model required as first argument');
  const model = this.prototype;
  model.relations.push({
    type: '1:1',
    foreignModel: other,
    from: from,
    to: to
  });*/
  //console.log(this.prototype.tableName, other.prototype.tableName);
};

Model.hasOne = function(model, field, pk) {
  /*
  if (!field) {
    field = field || model.meta.tableName + '_ID';
  }
  const p = this.meta.fields[field];
  field = p.fieldName;

  if (pk) {
    const p = model.meta.fields[pk];
    assert.ok(p, `Model (${model.name}) has no field (${pk})`);
    pk = p.fieldName;
  } else {
    const p = model.meta.getPrimaryKeys();
    assert.ok(p.length, `Model (${model.name}) has no primary key`);
    assert.equal(p.length, 1, `Model (${model.name}) has more than one primary key`);
    pk = p[0].fieldName;
  }

  assert.ok(model.prototype instanceof Model, 'Invalid argument');
  const relation = new RelationO2O(this, field, model, pk);
  this.prototype._relations.push(relation);
  return relation;*/
};

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
