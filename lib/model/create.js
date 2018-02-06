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

module.exports = function() {
  const args = parseArgs.call(null, this, Array.prototype.slice.call(arguments));
  const self = this;
  if (!args.callback)
    return promisify.fromCallback(function(cb) {
      create(self, args.dbobj, args.options, cb);
    });
  create(self, args.dbobj, args.options, args.callback);
};

function create(model, dbobj, options, callback) {
  const query = prepareQuery(model, dbobj, options || {});
  query.execute(options, function(err, result) {
    if (!err && result && result.rows.length)
      return callback(null, result.returning || true);
    callback(err);
  });
}

function parseArgs(model, args) {
  var dbobj;
  var attributes;
  var options;
  var callback;
  var a = args.shift();
  if (typeof a.execute === 'function' &&
      typeof a.select === 'function') {
    dbobj = a;
    attributes = args.shift();
  } else attributes = a;
  a = args.shift();
  if (typeof attributes !== 'object')
    throw new ArgumentError('Attributes required to create model instance');
  if (typeof a === 'function') {
    callback = a;
  } else {
    options = a;
    callback = args.shift();
  }
  options = options || {};
  options.objectRows = true;
  options.validateFields = options.validateFields ||
      model.owner.options.validateFields;
  if (options.returning)
    options.returning = Array.isArray(options.returning) ? options.returning :
        [options.returning];
  return {
    dbobj: dbobj || model.owner.pool,
    attributes: attributes,
    options: options,
    callback: callback
  };
}

function prepareQuery(model, dbobj, options) {
  const selectColumns = {};
  var orderColumns;

  /* Prepare select column list */
  var a = options.returning && options.returning.length ? options.returning :
      model.primaryKeys || Object.getOwnPropertyNames(model.fields);
  a.forEach(function(k) {
    const m = k.match(/^([\w$]+) *([\w$]*)$/);
    if (!m) {
      if (!options.validateFields)
        return;
      throw new ArgumentError('Invalid column definition(%s)', k);
    }
    const name = m[1];
    const field = model.fields[name];
    if (!field) {
      if (!options.validateFields)
        return;
      throw new ArgumentError('Model (%s) has no field (%s)', model.name, name);
    }
    const alias = (m[2] || name);
    selectColumns[alias] = {
      fieldName: field.fieldName,
      name: alias
    };
  });

  /* Prepare order column list */
  if (options.orderBy) {
    orderColumns = [];
    options.orderBy.forEach(function(n) {
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
  const query = dbobj
      .select.apply(dbobj, a)
      .from((model.schemaName ? model.schemaName + '.' : '') +
          model.tableName + ' t1');

  if (options.where)
    query.where.apply(query, options.where);

  if (orderColumns) {
    query.orderBy.apply(query, orderColumns);
  }
  if (options.limit)
    query.limit(options.limit);
  if (options.offset)
    query.offset(options.offset);
//  if (options.params)
//    query.params(options.params);
  return query;
}
