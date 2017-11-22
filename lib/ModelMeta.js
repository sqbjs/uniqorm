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
const errorex = require('errorex');
const defineConst = require('putil-defineconst');
const Field = require('./Field');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;
const FIELD_PATTERN = /[a-zA-Z]\w*/;

/**
 * Expose `ModelMeta`.
 */
module.exports = ModelMeta;

/**
 * @param {Object} def
 * @constructor
 */
function ModelMeta(def) {
  const tableName = def.tableName || def.name;
  if (!(typeof tableName === 'string' && tableName.match(/([A-Za-z])\w*/)))
    throw new ArgumentError('Property `tableName` is empty or is not valid');
  defineConst(this, '_fields', [], false);
  this.setTable(def.tableName || def.name);
  this.setSchema(def.schemaName);
  this.setFields(def.fields);
  this.setDefaultFields(def.defaultFields);
  if (def.primaryKey && def.primaryKey.columns)
    this.setPrimaryKeys.apply(this, def.primaryKey.columns.split(','));
}

const proto = ModelMeta.prototype = {};
proto.constructor = ModelMeta;

proto.get = function(nameOrIndex) {
  if (nameOrIndex instanceof Number) {
    if (nameOrIndex < 0 || nameOrIndex >= this._fields.length)
      throw new ArgumentError('Field index(%d) out of bounds', nameOrIndex);
    return this._fields[nameOrIndex];
  }
  const i = this.indexOf(nameOrIndex);
  if (i < 0)
    throw new ArgumentError('Field `%s` not found', nameOrIndex);
  return this._fields[i];
};

proto.fieldNames = function() {
  const a = [];
  this._fields.forEach(function(f) {
    a.push(f.fieldName);
  });
  return a;
};

proto.indexOf = function(name) {
  const self = this;
  var i;
  for (i = 0; i < self._fields.length; i++) {
    if (self._fields[i].fieldName.toLowerCase() === name.toLowerCase())
      return i;
  }
  return -1;
};

proto.set = function(name, def) {
  var field;
  if (name instanceof Field) {
    field = name;
    name = field.fieldName;
  }
  if (!field) {
    if (!(typeof name === 'string' && name.match(FIELD_PATTERN)))
      throw new ArgumentError('`name argument is empty of invalid');
    if (!(typeof def === 'object'))
      throw new ArgumentError('`def` argument required');

    const T = Field.get(def.type);
    if (!T)
      throw new ArgumentError('Unknown field type definition `%s` for field `%s`',
          def.type, name);
    field = Object.create(T.prototype);
    T.call(field);
    field.setFieldName(name);
    field.setNotNull(def.notNull);
    field.setPrimaryKey(def.primaryKey);
    field.setDefaultValue(def.defaultValue);
  }
  const i = this.indexOf(name);
  if (i >= 0)
    this._fields[i] = field;
  else this._fields.push(field);
};

proto.setFields = function(source) {
  if (source) {
    if (!(typeof source === 'object'))
      throw new ArgumentError('First argument required as an object instance');
    const self = this;
    Object.getOwnPropertyNames(source).forEach(function(key) {
      const v = source[key];
      v.name = key;
      v.fieldName = v.fieldName || key;
      v.fieldType = Field.DataType.DATA;
      self.set(key, v);
    });
  }
  return this;
};

proto.setTable = function(tableName) {
  this.tableName = tableName;
  return this;
};

proto.setSchema = function(schemaName) {
  this.schemaName = schemaName;
  return this;
};

proto.setDefaultFields = function(fields) {
  if (!(arguments.length && fields)) return this;
  const self = this;
  const args = [];
  // build a flat array of arguments
  Array.prototype.forEach.call(arguments, function(t) {
    if (Array.isArray(t))
      Array.prototype.push.apply(args, t);
    else args.push(t);
  });
  // Validate fields
  args.forEach(function(t) {
    self.get(t);
  });
  this._defaultFields = args;
  return this;
};

proto.setPrimaryKeys = function(fields) {
  if (!(arguments.length && fields)) return this;
  const self = this;
  /* Clear previous flags */
  self._fields.forEach(function(t) {
    t.setPrimaryKey(false);
  });
  Array.prototype.forEach.call(arguments, function(t) {
    const field = self.get(t);
    field.setPrimaryKey(true);
  });
  return this;
};

proto.getPrimaryKeys = function() {
  return this._fields.filter(function(f) {
    return f.primaryKey;
  });
};
