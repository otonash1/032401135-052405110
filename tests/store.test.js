/**
 * tests/store.test.js —— store.js 的单元测试
 * 用内存 storage 代替 localStorage，验证增删改查、编号生成与持久化
 */
(function () {
  'use strict';

  const LF = window.LF;
  const test = LF.test;
  const assert = LF.assert;
  const ItemStore = LF.store.ItemStore;
  const createMemoryStorage = LF.store.createMemoryStorage;
  const SEED_COUNT = LF.seed.SEED_ITEMS.length;

  function newStore() {
    return new ItemStore({ storage: createMemoryStorage(), key: 'test-key' });
  }

  function draft() {
    return {
      type: 'found',
      name: '蓝色雨伞',
      cate: '雨伞',
      place: '紫金楼 101',
      time: '2026-09-24 16:00 左右',
      desc: '伞面有卡通图案',
      contact: '微信 new_user'
    };
  }

  // ---------- 初始化 ----------

  test('ItemStore：首次使用（storage 为空）时载入示例数据', function () {
    assert.equal(newStore().list().length, SEED_COUNT);
  });

  test('ItemStore：storage 中的 JSON 损坏时回退到示例数据（异常路径）', function () {
    const storage = createMemoryStorage();
    storage.setItem('bad-key', '{不是合法的 JSON');
    const store = new ItemStore({ storage: storage, key: 'bad-key' });
    assert.equal(store.list().length, SEED_COUNT);
  });

  test('ItemStore：storage 中为空数组时保持为空，不重新灌示例数据', function () {
    const storage = createMemoryStorage();
    storage.setItem('empty-key', '[]');
    const store = new ItemStore({ storage: storage, key: 'empty-key' });
    assert.equal(store.list().length, 0);
  });

  // ---------- 新增 ----------

  test('ItemStore.add：生成当日递增编号并把新信息放到最前面', function () {
    const store = newStore();
    const item = store.add(draft(), new Date(2026, 8, 24, 16, 30));
    assert.equal(item.id, 'LF20260924004');
    assert.equal(store.list()[0].id, 'LF20260924004');
    assert.equal(store.list().length, SEED_COUNT + 1);
  });

  test('ItemStore.add：新信息默认是「进行中」且归入我的发布', function () {
    const store = newStore();
    const item = store.add(draft(), new Date(2026, 8, 24, 16, 30));
    assert.equal(item.status, 'open');
    assert.equal(item.mine, true);
    assert.equal(item.pub, LF.seed.CURRENT_USER.name);
    assert.equal(store.listMine().length, 3);
  });

  test('ItemStore.add：自动补上发布者学院与发布时间戳', function () {
    const store = newStore();
    const item = store.add(draft(), new Date(2026, 8, 24, 16, 30));
    assert.equal(item.dept, LF.seed.CURRENT_USER.dept);
    assert.equal(item.createdAt, new Date(2026, 8, 24, 16, 30).getTime());
  });

  // ---------- 查询 ----------

  test('ItemStore.get：命中返回对象，未命中返回 null', function () {
    const store = newStore();
    assert.equal(store.get('LF20260924001').name, '黑色长柄雨伞');
    assert.equal(store.get('NOT_EXIST'), null);
  });

  test('ItemStore.list：返回副本，外部修改不会污染仓库内部数据', function () {
    const store = newStore();
    const list = store.list();
    list.push({ id: 'FAKE' });
    assert.equal(store.list().length, SEED_COUNT);
  });

  // ---------- 修改状态 ----------

  test('ItemStore.setStatus：可标记为已完成，也可改回进行中', function () {
    const store = newStore();
    assert.equal(store.setStatus('LF20260924001', 'done').status, 'done');
    assert.equal(store.get('LF20260924001').status, 'done');
    assert.equal(store.setStatus('LF20260924001', 'open').status, 'open');
  });

  test('ItemStore.setStatus：非法状态值一律按进行中处理，id 不存在时返回 null', function () {
    const store = newStore();
    assert.equal(store.setStatus('LF20260924001', 'finished').status, 'open');
    assert.equal(store.setStatus('NOT_EXIST', 'done'), null);
  });

  // ---------- 编辑 / 删除 ----------

  test('ItemStore.update：按字段局部修改信息', function () {
    const store = newStore();
    const updated = store.update('LF20260924001', { place: '紫金楼 501' });
    assert.equal(updated.place, '紫金楼 501');
    assert.equal(store.get('LF20260924001').place, '紫金楼 501');
  });

  test('ItemStore.update：修改不存在的 id 返回 null', function () {
    assert.equal(newStore().update('NOT_EXIST', { place: 'x' }), null);
  });

  test('ItemStore.remove：删除成功后列表变短，删除不存在的 id 返回 false', function () {
    const store = newStore();
    assert.equal(store.remove('LF20260924001'), true);
    assert.equal(store.list().length, SEED_COUNT - 1);
    assert.equal(store.remove('NOT_EXIST'), false);
  });

  // ---------- 持久化 ----------

  test('ItemStore.save：数据写入 storage，可被新的实例读回（持久化）', function () {
    const storage = createMemoryStorage();
    const first = new ItemStore({ storage: storage, key: 'persist-key' });
    const item = first.add(draft(), new Date(2026, 8, 24, 16, 30));
    first.setStatus(item.id, 'done');

    const second = new ItemStore({ storage: storage, key: 'persist-key' });
    assert.equal(second.list().length, SEED_COUNT + 1);
    assert.equal(second.get(item.id).status, 'done');
  });
})();
