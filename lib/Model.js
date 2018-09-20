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
const EventEmitter = require('events');
const {ErrorEx, ArgumentError} = require('errorex');
const sqb = require('sqb');
const isPlainObject = require('putil-isplainobject');
const merge = require('putil-merge');

const FieldMap = require('./FieldMap');
const Association = require('./Association');
const FindContext = require('./FindContext');
const ExtendedModel = require('./ExtendedModel');

/**
 * Module variables
 * @private
 */
const MODEL_NAME_PATTERN = /^(?:([A-Za-z]\w*)\.)?([A-Za-z]\w*)?$/;

/**
 *
 * @class
 * @extends EventEmitter
 */
class Model extends EventEmitter {

  /**
   *
   * @param {Uniqorm} orm
   * @param {Object} def
   * @param {String} def.name
   * @param {Object} def.fields
   * @param {Object} [def.associations]
   * @param {String} [def.tableName]
   * @param {String} [def.schemaName]
   */
  constructor(orm, def) {
    super();

    if (typeof def.name !== 'string')
      throw new ArgumentError('You must provide model name');

    if (!def.name.match(MODEL_NAME_PATTERN))
      throw new ArgumentError('Invalid model name "%s"', def.name);

    if (def.tableName && !def.tableName.match(MODEL_NAME_PATTERN))
      throw new ArgumentError('Invalid tableName "%s"', def.tableName);

    if (!isPlainObject(def.fields))
      throw new ArgumentError('`fields` property is empty or is not valid');

    this.name = def.name;
    this.schemaName = def.schemaName;
    this.tableName = def.tableName;
    this._orm = orm;
    this._associations = [];
    this._fields = new FieldMap(this);

    if (def.associations) {
      if (!Array.isArray(def.associations))
        throw new ArgumentError('Invalid model definition (%s). `associations` property can only be an array type', def.name);
      this.addAssociation(...def.associations);
    }

    /* Create fields */
    for (const name of Object.getOwnPropertyNames(def.fields)) {
      this._fields.set(name, def.fields[name]);
    }
  }

  /**
   *
   * @return {Set<Association>}
   */
  get associations() {
    return this._associations;
  }

  /**
   *
   * @return {Uniqorm}
   */
  get orm() {
    return this._orm;
  }

  /**
   *
   * @return {FieldMap}
   */
  get fields() {
    return this._fields;
  }

  /**
   *
   * @return {string}
   */
  get tableNameFull() {
    return (this.schemaName ? this.schemaName + '.' : '') +
        this.tableName;
  }

  addAssociation(...value) {
    for (const v of value)
      this.associations.push(new Association(this, v));
  }

