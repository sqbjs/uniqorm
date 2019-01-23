/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../lib/index');
const loadModels = require('./support/loadModels');
const {rejects} = require('rejected-or-not');
assert.rejects = assert.rejects || rejects;

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
    orm = new Uniqorm(pool, {showSql: true});
  });

  after(() => pool.close(true));

  it('load models', function() {
    loadModels(orm);
    orm.prepare();
    Countries = orm.getModel('uniqorm_1', 'Countries');
    Cities = orm.getModel('uniqorm_1', 'Cities');
    Streets = orm.getModel('uniqorm_1', 'Streets');
    Customers = orm.getModel('uniqorm_2', 'Customers');
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
      assert.strictEqual(recs.length, 2);
    });
  });

  it('should offset results', function() {
    return Countries.find().then(recs1 => {
      return Countries.find({offset: 1}).then(recs2 => {
        assert.strictEqual(recs2[0].id, recs1[1].id);
      });
    });
  });

  it('should sort results', function() {
    return Countries.find({sort: 'phoneCode'}).then(recs1 => {
      assert.strictEqual(recs1[0].id, 'RUS');
      return Countries.find({sort: '-phoneCode'}).then(recs2 => {
        assert.strictEqual(recs2[0].id, 'TUR');
      });
    });
  });

  it('should sort items must be string type', function() {
    return assert.rejects(() =>
            Countries.find({sort: 1}),
        /Invalid element in "sort" property/);
  });

  it('should sort items must be a valid string', function() {
    return assert.rejects(() =>
            Countries.find({sort: '1asdfd'}),
        /is not a valid order expression/);
  });

  it('should filter results', function() {
    return Countries.find({filter: {id: 'DEU'}}).then(recs => {
      assert.strictEqual(recs.length, 1);
      assert.strictEqual(recs[0].id, 'DEU');
      assert.strictEqual(recs[0].name, 'Germany');
    });
  });

  it('should return only requested properties with requested alias', function() {
    return Countries.find({properties: ['id country_id', 'name country_name']})
        .then(recs1 => {
          assert.strictEqual(Object.getOwnPropertyNames(recs1[0]).length, 2);
          assert(recs1[0].country_id);
          assert(recs1[0].country_name);
          return Countries.find({
            properties: {
              country_id: 'id',
              country_name: 'name'
            }
          }).then(recs2 => {
            assert(Object.getOwnPropertyNames(recs2[0]), 2);
            assert(recs2[0].country_id);
            assert(recs2[0].country_name);
          });
        });
  });

  it('should validate property names', function() {
    return assert.rejects(() =>
            Countries.find({properties: '1id'}),
        /is not a valid column name/);
  });

  it('should ignore invalid property names in silent mode', function() {
    return Countries.find({
      properties: ['1id', 'name', 'nofield', 123],
      silent: true
    })
        .then(recs => {
          assert(!recs[0].id);
          assert(!recs[0].nofield);
          assert(recs[0].name);
        });
  });

  describe('O2O associations', function() {

    it('should return associated properties', function() {
      return Cities.find({
        properties: ['id', 'name', 'country'],
        filter: {id: 1}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 1);
        assert.strictEqual(recs[0].name, 'Munich');
        assert.strictEqual(typeof recs[0].country, 'object');
        assert.strictEqual(recs[0].country.id, 'DEU');
        assert.strictEqual(recs[0].country.name, 'Germany');
      });
    });

    it('should return associated single value', function() {
      return Cities.find({
        properties: ['id', 'name', 'countryName'],
        filter: {id: 1}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 1);
        assert.strictEqual(recs[0].name, 'Munich');
        assert.strictEqual(recs[0].countryName, 'Germany');
      });
    });

    it('should request properties with array of property names', function() {
      return Cities.find({
        properties: ['id', 'name', 'country'],
        filter: {id: 1}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 1);
        assert.strictEqual(recs[0].name, 'Munich');
        assert.strictEqual(typeof recs[0].country, 'object');
        assert.strictEqual(recs[0].country.id, 'DEU');
        assert.strictEqual(recs[0].country.name, 'Germany');
      });
    });

    it('should request properties with object that includes property names', function() {
      return Cities.find({
        properties: {
          id: '',
          _name: 'name',
          _country: {
            fieldName: 'country',
            properties: {name_alias: 'name', 'phone_code_alias': 'phoneCode'}
          }
        },
        filter: {id: 1}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 1);
        assert.strictEqual(recs[0]._name, 'Munich');
        assert.strictEqual(typeof recs[0]._country, 'object');
        assert.strictEqual(Object.getOwnPropertyNames(recs[0]._country).length, 2);
        assert.strictEqual(recs[0]._country.name_alias, 'Germany');
        assert.strictEqual(recs[0]._country.phone_code_alias, 49);
      });
    });

    it('should request properties with object that includes property names - 2', function() {
      return Cities.find({
        properties: {
          id: '',
          _name: 'name',
          country: ['name', 'phoneCode']
        },
        filter: {id: 1}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 1);
        assert.strictEqual(recs[0]._name, 'Munich');
        assert.strictEqual(typeof recs[0].country, 'object');
        assert.strictEqual(Object.getOwnPropertyNames(recs[0].country).length, 2);
        assert.strictEqual(recs[0].country.name, 'Germany');
        assert.strictEqual(recs[0].country.phoneCode, 49);
      });
    });

    it('should request sub property flat', function() {
      return Cities.find({
        properties: ['id', 'name', 'country.name country_name'],
        filter: {id: 1}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 1);
        assert.strictEqual(recs[0].name, 'Munich');
        assert.strictEqual(recs[0].country_name, 'Germany');
      });
    });

    it('should request properties with different name than designed', function() {
      return Cities.find({
        properties: {
          id: '',
          _name: 'name',
          _country: 'country'
        },
        filter: {id: 1}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 1);
        assert.strictEqual(recs[0]._name, 'Munich');
        assert.strictEqual(typeof recs[0]._country, 'object');
        assert.strictEqual(Object.getOwnPropertyNames(recs[0]._country).length, 3);
        assert.strictEqual(recs[0]._country.name, 'Germany');
        assert.strictEqual(recs[0]._country.phoneCode, 49);
      });
    });

    it('should request properties with different name than designed', function() {
      return Cities.find({
        properties: {
          id: '',
          _name: 'name',
          country: null
        },
        filter: {id: 1}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 1);
        assert.strictEqual(recs[0]._name, 'Munich');
        assert.strictEqual(typeof recs[0].country, 'object');
        assert(!Array.isArray(recs[0].country));
        assert.strictEqual(Object.getOwnPropertyNames(recs[0].country).length, 3);
        assert.strictEqual(recs[0].country.name, 'Germany');
        assert.strictEqual(recs[0].country.phoneCode, 49);
      });
    });

    it('should return associated properties through other model', function() {
      return Customers.find({
        properties: ['id', 'name', 'city', 'country'],
        filter: {id: 19}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 19);
        assert.strictEqual(recs[0].name, 'Meric, Jale');
        assert.strictEqual(typeof recs[0].city, 'object');
        assert.strictEqual(recs[0].city.id, 10);
        assert.strictEqual(recs[0].city.name, 'Izmir');
        assert.strictEqual(recs[0].country.id, 'TUR');
        assert.strictEqual(recs[0].country.name, 'Turkey');
      });
    });

    it('should not request O2O associated flat fields sub property', function() {
      return assert.rejects(() =>
              Cities.find({properties: ['countryName.name name']}),
          /has no sub value/);
    });

  });

  describe('O2M associations', function() {

    it('should not request M2M associated sub property as flat', function() {
      return assert.rejects(() =>
              Customers.find({properties: ['notes.contents contents']}),
          /sub values can not be used/);
    });

    it('should check sub property exists', function() {
      return assert.rejects(() =>
              Cities.find({properties: ['country.nofield aaa']}),
          /has no field/);
    });

    it('should check sub property exists in child finder', function() {
      return assert.rejects(() =>
              Cities.find({
                properties: {
                  id: '',
                  name: '',
                  country: {
                    properties: [{unknown: null}]
                  }
                },
                filter: {id: 1}
              }),
          /has no field/);
    });

    it('should return associated properties', function() {
      return Customers.find({
        properties: ['id', 'name', 'notes'],
        filter: {id: 19}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 19);
        assert(Array.isArray(recs[0].notes));
        assert.strictEqual(recs[0].notes.length, 2);
        assert.strictEqual(recs[0].notes[0].contents, 'note 1');
        assert.strictEqual(recs[0].notes[1].contents, 'note 2');
      });
    });

    it('should filter by O2O associated property', function() {
      const scope = {};
      return Cities.find({
        properties: ['id', 'name'],
        filter: {countryName: 'France'},
        scope
      }).then(recs => {
        assert(scope);
        assert.strictEqual(recs.length, 2);
        assert.strictEqual(recs[0].name, 'Paris');
        assert.strictEqual(recs[1].name, 'Lyon');
      });
    });

    it('should filter by O2O associated property (towards)', function() {
      return Streets.find({
        properties: ['id', 'name'],
        filter: {countryName: 'France'}
      }).then(recs => {
        assert.strictEqual(recs.length, 4);
        assert.strictEqual(recs[0].name, 'Rue Cler');
        assert.strictEqual(recs[1].name, 'Rue des Rosiers');
      });
    });

    it('should sort by O2O associated property', function() {
      return Cities.find({
        properties: ['id', 'name', 'countryName'],
        sort: ['-countryName']
      }).then(recs => {
        assert.strictEqual(recs[0].name, 'Manchester');
        assert.strictEqual(recs[1].name, 'Izmir');
      });
    });

    it('should find deep', function() {
      return Streets.find({
        properties: {
          city: {
            properties: {
              country: {
                properties: {
                  id: null,
                  name: null
                }
              }
            }
          }
        }
      }).then(recs => {
        assert.strictEqual(typeof recs[0].city, 'object');
        assert.strictEqual(typeof recs[0].city.country, 'object');
        assert(recs[0].city.country.id);
        assert(recs[0].city.country.name);
      });
    });

    it('should find deep (default properties)', function() {
      return Streets.find({
        properties: {
          city: {
            properties: {
              country: null
            }
          }
        }
      }).then(recs => {
        assert.strictEqual(typeof recs[0].city, 'object');
        assert.strictEqual(typeof recs[0].city.country, 'object');
        assert(recs[0].city.country.id);
        assert(recs[0].city.country.name);
        assert(recs[0].city.country.phoneCode);
      });
    });

  });

  describe('M2M associations', function() {

    it('should return M2M associated properties (array)', function() {
      return Customers.find({
        properties: ['id', 'name', 'tags'],
        filter: {id: 19}
      }).then(recs => {
        assert.strictEqual(recs.length, 1);
        assert.strictEqual(recs[0].id, 19);
        assert(Array.isArray(recs[0].tags));
        assert.strictEqual(recs[0].tags.length, 2);
        assert.strictEqual(recs[0].tags[0].name, 'Red');
        assert.strictEqual(recs[0].tags[1].name, 'Green');
      });
    });
  });

  describe('Common', function() {

    it('should fill scope object', function() {
      const scope = {};
      return Customers.find({
        properties: ['id', 'name', 'notes'],
        filter: {id: 19},
        scope
      }).then(() => {
        assert(scope.properties);
        assert(scope.query);
        assert(scope.query.sql);
      });
    });

    it('should show sql on error', function() {
      orm.define({
        name: 'Notexists',
        schema: 'uniqorm_1',
        tableName: 'Notexists',
        fields: {
          id: 'INTEGER'
        }
      });
      return assert.rejects(() =>
              orm.getModel('uniqorm_1.Notexists').find({showSql: true}),
          /select t.id/);
    });
  });

  describe('Finalize', function() {

    it('should have no active connection after all tests', function() {
      assert.strictEqual(pool.acquired, 0);
    });

    it('should shutdown pool', function() {
      return pool.close().then(() => {
        if (!pool.isClosed)
          throw new Error('Failed');
      });
    });

  });

});
