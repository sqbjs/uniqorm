/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
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

  it('should update instance', function() {
    return Notes.update({id: 1, contents: 'changed 1'})
        .then(result => {
          assert(result);
          assert(result.executeTime);
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.queriesExecuted, 1);
        });
  });

  it('should update multiple instances and return fields', function() {
    return Notes.update({contents: 'changed 3'},
        {
          where: sqb.Op.and({'id >': 0}, {'id <': 5}),
          returning: ['id', 'contents']
        })
        .then(result => {
          assert(result);
          assert.strictEqual(result.rowsAffected, 4);
          assert.strictEqual(result.queriesExecuted, 1);
          assert.strictEqual(result.instances.length, 4);
          for (const inst of result.instances) {
            assert.strictEqual(inst.contents, 'changed 3');
          }
        });
  });

  it('should return own fields', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: ['id', 'contents']})
        .then(result => {
          assert(result);
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.queriesExecuted, 1);
          assert.strictEqual(result.instances.length, 1);
          assert.deepStrictEqual(result.instances[0], {
            id: 1,
            contents: 'changed 2'
          });
        });
  });

  it('should return all data fields if requested "*"', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: '*', silent: false})
        .then(result => {
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.queriesExecuted, 1);
          assert.strictEqual(result.instances.length, 1);
          assert.strictEqual(Object.getOwnPropertyNames(result.instances[0]).length, 4);
        });
  });

  it('should return single fields if requested as string property', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: 'id', silent: false})
        .then(result => {
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.instances.length, 1);
          assert.strictEqual(Object.getOwnPropertyNames(result.instances[0]).length, 1);
          assert.notStrictEqual(result.instances[0].id, undefined);
        });
  });

  it('should return O2O associated fields', function() {
    return Cities.update({id: 1000, name: 'Test City2', countryId: 'ITA'},
        {returning: ['countryName', 'country']})
        .then(result => {
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.instances.length, 1);
          assert.strictEqual(result.instances[0].countryName, 'Italy');
          assert.strictEqual(typeof result.instances[0].country, 'object');
          assert.strictEqual(result.instances[0].country.name, 'Italy');
        });
  });

  it('should update using custom conditions', function() {
    return Notes.update({contents: 'changed 5'},
        {returning: '*', where: {'id': 1}})
        .then((result) => {
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.instances.length, 1);
          return Notes.find({sort: 'id'}).then(result => {
            assert.strictEqual(result.instances.length, 6);
            assert.strictEqual(result.instances[0].id, 1);
            assert.strictEqual(result.instances[0].contents, 'changed 5');
            assert.strictEqual(result.instances[1].id, 2);
            assert.strictEqual(result.instances[1].contents, 'changed 3');
          });
        });
  });

  it('should validate values argument is object', function() {
    return assert.rejects(() => Cities.update([1, 2, 3]),
        /You must provide/);
  });

});
