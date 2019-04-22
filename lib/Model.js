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
const promisify = require('putil-promisify');

const Association = require('./Association');
const AssociatedField = require('./AssociatedField');
const CalculatedField = require('./CalculatedField');
const DataField = require('./DataField');
const Finder = require('./Finder');
const {
  normalizeProperties,
  normalizeFindOptions,
  mapConditions,
  makeArray
} = require('./helpers');
const {ValidationError} = require('./errors');

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
   * @param {Array<string>} [def.defaultSort]
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
    this._defaultSort = makeArray(def.defaultSort);

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
      throw new ArgumentError('Field "%s.%s" already exists', this.name, name);

    if (def.foreignModel) {
      if (def.dataType)
        throw new ArgumentError('Invalid field definition for "%s.%s". You can\'t define "dataType" for associated fields',
            this.name, name);
      if (def.calculate)
        throw new ArgumentError('Invalid field definition for "%s.%s". You can\'t define "calculate" method for associated fields',
            this.name, name);
      return (this.fields[name] = new AssociatedField(name, this, def));
    }

    if (def.calculate) {
      if (def.dataType)
        throw new ArgumentError('Invalid field definition for "%s.%s". You can\'t define "dataType" for calculated fields',
            this.name, name);
      return (this.fields[name] = new CalculatedField(name, this, def));
    }

    if (!def.dataType)
      throw new ArgumentError('Invalid field definition for "%s.%s". You must provide "dataType" property',
          this.name, name);

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
   * Retrieves a single instance by key value(s)
   *
   * @param {*} keyValues Key field value(s)
   * @param {Object} [options]
   * @param {Object|Array} options.properties
   * @param {Object} [options.connection]
   * @param {Boolean} [options.autoCommit]
   * @param {Boolean} [options.silent]
   * @param {Function} [options.trace]
   * @param {*} [options.context]
   * @return {Promise<{executeTime:number, queriesExecuted:number, instance:Object}>}
   */
  get(keyValues, options = {}) {
    return promisify(() => {
      const opts = merge({
        where: this._prepareKeyValues(keyValues),
        limit: 1
      }, options, {adjunct: true});
      return this.find(opts)
          .then(result => {
            result.instance = result.instances[0];
            delete result.instances;
            return result;
          });
    });
  }

  /**
   * Searches for multiple elements in the database
   *
   * @param {Object} [options]
   * @param {Object|Array<string>} [options.properties]
   * @param {Object|Array<Object>} [options.where]
   * @param {Array<string>} [options.sort]
   * @param {Number} [options.limit]
   * @param {Number} [options.offset]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.autoCommit]
   * @param {Boolean} [options.silent]
   * @param {Function} [options.trace]
   * @param {*} [options.context]
   * @return {Promise<{executeTime:number, queriesExecuted:number, instances:Array<Object>}>}
   */
  find(options = {}) {
    return promisify(() => {
      if (options.properties && typeof options.properties !== 'object')
        options.properties = [options.properties];

      if (typeof options.properties !== 'object' ||
          (Array.isArray(options.properties) && !options.properties.length)) {
        options.properties = this.getDataFields();
      }

      const silent = options.silent != null ?
          options.silent : this.orm.options.silent;
      const opts = normalizeFindOptions(options, silent);
      opts.model = this;
      opts.connection = options.connection || this.orm.pool;
      opts.silent = silent;
      opts.trace = options.trace;
      opts.sort = opts.sort || this._defaultSort;
      /* istanbul ignore next */
      opts.where = opts.where || opts.filter; // backward support
      return (new Finder(opts)).execute();
    });
  }

  /**
   * Creates new instance into database
   *
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.autoCommit]
   * @param {Boolean} [options.silent]
   * @param {*} [options.context]
   * @param {string|Array<string>} [options.returning]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number, instance:Object}>}
   */
  create(values, options = {}) {
    return promisify(() => {

      if (typeof values !== 'object' || Array.isArray(values))
        throw new ArgumentError('You must provide object instance which contains values');

      const silent = options.silent != null ?
          options.silent : this.orm.options.silent;
      values = this._normalizeValues(values, silent);
      const returning = this._prepareReturningOptions(options.returning, silent);

      const dbobj = (options.connection || this.orm.pool);
      return dbobj
          .insert(this.tableNameFull, values)
          .returning(returning && returning.dataTypes)
          .execute({
            objectRows: true,
            autoCommit: options.autoCommit
          }).then(resp => {
            const ret = {
              executeTime: resp.executeTime,
              queriesExecuted: 1,
              rowsAffected: resp.rowsAffected
            };
            if (returning) {
              const rows = resp.rows;
              returning.silent = silent;
              returning.context = options.context;
              return this._prepareReturningResponse(dbobj, rows, returning)
                  .then(o => {
                    /* istanbul ignore else */
                    if (o)
                      ret.instance = o[0];
                    return ret;
                  });
            }
            return ret;
          });
    });
  }

  /**
   * Performs update
   *
   * @param {*} [keyValues]
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Object|Array} [options.where]
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.silent]
   * @param {*} [options.context]
   * @param {string|Array<string>} [options.returning]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number, instances:Array<Object>}>}
   */
  update(keyValues, values, options = {}) {
    return this.updateMany(values, merge({
      where: this._prepareKeyValues(keyValues)
    }, options, {adjunct: true})).then(ret => {
      if (ret.instances) {
        ret.instance = ret.instances[0];
        delete ret.instances;
      }
      return ret;
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
   * @param {*} [options.context]
   * @param {string|Array<string>} [options.returning]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number, instances:Array<Object>}>}
   */
  updateMany(values, options = {}) {
    return promisify(() => {

      if (typeof values !== 'object' || Array.isArray(values))
        throw new ArgumentError('You must provide object instance which contains values');

      const silent = options.silent != null ?
          options.silent : this.orm.options.silent;
      values = this._normalizeValues(values, silent, true);
      const returning = this._prepareReturningOptions(options.returning, silent);

      let where;
      if (options.where) {
        where = this._mapConditions(options.where);
        where = Array.isArray(where) ?
            /* istanbul ignore next */ where : [where];
      } else {
        where = [{}];
        for (const n of this.keyFields) {
          /* istanbul ignore else */
          where[0][n] =
              values[n] != null ? values[n] : /* istanbul ignore next */ null;
          delete values[n];
        }
      }

      const dbobj = (options.connection || this.orm.pool);
      return dbobj
          .update(this.tableNameFull, values)
          .where(...where)
          .returning(returning && returning.dataTypes)
          .execute({
            objectRows: true,
            autoCommit: options.autoCommit
          }).then(resp => {
            const ret = {
              executeTime: resp.executeTime,
              queriesExecuted: 1,
              rowsAffected: resp.rowsAffected
            };
            if (returning) {
              const rows = resp.rows;
              returning.silent = silent;
              returning.context = options.context;
              return this._prepareReturningResponse(dbobj, rows, returning)
                  .then(o => {
                    /* istanbul ignore else */
                    if (o)
                      ret.instances = o;
                    return ret;
                  });
            }
            return ret;
          });
    });
  }

  /**
   * Performs delete
   *
   * @param {*} [keyValues]
   * @param {Object} [options]
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.silent]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number}>}
   */
  destroy(keyValues, options = {}) {
    return this.destroyMany(merge({
      where: this._prepareKeyValues(keyValues)
    }, options, {adjunct: true}));
  }

  /**
   * Performs delete
   *
   * @param {Object} [options]
   * @param {Object|Array<Object>} [options.where]
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.silent]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number}>}
   */
  destroyMany(/*istanbul ignore next*/ options = {}) {
    return promisify(() => {

      /*istanbul ignore else*/
      if (options.where) {
        options.where = this._mapConditions(options.where);
        options.where = Array.isArray(options.where) ?
            /* istanbul ignore next */ options.where : [options.where];
      }

      const dbobj = (options.connection || this.orm.pool);
      return dbobj
          .delete(this.tableNameFull)
          .where(...options.where)
          .execute({
            autoCommit: options.autoCommit
          }).then((result) => {
            result.queriesExecuted = 1;
            return result;
          });
    });
  }

  hasOne(property, options) {
    if (typeof options === 'string')
      options = {foreignModel: options};
    /* istanbul ignore next */
    if (typeof options !== 'object')
      throw new ArgumentError('You must provide "options" as object');
    options.hasMany = false;
    this.addField(property, options);
  }

  hasMany(property, options) {
    if (typeof options === 'string')
      options = {foreignModel: options};
    /* istanbul ignore next */
    if (typeof options !== 'object')
      throw new ArgumentError('You must provide "options" as object');
    options.hasMany = true;
    this.addField(property, options);
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
      if (f instanceof DataField)
        result.push(name);
    }
    return result;
  }

  _prepareKeyValues(keyValues) {
    /* istanbul ignore next */
    if (!(this.keyFields && this.keyFields.length))
      throw new ArgumentError('Model "%s" has no key fields');

    if (this.keyFields.length > 1 || typeof keyValues === 'object') {
      /* istanbul ignore next */
      if (typeof keyValues !== 'object')
        throw new ArgumentError('You must all provide all key values in object instance.');
      const result = {};
      for (const f of this.keyFields) {
        if (keyValues[f] === undefined)
          throw new ArgumentError('You must provide all key values in object instance.');
        result[f] = keyValues[f];
      }
      /*istanbul ignore else */
      if (typeof keyValues === 'object')
        merge(result, keyValues, {adjunct: true});
      return result;
    }
    if (keyValues === undefined)
      throw new ArgumentError('You must all provide all key values');
    return {
      [this.keyFields[0]]: keyValues != null ? keyValues :
          /* istanbul ignore next */null
    };
  }

  _prepareReturningOptions(value, silent) {
    if (!value)
      return;
    let properties = value === '*' ? this.getDataFields() :
        (typeof value === 'object' ? value : [value]);
    properties = normalizeProperties(properties, silent);
    /* Be sure key fields exists in properties */
    /* istanbul ignore else */
    if (this.keyFields) {
      for (const f of this.keyFields) {
        let keyExists;
        for (const attr of Object.getOwnPropertyNames(properties)) {
          if (f === (properties[attr] || attr)) {
            keyExists = true;
            break;
          }
        }
        if (!keyExists)
          properties[f] = null;
      }
    }
    const dataTypes = {};
    for (const alias of Object.getOwnPropertyNames(properties)) {
      const fname = properties[alias] || alias;
      const field = this.fields[fname];
      /* istanbul ignore next */
      if (!field) continue;
      if (field && field.jsType)
        dataTypes[field.fieldName] = field.jsType.toLowerCase();
      properties[alias] = {
        fieldName: fname,
        column: field.fieldName
      };
    }
    return {
      properties,
      dataTypes
    };
  }

  _prepareReturningResponse(dbobj, rows, options) {

    /* istanbul ignore next */
    if (!(rows && rows.length))
      return Promise.resolve();

    const propertyKeys = Object.getOwnPropertyNames(options.properties);
    let needFind;

    for (const attr of propertyKeys) {
      const fieldName = (options.properties[attr] &&
          options.properties[attr].fieldName);
      const field = this.fields[fieldName];
      if (field && field.foreignModel) {
        needFind = true;
        break;
      }
    }

    const promises = [];

    for (const row of rows) {

      const resultRow = {};
      if (!needFind) {
        for (const attr of propertyKeys) {
          const fieldName = (options.properties[attr] &&
              options.properties[attr].fieldName);
          const field = this.fields[fieldName];
          /* istanbul ignore else */
          if (field) {
            const colName = (options.properties[attr] &&
                options.properties[attr].column);
            resultRow[attr] = row[colName];
          }
        }
      }

      if (!(needFind && this.keyFields)) {
        promises.push(Promise.resolve(resultRow));
        continue;
      }

      const opts = {
        model: this,
        connection: dbobj,
        silent: options.silent,
        properties: options.properties,
        where: [],
        context: options.context
      };

      for (const n of this.keyFields) {
        opts.where.push({[n]: row[n]});
      }

      promises.push((new Finder(opts)).execute()
          .then(result => result.instances[0]));
    }
    return Promise.all(promises);

  }

  _mapConditions(conditions) {
    /* istanbul ignore next */
    if (!conditions)
      return [];
    return mapConditions(conditions, (x) => {
      const field = this.getField(x);
      /* istanbul ignore else */
      if (field instanceof DataField) {
        return field.fieldName;
      } else
        throw new ArgumentError('`%s` is an associated field and can not be used in where clause', x);
    });
  }

  /**
   *
   * @param {Object} values
   * @param {Boolean} silent
   * @param {Boolean} [forUpdate]
   * @return {Object}
   * @private
   */
  _normalizeValues(values, silent, forUpdate) {

    /* istanbul ignore else */
    if (!silent) {
      for (const name of Object.keys(values)) {
        this.getField(name);
      }
    }

    const result = {};
    for (const name of Object.keys(this.fields)) {
      const field = this.fields[name];
      if (!(field instanceof DataField))
        continue;
      const v = values[name];
      // Validate required
      if (field.notNull && field.required && field.defaultValue == null && (
          (!forUpdate && (v == null || v === '')) ||
          (forUpdate && (v === null || v === ''))
      )) {
        throw new ValidationError('Value required for field "%s"', name)
            .set({
              reason: 'value_required',
              field: name
            });
      }
      if (v !== undefined) {
        // Validate char length
        if (field.charLength && v != null && v.length > field.charLength)
          throw new ValidationError('Value too large for field "%s" (actual: %d, maximum: %d)',
              name, v.length, field.charLength)
              .set({
                reason: 'value_too_large',
                field: name,
                actual: v.length,
                max: field.charLength
              });

        result[field.fieldName] = field.parseValue(v);
      }
    }
    return result;
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
