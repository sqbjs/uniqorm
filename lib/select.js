/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */

/* External module dependencies. */
const assert = require('assert');
const sqb = require('sqb');

/**
 *
 * @constructor
 */
class Select {

  constructor(model, fields) {
    this.model = model;
    this._fields = [];
    this.setFields(fields);
  }

  /**
   *
   * @param {string} fields...
   */
  setFields(...fields) {
    if (!fields.length) return;
    this._fields = [];
    for (const f of fields) {
      if (Array.isArray(f))
        for (const k of f)
          this.addField(k);
      else
        this.addField(f);
    }
  }

  /**
   *
   * @param {string} field
   */
  addField(field) {
    if (!field) return;
    if (field.indexOf(',') >= 0) {
      const a = String(field).split(/\s*,\s*/);
      for (const k of a)
        this.addField(k);
    } else
      this._fields.push(field);
  }

  /**
   * @param {*} values...
   * @return {Select}
   */
  pk(...values) {
    return this;
  }

  /**
   * @param {*} values..
   * @return {Select}
   */
  where(...values) {
    this._where = values;
    return this;
  }

  offset(value) {
    this._offset = value;
    return this;
  }

  limit(value) {
    this._limit = value;
    return this;
  }

  /**
   * @private
   * @return {Object}
   */
  _prepare() {
    const self = this;
    const model = self.model;
    const database = model.schema.owner.dbPool;
    const defaultSchema = this.model._orm.defaultSchema || database.schema;
    const schema = model.schema.name &&
    model.schema.name !== defaultSchema ? model.schema.name : '';
    const relations = model._relations || [];
    const statement = database
        .select()
        .from((schema ? schema + '.' : '') + model.tableName + ' ' +
            model.tableAlias);
    const columns = [];
    const joins = {};

    /* Prepare select columns */
    /* - Get array of field names */
    let selFields = self._fields.length ? self._fields : model.meta._defaultFields;
    if (!(selFields && selFields.length))
      selFields = model.meta.getFieldNames();

    /* - Iterate array and convert names to to real field names */
    for (const item of selFields) {
      const f = model.getFieldInfo(item);
      assert(f, `Field (${item}) is not defined in model (${model.name})`);
      if (f.owner === model || f.owner.type === '1:1') {
        columns.push(f.tableAlias + '.' + f.fieldName +
            (f.name && f.fieldName !== f.name ? ' ' + f.name : ''));
        if (f.owner.type) {
          if (!joins[f.tableAlias]) {
            joins[f.tableAlias] = {
              tableName: f.tableName,
              tableAlias: f.tableAlias,
              schema: f.schema,
              key: f.owner.field,
              foreignKey: f.owner.foreignKey
            };
          }
        }
      } else
        assert(f, `Can not link field (${item}) directly. 1:1 relation is required for this operation`);
    }
    statement.columns(...columns);

    /* Prepare join clause */
    Object.getOwnPropertyNames(joins).forEach(alias => {
      const j = joins[alias];
      const sch = j.schema && j.schema !== defaultSchema ? j.schema : '';
      statement.join(sqb.leftOuterJoin((sch ? sch + '.' : '') + j.tableName +
          ' ' + alias)
          .on([model.tableAlias + '.' + j.key,
            sqb.raw(alias + '.' + j.foreignKey)]));
    });

    /* Prepare where clause */
    if (this._where) {
      const values = [...this._where];
      const metaFields = self.model.meta.fields;
      const deepUpdate = (source) => {
        source.forEach(item => {
          if (Array.isArray(item) && item.length &&
              typeof item[0] === 'string') {
            const fieldName = item[0];
            // check if field is in meta
            let f = metaFields[fieldName];
            if (f)
              item[0] = model.tableAlias + '.' + f.fieldName;
            else {
              let found;
              // Check 1:1 relations
              relations.forEach(relation => {
                if (relation.type === '1:1') {
                  f = relation.fields[fieldName];
                  if (f) {
                    found = true;
                    item[0] = f;
                    if (joins.indexOf(joins) < 0) joins.push(relation);
                  }
                }
              });
              if (!found)
                throw new Error(`Field (${fieldName}) is not defined in model (${model.name})`);
            }
          }
        });
      };
      deepUpdate(values);
      statement.where(...values);
    }
    if (self._limit)
      statement.limit(self._limit);
    if (self._offset)
      statement.offset(self._offset);
    /*console.log('--------');
     console.log(database.serializer.build(statement).sql);
     console.log('--------');*/
    return statement;
  }

  then(...args) {
    return this._prepare().then(...args);
  }

}

module.exports = Select;
