/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Module dependencies.
 * @private
 */
const Field = require('./Field');

/**
 *
 * @class
 * @extends Field
 */
class DataField extends Field {

  /**
   * @param {string} name
   * @param {Model|string} model
   * @param {Object} [def]
   * @param {string} [def.fieldName]
   * @param {boolean} [def.primaryKey]
   * @param {boolean} [def.notNull]
   * @param {*} def.defaultValue
   * @constructor
   */
  constructor(name, model, def) {
    super(name, model, def);
    this.defaultValue = this._def.defaultValue;
    this.notNull = this._def.notNull;
    this.primaryKey = this._def.primaryKey;
  }

  /**
   * @type {string}
   */
  get fieldName() {
    return this._def.fieldName || this.name;
  }

  /**
   * @type {boolean}
   */
  get primaryKey() {
    return this._def.primaryKey;
  }

  /**
   * @param {Boolean} value
   * @override
   */
  set primaryKey(value) {
    this._def.primaryKey = value == null ? null : !!value;
  }

  /**
   * @type {Boolean}
   */
  get notNull() {
    return this._def.notNull == null ? this.primaryKey :
        !!this._def.notNull;
  }

  /**
   * @param {Boolean} value
   * @override
   */
  set notNull(value) {
    this._def.notNull = value == null ? null : !!value;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @type {*}
   */
  get defaultValue() {
    return this._def.defaultValue;
  }

  /**
   * @param {Date} value
   * @override
   */
  set defaultValue(value) {
    this._def.defaultValue = value == null ? null : value;
  }

  /**
   * Registers a serializer class for given dialect
   *
   * @param {constructor<DataField>} fieldProto
   * @static
   * @public
   */
  static register(fieldProto) {
    const items = this._registry = this._registry || {};
    items[fieldProto.name.toUpperCase()] = fieldProto;
  }

  /**
   * Retrieves serializer class for given dialect
   *
   * @param {String} type
   * @return {constructor<DataField>}
   * @static
   * @public
   */
  static get(type) {
    return type && this._registry[type.toUpperCase()];
  }

}

/**
 * Expose `DataField`.
 */
module.exports = DataField;
