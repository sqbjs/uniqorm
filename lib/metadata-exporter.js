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

  constructor(dbPool, includeSchema, includeTables, excludeTables) {
    super();
    this.dbPool = dbPool;
    this.includeSchema = includeSchema;
    this.includeTables = includeTables;
    this.excludeTables = excludeTables;
  }

  execute(callback) {
    if (!callback)
      return Promisify.fromCallback((cb)=>this.execute(cb));

    const self = this;
    let connection;
    let tables;
    const out = {};
    const conditions = [];
    if (this.includeSchema)
      conditions.push(['schema_name', 'like', self.includeSchema]);
    if (this.includeTables)
      conditions.push(['table_name', 'like', this.includeTables]);
    if (this.excludeTables)
      conditions.push(['table_name', '!like', this.excludeTables]);
    callback = callback || function() {
        };

    waterfall([
          /* Get connection from db pool */
          function(next) {
            self.emit('process', 'connect', 'connecting');
            return self.dbPool.connect().then(conn => {
              self.emit('process', 'connect', 'connected');
              connection = conn;
              next();
            });
          },

          /* Iterate tables */
          function(next) {
            let counter = 0;
            self.emit('process', 'tables', 'query');
            return connection.meta()
                .select()
                .tables('schema_name', 'table_name', 'table_comments')
                .where(...conditions)
                .execute({
                  resultSet: {
                    autoClose: true
                  }
                }, (err, ret) => {
                  if (err)
                    next(err);
                  else {
                    tables = ret.resultSet;
                    tables.next(100, (err, rows, more) => {
                      if (err)
                        next(err);
                      else if (rows) {
                        counter += rows.length;
                        for (const row of rows) {
                          const tableName = row.TABLE_NAME;
                          self.emit('process', 'tables', 'iterate', tableName);
                          const o = out[tableName] = {};
                          if (row.SCHEMA_NAME)
                            o.schema = row.SCHEMA_NAME;
                          if (row.TABLE_COMMENTS)
                            o.comments = row.TABLE_COMMENTS;
                        }
                        more();
                      } else {
                        self.emit('process', 'tables', 'done', counter);
                        next();
                      }
                    });
                  }
                });
          },

          /* Iterate columns */
          function(next) {
            let counter = 0;
            self.emit('process', 'columns', 'query');
            return connection.meta()
                .select()
                .columns()
                .where(...conditions)
                .execute({
                  resultSet: {
                    autoClose: true
                  }
                }, (err, ret) => {
                  if (err)
                    next(err);
                  else {
                    tables = ret.resultSet;
                    tables.next(100, (err, rows, more) => {
                      if (err)
                        next(err);
                      else if (rows) {
                        counter += rows.length;
                        for (const row of rows) {
                          self.emit('process', 'columns', 'iterate', row.TABLE_NAME +
                              '.' + row.COLUMN_NAME);
                          const tbl = out[row.TABLE_NAME];
                          if (tbl) {
                            const fields = tbl.fields = tbl.fields || {};
                            const field = fields[row.COLUMN_NAME] = {};
                            field.type = row.DATA_TYPE;
                            if (row.DATA_LENGTH)
                              field.size = row.DATA_LENGTH;
                            if (row.DATA_PRECISION !== null)
                              field.precision = row.DATA_PRECISION;
                            if (row.DATA_SCALE)
                              field.scale = row.DATA_SCALE;
                            if (row.COLUMN_COMMETS)
                              field.comments = row.COLUMN_COMMETS;
                            if (!row.NULLABLE)
                              field.notNull = 1;
                          }
                        }
                        more();
                      } else {
                        self.emit('process', 'columns', 'done', counter);
                        next();
                      }
                    });
                  }
                });
          },

          /* Iterate primary keys */
          function(next) {
            let counter = 0;
            self.emit('process', 'primary keys', 'query');
            return connection.meta()
                .select()
                .primaryKeys('table_name', 'constraint_name', 'status', 'columns')
                .where(...conditions)
                .execute({
                  resultSet: {
                    autoClose: true
                  }
                }, (err, ret) => {
                  if (err)
                    next(err);
                  else {
                    //self.emit('process', 'tables_listed');
                    tables = ret.resultSet;
                    tables.next(100, (err, rows, more) => {
                      if (err)
                        next(err);
                      else if (rows) {
                        counter += rows.length;
                        for (const row of rows) {
                          self.emit('process', 'primary keys', 'iterate', row.CONSTRAINT_NAME);
                          const tbl = out[row.TABLE_NAME];
                          if (tbl)
                            tbl.primaryKey = {
                              constraintName: row.CONSTRAINT_NAME,
                              columns: row.COLUMNS
                            };
                        }
                        more();
                      } else {
                        self.emit('process', 'primary keys', 'done', counter);
                        next();
                      }
                    });
                  }
                });
          },

          /* Iterate foreign keys */
          function(next) {
            let counter = 0;
            self.emit('process', 'foreign keys', 'query');
            return connection.meta()
                .select()
                .foreignKeys('table_name', 'constraint_name', 'status',
                    'column_name', 'r_schema', 'r_table_name', 'r_columns')
                .where(...conditions)
                .execute({
                  resultSet: {
                    autoClose: true
                  }
                }, (err, ret) => {
                  if (err)
                    next(err);
                  else {
                    //self.emit('process', 'tables_listed');
                    tables = ret.resultSet;
                    tables.next(100, (err, rows, more) => {
                      if (err)
                        next(err);
                      else if (rows) {
                        counter += rows.length;
                        for (const row of rows) {
                          self.emit('process', 'foreign keys', 'iterate', row.CONSTRAINT_NAME);
                          const tbl = out[row.TABLE_NAME];
                          if (tbl) {
                            const arr = tbl.foreignKeys =
                                (tbl.foreignKeys || []);
                            arr.push({
                              constraintName: row.CONSTRAINT_NAME,
                              column: row.COLUMN_NAME,
                              remoteSchema: row.R_SCHEMA,
                              remoteTable: row.R_TABLE_NAME,
                              remoteColumns: row.R_COLUMNS
                            });
                          }
                        }
                        more();
                      } else {
                        self.emit('process', 'foreign keys', 'done', counter);
                        next();
                      }
                    });
                  }
                });
          }

        ],

        /* Final callback*/
        function(err) {
          if (connection) {
            connection.close();
            connection = undefined;
          }
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
