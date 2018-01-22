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
const promisify = require('putil-promisify');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;

/**
 * Expose `Find`.
 */
module.exports = Find;

/**
 * @param {Model} model
 * @param {...String} columns
 * @constructor
 */
function Find(model, columns) {
  this._model = model;
  this._columns = columns;
}

/**
 * @param {...*} values
 * @return {Find}
 */
Find.prototype.where = function(values) {
  this._where = Array.prototype.slice.call(arguments);
  return this;
};

/**
 * @param {...*} values
 * @return {Find}
 */
Find.prototype.whereAnd = function(values) {
  this._where = this._where || [];
  this._where.push.apply(this._where, Array.prototype.slice.call(arguments));
  return this;
};

Find.prototype.params = function(params) {
  this._params = params;
  return this;
};

Find.prototype.offset = function(value) {
  this._offset = value;
  return this;
};

Find.prototype.execute = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.execute(cb);
    });

  const query = this._prepareQuery();
  const options = {
    objectRows: true
  };
  //console.log(query.generate().sql);
  query.execute(options, function(err, result) {
    if (err)
      return callback(err);
    if (self._method === 'findOne') {
      callback(null, result.rows[0]);
      return;
    }
    callback(null, result.rows);
  });
};

Find.prototype.then = function(resolver) {
  return this.execute().then(resolver);
};

/**
 * @protected
 * @return {Object}
 */
Find.prototype._prepareQuery = function() {
  const self = this;
  const model = self._model;
  const selectColumns = {};
  var orderColumns;

  /* Prepare select column list */
  var a = this._columns.length ? this._columns :
      Object.getOwnPropertyNames(model.fields);
  a.forEach(function(k) {
    const m = k.match(/^([\w$]+) *([\w$]*)$/);
    const name = m[1];
    const field = model.fields[name];
    if (!field)
      throw new ArgumentError('Model (%s) has no field (%s)', model.name, name);
    const alias = (m[2] || name);
    selectColumns[alias] = {
      fieldName: field.fieldName,
      name: alias
    };
  });

  /* Prepare order column list */
  if (self._orderby) {
    orderColumns = [];
    self._orderby.forEach(function(n) {
      const m = n.match(/^([-+])?([a-zA-Z][\w$]*|\*) *(asc|dsc|desc|ascending|descending)?$/i);
      if (!m)
        throw new ArgumentError('(%s) does not match order column format', n);
      const name = m[2];
      var fieldName;
      if (selectColumns[name])
        fieldName = selectColumns[name].fieldName;
      else {
        const field = model.fields[name];
        if (!field)
          throw new ArgumentError('Model (%s) has no field (%s)', model.name, name);
        fieldName = field.fieldName;
      }
      const sortOrder = (m[1] && m[1] === '-' ? 'desc' : m[3]);
      orderColumns.push(fieldName + (sortOrder ? ' ' + sortOrder : ''));
    });
  }

  a = [];
  Object.getOwnPropertyNames(selectColumns).forEach(function(name) {
    const col = selectColumns[name];
    /* Add to columnNames array */
    a.push('t1.' + col.fieldName +
        (col.fieldName !== col.name ? ' ' + col.name : ''));
  });
  const query = model._dbObj
      .select.apply(model._dbObj, a)
      .from((model.schemaName ? model.schemaName + '.' : '') +
          model.tableName + ' t1');

  if (self._where)
    query.where.apply(query, self._where);

  if (orderColumns) {
    query.orderBy.apply(query, orderColumns);
  }
  if (this._method === 'findOne')
    query.limit(1);
  else if (self._limit)
    query.limit(self._limit);
  if (self._offset)
    query.offset(self._offset);
  if (self._params)
    query.params(self._params);
  return query;
};

module.exports = Find;
