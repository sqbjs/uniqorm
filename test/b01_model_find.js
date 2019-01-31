/* eslint-disable */
require('./support/env');
const assert = require('assert');
const {createPool, createOrm} = require('./support/helpers');
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
    pool = createPool();
    orm = createOrm(pool);
    Countries = orm.getModel('uniqorm_1', 'Countries');
    Cities = orm.getModel('uniqorm_1', 'Cities');
    Streets = orm.getModel('uniqorm_1', 'Streets');
    Customers = orm.getModel('uniqorm_2', 'Customers');
  });

  after(() => pool.close(true));

  it('should retrieve array of instances', function() {
    return Countries.find().then(resp => {
      assert(resp);
      assert(resp.executeTime);
      assert.strictEqual(resp.queriesExecuted, 1);
      assert(Array.isArray(resp.instances), 'Result is not array');
      assert(resp.instances.length);
      assert(resp.instances[0].id);
    });
  });

  it('should limit results', function() {
    return Countries.find({limit: 2}).then(resp => {
      assert.strictEqual(resp.queriesExecuted, 1);
      assert.strictEqual(resp.instances.length, 2);
    });
  });

  it('should offset results', function() {
    return Countries.find().then(resp1 => {
      return Countries.find({offset: 1}).then(resp2 => {
        assert.strictEqual(resp2.queriesExecuted, 1);
        assert.strictEqual(resp2.instances[0].id, resp1.instances[1].id);
      });
    });
  });

  it('should sort results', function() {
    return Countries.find({sort: 'phoneCode'}).then(resp1 => {
      assert.strictEqual(resp1.queriesExecuted, 1);
      assert.strictEqual(resp1.instances[0].id, 'RUS');
      return Countries.find({sort: '-phoneCode'}).then(resp2 => {
        assert.strictEqual(resp2.queriesExecuted, 1);
        assert.strictEqual(resp2.instances[0].id, 'TUR');
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
    return Countries.find({where: {or: [{phoneCode: 49}, {phoneCode: 90}]}})
        .then(resp => {
          assert.strictEqual(resp.queriesExecuted, 1);
          assert.strictEqual(resp.instances.length, 2);
        });
  });

  it('should return only requested properties with requested alias', function() {
    return Countries.find({properties: ['id country_id', 'name country_name']})
        .then(resp1 => {
          assert.strictEqual(resp1.queriesExecuted, 1);
          assert.strictEqual(Object.getOwnPropertyNames(resp1.instances[0]).length, 2);
          assert(resp1.instances[0].country_id);
          assert(resp1.instances[0].country_name);
          return Countries.find({
            properties: {
              country_id: 'id',
              country_name: 'name'
            }
          }).then(resp2 => {
            assert.strictEqual(resp2.queriesExecuted, 1);
            assert(Object.getOwnPropertyNames(resp2.instances[0]), 2);
            assert(resp2.instances[0].country_id);
            assert(resp2.instances[0].country_name);
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
    }).then(resp => {
      assert(!resp.instances[0].id);
      assert(!resp.instances[0].nofield);
      assert(resp.instances[0].name);
    });
  });

  describe('O2O associations', function() {

    it('should return associated properties', function() {
      return Cities.find({
        properties: ['id', 'name', 'country'],
        where: {id: 1}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 1);
        assert.strictEqual(resp.instances[0].name, 'Munich');
        assert.strictEqual(typeof resp.instances[0].country, 'object');
        assert.strictEqual(resp.instances[0].country.id, 'DEU');
        assert.strictEqual(resp.instances[0].country.name, 'Germany');
      });
    });

    it('should return associated single value', function() {
      return Cities.find({
        properties: ['id', 'name', 'countryName'],
        where: {id: 1}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 1);
        assert.strictEqual(resp.instances[0].name, 'Munich');
        assert.strictEqual(resp.instances[0].countryName, 'Germany');
      });
    });

    it('should request properties with array of property names', function() {
      return Cities.find({
        properties: ['id', 'name', 'country'],
        where: {id: 1}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 1);
        assert.strictEqual(resp.instances[0].name, 'Munich');
        assert.strictEqual(typeof resp.instances[0].country, 'object');
        assert.strictEqual(resp.instances[0].country.id, 'DEU');
        assert.strictEqual(resp.instances[0].country.name, 'Germany');
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
        where: {id: 1}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 1);
        assert.strictEqual(resp.instances[0]._name, 'Munich');
        assert.strictEqual(typeof resp.instances[0]._country, 'object');
        assert.strictEqual(Object.getOwnPropertyNames(resp.instances[0]._country).length, 2);
        assert.strictEqual(resp.instances[0]._country.name_alias, 'Germany');
        assert.strictEqual(resp.instances[0]._country.phone_code_alias, 49);
      });
    });

    it('should request properties with object that includes property names - 2', function() {
      return Cities.find({
        properties: {
          id: '',
          _name: 'name',
          country: ['name', 'phoneCode']
        },
        where: {id: 1}
      }).then(resp => {
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 1);
        assert.strictEqual(resp.instances[0]._name, 'Munich');
        assert.strictEqual(typeof resp.instances[0].country, 'object');
        assert.strictEqual(Object.getOwnPropertyNames(resp.instances[0].country).length, 2);
        assert.strictEqual(resp.instances[0].country.name, 'Germany');
        assert.strictEqual(resp.instances[0].country.phoneCode, 49);
      });
    });

    it('should request sub property flat', function() {
      return Cities.find({
        properties: ['id', 'name', 'country.name country_name'],
        where: {id: 1}
      }).then(resp => {
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 1);
        assert.strictEqual(resp.instances[0].name, 'Munich');
        assert.strictEqual(resp.instances[0].country_name, 'Germany');
      });
    });

    it('should request properties with different name than designed', function() {
      return Cities.find({
        properties: {
          id: '',
          _name: 'name',
          _country: 'country'
        },
        where: {id: 1}
      }).then(resp => {
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 1);
        assert.strictEqual(resp.instances[0]._name, 'Munich');
        assert.strictEqual(typeof resp.instances[0]._country, 'object');
        assert.strictEqual(Object.getOwnPropertyNames(resp.instances[0]._country).length, 3);
        assert.strictEqual(resp.instances[0]._country.name, 'Germany');
        assert.strictEqual(resp.instances[0]._country.phoneCode, 49);
      });
    });

    it('should request properties with different name than designed', function() {
      return Cities.find({
        properties: {
          id: '',
          _name: 'name',
          country: null
        },
        where: {id: 1}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 1);
        assert.strictEqual(resp.instances[0]._name, 'Munich');
        assert.strictEqual(typeof resp.instances[0].country, 'object');
        assert(!Array.isArray(resp.instances[0].country));
        assert.strictEqual(Object.getOwnPropertyNames(resp.instances[0].country).length, 3);
        assert.strictEqual(resp.instances[0].country.name, 'Germany');
        assert.strictEqual(resp.instances[0].country.phoneCode, 49);
      });
    });

    it('should return associated properties through other model', function() {
      return Customers.find({
        properties: ['id', 'name', 'city', 'country'],
        where: {id: 19}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 19);
        assert.strictEqual(resp.instances[0].name, 'Meric, Jale');
        assert.strictEqual(typeof resp.instances[0].city, 'object');
        assert.strictEqual(resp.instances[0].city.id, 10);
        assert.strictEqual(resp.instances[0].city.name, 'Izmir');
        assert.strictEqual(resp.instances[0].country.id, 'TUR');
        assert.strictEqual(resp.instances[0].country.name, 'Turkey');
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

    it('should not request sub field of single value associated field', function() {
      return assert.rejects(() =>
              Streets.find({properties: ['countryName.nofield']}),
          /is a single value associated field/);
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
                where: {id: 1}
              }),
          /has no field/);
    });

    it('should return associated properties', function() {
      return Customers.find({
        properties: ['id', 'name', 'notes'],
        where: {id: 19}
      }).then(resp => {
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 19);
        assert(Array.isArray(resp.instances[0].notes));
        assert.strictEqual(resp.instances[0].notes.length, 2);
        assert.strictEqual(resp.instances[0].notes[0].contents, 'note 1');
        assert.strictEqual(resp.instances[0].notes[1].contents, 'note 2');
      });
    });

    it('should filter by O2O associated property', function() {
      return Cities.find({
        properties: ['id', 'name'],
        where: {countryName: 'France'}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances.length, 2);
        assert.strictEqual(resp.instances[0].name, 'Paris');
        assert.strictEqual(resp.instances[1].name, 'Lyon');
      });
    });

    it('should filter by O2O associated property (towards)', function() {
      return Streets.find({
        properties: ['id', 'name'],
        where: {countryName: 'France'}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances.length, 4);
        assert.strictEqual(resp.instances[0].name, 'Rue Cler');
        assert.strictEqual(resp.instances[1].name, 'Rue des Rosiers');
      });
    });

    it('should sort by O2O associated property', function() {
      return Cities.find({
        properties: ['id', 'name', 'countryName'],
        sort: ['-countryName']
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(resp.instances[0].name, 'Manchester');
        assert.strictEqual(resp.instances[1].name, 'Izmir');
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
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(typeof resp.instances[0].city, 'object');
        assert.strictEqual(typeof resp.instances[0].city.country, 'object');
        assert(resp.instances[0].city.country.id);
        assert(resp.instances[0].city.country.name);
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
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 1);
        assert.strictEqual(typeof resp.instances[0].city, 'object');
        assert.strictEqual(typeof resp.instances[0].city.country, 'object');
        assert(resp.instances[0].city.country.id);
        assert(resp.instances[0].city.country.name);
        assert(resp.instances[0].city.country.phoneCode);
      });
    });

  });

  describe('M2M associations', function() {

    it('should return M2M associated properties (array)', function() {
      return Customers.find({
        properties: ['id', 'name', 'tags'],
        where: {id: 19}
      }).then(resp => {
        assert.strictEqual(resp.queriesExecuted, 2);
        assert.strictEqual(resp.instances.length, 1);
        assert.strictEqual(resp.instances[0].id, 19);
        assert(Array.isArray(resp.instances[0].tags));
        assert.strictEqual(resp.instances[0].tags.length, 2);
        assert.strictEqual(resp.instances[0].tags[0].name, 'Red');
        assert.strictEqual(resp.instances[0].tags[1].name, 'Green');
      });
    });
  });

  describe('Common', function() {

    it('should fill trace sqls', function() {
      let trace;
      return Customers.find({
        properties: ['id', 'name', 'notes'],
        where: {id: 19},
        trace: (x) => {
          trace = x;
        }
      }).then(() => {
        assert.deepStrictEqual(trace.properties, {
          id: null,
          name: null,
          notes: null
        });
        assert(trace.query);
        assert.strictEqual(typeof trace.query.sql, 'string');
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
              orm.getModel('uniqorm_1.Notexists').find(),
          (e) => {
            assert(e.query);
            assert(e.query.sql);
            return true;
          });
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
