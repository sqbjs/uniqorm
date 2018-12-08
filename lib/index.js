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
DataField.register(require('./fields/INTEGER'));
DataField.register(require('./fields/BIGINT'));
DataField.register(require('./fields/SMALLINT'));
DataField.register(require('./fields/FLOAT'));
DataField.register(require('./fields/NUMBER'));
DataField.register(require('./fields/DOUBLE'));
DataField.register(require('./fields/TEXT'));
DataField.register(require('./fields/VARCHAR'));
DataField.register(require('./fields/CHAR'));
DataField.register(require('./fields/DATE'));
DataField.register(require('./fields/TIMESTAMP'));
DataField.register(require('./fields/TIMESTAMPTZ'));
DataField.register(require('./fields/TIME'));
DataField.register(require('./fields/CLOB'));
DataField.register(require('./fields/BLOB'));
DataField.register(require('./fields/BUFFER'));
DataField.register(require('./fields/BOOLEAN'));

module.exports = Uniqorm;
Uniqorm.Field = Field;
Uniqorm.DataField = DataField;
Uniqorm.Model = Model;
Uniqorm.MetadataImporter = MetadataImporter;

//Object.assign(module.exports, Field);
