/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../lib/index');
const loadModels = require('./support/loadModels');
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

  it('should create record', function() {
    return Countries.create({id: 'ITA', name: 'Italy', phoneCode: 39})
        .then(result => {
          assert.strictEqual(result, true);
        });
  });

  it('should return own fields', function() {
    return Notes.create({
          source: 'customers',
          sourceKey: 2,
          contents: 'any content'
        },
        {returning: ['id', 'sourceKey'], silent: false})
        .then(result => {
          assert.notStrictEqual(result.id, undefined);
          assert.strictEqual(result.sourceKey, 2);
        });
  });

  it('should return all data fields if requested "*"', function() {
    return Notes.create({
          source: 'customers',
          sourceKey: 2,
          contents: 'any content'
        },
        {returning: '*', silent: false})
        .then(result => {
          assert.strictEqual(Object.getOwnPropertyNames(result).length, 4);
        });
  });

  it('should return single fields if requested as string property', function() {
    return Notes.create({
          source: 'customers',
          sourceKey: 2,
          contents: 'any content'
        },
        {returning: 'id', silent: false})
        .then(result => {
          assert.strictEqual(Object.getOwnPropertyNames(result).length, 1);
          assert.notStrictEqual(result.id, undefined);
        });
  });

  it('should return O2O associated fields', function() {
    return Cities.create({id: 1000, name: 'Test City', countryId: 'TUR'},
        {returning: ['countryName', 'country']})
        .then(result => {
          assert.strictEqual(result.countryName, 'Turkey');
          assert.strictEqual(typeof result.country, 'object');
          assert.strictEqual(result.country.name, 'Turkey');
        });
  });

  it('should validate values argument is object', function() {
    return assert.rejects(() => Cities.create([1, 2, 3]),
        /You must provide/);
  });

});
