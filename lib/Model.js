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
const promisify = require('putil-promisify');
const isPlainObject = require('putil-isplainobject');
const merge = require('putil-merge');

const Field = require('./Field');
const Association = require('./Association');
const FindContext = require('./FindContext');
const ExtendedModel = require('./ExtendedModel');

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
    /* Build field list */
    const fields = {};
    const keyFields = [];
    Object.getOwnPropertyNames(def.fields).forEach((name) => {
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
    this.name = name;
    this.Op = sqb.Op;
    this.owner = owner;
    this.schemaName = def.schemaName;
    this.tableName = def.tableName;
    this.fields = fields;
    this.keyFields = keyFields;
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

  extend(cfg) {
    if (typeof cfg !== 'object')
      throw new ArgumentError('You must provide config object');
    return new ExtendedModel(this, cfg);
  }

  /**
   * Searches for single element in the database by key values
   *
   * @param {*} keyValues Single value, if model has single key.
   *                      Object map that contains key values, if model has multi key
   * @param {Object} [options]
   * @param {Object|Array} options.attributes
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  get(keyValues, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    if (!callback)
      return promisify.fromCallback((cb) => this.get(keyValues, options, cb));

    keyValues = this._prepareKeyValues(keyValues);
    options = options || {};

    if (this._hooks && this._hooks.get)
      return this._hooks.get(keyValues, options, callback);

    const opts = merge({}, options);
    merge(opts, {
      where: keyValues,
      limit: 1,
      offset: 0,
      orderBy: null
    });
    this.find(opts, (err, result) => {
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
   * @param {Object|Array} options.attributes
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Number} [options.limit]
   * @param {Number} [options.offset]
   * @param {Boolean} [options.silent]
   * @param {Object|Array} [options.where]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  find(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    if (!callback)
      return promisify.fromCallback((cb) => this.find(options, cb));
    options = options || {};
    options.attributes = options.attributes ||
        Object.getOwnPropertyNames(this.fields);

    if (this._hooks && this._hooks.find)
      return this._hooks.find(options, callback);

    const opts = this._prepareFindOptions(options,
        options.silent || this.owner.options.silent);
    opts.connection = options.connection || this.owner.pool;
    opts.autoCommit = options.autoCommit;

    const context = new FindContext(this, opts);
    context.execute(callback);
  }

  /**
   * Performs insert
   *
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.silent]
   * @param {Boolean} [options.returning]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  create(values, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    if (!callback)
      return promisify.fromCallback((cb) => this.create(options, cb));

    if (typeof values !== 'object')
      throw new ArgumentError('You must provide values');

    options = options || {};

    if (this._hooks && this._hooks.create)
      return this._hooks.create(values, options, callback);

    const silent = options.silent || this.owner.options.silent;
    values = this._prepareUpdateValues(values, {
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
      attributes = this._prepareFindOptions({attributes}).attributes;
      returning = this._prepareReturning(attributes, silent);
    }

    /* Prepare query */
    const dbobj = (options.connection || this.owner.pool);
    const query = dbobj
        .insert(this.tableNameFull, values)
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
      this.keyFields.forEach(n => {
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
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  update(values, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }

    if (!callback)
      return promisify.fromCallback((cb) => this.update(values, options, cb));

    if (typeof values !== 'object')
      throw new ArgumentError('You must provide values');

    options = options || {};

    if (this._hooks && this._hooks.create)
      return this._hooks.create(values, options, callback);

    const silent = options.silent || this.owner.options.silent;
    let where = options.where || this._prepareKeyValues(values);
    where = Array.isArray(where) ? where : [where];
    /* prepare update values */
    values = this._prepareUpdateValues(values, {
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
      attributes = this._prepareFindOptions({attributes}).attributes;
      returning = this._prepareReturning(attributes, silent);
    }

    /* Prepare query */
    const dbobj = (options.connection || this.owner.pool);
    const query = dbobj
        .update(this.tableNameFull, values)
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
      return promisify.fromCallback((cb) => self.destroy(keyValues, options, cb));

    keyValues = this._prepareKeyValues(keyValues);
    options = options || {};
    if (this._hooks && this._hooks.create)
      return this._hooks.create(keyValues, options, callback);

    const opts = merge({}, options);
    /* Prepare query */
    const dbobj = (opts.connection || this.owner.pool);
    const query = dbobj
        .delete(this.tableNameFull)
        .where(keyValues);

    /* Execute query */
    query.execute({
      autoCommit: opts.autoCommit
    }, (err, result) => {
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

  _prepareFindOptions(options, silent) {
    if (Array.isArray(options))
      return this._prepareFindOptions({attributes: options}, silent);

    const addAttribute = (target, key, value) => {
      if (typeof value === 'string' || value == null)
        target[key] = value || key;
      else if (Array.isArray(value))
        target[key] = this._prepareFindOptions({attributes: value}, silent);
      else if (isPlainObject(value))
        target[key] = this._prepareFindOptions(value, silent);
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

  _prepareKeyValues(keyValues) {
    if (!(this.keyFields && this.keyFields.length))
      throw new ErrorEx('No key field defined for model "%s"', this.name);
    if (typeof keyValues !== 'object') {
      if (this.keyFields.length < 1)
        throw new ArgumentError('You must provide key values');
      return {[this.keyFields[0]]: keyValues};
    } else {
      this.keyFields.forEach(n => {
        if (keyValues[n] === undefined)
          throw new ArgumentError('You must provide value for key field "%s"', n);
      });
      return keyValues;
    }
  }

}

/**
 * Expose `Model`.
 */
module.exports = Model;
