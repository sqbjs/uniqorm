/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

const Query = require('./query');

/**
 *
 * @constructor
 */
class ReturningQuery extends Query {

  returning(columns) {
    if (typeof columns === 'string') {
      const cols = columns.split(/\s*,\s*/);
      const allFields = this.model.meta.getFieldNames();
      let a = [];
      cols.forEach(n => {
        if (n === '*')
          a = a.concat(allFields.filter((item) => {
            return a.indexOf(item) < 0;
          }));
        if (n.startsWith('-')) {
          let i = a.indexOf(n.substring(1));
          if (i >= 0)
            a.splice(i, 1);
        }
      });
      this._returning = a;
    } else this._returning =
        columns ? Array.prototype.slice.call(arguments) : undefined;
    return this;
  }

}

module.exports = ReturningQuery;
