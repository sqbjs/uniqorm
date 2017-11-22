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
const Relation = require('./relation');

/**
 * Expose `Relation`.
 */
module.exports = RelationO2O;

/**
 *
 * @constructor
 */
function RelationO2O() {
  Relation.apply(this, arguments);
  /*const fields = new Proxy({}, {
    get: function(obj, key) {
      return typeof key === 'string' ? obj[key.toUpperCase()] : obj[key];
    },
    set: function(obj, key, value) {
      if (typeof key === 'string')
        obj[key.toUpperCase()] = value;
      else obj[key] = value;
      return true;
    }
  });
  Object.defineProperty(this, 'fields', {
    value: fields,
    configurable: false,
    writable: false
  });*/
}

RelationO2O.prototype = {
  get type() {
    return '1:1';
  }
};

RelationO2O.prototype.setFields();
{
  /*if (args.length) {
    args.forEach(item => {
      const a = String(item).split(' ');
    this.fields[a[1] || a[0]] = a[0];
  });
  }
  return this;*/
}


