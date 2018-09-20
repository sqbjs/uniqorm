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
    assert(orm.models);
    orm = new Uniqorm(null, {silent: true});
    assert(orm.models);
    assert.equal(orm.options.silent, true);
    orm = new Uniqorm(pool);
    assert(orm);
    assert(orm.models);
  });

  it('should validate arguments on create', function() {
    try {
      new Uniqorm(new Date());
    } catch (e) {
      if (e.message.includes('First argument can be'))
        return;
      throw e;
    }
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
    const model1 = orm.get('model1');
  });

  it('should check modelDef argument exists in define() function', function() {
    const orm = new Uniqorm();
    try {
      orm.define();
    } catch (e) {
      if (e.message.includes('(modelDef) is empty or is not valid'))
        return;
      throw e;
    }
  });

  it('should check model not defined before', function() {
    const orm = new Uniqorm();
    try {
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
    } catch (e) {
      if (e.message.includes('already exists'))
        return;
      throw e;
    }
  });

  it('should check name argument valid on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define({name: '124ABC'});
    } catch (e) {
      if (e.message.includes('Invalid model name')) {
        try {
          orm.define({});
        } catch (e) {
          if (e.message.includes('You must provide model name'))
            return;
          throw e;
        }
      }
      throw e;
    }
  });

  it('should check options.fields property exists on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define({name: 'model1'});
    } catch (e) {
      if (e.message.includes('`fields` property is empty or is not valid')) {
        try {
          orm.define({name: 'model1', fields: 1234});
        } catch (e) {
          if (e.message.includes('`fields` property is empty or is not valid'))
            return;
        }
      }
      throw e;
    }
  });

  it('should check options.tableName property valid on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define({name: 'model1', tableName: '123ABC'});
    } catch (e) {
      if (e.message.includes('Invalid tableName'))
        return;
      throw e;
    }
  });

  it('should not get unknown model', function() {
    const orm = new Uniqorm();
    try {
      orm.get('model1234');
    } catch (e) {
      if (e.message.includes('not found'))
        return;
      throw e;
    }
  });

});
