/* eslint-disable */
require('./support/env');
const assert = require('assert');
const Uniqorm = require('../');

describe('Fields', function() {

  describe('BOOLEAN', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('BOOLEAN'));
    });

    it('should create', function() {
      const BOOLEAN = Uniqorm.DataField.get('BOOLEAN');
      const f = new BOOLEAN('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Boolean');
      assert.equal(f.sqlType, 'BOOLEAN');
    });

    it('should create with properties', function() {
      const BOOLEAN = Uniqorm.DataField.get('BOOLEAN');
      const f = new BOOLEAN('field1', null, {
        notNull: 1,
        defaultValue: 5,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, true);
      assert.equal(f.primaryKey, true);
    });
  });

  describe('INTEGER', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('INTEGER'));
    });

    it('should create', function() {
      const INTEGER = Uniqorm.DataField.get('INTEGER');
      const f = new INTEGER('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Number');
      assert.equal(f.sqlType, 'INTEGER');
    });

    it('should create with properties', function() {
      const INTEGER = Uniqorm.DataField.get('INTEGER');
      const f = new INTEGER('field1', null, {
        notNull: 1,
        defaultValue: '5.6',
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, 5);
      assert.equal(f.primaryKey, true);
    });
  });

  describe('BIGINT', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('BIGINT'));
    });

    it('should create', function() {
      const BIGINT = Uniqorm.DataField.get('BIGINT');
      const f = new BIGINT('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Number');
      assert.equal(f.sqlType, 'BIGINT');
    });

    it('should create with properties', function() {
      const BIGINT = Uniqorm.DataField.get('BIGINT');
      const f = new BIGINT('field1', null, {
        notNull: 1,
        defaultValue: '5.6',
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, 5);
      assert.equal(f.primaryKey, true);
    });
  });

  describe('SMALLINT', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('SMALLINT'));
    });

    it('should create', function() {
      const SMALLINT = Uniqorm.DataField.get('SMALLINT');
      const f = new SMALLINT('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Number');
      assert.equal(f.sqlType, 'SMALLINT');
    });

    it('should create with properties', function() {
      const SMALLINT = Uniqorm.DataField.get('SMALLINT');
      const f = new SMALLINT('field1', null, {
        notNull: 1,
        defaultValue: '5.6',
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, 5);
      assert.equal(f.primaryKey, true);
    });
  });

  describe('DOUBLE', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('DOUBLE'));
    });

    it('should create', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Number');
      assert.equal(f.sqlType, 'DOUBLE');
    });

    it('should create with properties', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1', null, {
        notNull: 1,
        defaultValue: '5.6',
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, 5.6);
      assert.equal(f.primaryKey, true);
    });
  });

  describe('FLOAT', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('FLOAT'));
    });

    it('should create', function() {
      const FLOAT = Uniqorm.DataField.get('FLOAT');
      const f = new FLOAT('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Number');
      assert.equal(f.sqlType, 'FLOAT');
    });

    it('should create with properties', function() {
      const FLOAT = Uniqorm.DataField.get('FLOAT');
      const f = new FLOAT('field1', null, {
        notNull: 1,
        defaultValue: '5.6',
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, 5.6);
      assert.equal(f.primaryKey, true);
    });
  });

  describe('NUMBER', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('NUMBER'));
    });

    it('should create', function() {
      const NUMBER = Uniqorm.DataField.get('NUMBER');
      let f = new NUMBER('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Number');
      assert.equal(f.sqlType, 'NUMBER(18,2)');

      assert.equal(f.precision, 18);
      assert.equal(f.scale, 2);
      f = new NUMBER('field1', null, {});
      assert.equal(f.precision, 18);
      assert.equal(f.scale, 2);
    });

    it('should create with properties', function() {
      const NUMBER = Uniqorm.DataField.get('NUMBER');
      const f = new NUMBER('field1', null, {
        notNull: 1,
        defaultValue: '5.6',
        primaryKey: 8,
        fieldName: 'f1',
        precision: 12,
        scale: 4
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, 5.6);
      assert.equal(f.primaryKey, true);
      assert.equal(f.precision, 12);
      assert.equal(f.sqlType, 'NUMBER(12,4)');
      f.scale = null;
      assert.equal(f.sqlType, 'NUMBER(12,2)');
      f.scale = 3;
      f.precision = null;
      assert.equal(f.sqlType, 'NUMBER(18,3)');
    });
  });

  describe('TEXT', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('TEXT'));
    });

    it('should create', function() {
      const TEXT = Uniqorm.DataField.get('TEXT');
      const f = new TEXT('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'String');
      assert.equal(f.sqlType, 'TEXT');
    });

    it('should create with properties', function() {
      const TEXT = Uniqorm.DataField.get('TEXT');
      const f = new TEXT('field1', null, {
        notNull: 1,
        defaultValue: 12345,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, '12345');
      assert.equal(f.primaryKey, true);
      assert.equal(f.sqlType, 'TEXT');
    });
  });

  describe('CHAR', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('CHAR'));
    });

    it('should create', function() {
      const CHAR = Uniqorm.DataField.get('CHAR');
      const f = new CHAR('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'String');
      assert.equal(f.sqlType, 'CHAR');
    });

    it('should create with properties', function() {
      const CHAR = Uniqorm.DataField.get('CHAR');
      const f = new CHAR('field1', null, {
        notNull: 1,
        defaultValue: 12345,
        primaryKey: 8,
        fieldName: 'f1',
        charLength: 10
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, '12345');
      assert.equal(f.primaryKey, true);
      assert.equal(f.charLength, 10);
      assert.equal(f.sqlType, 'CHAR(10)');
    });
  });

  describe('VARCHAR', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('VARCHAR'));
    });

    it('should create', function() {
      const VARCHAR = Uniqorm.DataField.get('VARCHAR');
      const f = new VARCHAR('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'String');
      assert.equal(f.sqlType, 'VARCHAR');
      assert.equal(f.charLength, null);
    });

    it('should create with properties', function() {
      const VARCHAR = Uniqorm.DataField.get('VARCHAR');
      const f = new VARCHAR('field1', null, {
        notNull: 1,
        defaultValue: 12345,
        primaryKey: 8,
        fieldName: 'f1',
        charLength: 10
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, '12345');
      assert.equal(f.primaryKey, true);
      assert.equal(f.charLength, 10);
      assert.equal(f.sqlType, 'VARCHAR(10)');
      f.charLength = undefined;
      assert.equal(f.charLength, null);
    });
  });

  describe('CLOB', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('CLOB'));
    });

    it('should create', function() {
      const CLOB = Uniqorm.DataField.get('CLOB');
      const f = new CLOB('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'String');
      assert.equal(f.sqlType, 'CLOB');
    });

    it('should create with properties', function() {
      const CLOB = Uniqorm.DataField.get('CLOB');
      const f = new CLOB('field1', null, {
        notNull: 1,
        defaultValue: 12345,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, '12345');
      assert.equal(f.primaryKey, true);
    });
  });

  describe('TIMESTAMP', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('TIMESTAMP'));
    });

    it('should create', function() {
      const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
      const f = new TIMESTAMP('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Date');
      assert.equal(f.sqlType, 'TIMESTAMP');
    });

    it('should create with properties', function() {
      const d = new Date();
      const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
      const f = new TIMESTAMP('field1', null, {
        notNull: 1,
        defaultValue: d.getTime(),
        primaryKey: 8,
        fieldName: 'f1',
        charLength: 10
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue.getTime(), d.getTime());
      assert.equal(f.primaryKey, true);
      f.defaultValue = d;
      assert.equal(f.defaultValue.getTime(), d.getTime());
    });
  });

  describe('DATE', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('DATE'));
    });

    it('should create', function() {
      const DATE = Uniqorm.DataField.get('DATE');
      const f = new DATE('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Date');
      assert.equal(f.sqlType, 'DATE');
    });

    it('should create with properties', function() {
      const d1 = new Date();
      const d2 = new Date(d1.getTime());
      d2.setHours(0, 0, 0, 0);
      const DATE = Uniqorm.DataField.get('DATE');
      const f = new DATE('field1', null, {
        notNull: 1,
        defaultValue: d1.getTime(),
        primaryKey: 8,
        fieldName: 'f1',
        charLength: 10
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue.getTime(), d2.getTime());
      assert.equal(f.primaryKey, true);
      f.defaultValue = d1;
      assert.equal(f.defaultValue.getTime(), d2.getTime());
    });
  });

  describe('TIME', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('TIME'));
    });

    it('should create', function() {
      const TIME = Uniqorm.DataField.get('TIME');
      const f = new TIME('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Date');
      assert.equal(f.sqlType, 'TIME');
    });

    it('should create with properties', function() {
      const d1 = new Date();
      const d2 = new Date(d1.getTime());
      d2.setFullYear(0, 0, 0);
      const TIME = Uniqorm.DataField.get('TIME');
      const f = new TIME('field1', null, {
        notNull: 1,
        defaultValue: d1.getTime(),
        primaryKey: 8,
        fieldName: 'f1',
        charLength: 10
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue.getTime(), d2.getTime());
      assert.equal(f.primaryKey, true);
      f.defaultValue = d1;
      assert.equal(f.defaultValue.getTime(), d2.getTime());
    });
  });

  describe('BUFFER', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('BUFFER'));
    });

    it('should create', function() {
      const BUFFER = Uniqorm.DataField.get('BUFFER');
      const f = new BUFFER('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Buffer');
      assert.equal(f.sqlType, 'BUFFER');
    });

    it('should create with properties', function() {
      const BUFFER = Uniqorm.DataField.get('BUFFER');
      const f = new BUFFER('field1', null, {
        notNull: 1,
        defaultValue: 5,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, true);
    });
  });

  describe('BLOB', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('BLOB'));
    });

    it('should create', function() {
      const BLOB = Uniqorm.DataField.get('BLOB');
      const f = new BLOB('field1');
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'field1');
      assert.equal(f.notNull, null);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, null);

      assert.equal(f.jsType, 'Buffer');
      assert.equal(f.sqlType, 'BLOB');
    });

    it('should create with properties', function() {
      const BLOB = Uniqorm.DataField.get('BLOB');
      const f = new BLOB('field1', null, {
        notNull: 1,
        defaultValue: 5,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.equal(f.name, 'field1');
      assert.equal(f.fieldName, 'f1');
      assert.equal(f.notNull, true);
      assert.equal(f.defaultValue, null);
      assert.equal(f.primaryKey, true);
    });
  });

});
