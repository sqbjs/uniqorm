/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://github.com/sqbjs/uniqorm
 */

const isPlainObject = require('putil-isplainobject');
const sqb = require('sqb');
const merge = require('putil-merge');
const {ArgumentError} = require('errorex');

/**
 *
 * @param {Object} options
 * @return {Object}
 */
function normalizeFindOptions(options) {
  const o = {
    ...options,
    properties: normalizeProperties(options.properties),
    where: options.where || options.filter ?
        makeArray(options.where || options.filter) : [],
    sort: options.sort ? makeArray(options.sort) : [],
    limit: options.limit,
    offset: options.offset
  };
  delete o.filter;
  return o;
}

/**
 *
 * @param {Object} properties
 * @return {Object}
 */
function normalizeProperties(properties) {

  if (!properties)
    return null;
  if (typeof properties !== 'object')
    properties = [properties];

  let i = 0;
  const addProperty = (target, key, value) => {
    if (typeof value === 'string' || value == null)
      target[key] = value && value !== key ? value : null;
    else if (Array.isArray(value))
      value = {properties: value};

    /* istanbul ignore else */
    if (value && isPlainObject(value)) {
      value.fieldName = value.fieldName || key;
      target[key] = normalizeFindOptions(value);
    }
    i++;
  };

  const addProperties = (target, properties) => {

    if (Array.isArray(properties)) {
      const COLUMN_PATTERN = /^([a-zA-Z][\w$]*)(?:\.?([\w$]+))? *([\w$]+)?$/;
      for (const v of properties) {
        if (typeof v === 'string') {
          const m = v.match(COLUMN_PATTERN);
          if (!m)
            throw new ArgumentError('"%s" is not a valid column name', v);
          addProperty(target, (m[3] || m[2] || m[1]),
              m[1] + (m[2] ? '.' + m[2] : ''));
          continue;
        }
        if (isPlainObject(v)) {
          addProperties(target, v);
          continue;
        }
        /* istanbul ignore next */
        throw new ArgumentError('"%s" is not a valid column name', v);
      }

    } else {
      /* istanbul ignore else */
      if (isPlainObject(properties)) {
        for (const v of Object.getOwnPropertyNames(properties))
          addProperty(target, v, properties[v]);
      }
    }
    return i && target || /* istanbul ignore next */null;
  };

  return addProperties({}, properties);
}

/**
 *
 * @param {*} keyValues
 * @param {Array<String>} keyFields
 * @return {Object}
 */
function normalizeKeyValues(keyValues, keyFields) {
  if (keyValues == null)
    throw new ArgumentError('You must provide key values');

  if (keyFields.length > 1 || typeof keyValues === 'object') {
    /* istanbul ignore next */
    if (typeof keyValues !== 'object')
      throw new ArgumentError('You must provide all key values in an object instance.');
    const result = {};
    for (const f of keyFields) {
      if (keyValues[f] === undefined)
        throw new ArgumentError('You must provide all key values in an object instance.');
      result[f] = keyValues[f];
    }
    /*istanbul ignore else */
    if (typeof keyValues === 'object')
      merge(result, keyValues, {combine: true});
    return result;
  }
  return {
    [keyFields[0]]: keyValues
  };
}

function mapConditions(obj, fn) {
  if (Array.isArray(obj))
    return obj.map(x => mapConditions(x, fn));

  if (obj instanceof sqb.LogicalOperator) {
    const cloned = merge({}, obj, {descriptor: true});
    Object.setPrototypeOf(cloned, Object.getPrototypeOf(obj));
    cloned._items = mapConditions(obj._items, fn);
    return cloned;
  }

  if (obj instanceof sqb.CompOperator) {
    const s = fn(obj._expression);
    /* istanbul ignore next */
    if (!s)
      return;
    const cloned = merge({}, obj, {descriptor: true});
    Object.setPrototypeOf(cloned, Object.getPrototypeOf(obj));
    cloned._expression = s;
    return cloned;
  }

  const result = {};
  for (const n of Object.keys(obj)) {
    if (['or', 'and'].includes(n.toLowerCase())) {
      result[n] = mapConditions(obj[n], fn);
      continue;
    }
    const m = n.match(/^([\w\\.$]+) *(.*)$/);
    /* istanbul ignore next */
    if (!m)
      throw new ArgumentError('"%s" is not a valid condition', n);
    const s = fn(m[1]);
    /* istanbul ignore else */
    if (s)
      result[s + (m[2] ? ' ' + m[2] : '')] = obj[n];
  }
  return result;
}

function makeArray(v) {
  return v == null ? [] :
      (Array.isArray(v) ? v : [v]);
}

module.exports = {
  normalizeFindOptions,
  normalizeProperties,
  normalizeKeyValues,
  makeArray,
  mapConditions
};
