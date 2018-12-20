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
const {ArgumentError} = require('errorex');
const sqb = require('sqb');
const isPlainObject = require('putil-isplainobject');
const merge = require('putil-merge');

const Association = require('./Association');
const AssociatedField = require('./AssociatedField');
const DataField = require('./DataField');
const FindContext = require('./FindContext');
const {
  normalizeFindOptions,
  normalizeUpdateValues,
  prepareKeyValues
} = require('./helpers');

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
   * @param {Schema} schema
   * @param {Object} def
   * @param {String} def.name
   * @param {String} [def.schema]
   * @param {String} [def.tableName]
   * @param {Object} def.fields
   * @param {Object} [def.associations]
   */
  constructor(schema, def) {
    super();

    if (typeof def.name !== 'string')
      throw new ArgumentError('You must provide model name');

    if (!def.name.match(MODEL_NAME_PATTERN))
      throw new ArgumentError('Invalid model name "%s"', def.name);

    if (def.tableName && !def.tableName.match(MODEL_NAME_PATTERN))
      throw new ArgumentError('Invalid tableName "%s"', def.tableName);

    if (!isPlainObject(def.fields))
      throw new ArgumentError('`fields` property is empty or is not valid');

    this._schema = schema;
    this._name = def.name;
    this._tableName = def.tableName;
    this._associations = [];
    this._fields = {};
    this._keyFields = null;

    if (def.associations) {
      /* istanbul ignore next */
      if (!Array.isArray(def.associations))
        throw new ArgumentError('Invalid model definition (%s). `associations` property can only be an array type', def.name);
      this.addAssociation(...def.associations);
    }

    /* Create fields */
    for (const name of Object.getOwnPropertyNames(def.fields))
      this.addField(name, def.fields[name]);
  }

  /**
   *
   * @return {Uniqorm}
   */
  get orm() {
    return this.schema.orm;
  }

  /**
   *
   * @return {string}
   */
  get schema() {
    return this._schema;
  }

  /**
   *
   * @return {string}
   */
  get schemaName() {
    return this.schema.name;
  }

  /**
   *
   * @return {string}
   */
  get name() {
    return this._name;
  }

  /**
   *
   * @return {string}
   */
  get tableName() {
    return this._tableName;
  }

  /**
   *
   * @return {Array<Association>}
   */
  get associations() {
    return this._associations;
  }

  /**
   *
   * @return {Object}
   */
  get fields() {
    return this._fields;
  }

  /**
   *
   * @return {Array<string>}
   */
  get keyFields() {
    return this._keyFields;
  }

  /**
   *
   * @return {string}
   */
  get tableNameFull() {
    return (!this.schema.isDefault ? this.schemaName + '.' : '') +
        this.tableName;
  }

  addAssociation(...value) {
    for (const v of value)
      this.associations.push(new Association(this, v));
  }

  /**
   *
   * @param {string} name
   * @param {Object|string} def
   * @return {Field}
   */
  addField(name, def) {
    if (typeof def === 'string')
      def = {dataType: String(def)};

    if (typeof def !== 'object')
      throw new ArgumentError('You must provide object instance for field definition');

    if (!name)
      throw new ArgumentError('You must provide "name" argument');

    if (this.fields[name])
      throw new ArgumentError('Field "%s" already exists', name);

    if (def.foreignModel)
      return (this.fields[name] = new AssociatedField(name, this, def));

    if (!def.dataType)
      throw new ArgumentError('You must provide "dataType" property');

    const Ctor = DataField.get(def.dataType);
    if (!Ctor)
      throw new ArgumentError('Unknown data type "%s"', def.dataType);
    return (this.fields[name] = new Ctor(name, this, def));
  }

  /**
   *
   * @param {string} name
   * @param {boolean} [silent]
   * @return {DataField}
   */
  getField(name, silent) {
    const field = this.fields[name];
    if (field)
      return field;
    if (silent) return null;
    throw new ArgumentError('Model "%s" has no field "%s"', this.name, name);
  }

  /**
   * Searches for single element in the database by key values
   *
   * @param {*} values Single value, if model has single key.
   *                      Object map that contains key values, if model has multi key
   * @param {Object} [options]
   * @param {Object|Array} options.attributes
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @return {Promise}
   */
  get(values, options) {
    return Promise.resolve().then(() => {
      if (values == null)
        throw new ArgumentError('You must provide key value(s)');

      if (typeof values !== 'object')
        values = prepareKeyValues(this, values);
      options = options || {};

      const opts = merge.defaults({
        filter: values,
        limit: 1
      }, options);

      return this.find(opts).then(result => result && result[0]);
    });
  }

  /**
   * Searches for multiple elements in the database
   *
   * @param {Object} [options]
   * @param {Object|Array} [options.attributes]
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
    return Promise.resolve().then(() => {
      options = options || {};
      if (options.attributes && !Array.isArray(options.attributes))
        options.attributes = [options.attributes];
      options.attributes =
          typeof options.attributes !== 'object' ||
          (Array.isArray(options.attributes) && !options.attributes.length)
              ? this.getDataFields() : options.attributes;

      const silent = options.silent != null ?
          options.silent : this.orm.options.silent;
      const opts = normalizeFindOptions(options, silent);
      opts.model = this;
      opts.connection = options.connection || this.orm.pool;
      opts.silent = silent;
      opts.showSql = opts.showSql != null ?
          opts.showSql : this.orm.options.showSql;
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
   * @param {Boolean} [options.showSql]
   * @param {string|Array<string>} [options.returning]
   * @param {Object} [options.scope]
   * @return {Promise}
   */
  create(values, options) {
    return Promise.resolve().then(() => {

      if (typeof values !== 'object' || Array.isArray(values))
        throw new ArgumentError('You must provide a valid "values" argument');

      options = options || {};
      const silent = options.silent != null ?
          options.silent : this.orm.options.silent;
      values = normalizeUpdateValues(this, values, silent);
      const returning = options.returning &&
          this._prepareReturning(options.returning, silent);

      const dbobj = (options.connection || this.orm.pool);
      return dbobj
          .insert(this.tableNameFull, values)
          .returning(returning && returning.columns)
          .execute({
            objectRows: true,
            autoCommit: options.autoCommit,
            showSql: true
          }).then(resp => {
            if (!(resp.rows && resp.rows.length && returning &&
                returning.attributes))
              return true;
            returning.silent = silent;
            returning.showSql = options.showSql;
            return this._responseReturning(dbobj, resp, returning);
          }).catch(/* istanbul ignore next */e => {
            if (options.showSql && e.query) {
              e.message += '\nSQL: ' + e.query.sql.replace(/\n/g, '\n     ');
              if (e.query.values && e.query.values.length)
                e.message += '\nValues: ' + JSON.stringify(e.query.values);
            }
            throw e;
          });
    });
  }

  /**
   * Performs update
   *
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Object|Array} [options.where]
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.silent]
   * @param {Boolean} [options.showSql]
   * @param {string|Array<string>} [options.returning]
   * @param {Object} [options.scope]
   * @return {Promise}
   */
  update(values, options) {
    return Promise.resolve().then(() => {

      if (typeof values !== 'object' || Array.isArray(values))
        throw new ArgumentError('You must provide a valid "values" argument');

      options = options || {};
      const silent = options.silent != null ?
          options.silent : this.orm.options.silent;
      values = normalizeUpdateValues(this, values, silent);
      const returning = options.returning &&
          this._prepareReturning(options.returning, silent);

      let filter;
      if (options.where) {
        filter =
            Array.isArray(options.where) ? /* istanbul ignore next */ options.where : [options.where];
      } else {
        filter = [{}];
        for (const n of this.keyFields) {
          /* istanbul ignore else */
          filter[0][n] =
              values[n] != null ? values[n] : /* istanbul ignore next */ null;
          delete values[n];
        }
      }

      const dbobj = (options.connection || this.orm.pool);
      return dbobj
          .update(this.tableNameFull, values)
          .where(...filter)
          .returning(returning && returning.columns)
          .execute({
            objectRows: true,
            autoCommit: options.autoCommit
          }).then(resp => {
            if (!(resp.rows && resp.rows.length && returning &&
                returning.attributes))
              return true;
            returning.silent = silent;
            returning.showSql = options.showSql;
            return this._responseReturning(dbobj, resp, returning);
          }).catch(/* istanbul ignore next */e => {
            if (options.showSql && e.query) {
              e.message += '\nSQL: ' + e.query.sql.replace(/\n/g, '\n     ');
              if (e.query.values && e.query.values.length)
                e.message += '\nValues: ' + JSON.stringify(e.query.values);
            }
            throw e;
          });
    });
  }

  /**
   * Performs delete
   *
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.silent]
   * @param {Boolean} [options.showSql]
   * @param {string|Array<string>} [options.returning]
   * @param {Object} [options.scope]
   * @return {Promise}
   */
  destroy(values, options) {
    return Promise.resolve().then(() => {
      options = options || {};
      if (typeof values !== 'object')
        values = prepareKeyValues(this, values);

      const dbobj = (options.connection || this.orm.pool);
      return dbobj
          .delete(this.tableNameFull)
          .where(values)
          .execute({
            autoCommit: options.autoCommit,
            showSql: options.scope
          }).catch(/* istanbul ignore next */e => {
            if (options.showSql && e.query) {
              e.message += '\nSQL: ' + e.query.sql.replace(/\n/g, '\n     ');
              if (e.query.values && e.query.values.length)
                e.message += '\nValues: ' + JSON.stringify(e.query.values);
            }
            throw e;
          }).then(() => true);
    });
  }

  hasOne(attribute, options) {
    if (typeof options === 'string')
      options = {foreignModel: options};
    /* istanbul ignore next */
    if (typeof options !== 'object')
      throw new ArgumentError('You must provide "options" as object');
    options.hasMany = false;
    this.addField(attribute, options);
  }

  hasMany(attribute, options) {
    if (typeof options === 'string')
      options = {foreignModel: options};
    /* istanbul ignore next */
    if (typeof options !== 'object')
      throw new ArgumentError('You must provide "options" as object');
    options.hasMany = true;
    this.addField(attribute, options);
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
    for (const name of Object.keys(this.fields)) {
      const f = this.fields[name];
      if (!f.foreignModel)
        result.push(name);
    }
    return result;
  }

  _prepareReturning(value, silent) {
    let attributes;
    attributes = value === '*' ? this.getDataFields() :
        (typeof value === 'object' ? value : [value]);
    attributes = normalizeFindOptions({attributes}, silent).attributes;
    /* Be sure key fields exists in attributes */
    /* istanbul ignore else */
    if (this.keyFields) {
      for (const f of this.keyFields) {
        let keyExists;
        for (const attr of Object.getOwnPropertyNames(attributes)) {
          if (f === (attributes[attr] || attr)) {
            keyExists = true;
            break;
          }
        }
        if (!keyExists)
          attributes[f] = null;
      }
    }
    const columns = {};
    for (const alias of Object.getOwnPropertyNames(attributes)) {
      const fname = attributes[alias] || alias;
      const field = this.getField(fname, silent);
      if (field && field.jsType)
        columns[field.fieldName] = field.jsType.toLowerCase();
      attributes[alias] = {
        fieldName: fname,
        column: field.fieldName
      };
    }
    return {
      attributes,
      columns
    };
  }

  _responseReturning(dbobj, resp, options) {

    let needFind;
    const result = {};
    for (const attr of Object.getOwnPropertyNames(options.attributes)) {
      const fieldName = (options.attributes[attr] &&
          options.attributes[attr].fieldName);
      const field = this.getField(fieldName, true);
      /* istanbul ignore else */
      if (field) {
        if (field.foreignModel) {
          needFind = true;
          break;
        }
        const colName = (options.attributes[attr] &&
            options.attributes[attr].column);
        result[attr] = resp.rows[0][colName];
      }
    }
    if (!(needFind && this.keyFields))
      return result;

    const opts = {
      model: this,
      connection: dbobj,
      silent: options.silent,
      attributes: options.attributes,
      filter: [],
      showSql: options.showSql != null ?
          /* istanbul ignore next */options.showSql : this.orm.options.showSql
    };

    for (const n of this.keyFields) {
      opts.filter.push({[n]: resp.rows[0][n]});
    }

    return (new FindContext(opts)).execute(options.scope)
        .then(result => result[0]);
  }

  /* istanbul ignore next */
  static get Op() {
    return sqb.Op;
  }

}

/**
 * Expose `Model`.
 */
module.exports = Model;
