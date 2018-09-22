/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../lib/index');
const waterfall = require('putil-waterfall');

describe('MetadataImporter', function() {

  let pool;
  let orm;

  before(function() {
    pool = sqb.pool({
      dialect: 'pg',
      user: (process.env.DB_USER || 'postgres'),
      password: (process.env.DB_PASS || ''),
      host: (process.env.DB_HOST || 'localhost'),
      database: (process.env.DB || 'test'),
      schema: 'sqb_test',
      defaults: {
        naming: 'lowercase'
      }
    });
    orm = new Uniqorm(pool);
  });

  after(() => pool.close(true));

  it('should list schema names', function() {
    const importer = new Uniqorm.MetadataImporter(pool);
    return importer.listSchemas().then(schemas => {
      assert(schemas);
      assert.notEqual(schemas.length, 0);
      assert.notEqual(schemas.indexOf('uniqorm_1'), 0);
    });
  });

  it('should import schema', function() {
    const importer = new Uniqorm.MetadataImporter(pool);
    return waterfall.every(['uniqorm_1', 'uniqorm_2'], (next, s) => {
      return importer.importSchema(s, {capitalize: 1}).then(result => {
        assert.equal(typeof result, 'object');
        for (const key of Object.keys(result)) {
          const o = result[key];
          const j = require('./support/models/' + o.name + '.json');
          assert.deepEqual(o, j);
        }
      });
    });
  });

  it('should provide schame name argument if dialect supports', function(done) {
    const importer = new Uniqorm.MetadataImporter(pool);
    importer.importSchema().then(() => assert(0, 'Failed'))
        .catch(e => {
          if (e.message.includes('You must provide schema name'))
            return done();
          done(e);
        });
  });

  it('should import manipulate model names with nameModifier()', function() {
    const importer = new Uniqorm.MetadataImporter(pool);
    return importer.importSchema('uniqorm_1', {
      nameModifier: (modelName, schemaName, tableName) => {
        return schemaName+'_'+tableName;
      }
    }).then(result => {
      assert.equal(typeof result, 'object');
      for (const key of Object.keys(result)) {
        const o = result[key];
        assert.equal(o.name, o.schema+'_'+o.tableName);
      }
    });
  });

});
