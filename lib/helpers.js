/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

const isPlainObject = require('putil-isplainobject');
const merge = require('putil-merge');
const {ArgumentError} = require('errorex');

function normalizeFindOptions(options, silent) {
  const result = merge({}, options);
  result.properties = normalizeProperties(options.properties, silent);
  result.filter = !options.filter || Array.isArray(options.filter) ?
      options.filter : [options.filter];
  result.sort = !options.sort || Array.isArray(options.sort) ?
      options.sort : [options.sort];
  return result;
}

function normalizeProperties(properties, silent) {

  if (!properties)
    return null;

  let i = 0;
  const addProperty = (target, key, value) => {
    if (typeof value === 'string' || value == null)
      target[key] = value && value !== key ? value : null;
    else if (Array.isArray(value))
      value = {properties: value};

    /* istanbul ignore else */
    if (isPlainObject(value)) {
      value.fieldName = value.fieldName || key;
      target[key] = normalizeFindOptions(value, silent);
    }
    i++;
  };

  const parseProperties = (target, value) => {

    if (Array.isArray(value)) {
      const COLUMN_PATTERN = /^([a-zA-Z][\w$]*)(?:\.?([\w$]+))? *([\w$]+)?$/;
      for (const v of value) {
        if (typeof v === 'string') {
          const m = v.match(COLUMN_PATTERN);
          if (!m) {
            if (silent) continue;
            throw new ArgumentError('"%s" is not a valid column name', v);
          }
          addProperty(target, (m[3] || m[2] || m[1]),
              m[1] + (m[2] ? '.' + m[2] : ''));
          continue;
        }
        if (isPlainObject(v)) {
          parseProperties(target, v);
          continue;
        }
        /* istanbul ignore next */
        if (!silent)
          throw new ArgumentError('"%s" is not a valid column name', v);
      }

    } else {
      /* istanbul ignore else */
      if (isPlainObject(value)) {
        for (const v of Object.getOwnPropertyNames(value))
          addProperty(target, v, value[v]);
      }
    }
    return i && target || /* istanbul ignore next */null;
  };

  return parseProperties({}, properties);
}

/**
 *
 * @param {Model} model
 * @param {Object} properties
 * @param {Boolean} silent
 * @param {Boolean} [removePrimaryKey]
 * @return {Object}
 * @private
 */
function normalizeUpdateValues(model, properties, silent, removePrimaryKey) {
  const values = {};
  Object.getOwnPropertyNames(properties).forEach((name) => {
    const field = model.getField(name, silent);
    /* istanbul ignore else */
    if (field && field.dataType && (!(field.primaryKey && removePrimaryKey)))
      values[field.fieldName] = field.parseValue(properties[name]);
  });
  return values;
}

function prepareKeyValues(model, keyValues) {
  /* istanbul ignore next */
  if (!(model.keyFields && model.keyFields.length))
    return null;
  return {
    [model.keyFields[0]]: keyValues == null ?
        /* istanbul ignore next */null : keyValues
  };
}

function makeArray(v) {
  return v == null ? [] :
      (Array.isArray(v) ? v : [v]);
}

module.exports = {
  normalizeFindOptions,
  normalizeProperties,
  normalizeUpdateValues,
  prepareKeyValues,
  makeArray
};
