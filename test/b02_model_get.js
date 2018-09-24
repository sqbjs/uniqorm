/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../lib/index');
const loadModels = require('./support/loadModels');

describe('Model.prototype.get', function() {

  let pool;
  let orm;
  let Countries;
  let Cities;
  let Streets;
  let Customers;

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

  it('load models', function() {
    loadModels(orm);
    orm.prepare();
    Countries = orm.get('uniqorm_1.Countries');
    Cities = orm.get('uniqorm_1.Cities');
    Streets = orm.get('uniqorm_1.Streets');
    Customers = orm.get('uniqorm_2.Customers');
  });

  it('should get() retrieve single instance', function() {
    return Countries.get({id: 'DEU'}).then(rec => {
      assert.equal(typeof rec, 'object');
      assert(!Array.isArray(rec), 'Record is array');
      assert.equal(rec.id, 'DEU');
      assert.equal(rec.phoneCode, 49);
    });
  });

  it('should get() check key values on get()', function(done) {
    Countries.get().then(() => done('Failed')).catch(() => done());
  });

  describe('Finalize', function() {

    it('should have no active connection after all tests', function() {
      assert.equal(pool.acquired, 0);
    });

    it('should shutdown pool', function() {
      return pool.close().then(() => {
        if (!pool.isClosed)
          throw new Error('Failed');
      });
    });

  });

});
