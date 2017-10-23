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
const defineConst = require('putil-defineconst');
const ModelMeta = require('./modelmeta');
const DeleteQuery = require('./queries/deletequery');
const InsertQuery = require('./queries/insertquery');
const SelectQuery = require('./queries/selectquery');
const UpdateQuery = require('./queries/updatequery');
//const RelationO2O = require('./relation-one2one');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;
const MODEL_NAME_PATTERN = /^([A-Za-z]\w*)?(\.[A-Za-z]\w*)?$/;

/**
 * Expose `Model`.
 */
module.exports = Model;

/**
 * @param {Object} db
 * @constructor
 */
function Model(db) {
  if (db &&
      !(typeof db.select === 'function' && typeof db.insert === 'function'))
    throw new ArgumentError('`db` argument must be a SQB pool or connection instance');
  this._db = db || this.orm.db;
  /*
  const aliases = [];
  aliases.push(this.tableAlias);
  for (const relation of this._relations) {
    const t = relation.foreignModel.meta.table;
    const aa = t.substring(t, 1).toLowerCase();
    let a = aa;
    let i = 1;
    while (aliases.indexOf(a) >= 0)
      a = aa + (++i);
    aliases.push(a);
    //noinspection JSUndefinedPropertyAssignment
    relation.table = t;
    //noinspection JSUndefinedPropertyAssignment
    relation.tableAlias = a;
  }*/
}

const proto = Model.prototype = {};
proto.constructor = Model;

proto.delete = function() {
  const o = Object.create(DeleteQuery.prototype);
  DeleteQuery.call(o, this);
  return o;
};

proto.insert = function(values) {
  const o = Object.create(InsertQuery.prototype);
  InsertQuery.apply(o, Array.prototype.concat.apply([this], arguments));
  return o;
};

proto.select = function(colargs) {
  const o = Object.create(SelectQuery.prototype);
  SelectQuery.apply(o, Array.prototype.concat.apply([this], arguments));
  return o;
};

proto.update = function(values) {
  const o = Object.create(UpdateQuery.prototype);
  UpdateQuery.apply(o, Array.prototype.concat.apply([this], arguments));
  return o;
};

/**
 * Returns short info for field
 *
 * @param {string} name - Field Name
 * @return {Object}
 */
proto.getFieldInfo = function(name) {
  //noinspection JSUnresolvedVariable
  const f = this.meta.get(name);
  if (f) {
    //noinspection JSUnresolvedVariable
    return {
      owner: this,
      name: f.name,
      fieldName: f.fieldName,
      tableName: this.tableName,
      tableAlias: this.tableAlias,
      schemaName: this.schemaName
    };
  }
  //noinspection JSUnresolvedVariable
  this._relations.forEach(function(relation) {
    if (relation.fields) {
      const f = relation.fields[name];
      if (f) {
        return {
          owner: relation,
          name: name,
          fieldName: f,
          tableName: relation.tableName,
          tableAlias: relation.tableAlias,
          schemaName: relation.foreignSchema
        };
      }
    }
  });
};

Model.extend = function(name, modelDef) {
  if (!modelDef) {
    modelDef = name;
    name = null;
  }
  if (typeof modelDef !== 'object')
    throw new ArgumentError('`modelDef` argument is empty or is not valid');
  name = name || modelDef.tableName;

  if (!(typeof name === 'string' && name.match(MODEL_NAME_PATTERN)))
    throw new ArgumentError('Invalid model name `%s`', name);
  const meta = new ModelMeta(modelDef);
  const _super = this;
  const ctor = function Model() {
    defineConst(this, {
      meta: meta
    });
    _super.apply(this, arguments);
  };
  ctor.prototype = Object.create(_super.prototype);
  ctor.prototype.constructor = ctor;

  name = name.replace(/\./, '') + 'Model';
  defineConst(ctor, 'name', name.substring(0, 1).toUpperCase() +
      name.substring(1), false);

  defineConst(ctor, {
    meta: meta
  });

  defineConst(ctor.prototype, {
    schemaName: meta.schemaName,
    tableName: meta.tableName,
    tableAlias: meta.tableName.substring(0, 1).toLowerCase(),
    relations: []
  });
  return ctor;
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

