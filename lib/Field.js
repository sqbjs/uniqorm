/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Expose `Field`.
 */
module.exports = Field;

/**
 * @param {String} name
 * @param {Object} def
 * @constructor
 */
function Field(name, def) {
  /**
   * @property
   * @type {string}
   */
  this.fieldType = Field.FieldType.DATA;
  this.name = name;
  this.fieldName = def.fieldName || name;
  if (def) {
    this.notNull = def.notNull;
    this.defaultValue = def.defaultValue;
    this.primaryKey = def.primaryKey;
  }
}

Field.prototype = {
  /**
   * @type {string}
   */
  get fieldName() {
    return this._fieldName;
  },

  /**
   * @param {string} value
   */
  set fieldName(value) {
    this._fieldName = String(value);
  },

  /**
   * @type {boolean}
   */
  get primaryKey() {
    return this._primaryKey;
  },

  /**
   * @param {boolean} value
   */
  set primaryKey(value) {
    this._primaryKey = value;
  },

  /**
   * @type {boolean}
   */
  get notNull() {
    return this._notNull;
  },

  /**
   * @param {boolean} value
   */
  set notNull(value) {
    this._notNull = value;
  },

  //noinspection JSUnusedGlobalSymbols
  /**
   * @type {*}
   */
  get defaultValue() {
    return this._defaultValue;
  },

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {*} value
   */
  set defaultValue(value) {
    this._defaultValue = value;
  }
};

Field.prototype.constructor = Field;

/**
 * @param {*} value
 * @return {Field}
 */
Field.prototype.setDefaultValue = function(value) {
  this.defaultValue = value;
  return this;
};

/**
 * @param {string} name
 * @return {Field}
 */
Field.prototype.setFieldName = function(name) {
  this.fieldName = name;
  return this;
};

/**
 * @param {boolean} [value = true]
 * @return {Field}
 */
Field.prototype.setPrimaryKey = function(value) {
  this.primaryKey = value || value === undefined;
  return this;
};

/**
 * @param {boolean} [value = true]
 * @return {Field}
 */
Field.prototype.setNotNull = function(value) {
  this.notNull = value || value === undefined;
  return this;
};

/** @export @enum {number} */
Field.FieldType = {};

/** @export */
Field.FieldType.DATA = /** @type {!Field.FieldType} */ (0);

/** @export */
Field.FieldType.AGGREGATE = /** @type {!Field.FieldType} */ (1);

/** @export */
Field.FieldType.CALCULATED = /** @type {!Field.FieldType} */ (2);

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
