/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Module dependencies
 * @private
 */
const errorex = require('errorex');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;

/**
 *
 * @param {Object} options
 * @param {String} options.sourceKey
 * @param {Model} options.sourceModel
 * @param {String} options.foreignKey
 * @param {Model} options.foreignModel
 * @constructor
 */
class Association {
  constructor(options) {

    if (!options.kind || ['OtM', 'OtO'].indexOf(options.kind) < 0)
      throw new ArgumentError('Invalid relation kind');

    if (options.fields) {
      if (typeof options.fields === 'string')
        options.fields = [options.fields];
      else if (!Array.isArray(options.fields))
        throw new ArgumentError('You can provide Array or String type for "options.fields"');
    }

    /* Validate "where" property */
    if (options.where)
      options.where = Array.isArray(options.where) ?
          options.where : [options.where];

    this.kind = options.kind;
    this.sourceKey = options.sourceKey;
    this.sourceModel = options.sourceModel;
    this.foreignKey = options.foreignKey;
    this.foreignModel = options.foreignModel;
    this.fields = options.fields;
    this.where = options.where;
  }

  toString() {
    return '[Object Association(' + this.kind + ': ' +
        this.sourceModel.name + '[' + this.sourceKey + '] > ' +
        this.foreignModel.name + '[' + this.foreignKey + '])]';
  }

  toJSON() {
    return this.toString();
  }

  inspect() {
    return this.toString();
  }
}

/**
 * Expose `Association`.
 */
module.exports = Association;
