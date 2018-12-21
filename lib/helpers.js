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
  const result = merge.clone(options);
  result.attributes = normalizeAttributes(options.attributes, silent);
  result.filter = !options.filter || Array.isArray(options.filter) ?
      options.filter : [options.filter];
  result.sort = !options.sort || Array.isArray(options.sort) ?
      options.sort : [options.sort];
  return result;
}

function normalizeAttributes(attributes, silent) {

  if (!attributes)
    return null;

  let i = 0;
  const addAttribute = (target, key, value) => {
    if (typeof value === 'string' || value == null)
      target[key] = value && value !== key ? value : null;
    else if (Array.isArray(value))
      value = {attributes: value};

    /* istanbul ignore else */
    if (isPlainObject(value)) {
      value.fieldName = value.fieldName || key;
      target[key] = normalizeFindOptions(value, silent);
    }
    i++;
  };

  const parseAttributes = (target, value) => {

    if (Array.isArray(value)) {
      const COLUMN_PATTERN = /^([a-zA-Z][\w$]*)(?:\.?([\w$]+))? *([\w$]+)?$/;
      for (const v of value) {
        if (typeof v === 'string') {
          const m = v.match(COLUMN_PATTERN);
          if (!m) {
            if (silent) continue;
            throw new ArgumentError('"%s" is not a valid column name', v);
          }
          addAttribute(target, (m[3] || m[2] || m[1]),
              m[1] + (m[2] ? '.' + m[2] : ''));
          continue;
        }
        if (isPlainObject(v)) {
          parseAttributes(target, v);
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
          addAttribute(target, v, value[v]);
      }
    }
    return i && target || /* istanbul ignore next */null;
  };

  return parseAttributes({}, attributes);
}

/**
 *
 * @param {Model} model
 * @param {Object} attributes
 * @param {Boolean} silent
 * @param {Boolean} [removePrimaryKey]
 * @return {Object}
 * @private
 */
function normalizeUpdateValues(model, attributes, silent, removePrimaryKey) {
  const values = {};
  Object.getOwnPropertyNames(attributes).forEach((name) => {
    const field = model.getField(name, silent);
    /* istanbul ignore else */
    if (field && field.dataType && (!(field.primaryKey && removePrimaryKey)))
      values[field.fieldName] = field.parseValue(attributes[name]);
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
  normalizeAttributes,
  normalizeUpdateValues,
  prepareKeyValues,
  makeArray
};
