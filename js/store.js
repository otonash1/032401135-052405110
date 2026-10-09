/**
 * store.js —— 信息仓库（数据 + 增删改查 + 本地持久化）
 *
 * 说明：
 * 1. 数据存在浏览器 localStorage 里，刷新页面不丢；
 * 2. 构造函数允许外部传入任意 storage 对象（测试时传内存版实现），
 *    因此这个模块不依赖真实的浏览器环境，可以直接被单元测试覆盖；
 * 3. 这是「信息的唯一出入口」，页面只通过它读写数据。
 */
(function () {
  'use strict';

  const LF = (window.LF = window.LF || {});
  const SEED_ITEMS = LF.seed.SEED_ITEMS;
  const CURRENT_USER = LF.seed.CURRENT_USER;
  const CATE_ICON = LF.seed.CATE_ICON;
  const utils = LF.utils;

  const STORAGE_KEY = 'lost-found-items-v1';

  /** 示例数据的副本，避免直接改动 seed.js 里的原始对象 */
  function seedItems() {
    return SEED_ITEMS.map(function (item) {
      return Object.assign({}, item);
    });
  }

  /** 内存版 storage，用于单元测试或 localStorage 不可用时兜底 */
  function createMemoryStorage() {
    const map = {};
    return {
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null; },
      setItem: function (key, value) { map[key] = String(value); },
      removeItem: function (key) { delete map[key]; }
    };
  }

  /** 取浏览器 localStorage，不可用（隐私模式等）时退回内存存储 */
  function defaultStorage() {
    try {
      const probe = '__lf_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (e) {
      return createMemoryStorage();
    }
  }

  function ItemStore(options) {
    const opt = options || {};
    this.key = opt.key || STORAGE_KEY;
    this.storage = opt.storage || defaultStorage();
    this.items = [];
    this.load();
  }

  /** 从 storage 读取；没有数据或数据损坏时退回示例数据 */
  ItemStore.prototype.load = function () {
    let data = null;
    try {
      const raw = this.storage.getItem(this.key);
      if (raw !== null && raw !== undefined) data = JSON.parse(raw);
    } catch (e) {
      data = null;
    }
    this.items = Array.isArray(data) ? data : seedItems();
    return this.list();
  };

  /** 写回 storage */
  ItemStore.prototype.save = function () {
    try {
      this.storage.setItem(this.key, JSON.stringify(this.items));
    } catch (e) {
      /* 存储写入失败（配额满等）时不阻断页面操作 */
    }
    return true;
  };

  ItemStore.prototype.list = function () {
    return this.items.slice();
  };

  /** 只取当前用户发布的信息 */
  ItemStore.prototype.listMine = function () {
    return this.items.filter(function (item) { return !!item.mine; });
  };

  ItemStore.prototype.get = function (id) {
    return this.items.filter(function (item) { return item.id === id; })[0] || null;
  };

  /**
   * 新增一条信息。
   * @param {Object} draft 已通过校验的规范字段
   * @param {Date} [now] 便于测试注入固定时间
   */
  ItemStore.prototype.add = function (draft, now) {
    const date = now || new Date();
    const ids = this.items.map(function (item) { return item.id; });
    const item = {
      id: utils.makeId(date, utils.nextSeq(ids, date)),
      name: draft.name,
      type: draft.type,
      cate: draft.cate,
      place: draft.place,
      time: draft.time,
      desc: draft.desc,
      contact: draft.contact,
      pub: CURRENT_USER.name,
      dept: CURRENT_USER.dept,
      status: 'open',
      mine: true,
      createdAt: date.getTime()
    };
    this.items.unshift(item);
    this.save();
    return item;
  };

  /** 修改状态：open 进行中 / done 已完成 */
  ItemStore.prototype.setStatus = function (id, status) {
    const item = this.get(id);
    if (!item) return null;
    item.status = status === 'done' ? 'done' : 'open';
    this.save();
    return item;
  };

  /** 修改一条信息的若干字段（编辑功能用） */
  ItemStore.prototype.update = function (id, patch) {
    const item = this.get(id);
    if (!item) return null;
    Object.assign(item, patch || {});
    this.save();
    return item;
  };

  /** 删除一条信息 */
  ItemStore.prototype.remove = function (id) {
    const before = this.items.length;
    this.items = this.items.filter(function (item) { return item.id !== id; });
    const removed = this.items.length < before;
    if (removed) this.save();
    return removed;
  };

  LF.store = {
    STORAGE_KEY: STORAGE_KEY,
    ItemStore: ItemStore,
    createMemoryStorage: createMemoryStorage,
    seedItems: seedItems,
    CATE_ICON: CATE_ICON
  };
})();
