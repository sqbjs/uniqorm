const merge = require('putil-merge');

module.exports = merge.all([{}, require('./Notes.json'), {
  fields: {
    id: {
      required: false
    }
  }
}], {deep: true});
