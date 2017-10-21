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
const Promisify = require('putil-promisify');

/**
 * Expose `MetadataExporter`.
 */
module.exports = MetadataExporter;

/**
 * @param {Object} dbPool
 * @param {Object} options
 * @constructor
 */
function MetadataExporter(dbPool, options) {
  EventEmitter.call(this);
  this.dbPool = dbPool;
  if (options) {
    this.includeSchemas = options.includeSchemas;
    this.includeTables = options.includeTables;
    this.excludeTables = options.excludeTables;
  }
  this.naming = options && options.naming !== undefined ?
      options.naming : dbPool.config.naming;
}

const proto = MetadataExporter.prototype = {};
Object.setPrototypeOf(proto, EventEmitter.prototype);
proto.constructor = MetadataExporter;

proto.execute = function(callback) {
  const self = this;
  if (!callback)
    return Promisify.fromCallback(function(cb) {
      self.execute(cb);
    });

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
          return db.test().then(function() {
            self.emit('process', 'connect', 'connected');
            next();
          });
        },

        /* Iterate tables */
        function(next) {
          self.emit('process', 'tables', 'query');
          const query = db.metaData
              .select('schema_name', 'table_name', 'table_comments')
              .from('tables');
          query.where.apply(query, conditions);
          return query.execute({cursor: true}, function(err, ret) {
            if (err)
              return next(err);
            const dset = ret.dataset;
            var counter = 0;
            dset.next(function(err, more) {
              if (err)
                return next(err);
              if (more) {
                counter++;
                const tableName = setCase(dset.getValue('table_name'));
                self.emit('process', 'tables', 'iterate', tableName);
                const o = out[tableName] = {};
                var v = dset.getValue('schema_name');
                if (v) o.schemaName = v;
                v = dset.getValue('table_comments');
                if (v) o.comments = v;
                more();
              } else {
                self.emit('process', 'tables', 'done', counter);
                dset.close(function() {
                  next();
                });
              }
            });

          });
        },

        /* Iterate columns */
        function(next) {
          self.emit('process', 'columns', 'query');
          const query = db.metaData
              .select('table_name', 'column_name', 'data_type', 'data_length',
                  'data_precision', 'data_scale', 'column_comments', 'nullable')
              .from('columns');
          query.where.apply(query, conditions);
          return query.execute({cursor: true}, function(err, ret) {
            if (err)
              return next(err);
            const dset = ret.dataset;
            var counter = 0;
            dset.next(function(err, more) {
              if (err)
                return next(err);
              if (more) {
                counter++;
                self.emit('process', 'columns', 'iterate',
                    dset.getValue('table_name') + '.' +
                    dset.getValue('column_name'));
                const tbl = out[setCase(dset.getValue('table_name'))];
                if (tbl) {
                  const fields = tbl.fields = tbl.fields || {};
                  const field = fields[setCase(dset.getValue('column_name'))] = {};
                  field.type = dset.getValue('data_type');
                  var v;
                  if ((v = dset.getValue('data_length')))
                    field.size = v;
                  if ((v = dset.getValue('data_precision')))
                    field.precision = v;
                  if ((v = dset.getValue('data_scale') !== null))
                    field.scale = v;
                  if ((v = dset.getValue('column_comments')))
                    field.comments = v;
                  if (!dset.getValue('nullable'))
                    field.notNull = true;
                }
                more();
              } else {
                self.emit('process', 'columns', 'done', counter);
                dset.close(function() {
                  next();
                });
              }
            });
          });
        },

        /* Iterate primary keys */
        function(next) {
          self.emit('process', 'primary keys', 'query');
          const query = db.metaData
              .select('table_name', 'constraint_name', 'enabled', 'columns')
              .from('primary_keys');
          query.where.apply(query, conditions);
          return query.execute({cursor: true}, function(err, ret) {
            if (err)
              return next(err);

            //self.emit('process', 'tables_listed');
            const dset = ret.dataset;
            var counter = 0;
            dset.next(function(err, more) {
              if (err)
                return next(err);
              if (more) {
                counter++;
                self.emit('process', 'primary keys', 'iterate', dset.getValue('table_name'));
                const tbl = out[setCase(dset.getValue('table_name'))];
                if (tbl)
                  tbl.primaryKey = {
                    constraintName: setCase(dset.getValue('constraint_name')),
                    columns: setCase(dset.getValue('columns'))
                  };
                more();
              } else {
                self.emit('process', 'primary keys', 'done', counter);
                dset.close(function() {
                  next();
                });
              }
            });
          });
        },

        /* Iterate foreign keys */
        function(next) {
          self.emit('process', 'foreign keys', 'query');
          const query = db.metaData
              .select('table_name', 'constraint_name', 'enabled',
                  'column_name', 'r_schema', 'r_table_name', 'r_columns')
              .from('foreign_keys');
          query.where.apply(query, conditions);
          return query.execute({cursor: true}, function(err, ret) {
            if (err)
              return next(err);

            const dset = ret.dataset;
            var counter = 0;
            dset.next(function(err, more) {
              if (err)
                return next(err);
              if (more) {
                counter++;
                self.emit('process', 'foreign keys', 'iterate', dset.getValue('constraint_name'));
                const tbl = out[setCase(dset.getValue('table_name'))];
                if (tbl) {
                  const arr = tbl.foreignKeys =
                      (tbl.foreignKeys || []);
                  arr.push({
                    constraintName: setCase(dset.getValue('constraint_name')),
                    column: setCase(dset.getValue('column_name')),
                    remoteSchema: setCase(dset.getValue('r_schema')),
                    remoteTable: setCase(dset.getValue('r_table_name')),
                    remoteColumns: setCase(dset.getValue('r_columns'))
                  });
                }
                more();
              } else {
                self.emit('process', 'foreign keys', 'done', counter);
                dset.close(function() {
                  next();
                });
              }
            });
          });
        }

      ],

      /* Final callback*/
      function(err) {
        if (err) {
          if (self.listenerCount('error'))
            self.emit('error', err);
        } else
          self.emit('finish', out);
        callback(err, out);
      }
  );
};
