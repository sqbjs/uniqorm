/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://github.com/sqbjs/uniqorm
 */

/**
 * Module dependencies.
 * @private
 */
const Uniqorm = require('./Uniqorm');
const Model = require('./Model');
const Field = require('./Field');
const DataField = require('./DataField');
const MetadataImporter = require('./MetadataImporter');

module.exports = Uniqorm;
Uniqorm.Field = Field;
Uniqorm.DataField = DataField;
Uniqorm.Model = Model;
Uniqorm.MetadataImporter = MetadataImporter;
Uniqorm.fieldClasses = {
  BOOLEAN: require('./fields/BOOLEAN'),
  BOOL: require('./fields/BOOLEAN'),
  INTEGER: require('./fields/INTEGER'),
  BIGINT: require('./fields/BIGINT'),
  SMALLINT: require('./fields/SMALLINT'),
  FLOAT: require('./fields/FLOAT'),
  NUMBER: require('./fields/NUMBER'),
  NUMERIC: require('./fields/NUMBER'),
  DOUBLE: require('./fields/DOUBLE'),
  TEXT: require('./fields/TEXT'),
  VARCHAR: require('./fields/VARCHAR'),
  CHAR: require('./fields/CHAR'),
  DATE: require('./fields/DATE'),
  TIMESTAMP: require('./fields/TIMESTAMP'),
  TIMESTAMPTZ: require('./fields/TIMESTAMPTZ'),
  TIME: require('./fields/TIME'),
  CLOB: require('./fields/CLOB'),
  BLOB: require('./fields/BLOB'),
  BUFFER: require('./fields/BUFFER')
};

for (const n of Object.keys(Uniqorm.fieldClasses)) {
  DataField.register(n, Uniqorm.fieldClasses[n]);
}

//Object.assign(module.exports, Field);
