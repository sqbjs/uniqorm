const merge = require('putil-merge');

module.exports = merge.deep({}, require('./Streets.json'), {
  fields: {
    city: {
      foreignModel: 'uniqorm_1.Cities'
    },
    country_name: {
      foreignModel: 'uniqorm_1.Cities',
      towards: {
        foreignModel: 'uniqorm_1.Countries',
        fieldName: 'name'
      }
    }
  }
});
