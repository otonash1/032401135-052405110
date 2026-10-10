/**
 * tests/search.test.js —— search.js 的单元测试
 * 覆盖：四字段关键词匹配、类型／类别／状态筛选、组合查询、排序
 */
(function () {
  'use strict';

  const LF = window.LF;
  const test = LF.test;
  const assert = LF.assert;
  const search = LF.search;
  const SEED = LF.seed.SEED_ITEMS;

  // ---------- 关键词搜索 ----------

  test('searchItems：关键词为空时返回空数组（搜索页据此展示热门搜索）', function () {
    assert.deepEqual(search.searchItems(SEED, ''), []);
    assert.deepEqual(search.searchItems(SEED, '   '), []);
  });

  test('searchItems：按物品名称匹配', function () {
    const result = search.searchItems(SEED, '雨伞');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'LF20260924001');
  });

  test('searchItems：按地点字段匹配（四字段之一）', function () {
    const result = search.searchItems(SEED, '三区食堂');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'LF20260924002');
  });

  test('searchItems：按描述字段匹配且不区分大小写', function () {
    const upper = search.searchItems(SEED, 'MAH');
    const lower = search.searchItems(SEED, 'mAh');
    assert.equal(upper.length, 1);
    assert.equal(lower.length, 1);
    assert.equal(lower[0].id, 'LF20260921001');
  });

  test('searchItems：按类别字段匹配，能一次命中多条', function () {
    const result = search.searchItems(SEED, '校园卡/证件');
    assert.equal(result.length, 2);
  });

  test('searchItems：无匹配时返回空数组（异常路径：搜不到结果）', function () {
    assert.deepEqual(search.searchItems(SEED, '自行车头盔'), []);
  });

  // ---------- 单条件筛选 ----------

  test('filterByType：lost / found / all 三种取值', function () {
    assert.equal(search.filterByType(SEED, 'lost').every(function (i) { return i.type === 'lost'; }), true);
    assert.equal(search.filterByType(SEED, 'found').every(function (i) { return i.type === 'found'; }), true);
    assert.equal(search.filterByType(SEED, 'all').length, SEED.length);
    assert.equal(search.filterByType(SEED, '').length, SEED.length);
  });

  test('filterByCategory：按具体类别筛选，all 返回全部', function () {
    assert.equal(search.filterByCategory(SEED, '校园卡/证件').length, 2);
    assert.equal(search.filterByCategory(SEED, 'all').length, SEED.length);
  });

  test('filterByStatus：可以单独筛出已完成的信息', function () {
    const done = search.filterByStatus(SEED, 'done');
    assert.equal(done.length, 2);
    assert.equal(done.every(function (i) { return i.status === 'done'; }), true);
  });

  // ---------- 排序 ----------

  test('sortByTimeDesc：按发布时间倒序且不改动原数组', function () {
    const before = SEED.map(function (i) { return i.id; });
    const sorted = search.sortByTimeDesc(SEED);
    assert.equal(sorted[0].id, 'LF20260924001');
    assert.equal(sorted[sorted.length - 1].id, 'LF20260921001');
    assert.deepEqual(SEED.map(function (i) { return i.id; }), before);
  });

  // ---------- 组合查询 ----------

  test('queryItems：关键词 + 类型 + 状态组合过滤', function () {
    const result = search.queryItems(SEED, { keyword: '校园卡', type: 'lost', status: 'open' });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'LF20260924003');
  });

  test('queryItems：状态筛成 done 后，进行中的信息被排除', function () {
    const result = search.queryItems(SEED, { keyword: '校园卡', status: 'done' });
    assert.deepEqual(result, []);
  });
})();
