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
const {ErrorEx, ArgumentError} = require('errorex');
const sqb = require('sqb');
const defineConst = require('putil-defineconst');
const Field = require('./Field');
const promisify = require('putil-promisify');
const Association = require('./Association');

const {ModelFind, ModelList} = require('./model/find');

/**
 * ModelError Class
 * @constructor
 */
class ModelError extends ErrorEx {
}

/**
 * Module variables
 * @private
 */
const Op = sqb.Op;
const MODEL_NAME_PATTERN = /^(?:([A-Za-z]\w*)\.)?([A-Za-z]\w*)?$/;

/**
 *
 * @class
 */
class Model {

  /**
   *
   * @param {Uniqorm} owner
   * @param {String} name
   * @param {Object} def
   */
  constructor(owner, name, def) {
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
      Op: sqb.Op,
      name: name,
      owner: owner,
      schemaName: def.schemaName || undefined,
      tableName: def.tableName,
      fields: fields,
      keyFields: keyFields
    });

    this._associations = new Map();
  }

  get tableNameFull() {
    return (this.schemaName ? this.schemaName + '.' : '') +
        this.tableName;
  }

  getField(name, silent) {
    const field = this.fields[name];
    if (!field && !silent)
      throw new ArgumentError('Model "%s" has no field "%s"', this.name, name);
    return field;
  }

  /**
   * Searches for single element in the database
   *
   * @param {Object} options
   * @return {ModelFind}
   */
  find(options) {
    return new ModelFind(this, options);
  }

  /**
   * Searches for multiple elements in the database
   *
   * @param {Object} options
   * @return {ModelList}
   */
  list(options) {
    return new ModelList(this, options);
  }

  /**
   * Performs insert
   *
   * @param {Object} values
   * @param {Object} [options]
   * @param {Boolean} [options.silent]
   * @param {Boolean} [options.includeKeys]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  create(values, options, callback) {
    if (typeof values !== 'object')
      throw new ArgumentError('Values required to create model instance');
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    const self = this;
    if (!callback)
      return promisify.fromCallback(function(cb) {
        self.create(values, options, cb);
      });

    options = options || {};
    options.includeKeys = true;

    /* Prepare query */
    const dbobj = (options.connection || this.owner.pool);
    const queryValues = prepareValues(this, values, options);
    const returningFields = prepareReturning(self, options);

    const query = dbobj
        .insert(self.tableNameFull, queryValues)
        .returning(returningFields);
    /* Execute query */
    query.execute({
      objectRows: true,
      autoCommit: options.autoCommit
    }, function(err, result) {
      if (!err)
        return callback(null, (result.rows && result.rows[0]) || true);
      callback(err);
    });
  }

  /**
   * Performs update
   *
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  update(values, options, callback) {
    if (typeof values !== 'object')
      throw new ArgumentError('Values required to update model instance');
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    const self = this;
    if (!callback)
      return promisify.fromCallback(function(cb) {
        self.update(values, options, cb);
      });

    options = options || {};
    if (options.where && !Array.isArray(options.where))
      throw new ArgumentError('Only array type accepted for "where" option');
    options.silent = options.silent ||
        self.owner.options.silent;
    options.includeKeys = !!options.where;

    const queryValues = prepareValues(this, values, options);
    const where = options.where ? options.where : prepareWhere(this, values);
    const returningFields = prepareReturning(self, options);

    /* Prepare query */
    const dbobj = (options.connection || this.owner.pool);
    const query = dbobj
        .update(this.tableNameFull, queryValues);
    query.where.apply(query, where)
        .returning(returningFields);
    /* Execute query */
    query.execute({
      objectRows: true,
      autoCommit: options.autoCommit
    }, function(err, result) {
      if (!err)
        return callback(null, (result.rows && result.rows[0]) || true);
      callback(err);
    });
  };

  /**
   * Performs delete
   *
   * @param {Object} [keyValues]
   * @param {Object} [options]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  destroy(keyValues, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    const self = this;
    if (!callback)
      return promisify.fromCallback(function(cb) {
        self.destroy(keyValues, options, cb);
      });

    options = options || {};
    if (options.where && !Array.isArray(options.where))
      throw new ArgumentError('Only array type accepted for "where" option');

    const where = options.where ? options.where :
        keyValues ? prepareWhere(this, keyValues) : null;

    /* Prepare query */
    const dbobj = (options.connection || this.owner.pool);
    const query = dbobj
        .delete(this.tableNameFull);
    query.where.apply(query, where);

    /* Execute query */
    query.execute({
      autoCommit: options.autoCommit
    }, function(err, result) {
      if (!err)
        return callback();
      callback(err);
    });
  }

  hasOne(attribute, options) {
    this._addAssociation(attribute, 'OtO', options);
  }

  hasMany(attribute, options) {
    this._addAssociation(attribute, 'OtM', options);
  }

  getAssociation(name) {
    const a = this._associations.get(name);
    if (typeof a === 'function')
      return a();
    return a;
  }

  toString() {
    return '[Object Model(' + this.name + ')]';
  }

  toJSON() {
    return this.toString();
  }

  inspect() {
    return this.toString();
  }

  _addAssociation(attribute, kind, options) {
    if (!(attribute && typeof attribute === 'string'))
      throw new ArgumentError('You must provide attribute name');

    if (this.fields[attribute])
      throw new ArgumentError('Model "%s" has already field with name "%s"',
          this.name, attribute);

    if (!options)
      throw new ArgumentError('You must provide options');

    const createAssociation = (options) => {
      if (!options.model)
        throw new ArgumentError('You must provide options.model');

      if (!options.foreignKey || typeof options.foreignKey !== 'string')
        throw new ArgumentError('You must provide options.foreignKey');

      if (!typeof options.sourceKey || typeof options.sourceKey !== 'string')
        throw new ArgumentError('You must provide options.sourceKey');

      this.getField(options.sourceKey);
      options.model.getField(options.foreignKey);

      return new Association({
        kind,
        sourceModel: this,
        sourceKey: options.sourceKey,
        foreignKey: options.foreignKey,
        foreignModel: options.model
      });
    };

    if (typeof options.model === 'string') {
      const opts = Object.assign({}, options);
      options = () => {
        opts.model = this.owner.get(opts.model);
        return opts;
      };
    }

    this._associations.set(attribute,
        (typeof options === 'function') ? () => {
          const a = createAssociation(options());
          this._associations.set(attribute, a);
          return a;
        } : createAssociation(options));
  }
}

