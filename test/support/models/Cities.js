const merge = require('putil-merge');

module.exports = merge.deep({}, require('./Cities.json'), {
  fields: {
    country: {
      foreignModel: 'uniqorm_1.Countries'
    },
    countryName: {
      foreignModel: 'uniqorm_1.Countries',
      fieldName: 'name'
    }
  }
});
