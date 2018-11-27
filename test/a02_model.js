/* eslint-disable */
require('./support/env');
const assert = require('assert');
const merge = require('putil-merge');
const Uniqorm = require('../');

describe('Model', function() {

  const model1Def = {
    name: 'model1',
    schema: 'schema1',
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

  const model2Def = {
    name: 'model2',
    schema: 'schema1',
    tableName: 'table2',
    fields: {
      id: {
        dataType: 'INTEGER',
        primaryKey: true
      },
      model1_id: {
        dataType: 'INTEGER'
      }
    }
  };

  it('should validate field data types on create', function() {
    const orm = new Uniqorm();
    try {
      orm.define({
        name: 'model1',
        fields: {
          field1: {
            'dataType': 'UNKNOWN'
          }
        }
      });
    } catch (e) {
      if (e.message.includes('Unknown data type'))
        return;
      throw e;
    }
  });

  it('should define primary keys on create', function() {
    const orm = new Uniqorm();
    orm.define(model1Def);
    orm.prepare();
    const model1 = orm.getModel('model1');
    assert.deepEqual(model1.keyFields, ['id']);
  });

  it('should manipulate toString()', function() {
    const orm = new Uniqorm();
    orm.define(model1Def);
    const model1 = orm.getModel('model1');
    assert.deepEqual(String(model1), '[object Model<model1>]');
  });

  it('should tableNameFull property return schema.fieldname pattern', function() {
    const orm = new Uniqorm();
    let model1 = orm.define(model1Def);
    assert.deepEqual(model1.tableNameFull, 'schema1.table1');
    const model2Def = merge.clone(model1Def);
    model2Def.name = 'model2';
    delete model2Def.schema;
    const model2 = orm.define(model2Def);
    assert.deepEqual(model2.tableNameFull, 'table1');
  });

  it('should getField() return field instance', function() {
    const orm = new Uniqorm();
    const model1 = orm.define(model1Def);
    assert.deepEqual(model1.getField('id').name, 'id');
    assert.equal(model1.getField('id').orm, orm);
    assert.equal(model1.getField('id').model, model1);
  });

  it('should getField() throw error if field not found', function() {
    const orm = new Uniqorm();
    const model1 = orm.define(model1Def);
    try {
      model1.getField('unknown');
    } catch (e) {
      if (e.message.includes('has no field'))
        return;
      throw e;
    }
  });

  it('should addField() validate definition object', function() {
    const orm = new Uniqorm();
    const model1 = orm.define(model1Def);
    try {
      model1.addField('field3', 123);
    } catch (e) {
      if (e.message.includes('You must provide object instance'))
        return;
      throw e;
    }
  });

  it('should add data field to a model', function() {
    const orm = new Uniqorm();
    orm.define(model1Def);
    const model2 = orm.define(model2Def);
    model2.addField('field2', {
      dataType: 'DATE'
    });
    const field3 = model2.fields.field2;
    assert(field3);
    assert.equal(field3.dataType, 'DATE');
    assert.equal(field3.jsType, 'Date');
  });

  it('should add associated field to a model', function() {
    const orm = new Uniqorm();
    orm.define(model1Def);
    const model2 = orm.define(model2Def);
    model2.addField('field3', {
      foreignModel: 'model1',
      key: 'id',
      foreignKey: 'model1_id'
    });
    const field3 = model2.fields.field3;
    assert(field3);
    assert.equal(field3.foreignModel.name, 'model1');
  });

  it('should validate dataType argument while addl', function() {
    const orm = new Uniqorm();
    orm.define(model1Def);
    const model2 = orm.define(model2Def);
    try {
      model2.addField('field2', {});
    } catch (e) {
      if (e.message.includes('You must provide "dataType" property'))
        return;
      throw e;
    }
  });

  it('should getDataFields() return only data fields', function() {
    const orm = new Uniqorm();
    orm.define(model1Def);
    const model2 = orm.define(model2Def);
    model2.addField('field3', {
      foreignModel: 'model1',
      key: 'id',
      foreignKey: 'model1_id'
    });
    const a = model2.getDataFields();
    assert.equal(a.length, 2);
  });

  it('should toString() return custom formatted text', function() {
    const orm = new Uniqorm();
    const model2 = orm.define(model2Def);
    assert.equal(String(model2), '[object Model<model2>]');
    assert.equal(model2.inspect(), '[object Model<model2>]');
  });

});
