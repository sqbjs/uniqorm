/* eslint-disable */
require('./support/env');
const assert = require('assert');
const Uniqorm = require('../');
const CalculatedField = require('../lib/CalculatedField');

describe('Calculated Fields', function() {

  it('should create', function() {
    const orm = new Uniqorm();
    orm.define({
      name: 'model1',
      fields: {
        calcfield: {
          calculate: () => 1,
          requires: 'field1'
        }
      }
    });
    const model1 = orm.getModel('model1');
    const f1 = model1.getField('calcfield');
    assert(f1 instanceof CalculatedField);
    assert.strictEqual(typeof f1.calculate, 'function');
    assert(Array.isArray(f1.requires));
  });

  it('should validate "calculate" property is function', function() {
    assert.throws(() => {
      const orm = new Uniqorm();
      orm.define({
        name: 'model1',
        fields: {
          calcfield: {
            calculate: 1
          }
        }
      });

    }, /You must provide a Function/);
  });

});