function buildSelectColumns(model, options) {
  const result = {};

  const cols = options.fields && options.fields.length ?
      options.fields : Object.getOwnPropertyNames(model.fields);

  cols.forEach(function(k) {
    const m = k.match(/^([\w$]+) *([\w$]*)$/);
    if (!m) {
      if (!options.silent)
        throw new ArgumentError('"%s" is not a valid column name', k);
      return;
    }
    const name = m[1];
    const field = model.getField(name, options.silent);
    if (field)
      result[(m[2] || name)] = field.fieldName;
  });
  return result;
}

function prepareValues(model, attributes, options) {
  const values = {};
  Object.getOwnPropertyNames(attributes).forEach(function(name) {
    const field = model.getField(name, options.silent);
    if (field && (!field.primaryKey || options.includeKeys))
      values[name] = attributes[name];
  });
  return values;
}

function prepareWhere(model, attributes) {
  if (!(model.keyFields && model.keyFields.length))
    throw new ModelError('No primary key defined for model "%s"', model.name);

  const where = [];
  model.keyFields.forEach(function(key) {
    const v = attributes[key];
    if (v == null)
      throw new ArgumentError('Value required for key field "%s"', key);
    where.push(Op.eq(key, v));
  });
  return where;
}

function prepareReturning(model, options) {
  let a;
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
    const field = model.getField(fname, options.silent);
    if (field)
      returningColumns[fname] = field.jsType.toLowerCase();
  });
  return returningColumns;
}

/**
 * Expose `Model`.
 */
module.exports = Model;
