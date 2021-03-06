/* eslint-disable */
require('./support/env');
const assert = require('assert');
const Uniqorm = require('../');
const fecha = require('fecha');

describe('Data Fields', function() {

  describe('BOOLEAN', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('BOOLEAN'));
    });

    it('should construct', function() {
      const BOOLEAN = Uniqorm.DataField.get('BOOLEAN');
      const f = new BOOLEAN('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'Boolean');
      assert.strictEqual(f.sqlType, 'BOOLEAN');
    });

    it('should create with properties', function() {
      const BOOLEAN = Uniqorm.DataField.get('BOOLEAN');
      const f = new BOOLEAN('field1', null, {
        notNull: 1,
        defaultValue: 5,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, true);
      assert.strictEqual(f.primaryKey, true);
    });

    it('should parse', function() {
      const BOOLEAN = Uniqorm.DataField.get('BOOLEAN');
      const f = new BOOLEAN('field1');
      assert.strictEqual(f.parse(true), true);
      assert.strictEqual(f.parse(false), false);
      assert.strictEqual(f.parse(0), false);
      assert.strictEqual(f.parse(1), true);
      assert.strictEqual(f.parse({}), true);
      assert.strictEqual(f.parse(NaN), false);
      assert.strictEqual(f.parse(undefined), null);
    });

    it('should serialize', function() {
      const BOOLEAN = Uniqorm.DataField.get('BOOLEAN');
      const f = new BOOLEAN('field1');
      assert.strictEqual(f.serialize(true), true);
      assert.strictEqual(f.serialize(false), false);
      assert.strictEqual(f.serialize(0), false);
      assert.strictEqual(f.serialize(1), true);
      assert.strictEqual(f.serialize({}), true);
      assert.strictEqual(f.serialize(NaN), false);
      assert.strictEqual(f.serialize(undefined), null);
    });

  });

  describe('INTEGER', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('INTEGER'));
    });

    it('should construct', function() {
      const INTEGER = Uniqorm.DataField.get('INTEGER');
      const f = new INTEGER('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'Number');
      assert.strictEqual(f.sqlType, 'INTEGER');
    });

    it('should create with properties', function() {
      const INTEGER = Uniqorm.DataField.get('INTEGER');
      const f = new INTEGER('field1', null, {
        notNull: 1,
        defaultValue: '5.6',
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, 5);
      assert.strictEqual(f.primaryKey, true);
    });

    it('should parse', function() {
      const INTEGER = Uniqorm.DataField.get('INTEGER');
      const f = new INTEGER('field1');
      assert.strictEqual(f.parse(0), 0);
      assert.strictEqual(f.parse(1), 1);
      assert.strictEqual(f.parse('123'), 123);
      assert.strictEqual(f.parse('123.5'), 123);
      assert.strictEqual(f.parse(undefined), null);
    });

    it('should serialize', function() {
      const INTEGER = Uniqorm.DataField.get('INTEGER');
      const f = new INTEGER('field1');
      assert.strictEqual(f.serialize(0), 0);
      assert.strictEqual(f.serialize(1), 1);
      assert.strictEqual(f.serialize('123'), 123);
      assert.strictEqual(f.serialize('123.5'), 123);
      assert.strictEqual(f.serialize(undefined), null);
    });

  });

  describe('BIGINT', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('BIGINT'));
    });

    it('should construct', function() {
      const BIGINT = Uniqorm.DataField.get('BIGINT');
      const f = new BIGINT('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'Number');
      assert.strictEqual(f.sqlType, 'BIGINT');
    });

  });

  describe('SMALLINT', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('SMALLINT'));
    });

    it('should construct', function() {
      const SMALLINT = Uniqorm.DataField.get('SMALLINT');
      const f = new SMALLINT('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'Number');
      assert.strictEqual(f.sqlType, 'SMALLINT');
    });

  });

  describe('DOUBLE', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('DOUBLE'));
    });

    it('should construct', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'Number');
      assert.strictEqual(f.sqlType, 'DOUBLE');
    });

    it('should create with properties', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1', null, {
        notNull: 1,
        defaultValue: '5.6',
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, 5.6);
      assert.strictEqual(f.primaryKey, true);
    });

    it('should parse', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1');
      assert.strictEqual(f.parse(0), 0);
      assert.strictEqual(f.parse(1), 1);
      assert.strictEqual(f.parse('123'), 123);
      assert.strictEqual(f.parse('123.5'), 123.5);
      assert.strictEqual(f.parse(undefined), null);
    });

    it('should serialize', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1');
      assert.strictEqual(f.parse(0), 0);
      assert.strictEqual(f.parse(1), 1);
      assert.strictEqual(f.parse('123'), 123);
      assert.strictEqual(f.parse('123.5'), 123.5);
      assert.strictEqual(f.parse(undefined), null);
    });

    it('should validate value is a valid number', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1', null, {});
      assert.throws(() => {
        f.parse('abc');
      }, /is not a valid number value/);
    });

    it('should validate minValue', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1', null, {
        minValue: 10
      });
      assert.throws(() => {
        f.parse('2');
      }, /Value is out of range/);
    });

    it('should validate minValue method', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1', null, {
        minValue: () => 10
      });
      assert.throws(() => {
        f.parse('2');
      }, /Value is out of range/);
    });

    it('should validate maxValue', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1', null, {
        maxValue: 10
      });
      assert.throws(() => {
        f.parse('11');
      }, /Value is out of range/);
    });

    it('should validate maxValue method', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1', null, {
        maxValue: () => 10
      });
      assert.throws(() => {
        f.parse('11');
      }, /Value is out of range/);
    });

    it('should validate using custom validator', function() {
      const DOUBLE = Uniqorm.DataField.get('DOUBLE');
      const f = new DOUBLE('field1', null, {
        maxValue: 10,
        validate: (v) => {
          if (v < 0)
            throw new Error('Invalid value');
        }
      });
      assert.throws(() => {
        f.parse(-1);
      }, /Invalid value/);
    });

  });

  describe('FLOAT', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('FLOAT'));
    });

    it('should construct', function() {
      const FLOAT = Uniqorm.DataField.get('FLOAT');
      const f = new FLOAT('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'Number');
      assert.strictEqual(f.sqlType, 'FLOAT');
    });

  });

  describe('NUMBER', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('NUMBER'));
    });

    it('should construct', function() {
      const NUMBER = Uniqorm.DataField.get('NUMBER');
      let f = new NUMBER('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);

      assert.strictEqual(f.jsType, 'Number');
      assert.strictEqual(f.sqlType, 'NUMBER(18,2)');

      assert.strictEqual(f.precision, 18);
      assert.strictEqual(f.scale, 2);
      f = new NUMBER('field1', null, {});
      assert.strictEqual(f.precision, 18);
      assert.strictEqual(f.scale, 2);
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
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, 5.6);
      assert.strictEqual(f.primaryKey, true);
      assert.strictEqual(f.precision, 12);
      assert.strictEqual(f.sqlType, 'NUMBER(12,4)');
      f.scale = null;
      assert.strictEqual(f.sqlType, 'NUMBER(12,2)');
      f.scale = 3;
      f.precision = null;
      assert.strictEqual(f.sqlType, 'NUMBER(18,3)');
    });

    it('should set scale to 0 if value is invalid', function() {
      const NUMBER = Uniqorm.DataField.get('NUMBER');
      const f = new NUMBER('field1', null, {
        scale: 'abc'
      });
      assert.strictEqual(f.scale, 0);
    });

  });

  describe('TEXT', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('TEXT'));
    });

    it('should construct', function() {
      const TEXT = Uniqorm.DataField.get('TEXT');
      const f = new TEXT('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'String');
      assert.strictEqual(f.sqlType, 'TEXT');
    });

    it('should create with properties', function() {
      const TEXT = Uniqorm.DataField.get('TEXT');
      const f = new TEXT('field1', null, {
        notNull: 1,
        defaultValue: 12345,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, '12345');
      assert.strictEqual(f.primaryKey, true);
      assert.strictEqual(f.sqlType, 'TEXT');
    });

    it('should parse', function() {
      const TEXT = Uniqorm.DataField.get('TEXT');
      const f = new TEXT('field1');
      assert.strictEqual(f.parse(0), '0');
      assert.strictEqual(f.parse(1), '1');
      assert.strictEqual(f.parse('123'), '123');
      assert.strictEqual(f.parse('123.5'), '123.5');
      assert.strictEqual(f.parse(NaN), 'NaN');
      assert.strictEqual(f.parse(undefined), null);
    });

    it('should serialize', function() {
      const TEXT = Uniqorm.DataField.get('TEXT');
      const f = new TEXT('field1');
      assert.strictEqual(f.serialize(0), '0');
      assert.strictEqual(f.serialize(1), '1');
      assert.strictEqual(f.serialize('123'), '123');
      assert.strictEqual(f.serialize('123.5'), '123.5');
      assert.strictEqual(f.serialize(NaN), 'NaN');
      assert.strictEqual(f.serialize(undefined), null);
    });

  });

  describe('CHAR', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('CHAR'));
    });

    it('should construct', function() {
      const CHAR = Uniqorm.DataField.get('CHAR');
      const f = new CHAR('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'String');
      assert.strictEqual(f.sqlType, 'CHAR');
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
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, '12345');
      assert.strictEqual(f.primaryKey, true);
      assert.strictEqual(f.charLength, 10);
      assert.strictEqual(f.sqlType, 'CHAR(10)');
    });
  });

  describe('VARCHAR', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('VARCHAR'));
    });

    it('should construct', function() {
      const VARCHAR = Uniqorm.DataField.get('VARCHAR');
      const f = new VARCHAR('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'String');
      assert.strictEqual(f.sqlType, 'VARCHAR');
      assert.strictEqual(f.charLength, null);
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
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, '12345');
      assert.strictEqual(f.primaryKey, true);
      assert.strictEqual(f.charLength, 10);
      assert.strictEqual(f.sqlType, 'VARCHAR(10)');
      f.charLength = undefined;
      assert.strictEqual(f.charLength, null);
    });

    it('should set charLength to null if value is invalid', function() {
      const VARCHAR = Uniqorm.DataField.get('VARCHAR');
      const f = new VARCHAR('field1', null, {
        charLength: 'abc'
      });
      assert.strictEqual(f.charLength, null);
    });

  });

  describe('CLOB', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('CLOB'));
    });

    it('should construct', function() {
      const CLOB = Uniqorm.DataField.get('CLOB');
      const f = new CLOB('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.parse(0), '0');
      assert.strictEqual(f.jsType, 'String');
      assert.strictEqual(f.sqlType, 'CLOB');
    });

    it('should create with properties', function() {
      const CLOB = Uniqorm.DataField.get('CLOB');
      const f = new CLOB('field1', null, {
        notNull: 1,
        defaultValue: 12345,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, '12345');
      assert.strictEqual(f.primaryKey, true);
    });
  });

  describe('TIMESTAMP', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('TIMESTAMP'));
    });

    it('should construct', function() {
      const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
      const f = new TIMESTAMP('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'Date');
      assert.strictEqual(f.sqlType, 'TIMESTAMP');
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
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue.getTime(), d.getTime());
      assert.strictEqual(f.primaryKey, true);
      f.defaultValue = d;
      assert.strictEqual(f.defaultValue.getTime(), d.getTime());
    });

    it('should parse', function() {
      const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
      const f = new TIMESTAMP('field1');
      assert.deepStrictEqual(f.parse(0), new Date(0));
      assert.deepStrictEqual(f.parse(new Date(1)), new Date(1));
      assert.deepStrictEqual(f.parse('2018-11-05'), new Date('2018-11-05T00:00:00'));
      assert.deepStrictEqual(f.parse('2018-11-05 10:15:30.654'), new Date('2018-11-05T10:15:30.654'));
      assert.deepStrictEqual(f.parse('2018-11-05T10:15:30.654'), new Date('2018-11-05T10:15:30.654'));
      assert.deepStrictEqual(f.parse('2018-11-05T10:15:30.654Z'), new Date('2018-11-05T10:15:30.654Z'));
      assert.deepStrictEqual(f.parse(undefined), null);

    });

    it('should serialize', function() {
      const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
      const f = new TIMESTAMP('field1');
      assert.deepStrictEqual(f.serialize(0), fecha.format(new Date(0), 'YYYY-MM-DDTHH:mm:ss'));
      assert.deepStrictEqual(f.serialize(new Date(1)),
          fecha.format(new Date(1), 'YYYY-MM-DDTHH:mm:ss.SSS'));
      assert.deepStrictEqual(f.serialize('2018-11-05'),
          fecha.format(new Date('2018-11-05T00:00:00'), 'YYYY-MM-DDTHH:mm:ss'));
      assert.deepStrictEqual(f.serialize('2018-11-05 10:15:30.654'),
          fecha.format(new Date('2018-11-05T10:15:30.654'), 'YYYY-MM-DDTHH:mm:ss.SSS'));
      assert.deepStrictEqual(f.serialize('2018-11-05T10:15:30.654'),
          fecha.format(new Date('2018-11-05T10:15:30.654'), 'YYYY-MM-DDTHH:mm:ss.SSS'));
      assert.deepStrictEqual(f.serialize('2018-11-05T10:15:30.654Z'),
          fecha.format(new Date('2018-11-05T10:15:30.654Z'), 'YYYY-MM-DDTHH:mm:ss.SSS'));
      assert.deepStrictEqual(f.serialize(undefined), null);
    });

    it('should parse NOW string as current time', function() {
      const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
      const f = new TIMESTAMP('field1', null, {});
      assert(f.parse('NOW') instanceof Date);
    });

    it('should parse DATE string as current date', function() {
      const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
      const f = new TIMESTAMP('field1', null, {});
      assert(f.parse('DATE') instanceof Date);
    });

    it('should parse() validate value', function() {
      assert.throws(() => {
        const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
        const f = new TIMESTAMP('field1', null, {});
        f.parse('abcd');
      });
      assert.throws(() => {
        const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
        const f = new TIMESTAMP('field1', null, {});
        f.parse({});
      });
    });

    it('should validate minValue', function() {
      assert.throws(() => {
        const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
        const f = new TIMESTAMP('field1', null, {
          minValue: '1990-01-02'
        });
        f.parse('1990-01-01');
      }, /Value is out of range/);
    });

    it('should validate minValue method', function() {
      assert.throws(() => {
        const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
        const f = new TIMESTAMP('field1', null, {
          minValue: () => '1990-01-02'
        });
        f.parse('1990-01-01');
      }, /Value is out of range/);
    });

    it('should validate maxValue', function() {
      assert.throws(() => {
        const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
        const f = new TIMESTAMP('field1', null, {
          maxValue: '1990-01-01'
        });
        f.parse('1990-01-02');
      }, /Value is out of range/);
    });

    it('should validate maxValue method', function() {
      assert.throws(() => {
        const TIMESTAMP = Uniqorm.DataField.get('TIMESTAMP');
        const f = new TIMESTAMP('field1', null, {
          maxValue: () => '1990-01-01'
        });
        f.parse('1990-01-02');
      }, /Value is out of range/);
    });

  });

  describe('TIMESTAMPTZ', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('TIMESTAMPTZ'));
    });

  });

  describe('DATE', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('DATE'));
    });

    it('should construct', function() {
      const DATE = Uniqorm.DataField.get('DATE');
      const f = new DATE('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      const d1 = new Date(0);
      d1.setHours(0, 0, 0);
      assert.strictEqual(f.jsType, 'Date');
      assert.strictEqual(f.sqlType, 'DATE');
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
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue.getTime(), d2.getTime());
      assert.strictEqual(f.primaryKey, true);
      f.defaultValue = d1;
      assert.strictEqual(f.defaultValue.getTime(), d2.getTime());
    });

    it('should parse', function() {
      const DATE = Uniqorm.DataField.get('DATE');
      const f = new DATE('field1');
      assert.deepStrictEqual(f.parse(0), new Date('1970-01-01T00:00:00'));
      assert.deepStrictEqual(f.parse(new Date('1970-01-01T00:00:00')), new Date('1970-01-01T00:00:00'));
      assert.deepStrictEqual(f.parse('2018-11-05'), new Date('2018-11-05T00:00:00'));
      assert.deepStrictEqual(f.parse('2018-11-05 10:15:30.654'), new Date('2018-11-05T00:00:00'));
      assert.deepStrictEqual(f.parse('2018-11-05T10:15:30.654'), new Date('2018-11-05T00:00:00'));
      assert.deepStrictEqual(f.parse(undefined), null);

    });

    it('should serialize', function() {
      const DATE = Uniqorm.DataField.get('DATE');
      const f = new DATE('field1');
      assert.deepStrictEqual(f.serialize(0), fecha.format(new Date(0), 'YYYY-MM-DD'));
      assert.deepStrictEqual(f.serialize(new Date(1)),
          fecha.format(new Date(1), 'YYYY-MM-DD'));
      assert.deepStrictEqual(f.serialize('2018-11-05'),
          fecha.format(new Date('2018-11-05T00:00:00'), 'YYYY-MM-DD'));
      assert.deepStrictEqual(f.serialize('2018-11-05 10:15:30.654'),
          fecha.format(new Date('2018-11-05T10:15:30.654'), 'YYYY-MM-DD'));
      assert.deepStrictEqual(f.serialize('2018-11-05T10:15:30.654'),
          fecha.format(new Date('2018-11-05T10:15:30.654'), 'YYYY-MM-DD'));
      assert.deepStrictEqual(f.serialize('2018-11-05T10:15:30.654Z'),
          fecha.format(new Date('2018-11-05T10:15:30.654Z'), 'YYYY-MM-DD'));
      assert.deepStrictEqual(f.serialize(undefined), null);
    });

  });

  describe('TIME', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('TIME'));
    });

    it('should construct', function() {
      const TIME = Uniqorm.DataField.get('TIME');
      const f = new TIME('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);
      assert.strictEqual(f.jsType, 'Date');
      assert.strictEqual(f.sqlType, 'TIME');
    });

    it('should create with properties', function() {
      const d1 = new Date();
      const d2 = new Date(d1.getTime());
      d2.setFullYear(1970, 0, 1);
      const TIME = Uniqorm.DataField.get('TIME');
      const f = new TIME('field1', null, {
        notNull: 1,
        defaultValue: d1.getTime(),
        primaryKey: 8,
        fieldName: 'f1',
        charLength: 10
      });
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue.getTime(), d2.getTime());
      assert.strictEqual(f.primaryKey, true);
      f.defaultValue = d1;
      assert.strictEqual(f.defaultValue.getTime(), d2.getTime());
    });

    it('should parse', function() {
      const TIME = Uniqorm.DataField.get('TIME');
      const f = new TIME('field1');
      const d1 = new Date(0);
      const d2 = new Date('2018-10-05T10:15:30.654');
      d1.setFullYear(1970, 0, 1);
      d2.setFullYear(1970, 0, 1);
      assert.deepStrictEqual(f.parse(0), d1);
      assert.deepStrictEqual(f.parse(new Date(0)), d1);
      assert.deepStrictEqual(f.parse('10:15:30.654'), d2);
      assert.deepStrictEqual(f.parse('2018-11-05T10:15:30.654'), d2);
      assert.deepStrictEqual(f.parse('2018-11-05T10:15:30.654'), d2);
      assert.deepStrictEqual(f.parse(undefined), null);
    });

    it('should serialize', function() {
      const TIME = Uniqorm.DataField.get('TIME');
      const f = new TIME('field1');
      assert.deepStrictEqual(f.serialize(0), fecha.format(new Date(0), 'HH:mm:ss'));
      assert.deepStrictEqual(f.serialize(new Date('2018-11-05 10:15:30.654')),
          fecha.format(new Date('2018-11-05 10:15:30.654'), 'HH:mm:ss.SSS'));
      assert.deepStrictEqual(f.serialize('2018-11-05'),
          fecha.format(new Date('2018-11-05T00:00:00'), 'HH:mm:ss'));
      assert.deepStrictEqual(f.serialize('2018-11-05 10:15:30.654'),
          fecha.format(new Date('2018-11-05T10:15:30.654'), 'HH:mm:ss.SSS'));
      assert.deepStrictEqual(f.serialize('2018-11-05T10:15:30.654'),
          fecha.format(new Date('2018-11-05T10:15:30.654'), 'HH:mm:ss.SSS'));
      assert.deepStrictEqual(f.serialize('2018-11-05T10:15:30.654Z'),
          fecha.format(new Date('2018-11-05T10:15:30.654Z'), 'HH:mm:ss.SSS'));
      assert.deepStrictEqual(f.serialize(undefined), null);
    });

  });

  describe('BUFFER', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('BUFFER'));
    });

    it('should construct', function() {
      const BUFFER = Uniqorm.DataField.get('BUFFER');
      const f = new BUFFER('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);

      assert.strictEqual(f.jsType, 'Buffer');
      assert.strictEqual(f.sqlType, 'BUFFER');
    });

    it('should create with properties', function() {
      const BUFFER = Uniqorm.DataField.get('BUFFER');
      const f = new BUFFER('field1', null, {
        notNull: 1,
        defaultValue: 5,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, true);
    });
  });

  describe('BLOB', function() {

    it('should be registered', function() {
      assert(Uniqorm.DataField.get('BLOB'));
    });

    it('should construct', function() {
      const BLOB = Uniqorm.DataField.get('BLOB');
      const f = new BLOB('field1');
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'field1');
      assert.strictEqual(f.notNull, null);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, null);

      assert.strictEqual(f.jsType, 'Buffer');
      assert.strictEqual(f.sqlType, 'BLOB');
    });

    it('should create with properties', function() {
      const BLOB = Uniqorm.DataField.get('BLOB');
      const f = new BLOB('field1', null, {
        notNull: 1,
        defaultValue: 5,
        primaryKey: 8,
        fieldName: 'f1'
      });
      assert.strictEqual(f.name, 'field1');
      assert.strictEqual(f.fieldName, 'f1');
      assert.strictEqual(f.notNull, true);
      assert.strictEqual(f.defaultValue, null);
      assert.strictEqual(f.primaryKey, true);
    });
  });

});
