/* eslint-disable */
require('./support/env');
const assert = require('assert');
const {createPool, createOrm} = require('./support/helpers');
const {rejects} = require('rejected-or-not');
assert.rejects = assert.rejects || rejects;

describe('Model.prototype.get', function() {

  let pool;
  let orm;
  let Countries;
  let Cities;
  let Streets;
  let Customers;

  before(function() {
    pool = createPool();
    orm = createOrm(pool);
    Countries = orm.getModel('uniqorm_1.Countries');
    Cities = orm.getModel('uniqorm_1.Cities');
    Streets = orm.getModel('uniqorm_1.Streets');
    Customers = orm.getModel('uniqorm_2.Customers');
  });

  after(() => pool.close(true));

  it('should retrieve single instance', function() {
    return Countries.get({id: 'DEU'}).then(resp => {
      assert(resp);
      assert(resp.executeTime);
      assert.strictEqual(typeof resp.instance, 'object');
      assert(!Array.isArray(resp.instance), 'Record is array');
      assert.strictEqual(resp.instance.id, 'DEU');
      assert.strictEqual(resp.instance.phoneCode, 49);
    });
  });

  it('should retrieve with key value', function() {
    return Countries.get('DEU').then(resp => {
      assert.strictEqual(typeof resp, 'object');
      assert(!Array.isArray(resp), 'Record is array');
      assert.strictEqual(resp.instance.id, 'DEU');
      assert.strictEqual(resp.instance.phoneCode, 49);
    });
  });

  it('should throw if no argument given', function() {
    return assert.rejects(() => Countries.get(),
        /You must all provide all key values/);
  });

  it('should throw if not all key values given', function() {
    return Promise.all([
      assert.rejects(() => Countries.get({}),
          /You must provide all key values/),
      assert.rejects(() => Countries.get({id: undefined}),
          /You must provide all key values/)
    ]);

  });

  describe('Finalize', function() {

    it('should have no active connection after all tests', function() {
      assert.strictEqual(pool.acquired, 0);
    });

    it('should shutdown pool', function() {
      return pool.close().then(() => {
        if (!pool.isClosed)
          throw new Error('Failed');
      });
    });

  });

});
