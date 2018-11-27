/* eslint-disable */
require('./support/env');
const assert = require('assert');
const Uniqorm = require('../');

describe('Associations', function() {

  it('should check "key" property is provided', function() {
    const orm = new Uniqorm();
    try {
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
    } catch (err) {
      if (err.message.includes('You must provide "key" property'))
        return;
      throw err;
    }
  });

  it('should check "foreignKey" property is provided', function() {
    const orm = new Uniqorm();
    try {
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
    } catch (err) {
      if (err.message.includes('You must provide "foreignKey" property'))
        return;
      throw err;
    }
  });

  it('should check "foreignModel" property is provided', function() {
    const orm = new Uniqorm();
    try {
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
    } catch (err) {
      if (err.message.includes('You must provide "foreignModel" property'))
        return;
      throw err;
    }
  });

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
    assert.equal(details.associations.length, 1);
    assert.equal(details.associations[0].orm, orm);
    assert.equal(details.associations[0].name, 'fk_details_master');
    assert.equal(details.associations[0].key, 'master_id');
    assert.equal(details.associations[0].foreignKey, 'id');
    assert.equal(details.associations[0].model.name, 'details');
    assert.equal(String(details.associations[0]), '[object Association(details.master_id>masters.id)]');
    assert.equal(details.associations[0].inspect(), '[object Association(details.master_id>masters.id)]');
    assert.equal(details.associations[0].foreignModel.name, 'masters');
  });

});
