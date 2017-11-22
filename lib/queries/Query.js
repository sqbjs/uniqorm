/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Expose `Query`.
 */
module.exports = Query;

/**
 * @param {Model} model
 * @constructor
 */
function Query(model) {
  this.model = model;
}

const proto = Query.prototype = {};
proto.constructor = Query;

proto.execute = function(varargs) {
  const query = this._prepare();
  return query.execute.apply(query, arguments);
};

proto.then = function(varargs) {
  const query = this._prepare();
  return query.then.apply(query, arguments);
};

/**
 * @protected
 */
proto._prepare = function() {
  throw new Error('Abstract error');
};
