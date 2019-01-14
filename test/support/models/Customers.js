const merge = require('putil-merge');

module.exports = merge.all([{}, require('./Customers.json'), {
  fields: {
    street: {
      foreignModel: 'uniqorm_1.Streets',
      attributes: ['id', 'name']
    },
    city: {
      foreignModel: 'uniqorm_1.Streets',
      towards: 'uniqorm_1.Cities'
    },
    country: {
      foreignModel: 'uniqorm_1.Streets',
      towards: {
        foreignModel: 'uniqorm_1.Cities',
        filter: {'id>': 0},
        towards: 'uniqorm_1.Countries'
      }
    },
    notes: {
      foreignModel: 'uniqorm_2.Notes',
      key: 'id',
      hasMany: true,
      foreignKey: 'sourceKey',
      filter: () => ({source: 'customers'})
    },
    tags: {
      hasMany: true,
      foreignModel: 'uniqorm_2.CustomerTags',
      filter: {active: 1},
      towards: {
        foreignModel: 'uniqorm_1.Tags',
        attributes: {
          id: null,
          name: null
        }
      }
    }
  }
}], {deep: true});
