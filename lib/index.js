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
const MetadataExporter = require('./ModelExporter');

// Register field classes
Field.register(require('./fields/INTEGER'));
Field.register(require('./fields/BIGINT'));
Field.register(require('./fields/SMALLINT'));
Field.register(require('./fields/FLOAT'));
Field.register(require('./fields/NUMBER'));
Field.register(require('./fields/VARCHAR'));
Field.register(require('./fields/CHAR'));
Field.register(require('./fields/DATE'));
Field.register(require('./fields/TIMESTAMP'));
Field.register(require('./fields/TIME'));
Field.register(require('./fields/CLOB'));
Field.register(require('./fields/BLOB'));
Field.register(require('./fields/BUFFER'));
Field.register(require('./fields/BOOL'));

module.exports = Uniqorm;
Uniqorm.Field = Field;
Uniqorm.Model = Model;
Uniqorm.MetadataExporter = MetadataExporter;
Uniqorm.FieldType = Field.FieldType;

//Object.assign(module.exports, Field);
