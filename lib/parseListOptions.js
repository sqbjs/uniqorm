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
const isPlainObject = require('putil-isplainobject');
const {ArgumentError} = require('errorex');

/*
 * Expose ''
 * @param {Object} options
 * @param {Boolean} silent
 * @return {*}
 */
module.exports = function parseListOptions(options, silent) {
  if (Array.isArray(options))
    return parseOptions({attributes: options}, silent);

  const addAttribute = (target, key, value) => {
    if (typeof value === 'string' || value == null)
      target[key] = value || key;
    else if (Array.isArray(value))
      target[key] = parseOptions({attributes: value});
    else if (isPlainObject(value))
      target[key] = parseOptions(value);
  };

  const parseAttributes = (target, value) => {
    let i = 0;
    if (Array.isArray(value)) {
      value.forEach(v => {
        i++;
        if (typeof v === 'string') {
          const m = v.match(/^([\w$]*\.?[\w$]+) *([\w$]*)$/);
          if (!m) {
            if (silent)
              throw new ArgumentError('"%s" is not a valid column name', v);
            return;
          }
          addAttribute(target, m[2] || m[1], m[1]);
          return;
        }
        if (isPlainObject(v))
          parseAttributes(target, v);
      });

    } else if (isPlainObject(value)) {
      Object.getOwnPropertyNames(value).forEach(v => {
        addAttribute(target, v, value[v]);
        i++;
      });
    }
    return i ? target : null;
  };

  const result = {};
  result.attributes = parseAttributes({}, options.attributes);
  result.where = !options.where || Array.isArray(options.where) ?
      options.where : [options.where];
  result.orderBy = !options.orderBy || Array.isArray(options.orderBy) ?
      options.orderBy : [options.orderBy];
  result.limit = options.limit;
  result.offset = options.offset;
  result.as = options.as;
  return result;
};
