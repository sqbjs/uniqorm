/* eslint-disable */
require('./support/env');
const assert = require('assert');
const Uniqorm = require('../');

describe('Associated Fields', function() {

  const defs = {
    countries: {
      name: 'countries',
      fields: {
        id: 'INTEGER',
        name: 'VARCHAR',
        temp: 'SMALLINT'
      }
    },

    states: {
      name: 'states',
      fields: {
        id: 'INTEGER',
        country_id: 'INTEGER',
        name: 'VARCHAR'
      },
      associations: [
        {
          foreignModel: 'countries',
          foreignKey: 'id',
          key: 'country_id'
        }
      ]
    },

    cities: {
      name: 'cities',
      fields: {
        id: {dataType: 'INTEGER', primaryKey: true},
        state_id: 'INTEGER',
        name: 'VARCHAR'
      },
      associations: [
        {
          foreignModel: 'states',
          foreignKey: 'id',
          key: 'state_id'
        }
      ]
    },

    streets: {
      name: 'streets',
      fields: {
        id: 'INTEGER',
        city_id: 'INTEGER',
        name: 'VARCHAR',
        city: {
          foreignModel: 'cities'
        }
      }
    },

    roads: {
      name: 'roads',
      fields: {
        uid: {dataType: 'INTEGER', primaryKey: true},
        state_id: 'INTEGER',
        name: 'VARCHAR',
        state: {
          foreignModel: 'states'
        }
      }
    }
  };

  it('should init', function() {
    const orm = new Uniqorm();
    orm.define(defs.countries);
    const States = orm.define(defs.states);
    States.hasMany('country', {
      foreignModel: 'countries',
      foreignKey: 'id',
      key: 'country_id',
      properties: ['id', 'name'],
      filter: [{id: 1}]
    });
    States.hasMany('country2', 'countries');
    orm.prepare();

    let f = States.fields.country;
    assert(f);
    assert.strictEqual(f.foreignModel.name, 'countries');
    assert.strictEqual(f.foreignKey, 'id');
    assert.strictEqual(f.key, 'country_id');
    assert.strictEqual(f.hasMany, true);
    assert.deepStrictEqual(f.filter, [{id: 1}]);
    assert.deepStrictEqual(f.properties, {
      id: null,
      name: null
    });
    f = States.fields.country2;
    assert(f);
    assert.strictEqual(f.foreignModel.name, 'countries');
    assert.strictEqual(f.foreignKey, 'id');
    assert.strictEqual(f.key, 'country_id');
    assert.strictEqual(f.hasMany, true);
  });

  it('should set "filter" if not provided as array', function() {
    const orm = new Uniqorm();
    orm.define(defs.countries);
    const States = orm.define(defs.states);
    States.hasOne('country', {
      foreignModel: 'countries',
      foreignKey: 'id',
      key: 'country_id',
      filter: {id: 1}
    });
    const f = States.fields.country;
    assert(f);
    assert.strictEqual(f.foreignModel.name, 'countries');
    assert.strictEqual(f.foreignKey, 'id');
    assert.strictEqual(f.key, 'country_id');
    assert.deepStrictEqual(f.filter, [{id: 1}]);
  });

  it('should set "field" if properties is not provided', function() {
    let orm = new Uniqorm();
    orm.define(defs.countries);
    const States = orm.define(defs.states);
    States.hasOne('country', {
      foreignModel: 'countries',
      foreignKey: 'id',
      key: 'country_id',
      filter: {id: 1},
      fieldName: 'name'
    });
    States.hasOne('country2', {
      foreignModel: 'countries',
      foreignKey: 'id',
      key: 'country_id',
      filter: {id: 1},
      properties: {id: null, name: null},
      fieldName: 'name'
    });
    orm.prepare();
    let f = States.fields.country;
    assert(f);
    assert.strictEqual(f.fieldName, 'name');

    f = States.fields.country2;
    assert(f);
    assert.strictEqual(f.fieldName, null);
    assert.deepStrictEqual(f.properties, {
      id: null,
      name: null
    });
  });

  it('should discover key fields if not provided', function() {
    const orm = new Uniqorm();
    const Countries = orm.define(defs.countries);
    Countries.hasMany('cities', {
      foreignModel: 'states',
      foreignKey: 'country_id',
      key: 'id',
      properties: {
        state_name: 'name'
      },
      filter: {'id>=': 1},
      towards: {
        foreignModel: 'cities',
        foreignKey: 'state_id',
        key: 'id',
        filter: {'id>': 0},
        properties: ['id', 'name']
      }
    });
    Countries.hasOne('cities2', {
      foreignModel: 'states',
      towards: 'cities'
    });
    orm.define(defs.states);
    const Cities = orm.define(defs.cities);
    Cities.hasOne('state', 'states');
    orm.define(defs.streets);
    orm.define(defs.roads);
    orm.prepare();

    let model = orm.getModel('countries');
    let f = model.fields.cities;
    assert(f);
    assert.strictEqual(f.foreignModel.name, 'states');
    assert.strictEqual(f.foreignKey, 'country_id');
    assert.strictEqual(f.key, 'id');
    assert.deepStrictEqual(f.filter, [{'id>=': 1}]);
    assert(f.towards);
    assert.strictEqual(f.towards.foreignModel.name, 'cities');
    assert.strictEqual(f.towards.foreignKey, 'state_id');
    assert.strictEqual(f.towards.key, 'id');
    assert.deepStrictEqual(f.towards.filter, [{'id>': 0}]);
    assert.deepStrictEqual(f.towards.properties, {id: null, name: null});

    f = model.fields.cities2;
    assert(f);
    assert.strictEqual(f.foreignModel.name, 'states');
    assert.strictEqual(f.foreignKey, 'country_id');
    assert.strictEqual(f.key, 'id');
    assert.strictEqual(f.properties, null);
    assert(f.towards);
    assert.strictEqual(f.towards.foreignModel.name, 'cities');
    assert.strictEqual(f.towards.foreignKey, 'state_id');
    assert.strictEqual(f.towards.key, 'id');
    assert.deepStrictEqual(f.towards.properties, {
      id: null,
      state: null,
      state_id: null,
      name: null
    });

    model = orm.getModel('cities');
    f = model.fields.state;
    assert(f);
    assert.strictEqual(f.foreignModel.name, 'states');
    assert.strictEqual(f.foreignKey, 'id');
    assert.strictEqual(f.key, 'state_id');

    model = orm.getModel('streets');
    f = model.fields.city;
    assert(f);
    assert.strictEqual(f.foreignModel.name, 'cities');
    assert.strictEqual(f.foreignKey, 'id');
    assert.strictEqual(f.key, 'cities_id');

    model = orm.getModel('roads');
    f = model.fields.state;
    assert(f);
    assert.strictEqual(f.foreignModel.name, 'states');
    assert.strictEqual(f.foreignKey, 'id');
    assert.strictEqual(f.key, 'states_id');
  });

});
