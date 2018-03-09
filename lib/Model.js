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
const promisify = require('putil-promisify');
const isPlainObject = require('putil-isplainobject');

const Field = require('./Field');
const Association = require('./Association');
const FindContext = require('./FindContext');

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
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  find(options, callback) {
    const self = this;
    if (!callback)
      return promisify.fromCallback(function(cb) {
        self.find(options, cb);
      });
    if (typeof options !== 'object')
      throw new ArgumentError('You must provide options');
    options.limit = 1;
    self.list(options, (err, result) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, result && result[0]);
    });
  }

  /**
   * Searches for multiple elements in the database
   *
   * @param {Object} options
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  list(options, callback) {
    const self = this;
    if (!callback)
      return promisify.fromCallback(function(cb) {
        self.list(options, cb);
      });

    if (typeof options !== 'object')
      throw new ArgumentError('You must provide options');

    const silent = options.silent || this.owner.options.silent;
    options.attributes = options.attributes ||
        Object.getOwnPropertyNames(this.fields);
    options = this._prepareListOptions(options, silent);

    const context = new FindContext(this, {
      connection: options.connection || this.owner.pool,
      silent: silent,
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
      attributes: options.attributes
    });
    context.execute(callback);
  }

  /**
   * Performs insert
   *
   * @param {Object} [options]
   * @param {Object} [options.values]
   * @param {Boolean} [options.silent]
   * @param {Boolean} [options.returning]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  create(options, callback) {
    const self = this;
    if (!callback)
      return promisify.fromCallback(function(cb) {
        self.create(options, cb);
      });

    if (typeof options !== 'object')
      throw new ArgumentError('You must provide options');

    const silent = options.silent || this.owner.options.silent;
    const values = this._prepareUpdateValues(options.values, {
      silent,
      removePrimaryKey: false
    });

    let attributes;
    let returning;
    if (options.returning) {
      attributes = options.returning === '*' ?
          Object.getOwnPropertyNames(this.fields) :
          (Array.isArray(options.returning) ? options.returning : [options.returning]);
      if (this.keyFields)
        attributes.unshift(...this.keyFields);
      attributes = this._prepareListOptions({attributes}).attributes;
      returning = this._prepareReturning(attributes, silent);
    }

    /* Prepare query */
    const dbobj = (options.connection || this.owner.pool);
    const query = dbobj
        .insert(self.tableNameFull, values)
        .returning(returning);
    /* Execute query */
    query.execute({
      objectRows: true,
      autoCommit: options.autoCommit
    }, (err, result) => {
      if (err) {
        callback(err);
        return;
      }
      if (!(result.rows && attributes && this.keyFields)) {
        callback(null, true);
        return;
      }
      const where = [];
      this.keyFields.forEach(n=>{
        where.push({[n]: result.rows[0][n]});
      });

      const context = new FindContext(this, {
        connection: dbobj,
        silent: silent,
        attributes,
        where
      });
      context.executeForReturning(result.rows, (err, rows) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, (rows && rows[0]) || true);
      });
    });
  }

  /**
   * Performs update
   *
   * @param {Object} [options]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  update(options, callback) {
    const self = this;
    if (!callback)
      return promisify.fromCallback(function(cb) {
        self.create(options, cb);
      });

    if (typeof options !== 'object')
      throw new ArgumentError('You must provide options');

    if (!(this.keyFields && this.keyFields.length))
      throw new ModelError('No primary key defined for model "%s"', this.name);

    /* prepare where clouse */
    let where = options.where;
    if (!where) {
      this.keyFields.forEach((key) => {
        const v = options.values[key];
        if (v == null)
          throw new ArgumentError('Value required for key field "%s"', key);
        where = where || {};
        where[key] = v;
      });
      if (!where)
        throw new ArgumentError('You must provide key value or "where" clouse to perform update');
    }
    where = Array.isArray(where) ? where : [where];

    /* prepare update values */
    const silent = options.silent || this.owner.options.silent;
    const values = this._prepareUpdateValues(options.values, {
      silent,
      removePrimaryKey: true
    });

    /* prepare returning map and result attributes */
    let attributes;
    let returning;
    if (options.returning) {
      attributes = options.returning === '*' ?
          Object.getOwnPropertyNames(this.fields) :
          (Array.isArray(options.returning) ? options.returning : [options.returning]);
      if (this.keyFields)
        attributes.unshift(...this.keyFields);
      attributes = this._prepareListOptions({attributes}).attributes;
      returning = this._prepareReturning(attributes, silent);
    }

    /* Prepare query */
    const dbobj = (options.connection || this.owner.pool);
    const query = dbobj
        .update(self.tableNameFull, values)
        .where(...where)
        .returning(returning);
    /* Execute query */
    query.execute({
      objectRows: true,
      autoCommit: options.autoCommit
    }, (err, result) => {
      if (err) {
        callback(err);
        return;
      }
      if (!(result.rows && attributes)) {
        callback(null, true);
        return;
      }
      const context = new FindContext(this, {
        connection: dbobj,
        silent: silent,
        attributes,
        where
      });
      context.executeForReturning(result.rows, (err, rows) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, (rows && rows[0]) || true);
      });
    });
  }

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

  _prepareListOptions(options, silent) {
    if (Array.isArray(options))
      return this._prepareListOptions({attributes: options}, silent);

    const addAttribute = (target, key, value) => {
      if (typeof value === 'string' || value == null)
        target[key] = value || key;
      else if (Array.isArray(value))
        target[key] = this._prepareListOptions({attributes: value});
      else if (isPlainObject(value))
        target[key] = this._prepareListOptions(value);
    };

    const parseAttributes = (target, value) => {
      let i = 0;
      if (Array.isArray(value)) {
        value.forEach(v => {
          i++;
          if (typeof v === 'string') {
            const m = v.match(/^([\w$]*\.?[\w$]+) *([\w$]*)$/);
            if (!m) {
              if (silent)
                throw new ArgumentError('"%s" is not a valid column name', v);
              return;
            }
            addAttribute(target, m[2] || m[1], m[1]);
            return;
          }
          if (isPlainObject(v))
            parseAttributes(target, v);
        });

      } else if (isPlainObject(value)) {
        Object.getOwnPropertyNames(value).forEach(v => {
          addAttribute(target, v, value[v]);
          i++;
        });
      }
      return i ? target : null;
    };

    const result = {};
    result.attributes = parseAttributes({}, options.attributes);
    result.where = !options.where || Array.isArray(options.where) ?
        options.where : [options.where];
    result.orderBy = !options.orderBy || Array.isArray(options.orderBy) ?
        options.orderBy : [options.orderBy];
    result.limit = options.limit;
    result.offset = options.offset;
    result.as = options.as;
    return result;
  }

  /**
   *
   * @param {Object} attributes
   * @param {Object} options
   * @return {{}}
   * @private
   */
  _prepareUpdateValues(attributes, options) {
    const values = {};
    Object.getOwnPropertyNames(attributes).forEach((name) => {
      const field = this.getField(name, options.silent);
      if (field && (!(field.primaryKey && options.removePrimaryKey)))
        values[name] = attributes[name];
    });
    return values;
  }

  _prepareReturning(attributes, silent) {
    const returningColumns = {};
    Object.getOwnPropertyNames(attributes).forEach((alias) => {
      const fname = attributes[alias];
      const field = this.getField(fname, silent);
      if (field)
        returningColumns[fname] = field.jsType.toLowerCase();
    });
    return returningColumns;
  }

}

/*
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

function generateUpdateValues(model, attributes, options) {
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

*/

/**
 * Expose `Model`.
 */
module.exports = Model;
