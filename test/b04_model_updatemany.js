/* eslint-disable */
require('./support/env');
const assert = require('assert');
const crypto = require('crypto');
const {createPool, createOrm} = require('./support/helpers');
const {rejects} = require('rejected-or-not');
assert.rejects = assert.rejects || rejects;

describe('Model.prototype.updateMany', function() {

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

  it('should update records', function() {
    const contents = crypto.randomBytes(4).toString('hex');
    return Notes.updateMany({contents}, {
      where: {id: 1}
    }).then(result => {
      assert(result);
      assert(result.executeTime);
      assert.strictEqual(result.rowsAffected, 1);
      assert.strictEqual(result.queriesExecuted, 1);
    });
  });

  it('should return fields', function() {
    const contents = crypto.randomBytes(4).toString('hex');
    return Notes.updateMany({contents}, {
      where: {'id >': 0, 'id <': 5},
      returning: ['id', 'contents']
    }).then(result => {
      assert(result);
      assert.strictEqual(result.rowsAffected, 4);
      assert.strictEqual(result.queriesExecuted, 1);
      assert.strictEqual(result.instances.length, 4);
      for (const inst of result.instances) {
        assert.strictEqual(inst.contents, contents);
      }
    });
  });

  it('should return all data fields if requested "*"', function() {
    const contents = crypto.randomBytes(4).toString('hex');
    return Notes.updateMany({contents}, {
      where: {id: 1},
      returning: '*', ignoreUnknownProperties: false
    }).then(result => {
      assert.strictEqual(result.rowsAffected, 1);
      assert.strictEqual(result.queriesExecuted, 1);
      assert.strictEqual(result.instances.length, 1);
      assert.strictEqual(Object.getOwnPropertyNames(result.instances[0]).length, 4);
    });
  });

  it('should return field values if requested as string property', function() {
    const contents = crypto.randomBytes(4).toString('hex');
    return Notes.updateMany({contents}, {
      where: {id: 1},
      returning: 'id', ignoreUnknownProperties: false
    }).then(result => {
      assert.strictEqual(result.rowsAffected, 1);
      assert.strictEqual(result.instances.length, 1);
      assert.strictEqual(Object.getOwnPropertyNames(result.instances[0]).length, 1);
      assert.notStrictEqual(result.instances[0].id, undefined);
    });
  });

  it('should return O2O associated fields', function() {
    return Cities.updateMany({
      name: 'Test City2', countryId: 'ITA'
    }, {
      where: {id: 1000},
      returning: ['countryName', 'country']
    }).then(result => {
      assert.strictEqual(result.rowsAffected, 1);
      assert.strictEqual(result.instances.length, 1);
      assert.strictEqual(result.instances[0].countryName, 'Italy');
      assert.strictEqual(typeof result.instances[0].country, 'object');
      assert.strictEqual(result.instances[0].country.name, 'Italy');
    });
  });

  it('should validate values argument is object', function() {
    return assert.rejects(() => Cities.updateMany([1, 2, 3]),
        /You must provide/);
  });

});
