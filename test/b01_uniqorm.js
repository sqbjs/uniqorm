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
      return;
    }
    assert(0, 'Failed');
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

  it('should check name argument exists on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should check name argument valid on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define('124ABC');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
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
      return;
    }
    assert(0, 'Failed');
  });

  it('should check options argument exists and valid on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define('model1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should check options.tableName property exists on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define('model1', {});
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should check options.tableName property valid on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define('model1', {tableName: '123ABC'});
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should check options.fields property exists on define', function() {
    const orm = new Uniqorm();
    try {
      orm.define('model1', {tableName: 'Table1'});
    } catch (e) {
      try {
        orm.define('model1', {tableName: 'Table1', fields: 1234});
      } catch (e) {
        return;
      }
    }
    assert(0, 'Failed');
  });

  it('should not get unknown model', function() {
    const orm = new Uniqorm();
    try {
      orm.get('model2');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

});
