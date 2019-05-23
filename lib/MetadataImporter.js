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
const EventEmitter = require('events').EventEmitter;
const waterfall = require('putil-waterfall');
const promisify = require('putil-promisify');
const sqb = require('sqb');
const {ArgumentError} = require('errorex');

const Op = sqb.Op;

/**
 * @param {Object} dbPool
 * @param {Object} options
 * @constructor
 */
class MetadataImporter extends EventEmitter {

  constructor(db) {
    super();
    this._db = db;
  }

  listSchemas() {
    const meta = new sqb.DBMeta(this._db);
    return meta.getSchemas().then(schemas => {
      const result = [];
      for (const sch of schemas)
        result.push(sch.name);
      return result;
    });
  }

  /**
   *
   * @param {string} schemaName
   * @param {Object} [options]
   * @param {int} [options.modelNameFormat=0]
   * @param {int} [options.fieldNameFormat=0]
   * @param {Function} [options.modelNameModifier]
   * @param {Function} [options.fieldNameModifier]
   * @return {Promise<void | never>}
   */
  importSchema(schemaName, options) {
    return promisify(() => {
      const meta = new sqb.DBMeta(this._db);
      /* istanbul ignore next */
      if (!meta.supportsSchemas)
        schemaName = null;
      else if (!schemaName)
        throw new ArgumentError('You must provide schema name');
      const out = {};
      options = options || /* istanbul ignore next */ {};

      const modifyFieldName = (fieldName) => {
        let n = fieldName;
        switch (options.fieldNameFormat || 0) {
          case (NameFormat.CAMEL_CASE):
            n = camelize(fieldName);
            break;
          case (NameFormat.CAPITALIZE_FIRST_LETTER):
            n = capitalize(camelize(fieldName));
            break;
        }
        if (typeof options.fieldNameModifier === 'function')
          n = options.fieldNameModifier(n, fieldName) ||
              /* istanbul ignore next */n;
        return n;
      };

      const modifyModelName = (tableName) => {
        let n = tableName;
        switch (options.modelNameFormat || 0) {
          case (NameFormat.CAMEL_CASE):
            n = camelize(tableName);
            break;
          case (NameFormat.CAPITALIZE_FIRST_LETTER):
            n = capitalize(camelize(tableName));
            break;
        }
        if (typeof options.modelNameModifier === 'function')
          n = options.modelNameModifier(n, schemaName, tableName) ||
              /* istanbul ignore next */n;
        return n;
      };

      const getTbl = (tableName) => {
        const name = modifyModelName(tableName);
        return out[name] = out[name] || {
          name,
          tableName
        };
      };
      const queue = [];
      return waterfall([

        () => this._db.test(),

        /* Iterate tables */
        () => {
          return meta
              .select().from('tables')
              .where(schemaName ? {schema_name: schemaName} : /* istanbul ignore next */ null)
              .orderBy('table_name')
              .execute({
                objectRows: true,
                fetchRows: 0,
                naming: 'lowercase'
              }).then(ret => {
                /* istanbul ignore next */
                if (!(ret && ret.rows)) return;

                let a;
                for (const row of ret.rows) {
                  if (!a || a.length >= 25) {
                    a = [];
                    queue.push(a);
                  }
                  const tbl = getTbl(row.table_name);
                  /* istanbul ignore else */
                  if (schemaName)
                    tbl.schema = schemaName;
                  if (row.table_comments)
                    tbl.comments = row.table_comments;
                  a.push(row.table_name);
                }
              });
        },

        /* Iterate primary keys */
        () => {
          return meta
              .select()
              .from('primary_keys')
              .where(schemaName ? {schema_name: schemaName} : /* istanbul ignore next */ null)
              .execute({
                objectRows: true,
                fetchRows: 0,
                naming: 'lowercase'
              }).then(ret => {
                /* istanbul ignore next */
                if (!(ret && ret.rows)) return;

                for (const row of ret.rows) {
                  const tbl = getTbl(row.table_name);
                  tbl.fields = tbl.fields || {};
                  const a = row.column_names.split(/\s*,\s*/);
                  for (const k of a) {
                    const attr = modifyFieldName(k);
                    tbl.fields[attr] = {
                      primaryKey: true
                    };
                  }
                }
              });
        },

        /* Iterate columns */
        () => {
          return waterfall.every(queue, (next, q) => {
            return meta
                .select().from('columns')
                .where(schemaName ? {schema_name: schemaName} : /* istanbul ignore next */ null,
                    Op.in('table_name', q))
                .execute({
                  objectRows: true,
                  fetchRows: 0,
                  naming: 'lowercase'
                }).then(ret => {
                  /* istanbul ignore next */
                  if (!(ret && ret.rows)) return;

                  for (const row of ret.rows) {
                    const tbl = getTbl(row.table_name);
                    tbl.fields = tbl.fields || /* istanbul ignore next */{};
                    const fieldName = modifyFieldName(row.column_name);
                    const field = tbl.fields[fieldName] =
                        tbl.fields[fieldName] || {};
                    if (fieldName !== row.column_name)
                      field.fieldName = row.column_name;
                    field.dataType = row.data_type_mean;
                    if (row.not_null && !field.primaryKey)
                      field.notNull = true;
                    if (row.char_length)
                      field.charLength = row.char_length;
                    if (row.data_precision && field.dataType === 'NUMBER')
                      field.precision = row.data_precision;
                    if (row.data_scale)
                      field.scale = row.data_scale;
                    if (row.default_value)
                      field.required = false;

                    if (row.column_comments)
                      field.comments = row.column_comments;
                  }
                });
          });
        },

        /* Iterate foreign keys */
        () => {
          return meta
              .select()
              .from('foreign_keys')
              .where(schemaName ? {schema_name: schemaName} : /* istanbul ignore next */ null)
              .execute({
                objectRows: true,
                fetchRows: 0,
                naming: 'lowercase'
              }).then(ret => {
                /* istanbul ignore next */
                if (!(ret && ret.rows)) return;

                for (const row of ret.rows) {
                  const tbl = getTbl(row.table_name);
                  const associations = tbl.associations ||
                      (tbl.associations = []);
                  const key = row.column_name.split(/[\s,]+/)
                      .map(v => modifyFieldName(v));
                  const foreignKey = row.foreign_column_name.split(/[\s,]+/)
                      .map(v => modifyFieldName(v));

                  associations.push({
                    name: row.constraint_name,
                    foreignModel:
                        (row.foreign_schema ? row.foreign_schema + '.' :
                            /*istanbul ignore next*/ '') +
                        modifyModelName(row.foreign_table_name),
                    key: (key.length > 1 ?
                        /*istanbul ignore next*/ key : key[0]),
                    foreignKey: (foreignKey.length > 1 ?
                        /*istanbul ignore next*/ foreignKey : foreignKey[0])
                  });
                }
              });
        }

      ]).then(() => out);
    });
  }

}

/**
 * ParamType
 * @export @enum {number}
 */
const NameFormat = {};

/** @export */
NameFormat.NONE = /** @type {!ParamType} */ (0);

/** @export */
NameFormat.CAMEL_CASE = /** @type {!ParamType} */ (1);

/** @export */
NameFormat.CAPITALIZE_FIRST_LETTER = /** @type {!ParamType} */ (2);

function camelize(str) {
  /*istanbul ignore next*/
  return str.replace(/[-_]+(.)?/g, function(arg$, c) {
    return (c != null ? c : '').toUpperCase();
  });
}

function capitalize(str) {
  return str[0].toUpperCase() + str.substr(1);
}

MetadataImporter.NameFormat = NameFormat;

/**
 * Expose `ModelExporter`.
 */
module.exports = MetadataImporter;
