/* eslint-disable */
require('./env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../../lib/index');
const loadModels = require('./loadModels');

describe('Model.prototype.find', function() {

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

  it('should create() record and return requested values (returning)', function() {
    return Notes.create({
          source: 'customers',
          source_key: 2,
          contents: 'any content'
        },
        {returning: ['id', 'source_key']})
        .then(result => {
          assert.notEqual(result.id, undefined);
          assert.equal(result.source_key, 2);
        });
  });

  it('should create() and return O2O associated field', function() {
    return Cities.create({id: 1000, name: 'Test City', country_id: 'TUR'},
        {returning: ['id', 'country_name', 'country']})
        .then(result => {
          assert.equal(result.country_name, 'Turkey');
          assert.equal(typeof result.country, 'Object');
          assert.equal(result.country.name, 'Turkey');
        });
  });

});
