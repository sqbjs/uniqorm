/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

const Association = require('./Association');

/**
 *
 * @class
 * @extends Set
 */
class AssociationSet extends Set {

  /**
   * @param {Model} model
   * @constructor
   */
  constructor(model) {
    super();
    this.model = model;
  }

  /**
   * @param {Object} obj
   * @return {Association}
   */
  add(obj) {
    const association = new Association(this.model, obj);
    super.add(association);
    return association;
  }

}

/**
 * Expose `AssociationSet`.
 */
module.exports = AssociationSet;
