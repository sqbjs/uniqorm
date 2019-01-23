/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../lib/index');
const loadModels = require('./support/loadModels');
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

  it('should update record', function() {
    return Notes.update({id: 1, contents: 'changed 1'})
        .then(result => {
          assert.strictEqual(result, true);
        });
  });

  it('should return own fields', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: ['id', 'contents'], silent: false})
        .then(result => {
          assert.strictEqual(result.id, 1);
          assert.strictEqual(result.contents, 'changed 2');
        });
  });

  it('should return all data fields if requested "*"', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: '*', silent: false})
        .then(result => {
          assert.strictEqual(Object.getOwnPropertyNames(result).length, 4);
        });
  });

  it('should return single fields if requested as string property', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: 'id', silent: false})
        .then(result => {
          assert.strictEqual(Object.getOwnPropertyNames(result).length, 1);
          assert.notStrictEqual(result.id, undefined);
        });
  });

  it('should return O2O associated fields', function() {
    return Cities.update({id: 1000, name: 'Test City2', countryId: 'ITA'},
        {returning: ['countryName', 'country']})
        .then(result => {
          assert.strictEqual(result.countryName, 'Italy');
          assert.strictEqual(typeof result.country, 'object');
          assert.strictEqual(result.country.name, 'Italy');
        });
  });

  it('should update using custom conditions', function() {
    return Notes.update({contents: 'changed 5'},
        {returning: '*', where: {'id': 1}})
        .then(() => {
          return Notes.find({sort: 'id'}).then(resp => {
            assert.strictEqual(resp.length, 6);
            assert.strictEqual(resp[0].id, 1);
            assert.strictEqual(resp[0].contents, 'changed 5');
            assert.strictEqual(resp[1].id, 2);
            assert.strictEqual(resp[1].contents, 'note 2');
          });
        });
  });

  it('should validate values argument is object', function() {
    return assert.rejects(() => Cities.update([1, 2, 3]),
        /You must provide/);
  });

});
