/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const Select = require('./select');
const {Field} = require('./field');
const RelationO2O = require('./relation-one2one');

/* External module dependencies. */
const assert = require('assert');

/**
 * @class
 * @constructor
 */

class Model {

  constructor() {
  }

  select(...fields) {
    return new Select(this, fields);
  }

  /**
   * Returns short info for field
   *
   * @param {string} name - Field Name
   * @return {Object}
   */
  getFieldInfo(name) {
    //noinspection JSUnresolvedVariable
    const f = this.meta.fields[name];
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
    for (let i = 0; i < this._relations.length; i++) {
      //noinspection JSUnresolvedVariable
      const relation = this._relations[i];
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

  const name = config.name || config.tableName;
  assert(typeof name === 'string' &&
      name.match(/([A-Za-z])\w*/), `Invalid model name "${name}"`);

  //noinspection JSUnusedLocalSymbols
  const
      ctor = class extends Model {
        //noinspection JSUnusedGlobalSymbols
        constructor() {
          super();
          const aliases = [];
          this.tableName = meta.tableName;
          this.tableAlias = meta.tableName.substring(0, 1).toLowerCase();
          aliases.push(this.tableAlias);
          this._relations.forEach(relation => {
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
          });
        }
      };
  const meta = new ModelMeta(config);
  // static members
  Object.defineProperty(ctor, 'name', {
    value: name || 'Model',
    writable: false,
    configurable: false
  });
  Object.defineProperty(ctor, 'meta', {
    value: meta,
    writable: false,
    configurable: false
  });
  Object.defineProperty(ctor.prototype, 'meta', {
    value: meta,
    writable: false,
    configurable: false
  });
  return ctor;
};

Model.hasOne = function(model, field, pk) {
  if (!field) {
    field = field || model.meta.tableName + '_ID';
  }
  const p = this.meta.fields[field];
  assert.ok(p, `Model (${this.name}) has no field (${field})`);
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
  (this.prototype._relations = this.prototype._relations || []).push(relation);
  return relation;
};

/**
 * @class
 */
class ModelMeta {

  constructor(config) {

    const tableName = config.tableName || config.name;
    assert.ok(tableName, 'One of name or tableName is required');
    assert.ok(tableName.match(/([A-Za-z])\w*/), `Invalid tableName name "${tableName}"`);

    //noinspection JSUnusedGlobalSymbols
    const fields = new Proxy({}, {
      get: function(obj, key) {
        return typeof key === 'string' ? obj[key.toUpperCase()] : obj[key];
      },
      set: function(obj, key, value) {
        if (!(value instanceof Field)) {
          const T = Field.get(value.type);
          assert.ok(T, `Invalid field definition for ${key}`);
          value = Reflect.construct(T, [value]);
        }
        assert.ok(value instanceof
            Field, `Invalid field definition for ${key}`);
        obj[key.toUpperCase()] = value;
        return true;
      }
    });
    Object.defineProperty(this, 'fields', {
      value: fields,
      configurable: false,
      writable: false
    });

    if (config) {
      this.setTable(config.tableName || config.name);
      this.setFields(config.fields);
      //noinspection JSUnresolvedVariable
      this.setDefaultFields(config.defaultFields);
    }
  }

  getFieldNames() {
    return Object.getOwnPropertyNames(this.fields);
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
        self.fields[key] = v;
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
    fields.forEach(field => {
      if (Array.isArray(field)) {
        field.forEach(function(item) {
          args.push(item);
        });
      } else args.push(field);
    });
    args.forEach(function(item) {
      const f = self.fields[item];
      if (!f)
        throw new Error(`Default fields definition error. Field "${item}" not found`);
    });
    this._defaultFields = args;
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  getPrimaryKeys() {
    const self = this;
    const out = [];
    Object.getOwnPropertyNames(self.fields).forEach(
        function(key) {
          const f = self.fields[key];
          if (f.primaryKey)
            out.push(f);
        }
    );
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
