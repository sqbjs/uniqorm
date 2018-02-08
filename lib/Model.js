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
const promisify = require('putil-promisify');
const ModelError = require('./ModelError');

/**
 * Module variables
 * @private
 */
const Op = sqb.Op;
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
    throw new ArgumentError('Model name required');
  if (!(typeof name === 'string' && name.match(MODEL_NAME_PATTERN)))
    throw new ArgumentError('Invalid model name "%s"', name);

  if (typeof def !== 'object')
    throw new ArgumentError('Model definition argument (def) is empty or is not valid');

  if (typeof def.tableName !== 'string')
    throw new ArgumentError('"tableName" property is empty or is not valid');

  if (typeof def.fields !== 'object')
    throw new ArgumentError('`fields` argument is empty or is not valid');

  /* Build field list */
  const fields = {};
  const keyFields = [];
  Object.getOwnPropertyNames(def.fields).forEach(function(name) {
    const o = def.fields[name];
    const Ctor = Field.get(o.dataType);
    if (!Ctor)
      throw new ArgumentError('Unknown data type "' + o.dataType + '"');
    const f = fields[name] = Object.create(Ctor.prototype);
    Ctor.call(f, name, o);
    if (o.primaryKey) {
      f.primaryKey = true;
      keyFields.push(name);
    }
  });

  defineConst(this, {
    name: name,
    owner: owner,
    schemaName: def.schemaName || undefined,
    tableName: def.tableName,
    fields: fields,
    keyFields: keyFields
  });
}

Model.prototype = {
  Op: sqb.Op,
  get tableNameFull() {
    return (this.schemaName ? this.schemaName + '.' : '') +
        this.tableName;
  }
};

Model.prototype.constructor = Model;

Model.prototype.getField = function(name) {
  const field = this.fields[name];
  if (!field)
    throw new ArgumentError('Model "%s" has no field "%s"', this.name, name);
  return field;
};

/**
 * Searches for one specific element in the database
 *
 * @param {Object} [options]
 * @param {Function} [callback]
 * @return {Promise|Undefined}
 */
Model.prototype.findOne = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.findOne(options, cb);
    });
  options = options || {};
  options.orderBy = null;
  options.limit = 1;
  return this.findAll(options, function(err, rows) {
    if (!err && rows && rows.length)
      return callback(null, rows[0]);
    callback(err);
  });
};

/**
 * Searches for multiple elements in the database
 *
 * @param {Object} [options]
 * @param {Function} [callback]
 * @return {Promise|Undefined}
 */
Model.prototype.findAll = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.findAll(options, cb);
    });
  /* Prepare query */
  const query = prepareFindQuery(self, options || {});
  options.cursor = false;
  options.rowset = false;
  /* Execute query */
  query.execute(options, function(err, result) {
    if (!err && result && result.rows.length)
      return callback(null, result.rows);
    callback(err);
  });
};

/**
 * Creates a Cursor that searches for multiple elements in the database
 *
 * @param {Object} [options]
 * @param {Function} [callback]
 * @return {Promise|Undefined}
 */
Model.prototype.findCursor = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.findOne(options, cb);
    });
  /* Prepare query */
  const query = prepareFindQuery(self, options || {});
  options.cursor = true;
  options.rowset = false;
  /* Execute query */
  query.execute(options, function(err, result) {
    if (!err && result && result.cursor)
      return callback(null, result.cursor);
    callback(err);
  });
};

/**
 * Inserts a new record
 *
 * @param {Object} [attributes]
 * @param {Object} [options]
 * @param {Function} [callback]
 * @return {Promise|Undefined}
 */
Model.prototype.create = function(attributes, options, callback) {
  if (typeof attributes !== 'object')
    throw new ArgumentError('Attributes required to create model instance');
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.create(attributes, options, cb);
    });

  options = options || {};
  options.objectRows = true;
  options.validateFields = options.validateFields ||
      self.owner.options.validateFields;

  /* Prepare query */
  const dbobj = (options.connection || this.owner.pool);
  const values = prepareValues(this, attributes, options);
  const query = dbobj
      .insert(self.tableNameFull, values)
      .returning(prepareReturning(self, options));
  /* Execute query */
  query.execute(options, function(err, result) {
    if (!err)
      return callback(null, (result.rows && result.rows[0]) || true);
    callback(err);
  });
};

