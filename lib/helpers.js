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

function normalizeFindOptions(options, silent) {
  const result = merge({}, options);
  result.properties = normalizeProperties(options.properties, silent);
  result.where = !options.where || Array.isArray(options.where) ?
      options.where : [options.where];
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
    if (value && isPlainObject(value)) {
      value.fieldName = value.fieldName || key;
      target[key] = normalizeFindOptions(value, silent);
    }
    i++;
  };

  const addProperties = (target, value) => {

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
          addProperties(target, v);
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

  return addProperties({}, properties);
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
  makeArray,
  mapConditions
};
