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
const sqb = require('sqb');
const errorex = require('errorex');
const isPlainObject = require('putil-isplainobject');
const promisify = require('putil-promisify');

/**
 * Module variables
 * @private
 */
const Op = sqb.Op;
const ArgumentError = errorex.ArgumentError;
const COLUMN_PATTERN = /^(?:([\w$]+)\.)?([\w$]+)$/;
const SORT_ORDER_PATTERN = /^([-+])?(?:([\w$]+)\.)?([a-zA-Z][\w$]*|\*) *(asc|dsc|desc|ascending|descending)?$/i;

class ModelFindAll {

  constructor(model, options) {
    this.model = model;
    options = options || {};
    this.silent = options.silent || this.model.owner.options.silent;

    options.attributes = options.attributes ||
        Object.getOwnPropertyNames(model.fields);
    this.options = parseOptions(options, this.silent);
  }

  execute(callback) {
    const self = this;
    if (!callback)
      return promisify.fromCallback(function(cb) {
        self._execute(cb);
      });
    self._execute(callback);
  }

  then(callback) {
    return this.execute().then(callback);
  }

  prepare() {
    const context = new FindContext(this.model, {
      silent: this.silent,
      where: this.options.where,
      orderBy: this.options.orderBy,
      limit: this.options.limit,
      offset: this.options.offset
    });
    context.addAttributes({
      attributes: this.options.attributes,
      tableAlias: 't'
    });
    return context;
  }

  _execute(callback) {
    this.prepare().execute(callback);
  }

}

/**
 * @class
 */
class ModelFindOne extends ModelFindAll {
  constructor(model, options) {
    options = options || {};
    options.limit = 1;
    super(model, options);
  }

  _execute(callback) {
    super._execute((err, result) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, result[0]);
    });
  }
}

/**
 *
 */
class FindContext {

  constructor(model, options) {
    this.model = model;
    this.attributes = {};
    this.joins = new Map();
    this.queryFields = {};
    this.fieldCount = 0;
    this.joinCount = 0;
    this.silent = options.silent;
    this.where = options.where;
    this.orderBy = options.orderBy;
    this.limit = options.limit;
    this.offset = options.offset;
  }

  addQueryField(column) {
    const o = this.queryFields[column];
    if (o)
      return o;
    return this.queryFields[column] = {
      colName: 'col' + (++this.fieldCount)
    };
  }

  addJoin(association, parentAlias) {
    let jinfo = this.joins.get(association);
    if (!jinfo) {
      jinfo = {
        joinAlias: 'a' + (++this.joinCount),
        tableAlias: parentAlias
      };
      this.joins.set(association, jinfo);
    }
    return jinfo;
  }

  addAssociation(association, options) {
    if (association.kind === 'OtO') {
      const jinfo = this.addJoin(association, options.tableAlias);
      let node;
      if (options.targetAttr) {
        node = options.targetNode[options.targetAttr] =
            options.targetNode[options.targetAttr] || {};
        node.columns = node.columns || {};
        node = node.columns;
      } else node = options.targetNode;
      this.addAttributes({
        model: association.foreignModel,
        tableAlias: jinfo.joinAlias,
        targetNode: node,
        attributes: options.attributes
      });
      return;
    }
    if (association.kind === 'OtM') {
      const srcCol = this.addQueryField(options.tableAlias + '.' +
          association.sourceKey);
      const context = new FindContext(association.foreignModel, {
        silent: this.silent,
        where: [Op.in(association.foreignKey, new RegExp(srcCol.colName)),
          ...(options.where || [])],
        orderBy: options.orderBy,
        limit: options.limit,
        offset: options.offset
      });
      options.targetNode[options.targetAttr] = context.addAttributes({
        attributes: options.attributes,
        tableAlias: 't',
        targetNode: context.attributes
      });
      const trgCol = context.addQueryField('t.' + association.foreignKey);
      context.foreignColumn = srcCol.colName;
      context.maxRows = 0;
      context.targetAttr = options.targetAttr;
      context.sourceColumn = trgCol.colName;
      options.targetNode[options.targetAttr] = context;
    }
  }

