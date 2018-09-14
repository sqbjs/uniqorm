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
const {ErrorEx, ArgumentError} = require('errorex');
const merge = require('putil-merge');

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
   * @param {string} [def.model]
   * @param {string} [def.key]
   * @param {string} [def.foreignKey]
   * @param {boolean} [def.hasMany]
   * @param {string} [def.field]
   * @param {Object} [def.attributes]
   * @param {Object|Array} [def.filter]
   * @param {Object} [def.through]
   * @constructor
   * @override
   */
  constructor(name, model, def) {
    super(name, model, def);
    this._foreignModel = null;
    this._through = null;
    this._attributes = null;
    this._parent = null;
    this._baked = null;

    if (def.filter)
      def.filter = Array.isArray(def.filter) ? def.filter : [def.filter];

    if (def.through) {
      this._through = new AssociatedField(name, model,
          typeof def.through === 'object' ? def.through : {
            model: def.through
          });
      this._through._parent = this;
    }

    if (def.attributes)
      this._setAttributes(def.attributes);
  }

  /**
   *
   * @return {string}
   */
  get key() {
    return this._def.key;
  }

  /**
   *
   * @return {Model}
   */
  get foreignModel() {
    if (!this._foreignModel)
      throw new Error('Unable to access "foreignModel". You must call orm.bake() first.');
    return this._foreignModel;
  }

  /**
   *
   * @return {string}
   */
  get foreignKey() {
    return this._def.foreignKey;
  }

  /**
   * @type {null|string}
   */
  get field() {
    return this._attributes ? null : this._def.field;
  }

  /**
   * @type {null|Object}
   */
  get attributes() {
    return this._attributes;
  }

  /**
   * @type {boolean}
   */
  get hasMany() {
    return this._def.hasMany == null ? null : !!this._def.hasMany;
  }

  /**
   *
   * @return {Array<Object>}
   */
  get filter() {
    return this._def.filter;
  }

  /**
   *
   * @return {null|AssociatedField}
   */
  get through() {
    return this._through;
  }

  /**
   *
   * @protected
   */
  bake() {
    super.bake();
    this._foreignModel = this.orm.get(this._def.model);
    if (!(this._def.field || this._def.attributes))
      this._setAttributes(this._foreignModel.fields.getDataFields());

    if (this._through)
      this._through.bake();

    if (!this._parent) {
      this._baked = {
        name: this.name,
        attributes: {},
        hasMany: this.hasMany
      };
      const relations = this._baked.relations = [];
      if (this._through)
        this._fillRelationsThrough(relations, this._through);
      else
        this._fillRelations(relations, this, this.model, this.foreignModel);

      if (this._attributes) {
        this._baked.attributes = merge.clone(this._attributes);
      } else if (this.field)
        this._baked.field = this.field;
    }
  }

  _fillRelationsThrough(relations, f) {
    if (f._through) {
      this._fillRelationsThrough(relations, f._through);
    } else
      this._fillRelations(relations, f, this.model, f.foreignModel);
    this._fillRelations(relations, f._parent, f.foreignModel, f._parent.foreignModel);
  }

  _fillRelations(relations, f, sourceModel, foreignModel) {
    const rel = {
      model: sourceModel,
      key: f.key,
      foreignModel: foreignModel,
      foreignKey: f.foreignKey,
      filter: Array.isArray(f.filter) ? f.filter : []
    };
    relations.push(rel);

    const validateKeys = () => {
      try {
        if (rel.key)
          sourceModel.getField(rel.key);
        else return;
        if (rel.foreignKey)
          foreignModel.getField(rel.foreignKey);
        return true;
      } catch (e) {
        throw new ErrorEx('Associated field (%s.%s) definition error. %s',
            this.model.name, this.name, e.message);
      }
    };
    if (validateKeys()) return;

    /* Test if this model has an association with target model */
    for (const asc of sourceModel.associations.values()) {
      if (asc.foreignModel === foreignModel) {
        rel.key = rel.key || asc.key;
        rel.foreignKey = rel.foreignKey || asc.foreignKey;
        if (asc.filter)
          rel.filter.push(...(Array.isArray(asc.filter) ? asc.filter : []));
        break;
      }
    }

    if (validateKeys()) return;

    /* Test if target model has an association with this model */
    for (const asc of foreignModel.associations.values()) {
      if (asc.foreignModel === sourceModel) {
        rel.key = rel.key || asc.foreignKey;
        rel.foreignKey = rel.foreignKey || asc.key;
        if (asc.filter)
          rel.filter.push(...Array.isArray(asc.filter) ? asc.filter : []);
        break;
      }
    }
    if (validateKeys()) return;

    throw new ErrorEx('Associated field (%s.%s) definition error. ' +
        'You must provide key and foreignKey properties or must define association between two tables',
        this.model.name, this.name);
  }

  _setAttributes(attributes) {
    if (Array.isArray(attributes)) {
      this._attributes = {};
      for (const f of attributes)
        this._attributes[f] = f;
    } else {
      if (typeof attributes !== 'object')
        throw new ArgumentError('You must provide an object value');
      this._attributes = attributes;
    }
  }

}

/**
 * Expose `AssociatedField`.
 */
module.exports = AssociatedField;
