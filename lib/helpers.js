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
const {ValueTooLargeError, ValueRequiredError} = require('./errors');

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
 * @param {Object} values
 * @param {Boolean} silent
 * @param {Boolean} [forUpdate]
 * @return {Object}
 * @private
 */
function normalizePostValues(model, values, silent, forUpdate) {

  if (!silent) {
    for (const name of Object.keys(values)) {
      model.getField(name);
    }
  }

  const result = {};
  for (const name of Object.keys(model.fields)) {
    const field = model.getField(name);
    const v = values[name];
    // Validate required
    if (field.notNull && field.required && field.defaultValue == null && (
        (!forUpdate && (v == null || v === '')) ||
        (forUpdate && (v === null || v === ''))
    )) {
      throw new ValueRequiredError(name).set({column: name});
    }
    if (v !== undefined) {
      // Validate char length
      if (field.charLength && v != null && v.length > field.charLength)
        throw new ValueTooLargeError(name, v.length, field.charLength)
            .set({
              column: name,
              actual: v.length,
              maximum: field.charLength
            });

      result[field.fieldName] = v;
    }
  }
  return result;
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
  normalizePostValues,
  prepareKeyValues,
  makeArray
};