  addAttributes(options) {
    const silent = this.silent;
    const model = options.model || this.model;
    const tableAlias = options.tableAlias;
    const targetNode = options.targetNode || this.attributes;
    const attributes = options.attributes ||
        parseOptions({attributes: Object.getOwnPropertyNames(model.fields)}).attributes;

    Object.getOwnPropertyNames(attributes).forEach(attr => {
      const col = attributes[attr];
      if (typeof col === 'string') {
        const m = col.match(COLUMN_PATTERN);
        if (!m) {
          if (silent) return;
          throw new ArgumentError('"%s" is not a valid column name', col);
        }
        const ascName = m[1];
        const fieldName = m[2];

        /* If there is no association alias, it can be a real field or an association alias */
        if (!ascName) {
          /* Test if this is a field name */
          if (model.getField(fieldName, true)) {
            targetNode[attr] = {
              column: this.addQueryField(tableAlias + '.' + fieldName)
            };
            return;
          }
          /* Test if this is an association alias */
          const association = model.getAssociation(fieldName);
          if (!association) {
            if (silent) return;
            throw new ArgumentError('Model "%s" has no field or association for "%s"', model.name, fieldName);
          }
          this.addAssociation(association, {
            tableAlias,
            targetNode: targetNode,
            targetAttr: attr
          });
          return;
        }
        /* A field name with association alias (flat) */
        const association = model.getAssociation(ascName);
        if (!association) {
          if (silent) return;
          throw new ArgumentError('Model "%s" has no association "%s"', model.name, ascName);
        }
        if (association.kind !== 'OtO')
          throw new ArgumentError('Only One-to-One associations can be used Flat');
        this.addAssociation(association, {
          tableAlias,
          targetNode: targetNode,
          attributes: [{[fieldName]: attr}]
        });
        return;
      }
      if (isPlainObject(col)) {
        const association = model.getAssociation(attr);
        if (!association) {
          if (silent) return;
          throw new ArgumentError('Model "%s" has no association named "%s"', model.name, attr);
        }
        this.addAssociation(association, {
          tableAlias,
          targetNode: targetNode,
          targetAttr: col.as || attr,
          attributes: col.attributes,
          where: col.where,
          orderBy: col.orderBy,
          limit: col.limit,
          offset: col.offset
        });
      }
    });
  }

