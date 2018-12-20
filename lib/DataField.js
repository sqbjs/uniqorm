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
   * @param {*} [def.defaultValue]
   * @constructor
   */
  constructor(name, model, def) {
    super(name, model);
    this.fieldName = def && def.fieldName;
    this.defaultValue = def && def.defaultValue;
    this.notNull = def && def.notNull;
    this.primaryKey = def && def.primaryKey;
  }

  get dataType() {
    return Object.getPrototypeOf(this).constructor.name;
  }

  /**
   * @type {string}
   */
  get fieldName() {
    return this._fieldName || this.name;
  }

  /**
   * @param {string} value
   * @override
   */
  set fieldName(value) {
    this._fieldName = value == null ? null : String(value);
  }

  /**
   * @type {boolean}
   */
  get primaryKey() {
    return this._primaryKey;
  }

  /**
   * @param {Boolean} value
   * @override
   */
  set primaryKey(value) {
    this._primaryKey = value == null ? null : !!value;
  }

  /**
   * @type {Boolean}
   */
  get notNull() {
    return this._notNull == null ? this.primaryKey :
        !!this._notNull;
  }

  /**
   * @param {Boolean} value
   * @override
   */
  set notNull(value) {
    this._notNull = value == null ? null : !!value;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @type {*}
   */
  get defaultValue() {
    return this._defaultValue;
  }

  /**
   * @param {Date} value
   * @override
   */
  set defaultValue(value) {
    this._defaultValue = this.parseValue(value);
  }

  /* istanbul ignore next */
  // noinspection JSMethodCanBeStatic
  /**
   *
   * @param {*} value
   * @return {*}
   */
  parseValue(value) {
    return value == null ? null : value;
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
