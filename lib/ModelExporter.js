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
const sqb = require('sqb');

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
}

Object.setPrototypeOf(MetadataExporter.prototype, EventEmitter.prototype);

MetadataExporter.prototype.execute = function(pool, options, callback) {
  const self = this;
  if (!callback)
    return Promisify.fromCallback(function(cb) {
      self.execute(pool, options, cb);
    });

  const Op = sqb.Op;
  const out = {};
  var filter;
  if (options && options.filter) {
    filter = [];
    var a = options.filter.split(/\|/g);
    a.forEach(function(v) {
      const b = v.split(/\./);
      if (b.length > 1) {
        const c = [];
        if (b[0] && b[0] !== '*')
          c.push(Op.like('schema_name', b[0].replace(/\*/g, '%')));
        if (b[1] && b[1] !== '*')
          c.push(Op.like('table_name', b[1].replace(/\*/g, '%')));
        filter.push(Op.and.apply(null, c));
      } else if (v && v !== '*')
        filter.push(Op.like('table_name', v.replace(/\*/g, '%')));
    });
    filter = filter && filter.length ? Op.or.apply(null, filter) : null;
  }

  const getTbl = function(schemaName, tableName) {
    const n = schemaName ? schemaName + '.' + tableName : tableName;
    const tbl = out[n] = out[n] || {};
    if (schemaName && !tbl.schemaName)
      tbl.schemaName = schemaName;
    if (!tbl.tableName)
      tbl.tableName = tableName;
    return out[n] = out[n] || {};
  };
  var v;
  var offset;
  const metaData = new sqb.DBMeta(pool);

  waterfall([

        /* Test pool */
        function(next) {
          return pool.test(next);
        },

        /* Iterate tables */
        function(next) {
          offset = 0;
          const query = metaData
              .select('schema_name', 'table_name', 'table_comments')
              .from('tables')
              .orderBy('schema_name', 'table_name')
              .limit(1000);
          if (filter)
            query.where(filter);
          // Not all drivers supports cursors. This is why we fetch rows by pages
          const nextPage = function() {
            query.offset(offset);
            query.execute({
              objectRows: true,
              fetchRows: 0,
              naming: 'lowercase'
            }, function(err, ret) {
              if (err || !ret.rows.length)
                return next(err);
              ret.rows.forEach(function(col) {
                const tbl = getTbl(col.schema_name, col.table_name);
                v = col.table_comments;
                if (v)
                  tbl.comments = v;
              });
              offset += ret.rows.length;
              nextPage();
            });
          };
          nextPage();
        },

        /* Iterate columns */
        function(next) {
          offset = 0;
          const query = metaData
              .select()
              .from('columns')
              .limit(1000);
          if (filter)
            query.where(filter);
          const nextPage = function() {
            query.offset(offset);
            query.execute({
              objectRows: true,
              fetchRows: 0,
              naming: 'lowercase'
            }, function(err, ret) {
              if (err || !ret.rows.length)
                return next(err);
              ret.rows.forEach(function(row) {
                const tbl = getTbl(row.schema_name, row.table_name);
                tbl.fields = tbl.fields || {};
                const col = tbl.fields[row.column_name] = {
                  dataType: row.data_type_mean
                };
                if (row.not_null)
                  col.notNull = true;
                if (row.char_length)
                  col.charLength = row.char_length;
                if (row.data_precision && col.dataType === 'NUMBER')
                  col.precision = row.data_precision;
                if (row.data_scale)
                  col.scale = row.data_scale;
                if (row.default_value)
                  col.defaultValue = row.default_value;
              });
              offset += ret.rows.length;
              nextPage();
            });
          };
          nextPage();
        },

        /* Iterate primary keys */
        function(next) {
          offset = 0;
          const query = metaData
              .select()
              .from('primary_keys')
              .limit(1000);
          if (filter)
            query.where(filter);
          const nextPage = function() {
            query.offset(offset);
            query.execute({
              objectRows: true,
              fetchRows: 0,
              naming: 'lowercase'
            }, function(err, ret) {
              if (err || !ret.rows.length)
                return next(err);
              ret.rows.forEach(function(col) {
                const tbl = getTbl(col.schema_name, col.table_name);
                tbl.primaryKey = col.column_names;
              });
              offset += ret.rows.length;
              nextPage();
            });
          };
          nextPage();
        },

        /* Iterate foreign keys */
        function(next) {
          offset = 0;
          const query = metaData
              .select()
              .from('foreign_keys')
              .limit(1000);
          if (filter)
            query.where(filter);
          const nextPage = function() {
            query.offset(offset);
            query.execute({
              objectRows: true,
              fetchRows: 0,
              naming: 'lowercase'
            }, function(err, ret) {
              if (err || !ret.rows.length)
                return next(err);
              ret.rows.forEach(function(col) {
                const tbl = getTbl(col.schema_name, col.table_name);
                const arr = tbl.foreignKeys = (tbl.foreignKeys || []);
                col = Object.assign({}, col);
                arr.push({
                  model: ((col.foreign_schema ? col.foreign_schema + '.' : '') +
                      col.foreign_table_name),
                  from: col.column_name,
                  to: col.foreign_column_name
                });
              });
              offset += ret.rows.length;
              nextPage();
            });
          };
          nextPage();
        }
      ],

      /* Final callback*/
      function(err) {
        callback(err, out);
      }
  );
};
