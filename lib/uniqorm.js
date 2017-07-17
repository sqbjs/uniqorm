/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const Schema = require('./schema');

/* External module dependencies. */
const fs = require('fs');
const assert = require('assert');
const util = require('util');
const waterfall = require('putil-waterfall');
const Promisify = require('putil-promisify');

const noSchemaSymbol = Symbol('no-schema');

/**
 * @class
 * @public
 */
class Uniqorm {

  constructor(dbPool) {
    const self = this;
    self.dbPool = dbPool;
    self.defaultSchema = dbPool.schema;

    /* Create a case in sensitive map*/
    //noinspection JSUnusedGlobalSymbols
    const schemas = new Proxy({}, {
      get: function(object, name) {
        return typeof name === 'string' ?
            object[name.toUpperCase()] : object[name];
      },
      set: function(object, name, value) {
        if (typeof name === 'string')
          object[name.toUpperCase()] = value;
        else object[name] = value;
        return true;
      }
    });
    Object.defineProperty(this, 'schemas', {
      value: schemas,
      configurable: false,
      writable: false
    });

    self.schemas[noSchemaSymbol] = new Schema(this, '');
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * Creates Model for given name
   *
   * @param {string} [schemaName]
   * @param {string} modelName
   * @return {Model}
   * @public
   */
  create(schemaName, modelName) {
    if (!modelName) {
      modelName = schemaName;
      schemaName = undefined;
    }
    const ctor = this.getModel(schemaName, modelName);
    assert(ctor, `Model not found ${schemaName ? schemaName + '.' +
        modelName : modelName}`);
    return Reflect.construct(ctor, [this]);
  }

  /**
   * Returns Schema instance for given name
   *
   * @param {string} [schemaName]
   * @return {[Function]}
   * @public
   */
  getSchema(schemaName) {
    return this.schemas[schemaName || this.defaultSchema ||
    noSchemaSymbol];
  }

  /**
   * Returns Model constructor for given name
   *
   * @param {string} [schemaName]
   * @param {string} modelName
   * @return {[Function]}
   * @public
   */
  getModel(schemaName, modelName) {
    if (!modelName) {
      modelName = schemaName;
      schemaName = undefined;
    }
    const self = this;
    if (!schemaName) {
      const m = modelName.match(/^(\w+).?(\w*)$/);
      assert.ok(m, 'Invalid argument');
      if (m[2]) {
        schemaName = m[1];
        modelName = m[2];
      } else {
        modelName = m[1];
      }
    }
    const schema = self.getSchema(schemaName);
    return schema ? schema.get(modelName) : undefined;
  }

  /**
   * Builds and adds a Model class
   * If argument is a configuration object it extends a new Model class
   *
   * @param {Object} obj
   * @param {string} [obj.schema]
   * @return {Function}
   * @public
   */
  define(obj) {
    const self = this;
    let schema = self.getSchema(obj.schema);
    if (!schema)
      schema = self.schemas[obj.schema] = new Schema(self, obj.schema);
    return schema.define(obj);
  }

  /**
   *
   * @param {string|Array<String>} files - Meta-data json File(s) to load
   * @param {Callback} [callback]
   * @return {Promise|undefined}
   */
  load(files, callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.load(files, cb));

    const self = this;
    if (!Array.isArray(files))
      files = [files];
    const objs = [];
    const tasks = [];
    for (const f of files) {
      tasks.push(function(next) {
        fs.readFile(f, 'utf8', (err, data) => {
          if (err)
            next(err);
          else {
            try {
              objs.push(JSON.parse(data));
              next();
            } catch (e) {
              next(e);
            }
          }
        });
      });
    }

    waterfall(tasks, (err) => {
      if (err) {
        callback(err);
        return;
      }
      try {
        for (const objSchema of objs) {
          Object.getOwnPropertyNames(objSchema).forEach(name => {
            const tableObj = objSchema[name];
            tableObj.name = name;
            self.define(tableObj);
          });
        }
      } catch (e) {
        callback(e);
        return;
      }
      callback();
    });
  }

  close(callback) {
    this.dbPool.close(callback);
  }

}

/**
 * @callback Callback
 * @param {Error} error
 */


module.exports = Uniqorm;
