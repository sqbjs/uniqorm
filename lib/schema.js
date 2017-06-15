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
const assert = require('assert');

/**
 * @class
 * @public
 */
class Schema {

  constructor(owner, name) {
    const self = this;
    self.owner = owner;
    self.name = name;

    /* Create a case in sensitive map*/
    //noinspection JSUnusedGlobalSymbols
    const models = new Proxy({}, {
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
   * @return {[Function]}
   * @public
   */
  get(name) {
    return this.models[name];
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
   * Builds and adds a Model class
   * If argument is a configuration object it extends a new Model class
   *
   * @param {Model|Object} obj
   * @param {string} [obj.name]
   * @param {string} [obj.tableName]
   * @return {Function}
   * @public
   */
  define(obj) {
    const self = this;
    const name = obj.name || obj.tableName;
    assert.ok(!self.get(name), `Model (${name}) already defined`);
    const ctor = Model.extend(obj);

    Object.defineProperty(ctor, 'schema', {
      value: self,
      writable: false,
      configurable: false
    });
    Object.defineProperty(ctor.prototype, 'schema', {
      value: self,
      writable: false,
      configurable: false
    });
    this.models[ctor.name] = ctor;
    return ctor;
  }

}

module.exports = Schema;
