const fs = require('fs');
const path = require('path');

module.exports = function looadModels(orm) {
  const dir = path.join(__dirname, 'models');
  const files = fs.readdirSync(dir);
  const uniqFiles = [];
  for (const f of files) {
    const fn = path.basename(f, path.extname(f));
    if (!uniqFiles.includes(fn))
      uniqFiles.push(fn);
  }
  for (const f of uniqFiles) {
    const j = require(path.join(dir, f));
    orm.define(j);
  }
};
