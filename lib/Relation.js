/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Expose `Relation`.
 */
module.exports = Relation;

/**
 *
 * @param {Model} model
 * @param {String} field
 * @param {Model} foreignModel
 * @param {String} foreignKey
 * @constructor
 */
function Relation(model, field, foreignModel, foreignKey) {
  this.model = model;
  this.field = field;
  this.foreignModel = foreignModel;
  this.foreignKey = foreignKey;
}

Relation.prototype = {
  get foreignSchema() {
    return this.foreignModel.schema.name;
  }
};
Relation.prototype.constructor = Relation;
