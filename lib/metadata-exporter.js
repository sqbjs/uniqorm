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
    let connection;
    const out = {};
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
                .execute({resultSet: true}, (err, ret) => {
                  if (err)
                    next(err);
                  else {
                    const rs = ret.resultSet;
                    rs.next(100, (err, rows, more) => {
                      if (err)
                        return next(err);
                      if (rows) {
                        counter += rows.length;
                        for (const row of rows) {
                          const tableName = setCase(row[1]);
                          self.emit('process', 'tables', 'iterate', tableName);
                          const o = out[tableName] = {};
                          if (row[0]) o.schema = setCase(row[0]);
                          if (row[2]) o.comments = row[2];
                        }
                        more();
                      } else {
                        self.emit('process', 'tables', 'done', counter);
                        rs.close(() => next());
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
                .columns('table_name', 'column_name', 'data_type', 'data_length',
                    'data_precision', 'data_scale', 'column_comments', 'nullable')
                .where(...conditions)
                .execute({resultSet: true}, (err, ret) => {
                  if (err)
                    return next(err);
                  const rs = ret.resultSet;
                  rs.next(100, (err, rows, more) => {
                    if (err)
                      return next(err);
                    if (rows) {
                      counter += rows.length;
                      for (const row of rows) {
                        self.emit('process', 'columns', 'iterate', row[0] +
                            '.' + row.COLUMN_NAME);
                        const tbl = out[setCase(row[0])];
                        if (tbl) {
                          const fields = tbl.fields = tbl.fields || {};
                          const field = fields[setCase(row[1])] = {};
                          field.type = row[2];
                          if (row[3])
                            field.size = row[3];
                          if (row[4] !== null)
                            field.precision = row[4];
                          if (row[5])
                            field.scale = row[5];
                          if (row[6])
                            field.comments = row[6];
                          if (!row[7])
                            field.notNull = 1;
                        }
                      }
                      more();
                    } else {
                      self.emit('process', 'columns', 'done', counter);
                      rs.close(() => next());
                    }
                  });
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
                .execute({resultSet: true}, (err, ret) => {
                  if (err)
                    return next(err);

                  //self.emit('process', 'tables_listed');
                  const rs = ret.resultSet;
                  rs.next(100, (err, rows, more) => {
                    if (err)
                      return next(err);
                    if (rows) {
                      counter += rows.length;
                      for (const row of rows) {
                        self.emit('process', 'primary keys', 'iterate', row[1]);
                        const tbl = out[setCase(row[0])];
                        if (tbl)
                          tbl.primaryKey = {
                            constraintName: setCase(row[1]),
                            columns: setCase(row[3])
                          };
                      }
                      more();
                    } else {
                      self.emit('process', 'primary keys', 'done', counter);
                      rs.close(() => next());
                    }
                  });
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
                .execute({resultSet: true}, (err, ret) => {
                  if (err)
                    return next(err);

                  //self.emit('process', 'tables_listed');
                  const rs = ret.resultSet;
                  rs.next(100, (err, rows, more) => {
                    if (err)
                      return next(err);
                    if (rows) {
                      counter += rows.length;
                      for (const row of rows) {
                        self.emit('process', 'foreign keys', 'iterate', row[1]);
                        const tbl = out[setCase(row[0])];
                        if (tbl) {
                          const arr = tbl.foreignKeys =
                              (tbl.foreignKeys || []);
                          arr.push({
                            constraintName: setCase(row[1]),
                            column: setCase(row[3]),
                            remoteSchema: setCase(row[4]),
                            remoteTable: setCase(row[5]),
                            remoteColumns: setCase(row[6])
                          });
                        }
                      }
                      more();
                    } else {
                      self.emit('process', 'foreign keys', 'done', counter);
                      rs.close(() => next());
                    }
                  });
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
