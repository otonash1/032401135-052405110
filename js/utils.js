/**
 * utils.js —— 通用工具函数
 *
 * 这里只放与页面渲染无关的纯逻辑，方便直接做单元测试。
 * 所有模块统一挂到 window.LF 命名空间下，避免污染全局变量。
 */
(function () {
  'use strict';

  const LF = (window.LF = window.LF || {});

  /**
   * 转义 HTML 特殊字符。
   * 用户发布的物品名称、描述会直接渲染到页面上，必须转义，
   * 否则输入 <script> 之类的字符会破坏页面结构。
   */
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 去掉首尾空白；输入不是字符串时统一按空串处理 */
  function trim(value) {
    return String(value == null ? '' : value).trim();
  }

  /** 生成信息编号前缀：LF + yyyyMMdd */
  function idPrefix(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return 'LF' + y + m + d;
  }

  /** 生成信息编号：LF + yyyyMMdd + 3 位当日序号（如 LF20260924001） */
  function makeId(date, seq) {
    return idPrefix(date) + String(seq).padStart(3, '0');
  }

  /**
   * 在已有编号中找出「当天」可用的下一个序号。
   * 例如已有 LF20260924001、LF20260924002，返回 3。
   */
  function nextSeq(ids, date) {
    const prefix = idPrefix(date);
    let max = 0;
    ids.forEach(function (id) {
      if (typeof id === 'string' && id.indexOf(prefix) === 0) {
        const n = parseInt(id.slice(prefix.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
    return max + 1;
  }

  /** 时间戳 -> 「9 月 24 日发布」 */
  function formatPubTime(ts_) {
    const d = new Date(ts_);
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日发布';
  }

  /** 时间戳 -> 「刚刚 / 12 分钟前 / 3 小时前 / 昨天 / 9 月 24 日」 */
  function formatRelative(ts_, now) {
    const base = now == null ? Date.now() : now;
    const diff = base - ts_;
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + ' 分钟前';
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / (60 * 60 * 1000)) + ' 小时前';
    if (diff < 48 * 60 * 60 * 1000) return '昨天';
    const d = new Date(ts_);
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  }

  LF.utils = {
    escapeHtml: escapeHtml,
    trim: trim,
    makeId: makeId,
    nextSeq: nextSeq,
    formatPubTime: formatPubTime,
    formatRelative: formatRelative
  };
})();
