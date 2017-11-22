/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Module dependencies.
 * @private
 */
const errorex = require('errorex');
const sqb = require('sqb');
const Query = require('./Query');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;

/**
 * Expose `SelectQuery`.
 */
module.exports = SelectQuery;

/**
 * @param {Model} model
 * @param {...String} fields
 * @constructor
 */
function SelectQuery(model, fields) {
  Query.call(this, model);
  this._fields = [];
  if (fields)
    this.setFields.apply(this, Array.prototype.slice.call(arguments, 1));
}

const proto = SelectQuery.prototype = {};
Object.setPrototypeOf(proto, Query.prototype);
proto.constructor = SelectQuery;

/**
 *
 * @param {...string} fields
 */
proto.setFields = function(fields) {
  if (!(arguments.length && fields)) return;
  this._fields = [];
  this.addField.apply(this, arguments);
};

/**
 *
 * @param {...string} fields
 */
proto.addField = function(fields) {
  if (!(arguments.length && fields)) return;
  const self = this;
  for (var i = 0; i < arguments.length; i++) {
    const f = arguments[i];
    if (Array.isArray(f)) {
      self.addField.apply(self, f);
      return;
    }
    if (typeof f !== 'string')
      throw new ArgumentError('Invalid argument. String type required');
    if (f.indexOf(',') >= 0) {
      self.addField.apply(self, String(f).split(/\s*,\s*/));
      return;
    }
    this._fields.push(f);
  }
};

/**
 * @param {...*} values
 * @return {SelectQuery}
 */
proto.pk = function(values) {
  return this;
};

/**
 * @param {...*} values
 * @return {SelectQuery}
 */
proto.where = function(values) {
  this._where = Array.prototype.slice.call(arguments);
  return this;
};

/**
 * @param {...*} values
 * @return {SelectQuery}
 */
proto.orderBy = function(values) {
  this._orderby = Array.prototype.slice.call(arguments);
  return this;
};

proto.params = function(params) {
  this._params = params;
  return this;
};

proto.offset = function(value) {
  this._offset = value;
  return this;
};

proto.limit = function(value) {
  this._limit = value;
  return this;
};

/**
 * @protected
 * @return {Object}
 */
proto._prepare = function() {
  const self = this;
  const model = self.model;
  if (!model._dbObj)
    throw new Error('No database connection set');
  const dbpool = model._dbObj.dbpool || model._dbObj;
  const defaultSchema = this.model.orm.defaultSchema || dbpool.schema;
  const schema = model.schemaName && model.schemaName !== defaultSchema ?
      model.schemaName : '';
  const relations = model._relations || [];
  const query = model._dbObj
      .select()
      .from((schema ? schema + '.' : '') + model.tableName + ' ' +
          model.tableAlias);
  const joins = {};

  /* Prepare select columns */
  const columnNames = [];
  /* - Get array of field names */
  var selFields = self._fields.length ? self._fields : model.meta._defaultFields;
  if (!(selFields && selFields.length))
    selFields = model.meta.fieldNames();

  /* - Iterate array and convert names to to real field names */
  selFields.forEach(function(item) {
    const f = model.getFieldInfo(item);
    if (!f)
      throw new ArgumentError('Field `%s` not found in model `%s`', item, model.name);
    if (f.owner === model || f.owner.type === '1:1') {
      columnNames.push(f.tableAlias + '.' + f.fieldName +
          (f.name && f.fieldName !== f.name ? ' ' + f.name : ''));
      if (f.owner.type) {
        if (!joins[f.tableAlias]) {
          joins[f.tableAlias] = {
            tableName: f.tableName,
            tableAlias: f.tableAlias,
            schemaName: f.schemaName,
            key: f.owner.field,
            foreignKey: f.owner.foreignKey
          };
        }
      }
    } else if (!f)
      throw new ArgumentError('Can not link field `%s` directly. 1:1 relation is required for this operation', item);
  });
  query.columns.apply(query, columnNames);

  /* Prepare join clause */
  Object.getOwnPropertyNames(joins).forEach(function(alias) {
    const j = joins[alias];
    const sch = j.schemaName &&
    j.schemaName !== defaultSchema ? j.schemaName : '';
    query.join(sqb.leftOuterJoin((sch ? sch + '.' : '') + j.tableName +
        ' ' + alias)
        .on([model.tableAlias + '.' + j.key,
          sqb.raw(alias + '.' + j.foreignKey)]));
  });

  /* Prepare where clause */
  if (this._where) {
    const values = this._where;
    const meta = self.model.meta;
    const deepUpdate = function(source) {
      source.forEach(function(item) {
            if (Array.isArray(item) && item.length &&
                typeof item[0] === 'string') {
              const fieldName = item[0];
              // check if field is in meta
              var f = meta.get(fieldName);
              if (f)
                item[0] = model.tableAlias + '.' + f.fieldName;
              else {
                var found;
                // Check 1:1 relations
                relations.forEach(function(relation) {
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
                  throw new Error('Field `%s` is not defined in model `%s`', fieldName, model.name);
              }
            }
          }
      );
    };
    deepUpdate(values);
    query.where.apply(query, values);
  }
  if (self._orderby)
    query.orderBy.apply(query, self._orderby);
  if (self._limit)
    query.limit(self._limit);
  if (self._offset)
    query.offset(self._offset);
  if (self._params)
    query.params(self._params);
  return query;
};

module.exports = SelectQuery;
