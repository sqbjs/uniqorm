const fs = require('fs');
const path = require('path');

module.exports = function looadModels(orm) {
  const dir = path.join(__dirname, 'models');
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const j = require(path.join(dir, f));
    orm.define(j);
  }
};
