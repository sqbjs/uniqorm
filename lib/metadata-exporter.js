/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* External module dependencies. */
const {EventEmitter} = require('events');
const waterfall = require('putil-waterfall');
const Promisify = require('putil-promisify');

/**
 * @class
 * @public
 */
class MetadataExporter extends EventEmitter {

  constructor(dbPool, options) {
    super();
    this.dbPool = dbPool;
    if (options) {
      this.includeSchemas = options.includeSchemas;
      this.includeTables = options.includeTables;
      this.excludeTables = options.excludeTables;
    }
    this.naming = options && options.naming !== undefined ?
        options.naming : dbPool.config.naming;
  }

  execute(callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.execute(cb));

    const self = this;
    const out = {};
    const db = self.dbPool;
    const conditions = [];
    if (this.includeSchemas)
      conditions.push(['schema_name', 'like', self.includeSchemas]);
    if (this.includeTables)
      conditions.push(['table_name', 'like', this.includeTables]);
    if (this.excludeTables)
      conditions.push(['table_name', '!like', this.excludeTables]);
    callback = callback || function() {
    };

    const setCase = function(val) {
      if (!val) return val;
      return self.naming === 'lowercase' ?
          val.toLowerCase() :
          (self.naming ===
          'uppercase' ? val.toUpperCase() : val);
    };

    waterfall([
          /* Get connection from db pool */
          function(next) {
            self.emit('process', 'connect', 'connecting');
            return db.test().then(() => {
              self.emit('process', 'connect', 'connected');
              next();
            });
          },

          /* Iterate tables */
          function(next) {
            self.emit('process', 'tables', 'query');
            return db.metaData
                .select('schema_name', 'table_name', 'table_comments')
                .from('tables')
                .where(...conditions)
                .execute({cursor: true}, (err, ret) => {
                  if (err)
                    return next(err);

                  const dset = ret.dataset;
                  let counter = 0;
                  dset.next((err, more) => {
                    if (err)
                      return next(err);
                    if (more) {
                      counter++;
                      const tableName = setCase(dset.values.table_name);
                      self.emit('process', 'tables', 'iterate', tableName);
                      const o = out[tableName] = {};
                      if (dset.values.schema_name)
                        o.schema = setCase(dset.values.schema_name);
                      if (dset.values.table_comments)
                        o.comments = dset.values.table_comments;
                      more();
                    } else {
                      self.emit('process', 'tables', 'done', counter);
                      dset.close(() => next());
                    }
                  });

                });
          },

          /* Iterate columns */
          function(next) {
            self.emit('process', 'columns', 'query');
            return db.metaData
                .select('table_name', 'column_name', 'data_type', 'data_length',
                    'data_precision', 'data_scale', 'column_comments', 'nullable')
                .from('columns')
                .where(...conditions)
                .execute({cursor: true}, (err, ret) => {
                  if (err)
                    return next(err);
                  const dset = ret.dataset;
                  let counter = 0;
                  dset.next((err, more) => {
                    if (err)
                      return next(err);
                    if (more) {
                      counter++;
                      self.emit('process', 'columns', 'iterate',
                          dset.values.table_name + '.' + dset.values.column_name);
                      const tbl = out[setCase(dset.values.table_name)];
                      if (tbl) {
                        const fields = tbl.fields = tbl.fields || {};
                        const field = fields[setCase(dset.values.column_name)] = {};
                        field.type = dset.values.data_type;
                        if (dset.values.data_length)
                          field.size = dset.values.data_length;
                        if (dset.values.data_precision !== null)
                          field.precision = dset.values.data_precision;
                        if (dset.values.data_scale !== null)
                          field.scale = dset.values.data_scale;
                        if (dset.values.column_comments)
                          field.comments = dset.values.column_comments;
                        if (!dset.values.nullable)
                          field.notNull = 1;
                      }
                      more();
                    } else {
                      self.emit('process', 'columns', 'done', counter);
                      dset.close(() => next());
                    }
                  });
                });
          },

          /* Iterate primary keys */
          function(next) {
            self.emit('process', 'primary keys', 'query');
            return db.metaData
                .select('table_name', 'constraint_name', 'status', 'columns')
                .from('primary_keys')
                .where(...conditions)
                .execute({cursor: true}, (err, ret) => {
                  if (err)
                    return next(err);

                  //self.emit('process', 'tables_listed');
                  const dset = ret.dataset;
                  let counter = 0;
                  dset.next((err, more) => {
                    if (err)
                      return next(err);
                    if (more) {
                      counter++;
                      self.emit('process', 'primary keys', 'iterate', dset.values.table_name);
                      const tbl = out[setCase(dset.values.table_name)];
                      if (tbl)
                        tbl.primaryKey = {
                          constraintName: setCase(dset.values.constraint_name),
                          columns: setCase(dset.values.columns)
                        };
                      more();
                    } else {
                      self.emit('process', 'primary keys', 'done', counter);
                      dset.close(() => next());
                    }
                  });
                });
          },

          /* Iterate foreign keys */
          function(next) {
            self.emit('process', 'foreign keys', 'query');
            return db.metaData
                .select('table_name', 'constraint_name', 'status',
                    'column_name', 'r_schema', 'r_table_name', 'r_columns')
                .from('foreign_keys')
                .where(...conditions)
                .execute({cursor: true}, (err, ret) => {
                  if (err)
                    return next(err);

                  const dset = ret.dataset;
                  let counter = 0;
                  dset.next((err, more) => {
                    if (err)
                      return next(err);
                    if (more) {
                      counter++;
                      self.emit('process', 'foreign keys', 'iterate', dset.values.constraint_name);
                      const tbl = out[setCase(dset.values.table_name)];
                      if (tbl) {
                        const arr = tbl.foreignKeys =
                            (tbl.foreignKeys || []);
                        arr.push({
                          constraintName: setCase(dset.values.constraint_name),
                          column: setCase(dset.values.column_name),
                          remoteSchema: setCase(dset.values.r_schema),
                          remoteTable: setCase(dset.values.r_table_name),
                          remoteColumns: setCase(dset.values.r_columns)
                        });
                      }
                      more();
                    } else {
                      self.emit('process', 'foreign keys', 'done', counter);
                      dset.close(() => next());
                    }
                  });
                });
          }

        ],

        /* Final callback*/
        function(err) {
          if (err)
            self.emit('error', err);
          else
            self.emit('finish', out);
          callback(err, out);
        }
    );
  }

}

module.exports = MetadataExporter;
