/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../lib/index');
const loadModels = require('./support/loadModels');

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
    Countries = orm.get('uniqorm_1.Countries');
    Cities = orm.get('uniqorm_1.Cities');
    Streets = orm.get('uniqorm_1.Streets');
    Customers = orm.get('uniqorm_2.Customers');
    Notes = orm.get('uniqorm_2.Notes');
  });

  after(() => pool.close(true));

  it('should update record', function() {
    return Notes.update({id: 1, contents: 'changed 1'})
        .then(result => {
          assert.equal(result, true);
        });
  });

  it('should return own fields', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: ['id', 'contents'], silent: false})
        .then(result => {
          assert.equal(result.id, 1);
          assert.equal(result.contents, 'changed 2');
        });
  });

  it('should return all data fields if requested "*"', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: '*', silent: false})
        .then(result => {
          assert.equal(Object.getOwnPropertyNames(result).length, 4);
        });
  });

  it('should return single fields if requested as string attribute', function() {
    return Notes.update({id: 1, contents: 'changed 2'},
        {returning: 'id', silent: false})
        .then(result => {
          assert.equal(Object.getOwnPropertyNames(result).length, 1);
          assert.notEqual(result.id, undefined);
        });
  });

  it('should return O2O associated fields', function() {
    return Cities.update({id: 1000, name: 'Test City2', country_id: 'ITA'},
        {returning: ['country_name', 'country']})
        .then(result => {
          assert.equal(result.country_name, 'Italy');
          assert.equal(typeof result.country, 'object');
          assert.equal(result.country.name, 'Italy');
        });
  });

  it('should update using custom conditions', function() {
    return Notes.update({contents: 'changed 5'},
        {returning: '*', where: {'id': 1}, })
        .then(() => {
          return Notes.find({sort: 'id'}).then(resp => {
            assert.equal(resp.length, 6);
            assert.equal(resp[0].id, 1);
            assert.equal(resp[0].contents, 'changed 5');
            assert.equal(resp[1].id, 2);
            assert.equal(resp[1].contents, 'note 2');
          });
        });
  });

  it('should validate values argument is object', function(done) {
    Cities.update([1, 2, 3])
        .then(() => done('Failed'))
        .catch(e => {
          if (e.message.includes('You must provide'))
            return done();
          done(e);
        });
  });

});
