/* eslint-disable */
require('./support/env');
const assert = require('assert');
const Uniqorm = require('../');

describe('Associations', function() {

  it('should define associations', function() {
    const orm = new Uniqorm();
    orm.define({
      name: 'masters',
      fields: {
        id: 'INTEGER'
      }
    });
    orm.define({
      name: 'details',
      fields: {
        id: 'INTEGER',
        master_id: 'INTEGER'
      },
      associations: [
        {
          name: 'fk_details_master',
          foreignModel: 'masters',
          foreignKey: 'id',
          key: 'master_id'
        }
      ]
    });
    const details = orm.getModel('details');
    assert.strictEqual(details.associations.length, 1);
    assert.strictEqual(details.associations[0].orm, orm);
    assert.strictEqual(details.associations[0].name, 'fk_details_master');
    assert.strictEqual(details.associations[0].key, 'master_id');
    assert.strictEqual(details.associations[0].foreignKey, 'id');
    assert.strictEqual(details.associations[0].model.name, 'details');
    assert.strictEqual(String(details.associations[0]), '[object Association(details.master_id>masters.id)]');
    assert.strictEqual(details.associations[0].inspect(), '[object Association(details.master_id>masters.id)]');
    assert.strictEqual(details.associations[0].foreignModel.name, 'masters');
  });

  it('should check "key" property is provided', function() {
    const orm = new Uniqorm();
    assert.throws(() => {
      orm.define({
        name: 'details2',
        fields: {
          id: 'INTEGER',
          master_id: 'INTEGER'
        },
        associations: [
          {
            name: 'fk_details_master',
            foreignModel: 'masters',
            foreignKey: 'id'
          }
        ]
      });
    }, /You must provide "key" property/);
  });

  it('should check "foreignKey" property is provided', function() {
    const orm = new Uniqorm();
    assert.throws(() => {
      orm.define({
        name: 'details2',
        fields: {
          id: 'INTEGER',
          master_id: 'INTEGER'
        },
        associations: [
          {
            name: 'fk_details_master',
            foreignModel: 'masters',
            key: 'master_id'
          }
        ]
      });
    }, /You must provide "foreignKey" property/);
  });

  it('should check "foreignModel" property is provided', function() {
    const orm = new Uniqorm();
    assert.throws(() => {
      orm.define({
        name: 'details2',
        fields: {
          id: 'INTEGER',
          master_id: 'INTEGER'
        },
        associations: [
          {
            name: 'fk_details_master',
            key: 'master_id',
            foreignKey: 'id'
          }
        ]
      });
    }, /You must provide "foreignModel" property/);
  });

  it('should validate jointType', function() {
    const orm = new Uniqorm();
    assert.throws(() => {
      orm.define({
        name: 'details2',
        fields: {
          id: 'INTEGER',
          master_id: 'INTEGER'
        },
        associations: [
          {
            name: 'fk_details_master',
            key: 'master_id',
            foreignKey: 'id'
          }
        ]
      });
    }, /You must provide "foreignModel" property/);
  });


});
