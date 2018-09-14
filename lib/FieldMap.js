/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

const {ArgumentError} = require('errorex');
const DataField = require('./DataField');
const AssociatedField = require('./AssociatedField');
const merge = require('putil-merge');

/**
 *
 * @class
 * @extends Map
 */
class FieldMap extends Map {

  /**
   * @param {Model} model
   * @constructor
   */
  constructor(model) {
    super();
    this.model = model;
  }

  /**
   * @param {String} key
   * @param {Object} value
   * @param {String} [value.foreignModel]
   * @param {String} [value.dataType]
   * @return {Field}
   */
  set(key, value) {
    try {

      if (typeof value !== 'object')
        throw new ArgumentError('You must provide object for field definition');

      if (value.model) {
        const field = new AssociatedField(key, this.model, value);
        return super.set(key, field);
      }

      if (!value.dataType)
        throw new ArgumentError('Data type is not defined');
      const Ctor = DataField.get(value.dataType);
      if (!Ctor)
        throw new ArgumentError('Unknown data type "%s"', value.dataType);
      const field = new Ctor(key, this.model, value);
      return super.set(key, field);

    } catch (e) {
      e.message = 'Field definition (' + this.model.name + '.' +
          key + ') is not valid. ' + e.message;
      throw e;
    }
  }

  getDataFields() {
    const result = [];
    for (const [key, f] of this.entries())
      if (f.fieldName)
        result.push(key);
    return result;
  }

}

/**
 * Expose `FieldMap`.
 */
module.exports = FieldMap;
