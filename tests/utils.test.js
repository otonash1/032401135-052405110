/**
 * tests/utils.test.js —— utils.js 的单元测试
 * 覆盖：HTML 转义、编号生成、相对时间显示
 */
(function () {
  'use strict';

  const LF = window.LF;
  const test = LF.test;
  const assert = LF.assert;
  const utils = LF.utils;

  // ---------- escapeHtml ----------

  test('escapeHtml：把尖括号转义，避免用户输入破坏页面结构', function () {
    assert.equal(utils.escapeHtml('<script>alert(1)</script>'),
      '&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('escapeHtml：null / undefined 统一返回空串', function () {
    assert.equal(utils.escapeHtml(null), '');
    assert.equal(utils.escapeHtml(undefined), '');
  });

  test('escapeHtml：双引号与单引号都会被转义', function () {
    assert.equal(utils.escapeHtml('a"b\'c'), 'a&quot;b&#39;c');
  });

  // ---------- trim ----------

  test('trim：去掉首尾空白，null 也能安全处理', function () {
    assert.equal(utils.trim('  黑色雨伞  '), '黑色雨伞');
    assert.equal(utils.trim(null), '');
  });

  // ---------- makeId / nextSeq ----------

  test('makeId：按「LF + 年月日 + 3 位序号」生成编号', function () {
    assert.equal(utils.makeId(new Date(2026, 8, 24), 1), 'LF20260924001');
    assert.equal(utils.makeId(new Date(2026, 8, 24), 12), 'LF20260924012');
  });

  test('nextSeq：同一天的编号递增', function () {
    const ids = ['LF20260924001', 'LF20260924002'];
    assert.equal(utils.nextSeq(ids, new Date(2026, 8, 24)), 3);
  });

  test('nextSeq：忽略其它日期的编号，从 1 开始', function () {
    const ids = ['LF20260923009', 'LF20260922001'];
    assert.equal(utils.nextSeq(ids, new Date(2026, 8, 24)), 1);
  });

  test('nextSeq：编号列表为空时返回 1', function () {
    assert.equal(utils.nextSeq([], new Date(2026, 8, 24)), 1);
  });

  // ---------- formatRelative ----------

  test('formatRelative：按时间差返回刚刚 / 分钟 / 小时 / 昨天', function () {
    const now = new Date(2026, 8, 24, 15, 0).getTime();
    assert.equal(utils.formatRelative(now - 10 * 1000, now), '刚刚');
    assert.equal(utils.formatRelative(now - 12 * 60 * 1000, now), '12 分钟前');
    assert.equal(utils.formatRelative(now - 3 * 60 * 60 * 1000, now), '3 小时前');
    assert.equal(utils.formatRelative(now - 30 * 60 * 60 * 1000, now), '昨天');
  });

  test('formatRelative：超过两天显示具体日期', function () {
    const now = new Date(2026, 8, 24, 15, 0).getTime();
    assert.equal(utils.formatRelative(new Date(2026, 8, 20, 9, 0).getTime(), now), '9 月 20 日');
  });

  test('formatPubTime：格式化为「9 月 24 日发布」', function () {
    assert.equal(utils.formatPubTime(new Date(2026, 8, 24, 15, 0).getTime()), '9 月 24 日发布');
  });
})();
