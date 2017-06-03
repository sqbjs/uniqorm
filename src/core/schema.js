/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const Model = require('./model');

/* External module dependencies. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

/**
 * @class
 * @public
 */
class Schema {

  constructor(name, db) {
    const self = this;
    self.name = name;
    self.database = db;
    // Create a read only proxy
    //noinspection JSUnusedGlobalSymbols
    const models = new Proxy({}, {
      get: function(object, name) {
        return typeof name ===
        'string' ? object[name.toUpperCase()] : undefined;
      },
      set: function(object, name, value) {
        if (typeof name === 'string')
          object[name.toUpperCase()] = value;
        else object[name] = value;
        return true;
      }
    });
    Object.defineProperty(this, 'models', {
      value: models,
      configurable: false,
      writable: false
    });
  }

  /**
   * Returns Model constructor for given name
   *
   * @param {string} name
   * @return {Function}
   * @public
   */
  get(name) {
    const model = this.models[name];
    if (!model)
      throw new Error(`Model "${name}" not found`);
    return model;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * Creates Model for given name
   *
   * @param {string} name
   * @return {Model}
   * @public
   */
  create(name) {
    const ctor = this.get(name);
    return Reflect.construct(ctor, []);
  }

  /**
   * Adds Model class to list of this schema.
   * If argument is a configuration object it extends new Model class
   *
   * @param {Model|Object} obj
   * @param {string} [obj.name]
   * @param {string} [obj.tableName]
   * @return {Function}
   * @public
   */
  define(obj) {
    let ctor;
    if (obj.prototype instanceof Model)
      ctor = obj;
    else {
      const name = obj.name || obj.tableName;
      assert.ok(!this.models[name], `Model (${name}) already defined`);
      ctor = Model.extend(obj);
    }
    Object.defineProperty(ctor, 'schema', {
      value: this,
      writable: false,
      configurable: false
    });
    Object.defineProperty(ctor.prototype, 'schema', {
      value: this,
      writable: false,
      configurable: false
    });
    this.models[ctor.name] = ctor;
    return ctor;
  }

  /**
   *
   * @param {string} dir - The search directory includes js files which exports Model class
   * @param {loadCallback} [callback]
   * @return {Promise}
   */
  load(dir, callback) {
    const self = this;
    const promise = new Promise((resolve, reject) => {
          fs.readdir(dir, function(err, files) {
            if (err) {
              reject(err);
              return;
            }
            for (let i = 0; i < files.length; i++) {
              try {
                const ctor = require(path.join(dir, files[i]));
                assert.ok(ctor.prototype instanceof
                    Model, `File (${files[i]}) does not export Model class`);
                self.define(ctor);
              } catch (e) {
                reject(e);
                return;
              }
            }
            resolve(self);
          });
        }
    );
    return !callback ? promise : promise.then(() => callback)
        .catch(err => callback(err));
  }
}

/**
 * This callback is called when load process complete
 * @callback loadCallback
 * @param {Error} error
 */


module.exports = Schema;