  buildQuery() {
    const self = this;
    const model = this.model;
    /* Prepare sort order */
    const orderBy = [];
    if (self.orderBy) {
      self.orderBy.forEach((col) => {
        if (typeof col !== 'string')
          throw new ArgumentError('Invalid element in "orderBy" property');
        const m = col.match(SORT_ORDER_PATTERN);
        if (!m) {
          if (self.silent) return;
          throw new ArgumentError('"%s" is not a valid order expression', col);
        }
        const ascName = m[2];
        let fieldName = m[3];
        let s = (m[1] || '');
        if (ascName) {
          const association = model.getAssociation(ascName);
          if (!association) {
            if (self.silent) return;
            throw new ArgumentError('Model "%s" has no association "%s"', model.name, ascName);
          }
          if (association.kind !== 'OtO')
            throw new ArgumentError('Only One-to-One associations can be used for sort order');
          const jinfo = self.addJoin(association, 't');
          s += jinfo.joinAlias + '.';
        } else {
          if (!model.getField(fieldName, this.silent))
            return;
          fieldName = 't.' + fieldName;
        }
        orderBy.push(s + fieldName + (m[4] ? ' ' + m[4] : ''));
      });
    }

    /* 1. Phase: Add joins needed for where clause and prepare an override map for expressions */
    const operatorOverrides = {};
    sqb.select()
        .where(...(self.where || []))
        .hook('serialize', (ctx, type, o) => {
          if (type === 'operator' && o.expression) {
            if (!o.expression.match(/^(?:([a-zA-Z][\w$]+)\.?)+$/))
              throw new ArgumentError('Invalid column definition "%s"', o.expression);
            const arr = o.expression.split(/\./);
            const fieldName = arr.pop();
            let m = model;
            let tableAlias = 't';
            for (const a of arr) {
              const association = m.getAssociation(a);
              if (!association)
                throw new ArgumentError('Model "%s" has no association "%s"', m.name, a);
              const jinfo = self.addJoin(association, tableAlias);
              tableAlias = jinfo.joinAlias;
              m = association.foreignModel;
            }
            operatorOverrides[o.expression] = tableAlias + '.' + fieldName;
          }
        }).generate();

    /* 2. Phase: Build query */
    const colarr = [];
    Object.getOwnPropertyNames(self.queryFields).forEach(col => {
      colarr.push(col + ' ' + self.queryFields[col].colName);
    });
    const joinarr = [];
    for (const [association, j] of self.joins.entries()) {
      joinarr.push(
          sqb.leftOuterJoin(
              association.foreignModel.tableNameFull + ' ' + j.joinAlias)
              .on(Op.eq('$' + j.joinAlias + '.' + association.foreignKey,
                  sqb.raw(j.tableAlias + '.' + association.sourceKey)))
      );
    }

    return (model.owner.pool)
        .select(...colarr)
        .from(model.tableNameFull + ' t')
        .join(...joinarr)
        .where(...(self.where || []))
        .orderBy(...orderBy)
        .limit(self.limit)
        .offset(self.offset)
        .hook('serialize', (ctx, type, o) => {
          if (type === 'operator' && o.expression) {
            o.expression = o.expression.substring(0, 1) === '$' ?
                o.expression.substring(1) :
                operatorOverrides[o.expression];
          }
        });
  }

  execute(callback) {
    //console.log(this);

    const self = this;

    const wrapRec = (source, target, attrMap) => {
      Object.getOwnPropertyNames(attrMap).forEach((attribute) => {
        const v = attrMap[attribute];
        if (v.column) {
          target[attribute] = source[v.column.colName];
          return;
        }
        if (v.columns) {
          target[attribute] =
              wrapRec(source, target[attribute] || {}, v.columns);
          return;
        }
        if (v instanceof FindContext) {
          target[attribute] = null;
          const keyValue = source[v.foreignColumn];
          self.children = self.children || new Set();
          if (!self.children.has(v)) {
            self.children.add(v);
            v.targetRows = {};
          }
          v.targetRows[keyValue] = target;
          v.keyValues = v.keyValues || [];
          v.keyValues.push(keyValue);
        }
      });
      return target;
    };

//    console.log(query.generate().sql);
    //  console.log('-----------------------');

    const query = self.buildQuery();
    const a = query.generate();
    console.log(a.sql);
    console.log(a.params);
    const isChild = self.foreignColumn;
    const rows = !isChild ? [] : null;
    const executeOpts = {
      objectRows: true,
      strictParams: true,
      maxRows: isChild ? 0 : undefined
    };
    const execParams = isChild ? {[self.foreignColumn]: self.keyValues} : null;

    query.params(execParams).execute(executeOpts, (err, result) => {
      if (err || !(result && result.rows && result.rows.length)) {
        callback(err);
        return;
      }

      result.rows.forEach((row) => {
        const obj = wrapRec(row, {}, self.attributes);
        if (!isChild) {
          rows.push(obj);
          return;
        }
        /* Merge obj with parent */
        const keyValue = row[self.sourceColumn];
        const r = self.targetRows[keyValue];
        if (r) {
          r[self.targetAttr] = r[self.targetAttr] || [];
          r[self.targetAttr].push(obj);
        }
      });

      /**/
      if (self.children) {
        const promises = [];
        for (const childContext of self.children.values()) {
          promises.push(promisify.fromCallback(function(cb) {
            childContext.execute(cb);
          }));
        }
        Promise.all(promises).then(() => callback(null, rows), callback);
        return;
      }
      callback(null, rows);
    });
  }

}

function parseOptions(options, silent) {
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
}

module.exports = {
  ModelFindOne,
  ModelFindAll
};
