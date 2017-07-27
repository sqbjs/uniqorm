/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const SelectQuery = require('./selectquery');
const InsertQuery = require('./insertquery');
const Field = require('./field');
const RelationO2O = require('./relation-one2one');

/* External module dependencies. */
const assert = require('assert');

/**
 * @class
 * @constructor
 */

class Model {

  constructor(orm, classMeta) {
    this._orm = orm;
    const aliases = [];
    this._meta = new ModelMeta(this, {tableName: classMeta.tableName});
    this._meta._fields.push(...classMeta._fields);
    this.tableName = classMeta.tableName;
    this.tableAlias = classMeta.tableName.substring(0, 1).toLowerCase();
    aliases.push(this.tableAlias);
    for (const relation of this._relations) {
      const t = relation.foreignModel.meta.tableName;
      const aa = t.substring(t, 1).toLowerCase();
      let a = aa;
      let i = 1;
      while (aliases.indexOf(a) >= 0)
        a = aa + (++i);
      aliases.push(a);
      //noinspection JSUndefinedPropertyAssignment
      relation.tableName = t;
      //noinspection JSUndefinedPropertyAssignment
      relation.tableAlias = a;
    }
  }

  get meta() {
    return this._meta;
  }

  select(...columns) {
    return new SelectQuery(this, ...columns);
  }

  insert(...columns) {
    return new InsertQuery(this, ...columns);
  }

  /**
   * Returns short info for field
   *
   * @param {string} name - Field Name
   * @return {Object}
   */
  getFieldInfo(name) {
    //noinspection JSUnresolvedVariable
    const f = this.meta.getField(name);
    if (f) {
      //noinspection JSUnresolvedVariable
      return {
        owner: this,
        name: f.name,
        fieldName: f.fieldName,
        tableName: this.tableName,
        tableAlias: this.tableAlias,
        schema: this.schema
      };
    }
    //noinspection JSUnresolvedVariable
    for (const relation of this._relations) {
      if (relation.fields) {
        const f = relation.fields[name];
        if (f) {
          return {
            owner: relation,
            name,
            fieldName: f,
            tableName: relation.tableName,
            tableAlias: relation.tableAlias,
            schema: relation.foreignSchema
          };
        }
      }
    }
  }
}

Model.extend = function(config) {

  let name = config.name || config.tableName;
  assert(typeof name === 'string' &&
      name.match(/([A-Za-z])\w*/), `Invalid model name "${name}"`);
  name = name.substring(0, 1).toUpperCase() + name.substring(1);
  //noinspection JSUnusedLocalSymbols
  const
      ctor = class extends Model {
        //noinspection JSUnusedGlobalSymbols
        constructor(orm) {
          super(orm, classMeta);
        }
      };

  const classMeta = new ModelMeta(ctor, config);
  // static members
  Object.defineProperties(ctor, {
    name: {
      value: name,
      writable: false,
      configurable: false
    }
  });
  Object.defineProperties(ctor.prototype, {
    name: {
      value: name,
      writable: false,
      configurable: false
    }, meta: {
      value: classMeta,
      writable: false,
      configurable: false
    }, _relations: {
      value: [],
      writable: false,
      configurable: false
    }
  });
  return ctor;
};

Model.hasOne = function(model, field, pk) {
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
  return relation;
};

/**
 * @class
 */
class ModelMeta {

  constructor(model, config) {

    const tableName = config.tableName || config.name;
    assert.ok(tableName, 'One of name or tableName is required');
    assert.ok(tableName.match(/([A-Za-z])\w*/), `Invalid tableName name "${tableName}"`);
    this.model = model;
    this._fields = [];
    if (config) {
      this.setTable(config.tableName || config.name);
      this.setFields(config.fields);
      //noinspection JSUnresolvedVariable
      this.setDefaultFields(config.defaultFields);
      if (config.primaryKey && config.primaryKey.columns)
        this.setPrimaryKeys(...config.primaryKey.columns.split(','));
    }
  }

  getField(nameOrIndex) {
    if (nameOrIndex instanceof Number) {
      assert(nameOrIndex > 0 && nameOrIndex <
          this._fields.length,
          'Field index(' + nameOrIndex + ') out of bounds');
      return this._fields[nameOrIndex];
    }
    const i = this.indexOfField(nameOrIndex);
    assert(i >= 0, `Model (${this.model.name}) has no field (${nameOrIndex})`);
    return this._fields[i];
  }

  getFieldNames() {
    const a = [];
    for (const f of this._fields)
      a.push(f.fieldName);
    return a;
  }

  indexOfField(name) {
    const self = this;
    for (let i = 0; i < self._fields.length; i++) {
      if (self._fields[i].fieldName.toLowerCase() === name.toLowerCase())
        return i;
    }
    return -1;
  }

  setField(name, opts) {
    let field;
    if (name instanceof Field) {
      field = name;
      name = field.fieldName;
    }
    if (!field) {
      assert(name, 'Invalid argument. "name" property required');
      assert(opts, 'Invalid argument. "opts" property required');
      const T = Field.get(opts.type);
      assert.ok(T, `Unknown field type definition "${opts.type}" in field ${name}`);
      field = Reflect.construct(T, [opts]);
    }
    const i = this.indexOfField(name);
    if (i >= 0)
      this._fields[i] = field;
    else this._fields.push(field);
  }

  setFields(source) {
    if (source) {
      assert.equal(typeof source, 'object');
      const self = this;
      Object.getOwnPropertyNames(source).forEach(function(key) {
        const v = source[key];
        v.name = key;
        v.fieldName = v.fieldName || key;
        v.fieldType = Field.DataType.DATA;
        self.setField(key, v);
      });
    }
    return this;
  }

  setTable(table) {
    this.tableName = table;
    return this;
  }

  setDefaultFields(...fields) {
    if (!fields.length) return this;
    const self = this;
    const args = [];
    // build a flat array of arguments
    for (const field of fields) {
      if (Array.isArray(field)) {
        field.forEach(function(item) {
          args.push(item);
        });
      } else if (field) args.push(field);
    }
    // Test fields
    for (const item of args)
      self.getField(item);
    this._defaultFields = args;
    return this;
  }

  setPrimaryKeys(...fields) {
    if (!fields.length) return this;
    const self = this;
    /* Clear previous flags */
    self._fields.forEach(f => {
      f.setPrimaryKey(false);
    });
    for (const f of fields) {
      const field = self.getField(f);
      field.setPrimaryKey(true);
    }
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  getPrimaryKeys() {
    const self = this;
    const out = [];
    self._fields.forEach(f => {
      if (f.primaryKey)
        out.push(f);
    });
    return out;
  }

  get tableName() {
    return this._tableName;
  }

  set tableName(value) {
    this._tableName = value ? String(value) : undefined;
  }

}

module.exports = Model;
