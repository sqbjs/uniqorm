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
   * @param {Object} [options.capitalize]
   * @param {Function} [options.nameModifier]
   * @return {Promise<void | never>}
   */
  importSchema(schemaName, options) {
    return Promise.resolve().then(() => {
      const meta = new sqb.DBMeta(this._db);
      /* istanbul ignore next */
      if (!meta.supportsSchemas)
        schemaName = null;
      else if (!schemaName)
        throw new ArgumentError('You must provide schema name');
      const out = {};
      options = options || /* istanbul ignore next */ {};

      const modelName = (tableName) => {
        let n = options.capitalize ? capitalize(tableName) : tableName;
        if (typeof options.nameModifier === 'function')
          n = options.nameModifier(n, schemaName, tableName) ||
              /* istanbul ignore next */n;
        return n;
      };

      const getTbl = (tableName) => {
        const name = modelName(tableName);
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
                for (const row of ret.rows) {
                  const tbl = getTbl(row.table_name);
                  tbl.fields = tbl.fields || {};
                  const a = row.column_names.split(/\s*,\s*/);
                  for (const k of a) {
                    tbl.fields[k] = {
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
                  for (const row of ret.rows) {
                    const tbl = getTbl(row.table_name);
                    const field = tbl.fields[row.column_name] =
                        tbl.fields[row.column_name] || {};
                    field.dataType = row.data_type_mean;
                    if (row.not_null && !field.primaryKey)
                      field.notNull = true;
                    if (row.char_length)
                      field.charLength = row.char_length;
                    if (row.data_precision && field.dataType === 'NUMBER')
                      field.precision = row.data_precision;
                    if (row.data_scale)
                      field.scale = row.data_scale;
                    if (row.default_value &&
                        !row.default_value.match(/^[\w]+\(.*/i)) // Ignore functions
                      field.defaultValue = row.default_value;
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
                for (const row of ret.rows) {
                  const tbl = getTbl(row.table_name);
                  const associations = tbl.associations ||
                      (tbl.associations = []);
                  associations.push({
                    name: row.constraint_name,
                    foreignModel:
                        (row.foreign_schema ? row.foreign_schema + '.' :
                            /*istanbul ignore next*/ '') +
                        modelName(row.foreign_table_name),
                    key: row.column_name,
                    foreignKey: row.foreign_column_name
                  });
                }
              });
        }

      ]).then(() => out);
    });
  }

}

function capitalize(str) {
  str = str.toLowerCase().replace(/([-_].)/g, (x) => {
    return x[1].toUpperCase();
  });
  return str.charAt(0).toUpperCase() + str.substr(1);
}

/**
 * Expose `ModelExporter`.
 */
module.exports = MetadataImporter;
