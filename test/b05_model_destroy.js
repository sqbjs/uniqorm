/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../lib/index');
const loadModels = require('./support/loadModels');

describe('Model.prototype.destroy', function() {

  let pool;
  let orm;
  let Countries;
  let Cities;
  let Streets;
  let Customers;
  let Notes;

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
    loadModels(orm);
    orm.prepare();
    Countries = orm.getModel('uniqorm_1.Countries');
    Cities = orm.getModel('uniqorm_1.Cities');
    Streets = orm.getModel('uniqorm_1.Streets');
    Customers = orm.getModel('uniqorm_2.Customers');
    Notes = orm.getModel('uniqorm_2.Notes');
  });

  after(() => pool.close(true));

  function getRecordCount(table) {
    return pool.select(sqb.raw('count(*)'))
        .from(table)
        .execute({objectRows: false})
        .then(resp => resp.rows[0][0]);
  }

  it('should destroy record with key value', function() {
    return getRecordCount('uniqorm_1.cities').then(count => {
      return Cities.destroy(1000)
          .then(result => {
            assert.equal(result, true);
            return Cities.get(1000).then(rows => {
              if (rows)
                assert(0, 'Failed');
              return getRecordCount('uniqorm_1.cities')
                  .then(c => assert.equal(c, count - 1));
            });
          });
    });

  });

  it('should destroy record with custom conditions', function() {
    return getRecordCount('uniqorm_2.notes').then(count => {
      return Notes.destroy({id: 1})
          .then(result => {
            assert.equal(result, true);
            return Notes.get(1).then(rows => {
              if (rows)
                assert(0, 'Failed');
              return getRecordCount('uniqorm_2.notes')
                  .then(c => assert.equal(c, count - 1));
            });
          });
    });
  });

});
