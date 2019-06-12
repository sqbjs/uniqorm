/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://github.com/sqbjs/uniqorm
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
const CalculatedField = require('./CalculatedField');
const DataField = require('./DataField');
const Finder = require('./Finder');
const {
  normalizeProperties,
  normalizeFindOptions,
  normalizeKeyValues,
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
      throw new ArgumentError('Invalid field definition for "%s.%s". Unknown data type "%s"',
          this.name, def.dataType);
    return (this.fields[name] = new Ctor(name, this, def));
  }

  /**
   *
   * @param {string} name
   * @return {DataField}
   */
  findField(name) {
    return this.fields[name];
  }

  /**
   *
   * @param {string} name
   * @return {DataField}
   */
  getField(name) {
    const field = this.fields[name];
    if (!field)
      throw new ArgumentError('Model "%s" has no field "%s"', this.name, name);
    return field;
  }

  /**
   * Retrieves a single instance by key value(s)
   *
   * @param {*} keyValues Key field value(s)
   * @param {Object} [options]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.autoCommit]
   * @param {Object|Array} options.properties
   * @param {Object|Array<Object>} [options.where]
   * @param {Boolean} [options.ignoreUnknownProperties]
   * @param {Function} [options.prepare]
   * @param {Function} [options.trace]
   * @param {*} [options.context]
   * @return {Promise<{executeTime:number, queriesExecuted:number, instance:Object}>}
   */
  async get(keyValues, options = {}) {
    const args = {
      keyValues: this.normalizeKeyValues(keyValues),
      options: this.normalizeGetOptions(options)
    };
    args.options.ignoreUnknownProperties =
        options.ignoreUnknownProperties != null ?
            options.ignoreUnknownProperties : this.orm.options.ignoreUnknownProperties;
    args.options.where.unshift(args.keyValues);

    if (options.prepare)
      await options.prepare(args);

    return (new Finder(this, args.options)).execute()
        .then(result => {
          result.instance = result.instances[0];
          delete result.instances;
          return result;
        });
  }

  /**
   * Searches for multiple elements in the database
   *
   * @param {Object} [options]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.autoCommit]
   * @param {Object|Array<string>} [options.properties]
   * @param {Object|Array<Object>} [options.where]
   * @param {Array<string>} [options.sort]
   * @param {Number} [options.limit]
   * @param {Number} [options.offset]
   * @param {Boolean} [options.ignoreUnknownProperties]
   * @param {Function} [options.prepare]
   * @param {Function} [options.trace]
   * @param {*} [options.context]
   * @return {Promise<{executeTime:number, queriesExecuted:number, instances:Array<Object>}>}
   */
  async find(options = {}) {
    const args = {
      options: this.normalizeFindOptions(options)
    };
    args.options.ignoreUnknownProperties =
        options.ignoreUnknownProperties != null ?
            options.ignoreUnknownProperties : this.orm.options.ignoreUnknownProperties;
    if (options.prepare)
      await options.prepare(args);
    return (new Finder(this, args.options)).execute();
  }

  /**
   * Creates new instance into database
   *
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.autoCommit]
   * @param {string|Array<string>} [options.returning]
   * @param {Boolean} [options.ignoreUnknownProperties]
   * @param {Function} [options.prepare]
   * @param {Function} [options.validate]
   * @param {*} [options.context]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number, instance:Object}>}
   */
  async create(values, options = {}) {

    if (typeof values !== 'object' || Array.isArray(values))
      throw new ArgumentError('You must provide values');

    const args = {
      values,
      options: {...options}
    };
    args.options.ignoreUnknownProperties =
        options.ignoreUnknownProperties != null ?
            options.ignoreUnknownProperties : this.orm.options.ignoreUnknownProperties;

    if (options.prepare)
      await options.prepare(args);

    this.validateValuesForCreate(args.values,
        args.options.ignoreUnknownProperties,
        args.options.context);

    if (options.validate)
      await options.validate(values, args.options);

    const dataValues = this._preparePostValues(args.values);
    const returning = this.normalizeReturning(args.options.returning);

    const dbobj = (args.options.connection || this.orm.pool);
    return dbobj
        .insert(this.tableNameFull, dataValues)
        .returning(returning && returning.dataTypes)
        .execute({
          objectRows: true,
          autoCommit: args.options.autoCommit
        }).then(resp => {
          const ret = {
            executeTime: resp.executeTime,
            queriesExecuted: 1,
            rowsAffected: resp.rowsAffected
          };
          if (returning) {
            const rows = resp.rows;
            returning.context = args.options.context;
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
  }

  /**
   * Creates many instances into database
   *
   * @param {Array<Object>} [values]
   * @param {Object} [options]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.autoCommit]
   * @param {Boolean} [options.ignoreUnknownProperties]
   * @param {Function} [options.prepare]
   * @param {Function} [options.validate]
   * @param {*} [options.context]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number, instance:Object}>}
   */
  async createMany(values, options = {}) {

    if (!Array.isArray(values))
      throw new ArgumentError('You must provide array of values');

    const args = {
      values,
      options: {...options}
    };
    args.options.ignoreUnknownProperties =
        options.ignoreUnknownProperties != null ?
            options.ignoreUnknownProperties : this.orm.options.ignoreUnknownProperties;

    if (options.prepare)
      await options.prepare(args);

    for (const v of args.values) {
      this.validateValuesForCreate(v,
          args.options.ignoreUnknownProperties,
          args.options.context);
      if (options.validate)
        await options.validate(v, args.options);

    }

    let rowsAffected = 0;
    let queriesExecuted = 0;
    const t = Date.now();
    const process = async (connection) => {
      for (const v of args.values) {
        const dataValues = this._preparePostValues(v);
        const resp = await connection
            .insert(this.tableNameFull, dataValues)
            .execute({objectRows: true});
        rowsAffected += (resp.rowsAffected || 0);
        queriesExecuted++;
      }

    };
    if (args.options.connection)
      await process(args.options.connection);
    else await this.orm.pool.acquire((connection) => process(connection));

    return {
      rowsAffected,
      executeTime: Date.now() - t,
      queriesExecuted
    };
  }

  /**
   * Performs update
   *
   * @param {*} [keyValues]
   * @param {Object} [values]
   * @param {Object} [options]
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Object|Array} [options.where]
   * @param {string|Array<string>} [options.returning]
   * @param {Boolean} [options.ignoreUnknownProperties]
   * @param {Function} [options.prepare]
   * @param {*} [options.context]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number, instances:Array<Object>}>}
   */
  update(keyValues, values, options = {}) {
    return this.updateMany(values, merge({
      where: this.normalizeKeyValues(keyValues)
    }, options, {combine: true})).then(ret => {
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
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @param {Object|Array} [options.where]
   * @param {string|Array<string>} [options.returning]
   * @param {Boolean} [options.ignoreUnknownProperties]
   * @param {Function} [options.prepare]
   * @param {Function} [options.validate]
   * @param {*} [options.context]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number, instances:Array<Object>}>}
   */
  async updateMany(values, options = {}) {
    if (typeof values !== 'object' || Array.isArray(values))
      throw new ArgumentError('You must provide values');

    const args = {
      values,
      options: {...options}
    };
    args.options.ignoreUnknownProperties =
        options.ignoreUnknownProperties != null ?
            options.ignoreUnknownProperties : this.orm.options.ignoreUnknownProperties;
    args.options.where = makeArray(args.options.where);

    if (options.prepare)
      await options.prepare(args);

    this.validateValuesForUpdate(args.values,
        args.options.ignoreUnknownProperties,
        args.options.context);

    if (options.validate)
      await options.validate(values, args.options);

    const dataValues = this._preparePostValues(values);
    const returning = this.normalizeReturning(options.returning);
    const where = makeArray(this._mapConditions(options.where));

    const dbobj = (options.connection || this.orm.pool);
    return dbobj
        .update(this.tableNameFull, dataValues)
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
  }

  /**
   * Performs delete
   *
   * @param {*} [keyValues]
   * @param {Object} [options]
   * @param {Boolean} [options.autoCommit]
   * @param {Object} [options.connection]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number}>}
   */
  destroy(keyValues, options = {}) {
    return this.destroyMany(merge({
      where: this.normalizeKeyValues(keyValues)
    }, options, {combine: true}));
  }

  /**
   * Performs delete
   *
   * @param {Object} [options]
   * @param {Object} [options.connection]
   * @param {Boolean} [options.autoCommit]
   * @param {Object|Array<Object>} [options.where]
   * @param {Boolean} [options.ignoreUnknownProperties]
   * @param {Function} [options.prepare]
   * @return {Promise<{executeTime:number, queriesExecuted:number, rowsAffected:number}>}
   */
  async destroyMany(/*istanbul ignore next*/ options = {}) {

    const args = {options};
    args.options.ignoreUnknownProperties =
        options.ignoreUnknownProperties != null ?
            options.ignoreUnknownProperties : this.orm.options.ignoreUnknownProperties;
    args.options.where = makeArray(args.options.where || []);

    if (options.prepare)
      await options.prepare(args);

    const where = this._mapConditions(makeArray(args.options.where));

    const dbobj = (options.connection || this.orm.pool);
    return dbobj
        .delete(this.tableNameFull)
        .where(...where)
        .execute({
          autoCommit: options.autoCommit
        }).then((result) => {
          result.queriesExecuted = 1;
          return result;
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

  /**
   *
   * @param {*} keyValues
   * @return {Object}
   */
  normalizeKeyValues(keyValues) {
    /* istanbul ignore next */
    if (!(this.keyFields && this.keyFields.length))
      throw new ArgumentError('Model "%s" has no key fields');
    return normalizeKeyValues(keyValues, this.keyFields);
  }

  /**
   *
   * @param {Object} options
   * @return {Object}
   */
  normalizeFindOptions(options = {}) {
    if (!options.properties || !Object.keys(options.properties).length)
      options = {...options, properties: this.getDataFields()};
    options = normalizeFindOptions(options);
    if (!options.sort && this._defaultSort)
      options.sort = this._defaultSort;
    return options;
  }

  /**
   *
   * @param {Object} options
   * @return {Object}
   */
  normalizeGetOptions(options = {}) {
    options = this.normalizeFindOptions(options);
    delete options.sort;
    delete options.offset;
    options.limit = 1;
    return options;
  }

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @param {Object} properties
   * @return {Object}
   */
  normalizeProperties(properties) {
    return normalizeProperties(properties);
  }

  normalizeReturning(value) {
    if (!value)
      return;
    let properties = value === '*' ? this.getDataFields() :
        (typeof value === 'object' ? value : [value]);
    properties = this.normalizeProperties(properties);
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
            resultRow[attr] = field.parse(row[colName]);
          }
        }
      }

      if (!(needFind && this.keyFields)) {
        promises.push(Promise.resolve(resultRow));
        continue;
      }

      const opts = {
        connection: dbobj,
        properties: options.properties,
        where: [],
        context: options.context
      };

      for (const n of this.keyFields) {
        opts.where.push({[n]: row[n]});
      }

      promises.push((new Finder(this, opts)).execute()
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
   * @param {boolean} [ignoreUnknownProperties=false]
   * @param {Object} [context]
   * @return {Object}
   */
  validateValuesForCreate(values, ignoreUnknownProperties, context) {
    return this._validateValues(values, ignoreUnknownProperties, true, context);
  }

  /**
   *
   * @param {Object} values
   * @param {boolean} [ignoreUnknownProperties=false]
   * @param {Object} [context]
   * @return {Object}
   */
  validateValuesForUpdate(values, ignoreUnknownProperties, context) {
    return this._validateValues(values, ignoreUnknownProperties, false, context);
  }

  /**
   *
   * @param {Object} values
   * @param {boolean} [ignoreUnknownProperties=false]
   * @param {boolean} [toCreate=false]
   * @param {Object} [context]
   * @private
   */
  _validateValues(values, ignoreUnknownProperties, toCreate, context) {
    if (typeof values !== 'object' || Array.isArray(values))
      throw new ArgumentError('You must provide values');

    /* istanbul ignore else */
    if (!ignoreUnknownProperties) {
      for (const name of Object.keys(values)) {
        this.getField(name);
      }
    }

    for (const name of Object.keys(this.fields)) {
      const field = this.fields[name];
      if (!(field instanceof DataField))
        continue;
      const v = values[name];

      // Validate required
      if (field.required && field.defaultValue == null && v == null &&
          (toCreate || v !== undefined)
      ) {
        throw new ValidationError('Value required for "%s"', name)
            .set({
              reason: 'value_required',
              field: name
            });
      }
      field.validate(v, values, toCreate, context);
    }
  }

  /**
   *
   * @param {Object} values
   * @return {Object}
   * @private
   */
  _preparePostValues(values) {
    const result = {};
    for (const name of Object.keys(this.fields)) {
      const field = this.fields[name];
      if (!(field instanceof DataField))
        continue;
      let v = values[name];
      if (v !== undefined) {
        v = field.parse(v);
        if (v == null && field.defaultValue != null)
          v = field.defaultValue;
      }
      if (v !== undefined)
        result[field.fieldName] = v;
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
