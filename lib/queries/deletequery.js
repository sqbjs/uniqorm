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
const Query = require('./query');

/**
 * Expose `DeleteQuery`.
 */
module.exports = DeleteQuery;

/**
 * @param {Model} model
 * @constructor
 */
function DeleteQuery(model) {
  Query.apply(this, arguments);
}

const proto = DeleteQuery.prototype = {};
Object.setPrototypeOf(proto, Query.prototype);
proto.constructor = DeleteQuery;

/**
 * @protected
 * @return {Object}
 */
proto._prepare = function() {
  const self = this;
  const model = self.model;
  const database = model.schema.owner.dbPool;
  const defaultSchema = this.model._orm.defaultSchema || database.schema;
  const schema = model.schema.name &&
  model.schema.name !== defaultSchema ? model.schema.name : '';

  /* Prepare values */
  if (!self._values)
    throw new Error('Nothing to insert');

  return database
      .delete()
      .from((schema ? schema + '.' : '') + model.tableName);
};
