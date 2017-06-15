/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* External module dependencies. */

/**
 * @class
 */
class Field {
  constructor(cfg) {
    this._fieldType = Field.DataType.DATA;
    if (typeof cfg === 'object') {
      this.setFieldName(cfg.fieldName);
      //noinspection PointlessBooleanExpressionJS
      this.setPrimaryKey(!!cfg.primaryKey);
      //noinspection PointlessBooleanExpressionJS
      this.setNotNull(!!cfg.notNull);
    }
  }

  /**
   * @type {string}
   */
  get fieldName() {
    return this._fieldName;
  }

  /**
   * @param {string} value
   */
  set fieldName(value) {
    this._fieldName = String(value);
  }

  /**
   * @type {boolean}
   */
  get primaryKey() {
    return this._primaryKey;
  }

  /**
   * @param {boolean} value
   */
  set primaryKey(value) {
    this._primaryKey = value;
  }

  /**
   * @type {boolean}
   */
  get notNull() {
    return this._notNull;
  }

  /**
   * @param {boolean} value
   */
  set notNull(value) {
    this._notNull = value;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @type {int}
   */
  get fieldType() {
    return this._fieldType;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {int} value
   */
  set fieldType(value) {
    this._fieldType = value;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @type {*}
   */
  get defaultValue() {
    return this._defaultValue;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {*} value
   */
  set defaultValue(value) {
    this._defaultValue = value;
  }

  /**
   * @param {*} value
   * @return {Field}
   */
  setDefaultValue(value) {
    this.defaultValue = value;
    return this;
  }

  /**
   * @param {string} name
   * @return {Field}
   */
  setFieldName(name) {
    this._fieldName = name;
    return this;
  }

  /**
   * @param {boolean} [value = true]
   * @return {Field}
   */
  setPrimaryKey(value = true) {
    this.primaryKey = value;
    return this;
  }

  /**
   * @param {boolean} [value = true]
   * @return {Field}
   */
  setNotNull(value = true) {
    this.notNull = value;
    return this;
  }
}

/** @export @enum {number} */
Field.DataType = {};

/** @export */
Field.DataType.DATA = /** @type {!Field.DataType} */ (0);

/** @export */
Field.DataType.AGGREGATE = /** @type {!Field.DataType} */ (1);

/** @export */
Field.DataType.CALCULATED = /** @type {!Field.DataType} */ (2);

/**
 * Registers a serializer class for given dialect
 *
 * @param {constructor<Field>} fieldProto
 * @static
 * @public
 */
Field.register = function(fieldProto) {
  const items = this._registry = this._registry || {};
  items[fieldProto.name.toUpperCase()] = fieldProto;
};

/**
 * Retrieves serializer class for given dialect
 *
 * @param {String} type
 * @return {constructor<Field>}
 * @static
 * @public
 */
Field.get = function(type) {
  return this._registry ? this._registry[type.toUpperCase()] : undefined;
};


module.exports = Field;