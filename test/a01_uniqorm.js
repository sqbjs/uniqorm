/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const Uniqorm = require('../');

sqb.use(require('sqb-connect-pg'));

describe('Uniqorm', function() {

  let pool;

  before(function() {
    pool = sqb.pool({
      dialect: 'pg'
    });
  });

  it('should initialize', function() {
    let orm = new Uniqorm();
    assert(orm.schemas);
    orm = new Uniqorm(null, {silent: true});
    assert.strictEqual(orm.options.silent, true);
    orm = new Uniqorm(pool);
    assert(orm);
  });

  it('should validate arguments on create', function() {
    assert.throws(() => {
      new Uniqorm(new Date());
    }, /First argument can be/);
  });

  it('should define model', function() {
    const orm = new Uniqorm();
    orm.define({
      name: 'model1',
      fields: {
        field1: {
          dataType: 'INTEGER'
        },
        field2: {
          dataType: 'VARCHAR'
        }
      }
    });
    orm.getModel('model1');
  });

  it('should check modelDef argument exists in define() function', function() {
    assert.throws(() => {
      const orm = new Uniqorm();
      orm.define();
    }, /is empty or is not valid/);
  });

  it('should check model not defined before', function() {
    assert.throws(() => {
      const orm = new Uniqorm();
      orm.define({
        name: 'model1',
        tableName: 'table1',
        fields: {
          field1: {
            dataType: 'INTEGER'
          }
        }
      });
      orm.define({name: 'model1'});
    }, /already exists/);
  });

  it('should check name argument valid on define', function() {
    const orm = new Uniqorm();
    assert.throws(() => {
      orm.define({name: '124ABC'});
    }, /Invalid model name/);
    assert.throws(() => {
      orm.define({});
    }, /You must provide model name/);
  });

  it('should check options.fields property exists on define', function() {
    const orm = new Uniqorm();
    assert.throws(() => {
      orm.define({name: 'model1'});
    }, /`fields` property is empty or is not valid/);
    assert.throws(() => {
      orm.define({name: 'model1', fields: 1234});
    }, /`fields` property is empty or is not valid/);
  });

  it('should check options.tableName property valid on define', function() {
    const orm = new Uniqorm();
    assert.throws(() => {
      orm.define({name: 'model1', tableName: '123ABC'});
    }, /Invalid tableName/);
  });

  it('should not get unknown schema', function() {
    const orm = new Uniqorm();
    assert.throws(() => {
      orm.getModel('model1234');
    }, /No such/);
  });

  it('should not get unknown model', function() {
    const orm = new Uniqorm();
    orm.define({
      name: 'model1',
      schema: 'schema1',
      fields: {
        field1: {
          dataType: 'INTEGER'
        },
        field2: {
          dataType: 'VARCHAR'
        }
      }
    });
    assert.throws(() => {
      orm.getModel('model1234');
    }, /Schema "schema1" has no model/);
  });

});
