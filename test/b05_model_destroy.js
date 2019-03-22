/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const {createPool, createOrm} = require('./support/helpers');

describe('Model.prototype.destroy', function() {

  let pool;
  let orm;
  let Countries;
  let Cities;
  let Streets;
  let Customers;
  let Notes;

  before(function() {
    pool = createPool();
    orm = createOrm(pool);
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
        .then(resp => Number(resp.rows[0][0]));
  }

  it('should destroy record with key value', function() {
    return getRecordCount('uniqorm_1.cities').then(count => {
      return Cities.destroy(1000)
          .then(result => {
            assert.strictEqual(result.queriesExecuted, 1);
            assert.strictEqual(result.rowsAffected, 1);
            return Cities.get(1000).then(result => {
              assert(!result.instance);
              return getRecordCount('uniqorm_1.cities')
                  .then(c => assert.strictEqual(c, count - 1));
            });
          });
    });

  });

  it('should destroy records with custom conditions', function() {
    return getRecordCount('uniqorm_2.notes').then(count => {
      return Notes.destroyMany({where: {'id in': [1, 2]}})
          .then(result => {
            assert.strictEqual(result.queriesExecuted, 1);
            assert.strictEqual(result.rowsAffected, 2);
            return Notes.get(1).then(result => {
              assert(!result.instance);
              return getRecordCount('uniqorm_2.notes')
                  .then(c => assert.strictEqual(c, count - 2));
            });
          });
    });
  });

});
