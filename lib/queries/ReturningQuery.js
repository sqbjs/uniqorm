/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Module dependencies.
 * @private
 */
const Query = require('./Query');

/**
 *
 * @constructor
 */
function ReturningQuery() {
  Query.apply(this, arguments);
}

const proto = ReturningQuery.prototype = {};
Object.setPrototypeOf(proto, Query.prototype);
proto.constructor = ReturningQuery;

proto.returning = function(columns) {
  if (typeof columns === 'string') {
    const cols = columns.split(/\s*,\s*/);
    const allFields = this.model.meta.fieldNames();
    var a = [];
    cols.forEach(function(n) {
      if (n === '*')
        a = a.concat(allFields.filter(function(item) {
          return a.indexOf(item) < 0;
        }));
      if (n.startsWith('-')) {
        var i = a.indexOf(n.substring(1));
        if (i >= 0)
          a.splice(i, 1);
      }
    });
    this._returning = a;
  } else this._returning =
      columns ? Array.prototype.slice.call(arguments) : undefined;
  return this;
};

module.exports = ReturningQuery;
