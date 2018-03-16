/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 *
 * @class
 */
class ExtendedModel {
  constructor(model, cfg) {
    this._model = model;
    Object.setPrototypeOf(this, model);
    this._hooks = {
      list: typeof cfg.list === 'function' ? cfg.list : null,
      create: typeof cfg.create === 'function' ? cfg.create : null,
      update: typeof cfg.update === 'function' ? cfg.update : null,
      destroy: typeof cfg.destroy === 'function' ? cfg.destroy : null
    };
  }

}

module.exports = ExtendedModel;
