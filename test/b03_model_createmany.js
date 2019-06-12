/* eslint-disable */
require('./support/env');
const assert = require('assert');
const {createPool, createOrm} = require('./support/helpers');
const {rejects} = require('rejected-or-not');
assert.rejects = assert.rejects || rejects;

describe('Model.prototype.createMany', function() {

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

  it('should create many record', function() {
    return Countries.createMany([
      {id: 'IND', name: 'India', phoneCode: 91},
      {id: 'MEX', name: 'Mexico', phoneCode: 52}
    ])
        .then(result => {
          assert(result);
          assert(result.executeTime);
          assert.strictEqual(result.rowsAffected, 2);
          assert.strictEqual(result.queriesExecuted, 2);
        });
  });

  it('should validate values argument is an array', function() {
    return assert.rejects(() => Cities.createMany({}),
        /You must provide/);
  });

});
