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
      options.naming : dbPool.defaults.naming;
}

Object.setPrototypeOf(MetadataExporter.prototype, EventEmitter.prototype);

MetadataExporter.prototype.execute = function(callback) {
  const self = this;
  if (!callback)
    return Promisify.fromCallback(function(cb) {
      self.execute(cb);
    });

  const out = {};
  const pool = self.dbPool;
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
          return pool.test().then(function() {
            self.emit('process', 'connect', 'connected');
            next();
          });
        },

        /* Iterate tables */
        function(next) {
          self.emit('process', 'tables', 'query');
          const query = pool.metaData()
              .select('schema_name', 'table_name', 'table_comments')
              .from('tables');
          query.where.apply(query, conditions);
          return query.then(function(ret) {
            const rowset = ret.rowset;
            while (rowset.next()) {
              const tableName = setCase(rowset.get('table_name'));
              self.emit('process', 'tables', 'iterate', tableName);
              const o = out[tableName] = {};
              var v = rowset.get('schema_name');
              if (v) o.owner = v;
              v = rowset.get('table_comments');
              if (v) o.comments = v;
            }
            self.emit('process', 'tables', 'done', rowset.length);
            next();
          });
        },

        /* Iterate columns */
        function(next) {
          self.emit('process', 'columns', 'query');
          const query = pool.metaData()
              .select('table_name', 'column_name', 'data_type', 'data_type_org',
                  'data_length', 'data_precision', 'data_scale',
                  'column_comments', 'nullable')
              .from('columns');
          query.where.apply(query, conditions);
          return query.then(function(ret) {
            const rowset = ret.rowset;
            while (rowset.next()) {
              self.emit('process', 'columns', 'iterate',
                  rowset.get('table_name') + '.' +
                  rowset.get('column_name'));
              const tbl = out[setCase(rowset.get('table_name'))];
              if (tbl) {
                const fields = tbl.fields = tbl.fields || {};
                const field = fields[setCase(rowset.get('column_name'))] = {};
                field.type = rowset.get('data_type');
                field.dbType = rowset.get('data_type_org');
                var v;
                if ((v = rowset.get('data_length')) !== null)
                  field.size = v;
                if ((v = rowset.get('data_precision')) !== null)
                  field.precision = v;
                if ((v = rowset.get('data_scale')) !== null)
                  field.scale = v;
                if ((v = rowset.get('column_comments')))
                  field.comments = v;
                if (!rowset.get('nullable'))
                  field.notNull = true;
              }
            }
            self.emit('process', 'columns', 'done', rowset.length);
            next();
          });
        },

        /* Iterate primary keys */
        function(next) {
          self.emit('process', 'primary keys', 'query');
          const query = pool.metaData()
              .select('table_name', 'constraint_name', 'enabled', 'columns')
              .from('primary_keys');
          query.where.apply(query, conditions);
          return query.then(function(ret) {
            const rowset = ret.rowset;
            while (rowset.next()) {
              self.emit('process', 'primary keys', 'iterate', rowset.get('table_name'));
              const tbl = out[setCase(rowset.get('table_name'))];
              if (tbl)
                tbl.primaryKey = {
                  constraintName: setCase(rowset.get('constraint_name')),
                  columns: setCase(rowset.get('columns'))
                };
            }
            self.emit('process', 'primary keys', 'done', rowset.length);
            next();
          });
        },

        /* Iterate foreign keys */
        function(next) {
          self.emit('process', 'foreign keys', 'query');
          const query = pool.metaData()
              .select('table_name', 'constraint_name', 'enabled',
                  'column_name', 'r_schema', 'r_table_name', 'r_columns')
              .from('foreign_keys');
          query.where.apply(query, conditions);
          return query.then(function(ret) {
            const rowset = ret.rowset;
            while (rowset.next()) {
              self.emit('process', 'foreign keys', 'iterate', rowset.get('constraint_name'));
              const tbl = out[setCase(rowset.getValue('table_name'))];
              if (tbl) {
                const arr = tbl.foreignKeys =
                    (tbl.foreignKeys || []);
                arr.push({
                  constraintName: setCase(rowset.get('constraint_name')),
                  column: setCase(rowset.get('column_name')),
                  remoteSchema: setCase(rowset.get('r_schema')),
                  remoteTable: setCase(rowset.get('r_table_name')),
                  remoteColumns: setCase(rowset.get('r_columns'))
                });
              }
            }
            self.emit('process', 'foreign keys', 'done', rowset.length);
            next();
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
