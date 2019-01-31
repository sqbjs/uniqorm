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
const Field = require('./Field');
const {normalizeProperties} = require('./helpers');
const {ErrorEx, ArgumentError} = require('errorex');

const JOIN_TYPES = ['inner', 'left', 'leftouter', 'right', 'rightouter',
  'outer', 'fullouter'];

/**
 *
 * @class
 * @extends Field
 */
class AssociatedField extends Field {

  /**
   * @param {string} name
   * @param {Model|string} model
   * @param {Object} [def]
   * @param {string} [def.foreignModel]
   * @param {string} [def.key]
   * @param {string} [def.foreignKey]
   * @param {boolean} [def.hasMany]
   * @param {string} [def.fieldName]
   * @param {Object} [def.properties]
   * @param {string} [def.joinType]
   * @param {Object|Array|Function} [def.filter]
   * @param {Object} [def.towards]
   * @constructor
   * @override
   */
  constructor(name, model, def) {
    super(name, model);
    this._def = def;
    this._key = def.key;
    this._foreignKey = def.foreignKey;
    this._properties = normalizeProperties(def.properties);
    if (def.filter)
      def.filter =
          typeof def.filter === 'function' || Array.isArray(def.filter) ?
              def.filter : [def.filter];

    if (def.towards) {
      def.towards = typeof def.towards === 'object' ? def.towards : {
        foreignModel: def.towards
      };
      if (def.properties)
        delete def.towards.fieldName;
    }
    this._joinType = def.joinType ?
        String(def.joinType).replace(/ /g, '').toLowerCase() : null;
    if (this._joinType && !JOIN_TYPES.includes(this._joinType))
      throw new ArgumentError('Unknown join type "%s"', def.joinType);
  }

  /**
   * @type {null|Object}
   */
  get properties() {
    return this._properties;
  }

  /**
   *
   * @return {string}
   */
  get key() {
    return this._key;
  }

  /**
   *
   * @return {Field}
   */
  get keyField() {
    return this.model.getField(this._key);
  }

  /**
   *
   * @return {string}
   */
  get foreignKey() {
    return this._foreignKey;
  }

  /**
   *
   * @return {Field}
   */
  get foreignField() {
    return this.foreignModel.getField(this._foreignKey);
  }

  /**
   *
   * @return {Model}
   */
  get foreignModel() {
    return this.orm.getModel(this._def.foreignModel);
  }

  /**
   * @type {string|null}
   */
  get fieldName() {
    return this._properties ? null : this._def.fieldName;
  }

  /**
   * @type {boolean}
   */
  get hasMany() {
    return this._def.hasMany;
  }

  /**
   *
   * @return {Array<Object>|Function|null}
   */
  get filter() {
    return this._def.filter;
  }

  get joinType() {
    return this._joinType;
  }

  /**
   *
   * @return {AssociatedField|null}
   */
  get towards() {
    if (!this._towards && this._def.towards && !this.fieldName) {
      this._towards = new AssociatedField(this.name,
          this.foreignModel, this._def.towards);
    }
    return this._towards;
  }

  get returnsSingleValue() {
    return !!this.fieldName ||
        (this.towards && this.towards.returnsSingleValue);
  }

  /**
   *
   * @protected
   */
  prepare() {
    super.prepare();

    this._towards = null;

    if (this.towards)
      this.towards.prepare();

    if (!this._def.fieldName && !this._def.properties && !this.towards)
      this._properties =
          normalizeProperties(Object.keys(this.foreignModel.fields));

    if (this._properties)
      for (const atr of Object.getOwnPropertyNames(this._properties)) {
        this.foreignModel.getField(this._properties[atr] || atr);
      }

    this._key = this._def.key;
    this._foreignKey = this._def.foreignKey;
    if (!(this._key && this._foreignKey)) {
      /* Test if source model has an association with foreign model */
      for (const asc of this.model.associations) {
        if (asc.foreignModel === this.foreignModel) {
          this._key = asc.key;
          this._foreignKey = asc.foreignKey;
          break;
        }
      }
    }

    if (!(this._key && this._foreignKey)) {
      /* Test if foreign model has an association with source model */
      for (const asc of this.foreignModel.associations) {
        /* istanbul ignore else */
        if (asc.foreignModel === this.model) {
          this._key = asc.foreignKey;
          this._foreignKey = asc.key;
          break;
        }
      }
    }

    if (!(this._key && this._foreignKey)) {
      /* set key fields automatically if not discovered */
      this._key = this._key ||
          (this.foreignModel.name + '_' + this.orm.options.defaultPrimaryKey);
      this._foreignKey = this._foreignKey ||
          this.foreignModel.keyFields[0] || this.orm.options.defaultPrimaryKey;
    }

    /* istanbul ignore next */
    if (!this._key)
      throw new ErrorEx('You must provide "key" property for associated field "%s"', this.name);
    /* istanbul ignore next */
    if (!this._foreignKey)
      throw new ErrorEx('You must provide "foreignKey" property for associated field "%s"', this.name);

  }

}

/**
 * Expose `AssociatedField`.
 */
module.exports = AssociatedField;
