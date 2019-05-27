/* eslint-disable */
require('./support/env');
const assert = require('assert');
const {createPool, createOrm} = require('./support/helpers');
const {rejects} = require('rejected-or-not');
assert.rejects = assert.rejects || rejects;

describe('Model.prototype.create', function() {

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

  it('should create record', function() {
    return Countries.create({id: 'ITA', name: 'Italy', phoneCode: 39})
        .then(result => {
          assert(result);
          assert(result.executeTime);
          assert.strictEqual(result.rowsAffected, 1);
        });
  });

  it('should return own fields', function() {
    return Notes.create({
          source: 'customers',
          sourceKey: 2,
          contents: 'any content'
        },
        {returning: ['id', 'sourceKey'], ignoreUnknownProperties: false})
        .then(result => {
          assert(result);
          assert.strictEqual(result.rowsAffected, 1);
          assert(result.instance);
          assert.notStrictEqual(result.instance.id, undefined);
          assert.strictEqual(result.instance.sourceKey, 2);
        });
  });

  it('should return all data fields if requested "*"', function() {
    return Notes.create({
          source: 'customers',
          sourceKey: 2,
          contents: 'any content'
        },
        {returning: '*', ignoreUnknownProperties: false})
        .then(result => {
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(Object.getOwnPropertyNames(result.instance).length, 4);
        });
  });

  it('should return single fields if requested as string property', function() {
    return Notes.create({
          source: 'customers',
          sourceKey: 2,
          contents: 'any content'
        },
        {returning: 'id', ignoreUnknownProperties: false})
        .then(result => {
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(Object.getOwnPropertyNames(result.instance).length, 1);
          assert.notStrictEqual(result.instance.id, undefined);
        });
  });

  it('should return O2O associated fields', function() {
    return Cities.create({id: 1000, name: 'Test City', countryId: 'TUR'},
        {returning: ['countryName', 'country']})
        .then(result => {
          assert.strictEqual(result.rowsAffected, 1);
          assert.strictEqual(result.instance.countryName, 'Turkey');
          assert.strictEqual(typeof result.instance.country, 'object');
          assert.strictEqual(result.instance.country.name, 'Turkey');
        });
  });

  it('should validate values argument is object', function() {
    return assert.rejects(() => Cities.create([1, 2, 3]),
        /You must provide/);
  });

  it('should validate required fields', function() {
    return assert.rejects(() => Notes.create({}),
        /Value required for "source"/);
  });

  it('should validate max chars', function() {
    return assert.rejects(() => Notes.create({
          source: '123456789012345678901'
        }),
        /Value too large for field/);
  });
});
