const merge = require('putil-merge');

module.exports = merge.all([{}, require('./Customers.json'), {
  fields: {
    street: {
      foreignModel: 'uniqorm_1.Streets',
      properties: ['id', 'name']
    },
    city: {
      foreignModel: 'uniqorm_1.Streets',
      towards: 'uniqorm_1.Cities'
    },
    country: {
      foreignModel: 'uniqorm_1.Streets',
      towards: {
        foreignModel: 'uniqorm_1.Cities',
        where: {'id>': 0},
        towards: 'uniqorm_1.Countries'
      }
    },
    notes: {
      foreignModel: 'uniqorm_2.Notes',
      key: 'id',
      hasMany: true,
      foreignKey: 'sourceKey',
      where: () => ({source: 'customers'})
    },
    tags: {
      hasMany: true,
      foreignModel: 'uniqorm_2.CustomerTags',
      where: {active: 1},
      towards: {
        foreignModel: 'uniqorm_1.Tags',
        properties: {
          id: null,
          name: null
        }
      }
    },
    tax: {
      calculate: (values) => {
        return values.balance ? values.balance * 0.2 : 0;
      },
      requires: ['balance']
    }
  }
}], {deep: true});
