const merge = require('putil-merge');

module.exports = merge.all([{}, require('./Streets.json'), {
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
}], {deep: true});
