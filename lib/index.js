/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const Uniqorm = require('./uniqorm');
const Model = require('./model');
const Field = require('./field');
const MetadataExporter = require('./metadata-exporter');

// Register field classes
Field.register(require('./fields/field-integer'));
Field.register(require('./fields/field-bigint'));
Field.register(require('./fields/field-float'));
Field.register(require('./fields/field-number'));
Field.register(require('./fields/field-varchar'));
Field.register(require('./fields/field-char'));
Field.register(require('./fields/field-date'));
Field.register(require('./fields/field-timestamp'));
Field.register(require('./fields/field-clob'));
Field.register(require('./fields/field-blob'));
Field.register(require('./fields/field-buffer'));

module.exports = function(dbPool) {
  return new Uniqorm(dbPool);
};

Object.assign(module.exports, {
  Uniqorm,
  Model,
  Field,
  MetadataExporter
});

Object.assign(module.exports, Field);
