/**
 * search.js —— 信息检索与筛选
 *
 * 首页筛选、搜索页都用这里的函数，保证两处行为一致。
 * 全部是纯函数：传入数组返回新数组，不改动原数据。
 */
(function () {
  'use strict';

  const LF = (window.LF = window.LF || {});

  /** 参与关键词匹配的字段：物品名称、类别、地点、描述 */
  const SEARCH_FIELDS = ['name', 'cate', 'place', 'desc'];

  /** 时间倒序，最新的排在最前面 */
  function sortByTimeDesc(items) {
    return items.slice().sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  /** 按类型筛选：all 全部 / lost 寻物 / found 招领 */
  function filterByType(items, type) {
    if (!type || type === 'all') return items.slice();
    return items.filter(function (item) { return item.type === type; });
  }

  /** 按物品类别筛选：all 或具体类别名 */
  function filterByCategory(items, cate) {
    if (!cate || cate === 'all') return items.slice();
    return items.filter(function (item) { return item.cate === cate; });
  }

  /** 按状态筛选：all / open 进行中 / done 已完成 */
  function filterByStatus(items, status) {
    if (!status || status === 'all') return items.slice();
    return items.filter(function (item) { return item.status === status; });
  }

  /**
   * 关键词模糊搜索（不区分大小写）。
   * 关键词为空时返回空数组——搜索页在空关键词下应展示热门搜索，
   * 而不是把全部信息当作搜索结果列出来。
   */
  function searchItems(items, keyword) {
    const kw = String(keyword == null ? '' : keyword).trim().toLowerCase();
    if (!kw) return [];
    return items.filter(function (item) {
      return SEARCH_FIELDS.some(function (field) {
        return String(item[field] == null ? '' : item[field]).toLowerCase().indexOf(kw) >= 0;
      });
    });
  }

  /**
   * 组合查询：关键词 + 类型 + 类别 + 状态，结果按时间倒序。
   * 搜索页只调用这一个函数，避免各处筛选顺序不一致。
   */
  function queryItems(items, options) {
    const opt = options || {};
    let result = searchItems(items, opt.keyword);
    result = filterByType(result, opt.type || 'all');
    result = filterByCategory(result, opt.cate || 'all');
    result = filterByStatus(result, opt.status || 'all');
    return sortByTimeDesc(result);
  }

  LF.search = {
    SEARCH_FIELDS: SEARCH_FIELDS,
    sortByTimeDesc: sortByTimeDesc,
    filterByType: filterByType,
    filterByCategory: filterByCategory,
    filterByStatus: filterByStatus,
    searchItems: searchItems,
    queryItems: queryItems
  };
})();
