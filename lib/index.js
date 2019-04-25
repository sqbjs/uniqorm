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
const Uniqorm = require('./Uniqorm');
const Model = require('./Model');
const Field = require('./Field');
const DataField = require('./DataField');
const MetadataImporter = require('./MetadataImporter');

// Register field classes
DataField.register('INTEGER', require('./fields/INTEGER'));
DataField.register('BIGINT', require('./fields/BIGINT'));
DataField.register('SMALLINT', require('./fields/SMALLINT'));
DataField.register('FLOAT', require('./fields/FLOAT'));
DataField.register('NUMBER', require('./fields/NUMBER'));
DataField.register('NUMERIC', require('./fields/NUMBER'));
DataField.register('DOUBLE', require('./fields/DOUBLE'));
DataField.register('TEXT', require('./fields/TEXT'));
DataField.register('VARCHAR', require('./fields/VARCHAR'));
DataField.register('CHAR', require('./fields/CHAR'));
DataField.register('DATE', require('./fields/DATE'));
DataField.register('TIMESTAMP', require('./fields/TIMESTAMP'));
DataField.register('TIMESTAMPTZ', require('./fields/TIMESTAMPTZ'));
DataField.register('TIME', require('./fields/TIME'));
DataField.register('CLOB', require('./fields/CLOB'));
DataField.register('BLOB', require('./fields/BLOB'));
DataField.register('BUFFER', require('./fields/BUFFER'));
DataField.register('BOOLEAN', require('./fields/BOOLEAN'));
DataField.register('BOOL', require('./fields/BOOLEAN'));

module.exports = Uniqorm;
Uniqorm.Field = Field;
Uniqorm.DataField = DataField;
Uniqorm.Model = Model;
Uniqorm.MetadataImporter = MetadataImporter;

//Object.assign(module.exports, Field);
