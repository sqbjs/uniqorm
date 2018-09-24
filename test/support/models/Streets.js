const merge = require('putil-merge');

module.exports = merge.deep({}, require('./Streets.json'), {
  fields: {
    city: {
      foreignModel: 'uniqorm_1.Cities'
    },
    countryName: {
      foreignModel: 'uniqorm_1.Cities',
      towards: {
        foreignModel: 'uniqorm_1.Countries',
        fieldName: 'name'
      }
    }
  }
});
