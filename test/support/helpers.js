const fs = require('fs');
const path = require('path');
const sqb = require('sqb');
const waterfall = require('putil-waterfall');
const glob = require('glob');
require('./env');
const Uniqorm = require('../..');

module.exports = {

  createOrm: function(pool) {
    const orm = new Uniqorm(pool);
    const dir = path.join(__dirname, 'models');
    const files = fs.readdirSync(dir);
    const uniqFiles = [];
    for (const f of files) {
      const fn = path.basename(f, path.extname(f));
      if (!uniqFiles.includes(fn))
        uniqFiles.push(fn);
    }
    for (const f of uniqFiles) {
      const j = require(path.join(dir, f));
      orm.define(j);
    }
    orm.prepare();
    return orm;
  },

  createPool: function() {
    const f = path.join(__dirname, 'db_config.json');
    const config = fs.existsSync(f) ? require(f) : {};
    config.dialect = 'pg';
    config.user = process.env.DB_USER || config.user;
    config.password = process.env.DB_PASS || config.password;
    config.host = process.env.DB_HOST || config.host;
    config.database = process.env.DB || config.database;
    config.user = process.env.DB_USER || config.user;
    config.schema = 'sqb_test';
    config.defaults = {
      naming: 'lowercase'
    };
    process.env.SKIP_CREATE_TABLES = process.env.SKIP_CREATE_TABLES ||
        config.skip_create_tables;
    return sqb.pool(config);
  },

  /**
   *
   * @param {Object} client
   * @param {Object} options
   * @param {Array<String>|String} options.structureScript
   * @param {Array<String>|String} options.dataFiles
   * @return {Promise}
   */
  createDatabase: function(client, options) {

    return waterfall([

          /* Create database structure */
          () => {
            const structureScript = Array.isArray(options.structureScript) ?
                options.structureScript : [options.structureScript];
            return waterfall.every(structureScript, (next, f) => {
              const sql = fs.readFileSync(path.join(__dirname, f), 'utf8');
              client.query(sql, (err) => next(err));
            });
          },

          /* Create tables */
          () => {
            const dataFiles = Array.isArray(options.dataFiles) ?
                options.dataFiles : [options.dataFiles];
            return waterfall.every(dataFiles, (next, dir) => {
              dir = path.join(__dirname, dir);
              const files = glob.sync(dir, {cwd: '/', root: '/', realpath: true});

              /* Iterate every table */
              return waterfall.every(files, (next, fileName) => {
                const table = require(fileName);
                /* Insert rows */
                const fieldKeys = Object.keys(table.rows[0]);
                let s1 = '';
                let s2 = '';
                for (const [i, f] of fieldKeys.entries()) {
                  s1 += (i ? ',' : '') + f.toLowerCase();
                  s2 += (i ? ',$' : '$') + (i + 1);
                }
                const insertSql = 'insert into ' + table.name +
                    ' (' + s1 + ') values (' + s2 + ')';
                return waterfall.every(table.rows, (next, row) => {
                  const params = [];
                  for (const key of fieldKeys) {
                    params.push(row[key] == null ? null : row[key]);
                  }
                  client.query({
                    text: insertSql,
                    values: params
                  }, (err) => {
                    if (err)
                      return next(err);
                    next();
                  });
                });
              });

            });

          }
        ]
    );
  }

};
