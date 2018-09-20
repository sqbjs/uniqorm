/* eslint-disable */
require('./support/env');
const assert = require('assert');
const merge = require('putil-merge');
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
    const statesDef = merge.clone(defs.states);
    statesDef.fields.country = {
      foreignModel: 'countries',
      foreignKey: 'id',
      key: 'country_id',
      hasMany: true,
      attributes: ['id', 'name'],
      filter: [{id: 1}]
    };
    const states = orm.define(statesDef);
    const f = states.fields.get('country');
    assert(f);
    assert.equal(f.foreignModel.name, 'countries');
    assert.equal(f.foreignKey, 'id');
    assert.equal(f.key, 'country_id');
    assert.equal(f.hasMany, true);
    assert.deepEqual(f.filter, [{id: 1}]);
    assert.deepEqual(f.attributes, {
      id: null,
      name: null
    });
  });

  it('should set "filter" if not provided as array', function() {
    const orm = new Uniqorm();
    orm.define(defs.countries);
    const statesDef = merge.clone(defs.states);
    statesDef.fields.country = {
      foreignModel: 'countries',
      foreignKey: 'id',
      key: 'country_id',
      filter: {id: 1}
    };
    const states = orm.define(statesDef);
    const f = states.fields.get('country');
    assert(f);
    assert.equal(f.foreignModel.name, 'countries');
    assert.equal(f.foreignKey, 'id');
    assert.equal(f.key, 'country_id');
    assert.deepEqual(f.filter, [{id: 1}]);
  });

  it('should set "field" if attributes is not provided', function() {
    let orm = new Uniqorm();
    orm.define(defs.countries);
    const statesDef = merge.clone(defs.states);
    statesDef.fields.country = {
      foreignModel: 'countries',
      foreignKey: 'id',
      key: 'country_id',
      filter: {id: 1},
      fieldName: 'name'
    };
    statesDef.fields.country2 = {
      foreignModel: 'countries',
      foreignKey: 'id',
      key: 'country_id',
      filter: {id: 1},
      attributes: {id: null, name: null},
      fieldName: 'name'
    };
    const states = orm.define(statesDef);
    orm.prepare();
    let f = states.fields.get('country');
    assert(f);
    assert.equal(f.fieldName, 'name');

    f = states.fields.get('country2');
    assert(f);
    assert.equal(f.fieldName, null);
    assert.deepEqual(f.attributes, {
      id: null,
      name: null
    });
  });

  it('should discover key fields if not provided', function() {
    const orm = new Uniqorm();
    const countriesDef = merge.clone(defs.countries);
    const citiesDef = merge.clone(defs.cities);
    countriesDef.fields.cities = {
      foreignModel: 'states',
      foreignKey: 'country_id',
      key: 'id',
      attributes: {
        state_name: 'name'
      },
      filter: {'id>=': 1},
      hasMany: true,
      towards: {
        foreignModel: 'cities',
        foreignKey: 'state_id',
        key: 'id',
        filter: {'id>': 0},
        attributes: ['id', 'name']
      }
    };
    countriesDef.fields.cities2 = {
      foreignModel: 'states',
      towards: 'cities'
    };
    citiesDef.fields.state = {
      foreignModel: 'states'
    };

    orm.define(countriesDef);
    orm.define(defs.states);
    orm.define(citiesDef);
    orm.define(defs.streets);
    orm.define(defs.roads);
    orm.prepare();

    let model = orm.get('countries');
    let f = model.fields.get('cities');
    assert(f);
    assert.equal(f.foreignModel.name, 'states');
    assert.equal(f.foreignKey, 'country_id');
    assert.equal(f.key, 'id');
    assert.deepEqual(f.filter, [{'id>=': 1}]);
    assert(f.towards);
    assert.equal(f.towards.foreignModel.name, 'cities');
    assert.equal(f.towards.foreignKey, 'state_id');
    assert.equal(f.towards.key, 'id');
    assert.deepEqual(f.towards.filter, [{'id>': 0}]);
    assert.deepEqual(f.towards.attributes, {id: null, name: null});

    f = model.fields.get('cities2');
    assert(f);
    assert.equal(f.foreignModel.name, 'states');
    assert.equal(f.foreignKey, 'country_id');
    assert.equal(f.key, 'id');
    assert.equal(f.attributes, null);
    assert(f.towards);
    assert.equal(f.towards.foreignModel.name, 'cities');
    assert.equal(f.towards.foreignKey, 'state_id');
    assert.equal(f.towards.key, 'id');
    assert.deepEqual(f.towards.attributes, {
      id: null,
      state_id: null,
      name: null
    });

    model = orm.get('cities');
    f = model.fields.get('state');
    assert(f);
    assert.equal(f.foreignModel.name, 'states');
    assert.equal(f.foreignKey, 'id');
    assert.equal(f.key, 'state_id');

    model = orm.get('streets');
    f = model.fields.get('city');
    assert(f);
    assert.equal(f.foreignModel.name, 'cities');
    assert.equal(f.foreignKey, 'id');
    assert.equal(f.key, 'cities_id');

    model = orm.get('roads');
    f = model.fields.get('state');
    assert(f);
    assert.equal(f.foreignModel.name, 'states');
    assert.equal(f.foreignKey, 'id');
    assert.equal(f.key, 'states_id');
  });

});
