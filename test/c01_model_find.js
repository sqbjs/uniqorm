/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../');
const loadModels = require('./support/loadModels');

describe('Model.prototype.find', function() {

  let pool;
  let orm;
  let Countries;
  let Cities;
  let Streets;
  let Customers;

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
  });

  after(() => pool.close(true));

  it('load models', function() {
    loadModels(orm);
    orm.bake();
    Countries = orm.get('Countries');
    Cities = orm.get('Cities');
    Streets = orm.get('Streets');
    Customers = orm.get('Customers');
  });

  it('should retrieve array of instances', function() {
    return Countries.find().then(recs => {
      assert(Array.isArray(recs), 'Result is not array');
      assert(recs.length);
      assert(recs[0].id);
    });
  });

  it('should limit results', function() {
    return Countries.find({limit: 2}).then(recs => {
      assert.equal(recs.length, 2);
    });
  });

  it('should offset results', function() {
    return Countries.find().then(recs1 => {
      return Countries.find({offset: 1}).then(recs2 => {
        assert.equal(recs2[0].id, recs1[1].id);
      });
    });
  });

  it('should sort results', function() {
    return Countries.find({orderBy: 'phone_code'}).then(recs1 => {
      assert.equal(recs1[0].id, 'RUS');
      return Countries.find({orderBy: '-phone_code'}).then(recs2 => {
        assert.equal(recs2[0].id, 'TUR');
      });
    });
  });

  it('should filter results', function() {
    return Countries.find({filter: {id: 'DEU'}}).then(recs => {
      assert.equal(recs.length, 1);
      assert.equal(recs[0].id, 'DEU');
      assert.equal(recs[0].name, 'Germany');
    });
  });

  it('should return only requested attributes with requested alias', function() {
    return Countries.find({attributes: ['id country_id', 'name country_name']})
        .then(recs1 => {
          assert.equal(Object.getOwnPropertyNames(recs1[0]).length, 2);
          assert(recs1[0].country_id);
          assert(recs1[0].country_name);
          return Countries.find({
            attributes: {
              country_id: 'id',
              country_name: 'name'
            }
          }).then(recs2 => {
            assert(Object.getOwnPropertyNames(recs1[0]), 2);
            assert(recs1[0].country_id);
            assert(recs1[0].country_name);
          });
        });
  });

  describe('O2O associations', function() {

    it('should return associated attributes as object', function() {
      return Cities.find({
        attributes: ['id', 'name', 'country'],
        filter: {id: 1}
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 1);
        assert.equal(recs[0].name, 'Munich');
        assert.equal(typeof recs[0].country, 'object');
        assert.equal(recs[0].country.id, 'DEU');
        assert.equal(recs[0].country.name, 'Germany');
      });
    });

    it('should return associated single value', function() {
      return Cities.find({
        attributes: ['id', 'name', 'country_name'],
        filter: {id: 1}
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 1);
        assert.equal(recs[0].name, 'Munich');
        assert.equal(recs[0].country_name, 'Germany');
      });
    });

    it('should request attributes with array of attribute names', function() {
      return Cities.find({
        attributes: ['id', 'name', 'country'],
        filter: {id: 1}
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 1);
        assert.equal(recs[0].name, 'Munich');
        assert.equal(typeof recs[0].country, 'object');
        assert.equal(recs[0].country.id, 'DEU');
        assert.equal(recs[0].country.name, 'Germany');
      });
    });

    it('should request attributes with object that includes attribute names', function() {
      return Cities.find({
        attributes: {
          id: '',
          _name: 'name',
          _country: {
            field: 'country',
            attributes: {name_alias: 'name', 'phone_code_alias': 'phone_code'}
          }
        },
        filter: {id: 1}
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 1);
        assert.equal(recs[0]._name, 'Munich');
        assert.equal(typeof recs[0]._country, 'object');
        assert.equal(Object.getOwnPropertyNames(recs[0]._country).length, 2);
        assert.equal(recs[0]._country.name_alias, 'Germany');
        assert.equal(recs[0]._country.phone_code_alias, 49);
      });
    });

    it('should request attributes with object that includes attribute names - 2', function() {
      return Cities.find({
        attributes: {
          id: '',
          _name: 'name',
          country: {
            attributes: ['name', 'phone_code']
          }
        },
        filter: {id: 1}
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 1);
        assert.equal(recs[0]._name, 'Munich');
        assert.equal(typeof recs[0].country, 'object');
        assert.equal(Object.getOwnPropertyNames(recs[0].country).length, 2);
        assert.equal(recs[0].country.name, 'Germany');
        assert.equal(recs[0].country.phone_code, 49);
      });
    });

    it('should request attributes with different name than designed', function() {
      return Cities.find({
        attributes: {
          id: '',
          _name: 'name',
          _country: 'country'
        },
        filter: {id: 1}
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 1);
        assert.equal(recs[0]._name, 'Munich');
        assert.equal(typeof recs[0]._country, 'object');
        assert.equal(Object.getOwnPropertyNames(recs[0]._country).length, 3);
        assert.equal(recs[0]._country.name, 'Germany');
        assert.equal(recs[0]._country.phone_code, 49);
      });
    });

    it('should request attributes with different name than designed', function() {
      return Cities.find({
        attributes: {
          id: '',
          _name: 'name',
          country: null
        },
        filter: {id: 1}
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 1);
        assert.equal(recs[0]._name, 'Munich');
        assert.equal(typeof recs[0].country, 'object');
        assert(!Array.isArray(recs[0].country));
        assert.equal(Object.getOwnPropertyNames(recs[0].country).length, 3);
        assert.equal(recs[0].country.name, 'Germany');
        assert.equal(recs[0].country.phone_code, 49);
      });
    });

    it('should return associated attributes through other model', function() {
      return Customers.find({
        attributes: ['id', 'name', 'city', 'country'],
        filter: {id: 19}
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 19);
        assert.equal(recs[0].name, 'Meric, Jale');
        assert.equal(typeof recs[0].city, 'object');
        assert.equal(recs[0].city.id, 10);
        assert.equal(recs[0].city.name, 'Izmir');
        assert.equal(recs[0].country.id, 'TUR');
        assert.equal(recs[0].country.name, 'Turkey');
      });
    });

  });

  describe('O2M associations', function() {

    it('should return associated attributes', function() {
      const scope = {};
      return Customers.find({
        attributes: ['id', 'name', 'notes'],
        filter: {id: 19},
        showSql: true,
        scope
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 19);
        assert(Array.isArray(recs[0].notes));
        assert.equal(recs[0].notes.length, 2);
        assert.equal(recs[0].notes[0].contents, 'note 1');
        assert.equal(recs[0].notes[1].contents, 'note 2');
        assert(scope);
      });
    });

  });

  describe('M2M associations', function() {
    it('should return M2M associated attributes (array)', function() {
      return Customers.find({
        attributes: ['id', 'name', 'tags'],
        filter: {id: 19},
        showSql: true
      }).then(recs => {
        assert.equal(recs.length, 1);
        assert.equal(recs[0].id, 19);
        assert(Array.isArray(recs[0].tags));
        assert.equal(recs[0].tags.length, 2);
      });
    });
  });

  describe('Finalize', function() {

    it('should have no active connection after all tests', function() {
      assert.equal(pool.acquired, 0);
    });

    it('should shutdown pool', function() {
      return pool.close().then(() => {
        if (!pool.isClosed)
          throw new Error('Failed');
      });
    });

  });

});