  /**
   *
   * @param {string} name
   * @param {boolean} [silent]
   * @return {DataField}
   */
  getField(name, silent) {
    const field = this._fields.get(name);
    if (field)
      return field;
    if (silent) return null;
    throw new ArgumentError('Model "%s" has no field "%s"', this.name, name);
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
   * @return {Promise}
   */
  get(keyValues, options) {
    if (typeof keyValues !== 'object')
      return Promise.reject(new ArgumentError('You must provide key values'));
    keyValues = this._prepareKeyValues(keyValues);
    options = options || {};

    const opts = merge.defaults({
      filter: keyValues,
      limit: 1,
      offset: 0,
      sort: []
    }, options);
    return this.find(opts).then(result => result && result[0]);
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
   * @param {Object|Array} [options.filter]
   * @param {Object} [options.scope]
   * @return {Promise}
   */
  find(options) {
    options = options || {};
    if (options.attributes && !Array.isArray(options.attributes))
      options.attributes = [options.attributes];
    options.attributes =
        typeof options.attributes !== 'object' ||
        (Array.isArray(options.attributes) && !options.attributes.length)
            ? this.getDataFields() : options.attributes;

    return Promise.resolve().then(() => {
      const opts = this._prepareFindOptions(options,
          options.silent != null ? options.silent : this._orm.options.silent);
      opts.model = this;
      opts.connection = options.connection || this._orm.pool;
      opts.showSql =
          opts.showSql != null ? opts.showSql : this.orm.options.showSql;
      delete opts.scope;
      return (new FindContext(opts)).execute(options.scope);
    });
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

    const silent = options.silent || this._orm.options.silent;
    values = this._prepareUpdateValues(values, {
      silent,
      removePrimaryKey: false
    });

    let attributes;
    let returning;
    if (options.returning) {
      attributes = options.returning === '*' ?
          Object.getOwnPropertyNames(this._fields) :
          (Array.isArray(options.returning) ? options.returning : [options.returning]);
      if (this.keyFields)
        attributes.unshift(...this.keyFields);
      attributes = this._prepareFindOptions({attributes}).attributes;
      returning = this._prepareReturning(attributes, silent);
    }

    /* Prepare query */
    const dbobj = (options.connection || this._orm.pool);
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
      const filter = [];
      this.keyFields.forEach(n => {
        filter.push({[n]: result.rows[0][n]});
      });

      const context = new FindContext(this, {
        connection: dbobj,
        silent: silent,
        attributes,
        filter
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

    const silent = options.silent || this._orm.options.silent;
    let filter = options.filter || this._prepareKeyValues(values);
    filter = Array.isArray(filter) ? filter : [filter];
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
          Object.getOwnPropertyNames(this._fields) :
          (Array.isArray(options.returning) ? options.returning : [options.returning]);
      if (this.keyFields)
        attributes.unshift(...this.keyFields);
      attributes = this._prepareFindOptions({attributes}).attributes;
      returning = this._prepareReturning(attributes, silent);
    }

    /* Prepare query */
    const dbobj = (options.connection || this._orm.pool);
    const query = dbobj
        .update(this.tableNameFull, values)
        .where(...filter)
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
        filter
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
    const dbobj = (opts.connection || this._orm.pool);
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
    //this.addAssociation(attribute, 'OtO', options);
  }

  hasMany(attribute, options) {
    //this.addAssociation(attribute, 'OtM', options);
  }

  toString() {
    return '[object ' + Object.getPrototypeOf(this).constructor.name + '<' +
        this.name + '>]';
  }

  inspect() {
    return this.toString();
  }

  getDataFields() {
    const result = [];
    for (const [key, f] of this.fields.entries())
      if (f.fieldName)
        result.push(key);
    return result;
  }

  _prepareFindOptions(options, silent) {
    if (Array.isArray(options))
      return this._prepareFindOptions({attributes: options}, silent);
    let i = 0;
    const addAttribute = (target, key, value) => {
      if (typeof value === 'string' || value == null)
        target[key] = value || key;
      else if (Array.isArray(value))
        target[key] = this._prepareFindOptions({attributes: value}, silent);
      else if (isPlainObject(value)) {
        value.field = value.field || key;
        target[key] = this._prepareFindOptions(value, silent);
      }
      i++;
    };

    const parseAttributes = (target, value) => {

      if (Array.isArray(value)) {
        const COLUMN_PATTERN = /^([a-zA-Z][\w$]*)(?:\.?([\w$]+))? *([\w$]+)?$/;
        for (const v of value) {
          if (typeof v === 'string') {
            const m = v.match(COLUMN_PATTERN);
            if (!m) {
              if (silent) continue;
              throw new ArgumentError('"%s" is not a valid column name', v);
            }
            addAttribute(target, m[3] || m[2] || m[1],
                m[1] + (m[2] ? '.' + m[2] : ''));
            continue;
          }
          if (isPlainObject(v)) {
            parseAttributes(target, v);
            continue;
          }
          if (silent) continue;
          throw new ArgumentError('"%s" is not a valid column name', v);
        }

      } else if (isPlainObject(value)) {
        for (const v of Object.getOwnPropertyNames(value))
          addAttribute(target, v, value[v]);
      }
      return i ? target : null;
    };

    const result = merge.deep.clone(options);
    result.attributes = parseAttributes({}, options.attributes);
    result.filter = !options.filter || Array.isArray(options.filter) ?
        options.filter : [options.filter];
    result.sort = !options.sort || Array.isArray(options.sort) ?
        options.sort : [options.sort];
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

  static get Op() {
    return sqb.Op;
  }

}

/**
 * Expose `Model`.
 */
module.exports = Model;
