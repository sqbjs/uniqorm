/* eslint-disable */
require('./support/env');
const assert = require('assert');
const crypto = require('crypto');
const {createPool, createOrm} = require('./support/helpers');
const {rejects} = require('rejected-or-not');
assert.rejects = assert.rejects || rejects;

describe('Model.prototype.update', function() {

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

  it('should update by key value', function() {
    return Notes.update(1, {contents: 'changed 1'})
        .then(result => {
          assert(result);
          assert(result.executeTime);
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.queriesExecuted, 1);
        });
  });

  it('should update by key value pairs', function() {
    return Notes.update({id: 1}, {contents: 'changed 1'})
        .then(result => {
          assert(result);
          assert(result.executeTime);
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.queriesExecuted, 1);
        });
  });

  it('should return fields', function() {
    const contents = crypto.randomBytes(4).toString('hex');
    return Notes.update(1, {contents}, {
      returning: ['id', 'contents']
    }).then(result => {
      assert(result);
      assert.strictEqual(result.rowsAffected, 1);
      assert.strictEqual(result.queriesExecuted, 1);
      assert(result.instance);
      assert.strictEqual(result.instance.contents, contents);
    });
  });

  it('should return all data fields if requested "*"', function() {
    const contents = crypto.randomBytes(4).toString('hex');
    return Notes.update(1, {contents}, {
      returning: '*', silent: false
    }).then(result => {
      assert.strictEqual(result.rowsAffected, 1);
      assert.strictEqual(result.queriesExecuted, 1);
      assert(result.instance);
      assert.strictEqual(Object.getOwnPropertyNames(result.instance).length, 4);
    });
  });

  it('should return field values if requested as string property', function() {
    const contents = crypto.randomBytes(4).toString('hex');
    return Notes.update(1, {contents}, {
      returning: 'id', silent: false
    }).then(result => {
      assert.strictEqual(result.rowsAffected, 1);
      assert(result.instance);
      assert.strictEqual(Object.getOwnPropertyNames(result.instance).length, 1);
      assert.notStrictEqual(result.instance.id, undefined);
    });
  });

  it('should return O2O associated fields', function() {
    return Cities.update(1000, {name: 'Test City2', countryId: 'ITA'},
        {returning: ['countryName', 'country']})
        .then(result => {
          assert.strictEqual(result.rowsAffected, 1);
          assert(result.instance);
          assert.strictEqual(result.instance.countryName, 'Italy');
          assert.strictEqual(typeof result.instance.country, 'object');
          assert.strictEqual(result.instance.country.name, 'Italy');
        });
  });

  it('should return O2O associated fields', function() {
    return Cities.update(1000, {
      name: 'Test City2', countryId: 'ITA'
    }, {
      returning: ['countryName', 'country']
    }).then(result => {
      assert.strictEqual(result.rowsAffected, 1);
      assert(result.instance);
      assert.strictEqual(result.instance.countryName, 'Italy');
      assert.strictEqual(typeof result.instance.country, 'object');
      assert.strictEqual(result.instance.country.name, 'Italy');
    });
  });

  it('should validate values argument is object', function() {
    return assert.rejects(() => Cities.update(1, [1, 2, 3]),
        /You must provide/);
  });

});
