/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../lib/index');
const loadModels = require('./support/loadModels');

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
    Countries = orm.get('Countries');
    Cities = orm.get('Cities');
    Streets = orm.get('Streets');
    Customers = orm.get('Customers');
    Notes = orm.get('Notes');
  });

  after(() => pool.close(true));

  it('should create() record', function() {
    return Countries.create({id: 'ITA', name: 'Italy', phone_code: 39})
        .then(result => {
          assert.equal(result, true);
        });
  });

  it('should return own fields', function() {
    return Notes.create({
          source: 'customers',
          source_key: 2,
          contents: 'any content'
        },
        {returning: ['id', 'source_key'], silent: false})
        .then(result => {
          assert.notEqual(result.id, undefined);
          assert.equal(result.source_key, 2);
        });
  });

  it('should return all data fields if requested "*"', function() {
    return Notes.create({
          source: 'customers',
          source_key: 2,
          contents: 'any content'
        },
        {returning: '*', silent: false})
        .then(result => {
          assert.equal(Object.getOwnPropertyNames(result).length, 4);
        });
  });

  it('should return single fields if requested as string attribute', function() {
    return Notes.create({
          source: 'customers',
          source_key: 2,
          contents: 'any content'
        },
        {returning: 'id', silent: false})
        .then(result => {
          assert.equal(Object.getOwnPropertyNames(result).length, 1);
          assert.notEqual(result.id, undefined);
        });
  });

  it('should create() and return O2O associated fields', function() {
    return Cities.create({id: 1000, name: 'Test City', country_id: 'TUR'},
        {returning: ['country_name', 'country']})
        .then(result => {
          assert.equal(result.country_name, 'Turkey');
          assert.equal(typeof result.country, 'object');
          assert.equal(result.country.name, 'Turkey');
        });
  });

  it('should validate values argument is object', function(done) {
    Cities.create([1, 2, 3])
        .then(() => done('Failed'))
        .catch(e => {
          if (e.message.includes('You must provide'))
            return done();
          done(e);
        });
  });

});