/**
 * Updates the record
 *
 * @param {Object} [attributes]
 * @param {Object} [options]
 * @param {Function} [callback]
 * @return {Promise|Undefined}
 */
Model.prototype.update = function(attributes, options, callback) {
  if (typeof attributes !== 'object')
    throw new ArgumentError('Attributes required to update model instance');
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.update(attributes, options, cb);
    });

  options = options || {};
  options.objectRows = true;
  options.validateFields = options.validateFields ||
      self.owner.options.validateFields;

  /* Prepare query */
  const dbobj = (options.connection || this.owner.pool);
  const values = prepareValues(this, attributes, options);
  const query = dbobj
      .update(this.tableNameFull, values)
      .where(prepareWhere(this, attributes))
      .returning(prepareReturning(this, options));
  /* Execute query */
  query.execute(options, function(err, result) {
    if (!err)
      return callback(null, (result.rows && result.rows[0]) || true);
    callback(err);
  });
};

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

function buildSelectColumns(model, cols, options) {
  const result = {};
  cols.forEach(function(k) {
    const m = k.match(/^([\w$]+) *([\w$]*)$/);
    if (!m) {
      if (options.validateFields)
        throw new ArgumentError('"%s" is not a valid column name', k);
      return;
    }
    const name = m[1];
    const field = options.validateFields ? model.getField(name) : model.fields[name];
    if (field)
      result[(m[2] || name)] = field.fieldName;
  });
  return result;
}

function prepareFindQuery(model, options) {
  options.limit = (parseInt(options.limit) || 0) || 100;
  options.objectRows = options.objectRows || options.objectRows == null;
  options.validateFields = options.validateFields ||
      model.owner.options.validateFields;
  if (options.fields)
    options.fields = Array.isArray(options.fields) ?
        options.fields : [options.fields];
  if (options.where)
    options.where = Array.isArray(options.where) ?
        options.where : [options.where];
  if (options.orderBy)
    options.orderBy = Array.isArray(options.orderBy) ?
        options.orderBy : [options.orderBy];

  const dbobj = options.transaction || model.owner.pool;
  var orderColumns;
  /* Prepare select column list */
  var a = options.fields && options.fields.length ? options.fields :
      Object.getOwnPropertyNames(model.fields);
  const selectColumns = buildSelectColumns(model, a, options);

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
        fieldName = selectColumns[name];
      else {
        const field = options.validateFields ? model.getField(name) : model.fields[name];
        if (field)
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
    a.push('t1.' + col + (col !== name ? ' ' + name : ''));
  });
  const query = dbobj
      .select.apply(dbobj, a)
      .from(model.tableNameFull + ' t1');

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

function prepareValues(model, attributes, options) {
  const values = {};
  Object.getOwnPropertyNames(attributes).forEach(function(name) {
    const field = options.validateFields ? model.getField(name) : model.fields[name];
    if (field && !field.primaryKey)
      values[name] = attributes[name];
  });
  return values;
}

function prepareWhere(model, attributes) {
  if (!(model.keyFields && model.keyFields.length))
    throw new ModelError('No primary key defined for model "%s"', model.name);

  const where = [];
  var v;
  model.keyFields.forEach(function(key) {
    v = attributes[key];
    if (v == null)
      throw new ArgumentError('Value required for key field "%s', key);
    where.push(Op.eq(key, v));
  });
  return Op.and.apply(null, where);
}

function prepareReturning(model, options) {
  var a;
  if ((options.returning === '*'))
    a = Object.getOwnPropertyNames(model.fields);
  else if (options.returning) {
    a = Array.isArray(options.returning) ? options.returning :
        [options.returning];
  } else a = model.keyFields;

  a = buildSelectColumns(model, a, options);
  const returningColumns = {};
  Object.getOwnPropertyNames(a).forEach(function(alias) {
    const fname = a[alias];
    const field = options.validateFields ? model.getField(fname) : model.fields[fname];
    if (field)
      returningColumns[fname] = field.jsType.toLowerCase();
  });
  return returningColumns;
}
