/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../');
const merge = require('putil-merge');
const loadModels = require('./support/loadModels');

describe('Model', function() {

  let pool;
  const model1Def = {
    name: 'model1',
    schemaName: 'schema1',
    tableName: 'table1',
    fields: {
      id: {
        dataType: 'INTEGER',
        primaryKey: true
      },
      field2: {
        dataType: 'VARCHAR'
      }
    }
  };

  before(function() {
    pool = sqb.pool({
      dialect: 'pg'
    });
  });

  it('should validate field data types on create', function() {
    const orm = new Uniqorm();
    try {
      orm.define('model1', {
        tableName: 'table1',
        fields: {
          field1: {
            'dataType': 'UNKNOWN'
          }
        }
      });
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should define primary keys on create', function() {
    const orm = new Uniqorm();
    orm.define(model1Def);
    orm.bake();
    const model1 = orm.get('model1');
    assert.deepEqual(model1.keyFields, ['id']);
  });

  it('should manipulate toString()', function() {
    const orm = new Uniqorm();
    orm.define(model1Def);
    const model1 = orm.get('model1');
    assert.deepEqual(String(model1), '[object Model<model1>]');
  });

  it('should tableNameFull property return schema.fieldname pattern', function() {
    const orm = new Uniqorm();
    let model1 = orm.define(model1Def);
    assert.deepEqual(model1.tableNameFull, 'schema1.table1');
    const model2Def = merge.clone(model1Def);
    model2Def.name = 'model2';
    delete model2Def.schemaName;
    const model2 = orm.define(model2Def);
    assert.deepEqual(model2.tableNameFull, 'table1');
  });

  it('should getField() return field instance', function() {
    const orm = new Uniqorm();
    const model1 = orm.define(model1Def);
    assert.deepEqual(model1.getField('id').name, 'id');
  });

  it('should getField() throw error if field not found', function() {
    const orm = new Uniqorm();
    const model1 = orm.define(model1Def);
    try {
      model1.getField('unknown');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should define associations', function() {
    return; //TODO
    const orm = new Uniqorm();
    loadModels(orm);
    const teams = orm.get('Teams');
    //assert(teams.associations.get('fk_teams_country'));
  });

});
