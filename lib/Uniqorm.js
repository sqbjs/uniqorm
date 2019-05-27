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
const {EventEmitter} = require('events');
const {ErrorEx, ArgumentError} = require('errorex');
const Model = require('./Model');
const Schema = require('./Schema');
const isPlainObject = require('putil-isplainobject');

const defaultSchemaSymbol = Symbol('default');

/**
 * @class
 * @extends EventEmitter
 */
class Uniqorm extends EventEmitter {

  /**
   * @param {Object} [sqbPool]
   * @param {Object} [options]
   * @param {Boolean} [options.ignoreUnknownProperties]
   * @param {Boolean} [options.defaultPrimaryKey='id']
   * @constructor
   * @public
   */
  constructor(sqbPool, options = {}) {
    super();
    if (sqbPool && typeof sqbPool.select !== 'function')
      throw new ArgumentError('First argument can be an SQB pool instance only');
    if (sqbPool)
      this.pool = sqbPool;
    this._schemas = {};
    this.options = options;
    this.options.defaultPrimaryKey = this.options.defaultPrimaryKey || 'id';
  }

  /**
   *
   * @return {Object}
   */
  get schemas() {
    return this._schemas;
  }

  /* istanbul ignore next */
  /**
   *
   * @return {Schema}
   */
  get defaultSchema() {
    return this._schemas[defaultSchemaSymbol];
  }

  /**
   * Creates a new Model
   *
   * @param {Object} modelDef
   * @return {Model}
   * @public
   */
  define(modelDef) {
    if (!isPlainObject(modelDef))
      throw new ArgumentError('Model definition argument (modelDef) is empty or is not valid');

    const schemaName = modelDef.schema || defaultSchemaSymbol;
    let schema = this.schemas[schemaName];

    if (schema && schema.models[modelDef.name])
      throw new ArgumentError('Model "%s" already exists in schema %s',
          modelDef.name, schema.name);

    schema = schema ||
        (this.schemas[schemaName] =
            new Schema(this, String(schemaName), !modelDef.schema));

    const model = new Model(schema, modelDef);
    schema.models[modelDef.name] = model;
    return model;
  }

  /**
   * Returns Schema
   *
   * @param {string} schemaName
   * @return {Schema}
   * @public
   */
  getSchema(schemaName) {
    const schema = this.schemas[schemaName];
    if (!schema)
      throw new ErrorEx('No such "%s" schema defined', schemaName);
    return schema;
  }

  /**
   * Returns Model
   *
   * @param {string} [schemaName]
   * @param {string} modelName
   * @return {Model}
   * @public
   */
  getModel(schemaName, modelName) {
    if (arguments.length === 1 && schemaName.includes('.')) {
      const a = schemaName.split(/\./);
      schemaName = a[0];
      modelName = a[1];
    } else if (arguments.length <= 1) {
      modelName = schemaName;
      const keys = this.getSchemaKeys();
      const schema = keys.length === 1 ?
          this.schemas[keys[0]] :
          this.getSchema(defaultSchemaSymbol);
      return schema.getModel(modelName);
    }
    return this.getSchema(schemaName).getModel(modelName);
  }

  /**
   *
   */
  prepare() {
    const schemaKeys = this.getSchemaKeys();
    const modelKeys = {};

    /* Phase 1. Build key fields of each model */
    for (const schKey of schemaKeys) {
      const schema = this.schemas[schKey];
      modelKeys[schKey] = Object.keys(schema.models);
      for (const modelKey of modelKeys[schKey]) {
        const model = schema.models[modelKey];
        model._keyFields = [];
        for (const name of Object.keys(model.fields)) {
          const field = model.fields[name];
          if (field.primaryKey)
            model._keyFields.push(name);
        }
      }
    }
    /* Phase 2. Prepare fields */
    for (const schKey of schemaKeys) {
      const schema = this.schemas[schKey];
      for (const modelKey of modelKeys[schKey]) {
        const model = schema.models[modelKey];
        for (const name of Object.keys(model.fields)) {
          model.fields[name].prepare();
        }
      }
    }
  }

  /**
   *
   * @return {Array<string>}
   */
  getSchemaKeys() {
    const schemaKeys = Object.keys(this.schemas);
    if (this.schemas[defaultSchemaSymbol])
      schemaKeys.push(defaultSchemaSymbol);
    return schemaKeys;
  }

}

/**
 * Expose `Uniqorm`.
 */
module.exports = Uniqorm;
