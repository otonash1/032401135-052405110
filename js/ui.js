/**
 * ui.js —— 界面与交互
 *
 * 页面通过「路由 + 渲染函数」组织：
 *   - state.route 记录当前页面；
 *   - PAGES 是 路由 -> 渲染函数 的注册表，渲染函数返回一段 HTML 字符串；
 *   - 所有点击都用事件代理（data-action 属性）统一处理，避免把函数挂到全局。
 *
 * 具体页面会随开发阶段逐个补充。
 */
(function () {
  'use strict';

  const LF = (window.LF = window.LF || {});
  const utils = LF.utils;
  const seed = LF.seed;
  const search = LF.search;
  const CATE_ICON = seed.CATE_ICON;

  /* 数据仓库：页面只通过它读写数据 */
  const store = new LF.store.ItemStore();

  const $ = function (id) { return document.getElementById(id); };

  /* ---------- 页面状态 ---------- */
  const state = {
    route: 'home',   /* 当前页面 */
    params: {},      /* 当前页面参数（如详情页的 id） */
    nav: [],         /* 历史栈，供返回使用 */
    homeType: 'all'  /* 首页类型筛选：all / lost / found */
  };

  /* ================= 公共渲染片段 ================= */

  /** 取物品类别对应的图标 */
  function cateIcon(item) {
    return CATE_ICON[item.cate] || '🎒';
  }

  /** 列表卡片 */
  function itemCard(item) {
    const typeText = item.type === 'lost' ? '寻物' : '招领';
    const done = item.status === 'done';
    return '' +
      '<div class="card" data-action="detail" data-id="' + utils.escapeHtml(item.id) + '">' +
        '<div class="thumb ' + item.type + '">' + cateIcon(item) + '</div>' +
        '<div class="info">' +
          '<div class="row1">' +
            '<span class="name">' + utils.escapeHtml(item.name) + '</span>' +
            (done
              ? '<span class="tag done">已完成</span>'
              : '<span class="tag ' + item.type + '">' + typeText + '</span>') +
          '</div>' +
          '<div class="meta">📍 ' + utils.escapeHtml(item.place) + '<br>🕒 ' + utils.escapeHtml(item.time) + '</div>' +
          '<div class="desc">' + utils.escapeHtml(item.desc) + '</div>' +
        '</div>' +
      '</div>';
  }

  /** 空状态 */
  function empty(text) {
    return '<div class="empty">' + utils.escapeHtml(text) + '</div>';
  }

  /** 顶部导航（子页面用，首页有自己的渐变头部） */
  function navbar(title) {
    return '' +
      '<div class="navbar">' +
        '<button class="back" data-action="back" aria-label="返回">‹</button>' +
        '<div class="title">' + utils.escapeHtml(title) + '</div>' +
        '<div class="placeholder"></div>' +
      '</div>';
  }

  /** 轻提示 */
  let toastTimer = null;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 1600);
  }

  /* ================= 页面：首页 ================= */

  function renderHome() {
    const chips = [['all', '全部'], ['lost', '寻物'], ['found', '招领']].map(function (pair) {
      const on = state.homeType === pair[0];
      return '<div class="chip' + (on ? ' on' : '') + '" data-action="home-type" data-type="' + pair[0] + '">' + pair[1] + '</div>';
    }).join('');

    let list = search.filterByType(store.list(), state.homeType);
    list = search.sortByTimeDesc(list);

    return '' +
      '<div class="home-head">' +
        '<h2>校园失物招领</h2>' +
        '<p>找东西、还东西，都在这一个池子里</p>' +
        '<div class="searchbar" data-action="go" data-route="search">🔍 搜索物品名称，如「校园卡」「耳机」</div>' +
      '</div>' +
      '<div class="quick">' +
        '<div class="q" data-action="publish" data-type="lost"><div class="ico">🔎</div><div class="t">发布寻物</div><div class="d">我丢了东西</div></div>' +
        '<div class="split"></div>' +
        '<div class="q" data-action="publish" data-type="found"><div class="ico">🙌</div><div class="t">发布招领</div><div class="d">我捡到东西</div></div>' +
      '</div>' +
      '<div class="filter">' + chips + '</div>' +
      '<div class="list">' + (list.map(itemCard).join('') || empty('暂时还没有信息')) + '</div>';
  }

  /* ================= 路由 ================= */

  const PAGES = {
    home: renderHome
  };

  function navigate(entry, push) {
    if (push) state.nav.push({ route: state.route, params: state.params });
    state.route = entry.route;
    state.params = entry.params || {};
    render();
  }

  function go(route, params) {
    navigate({ route: route, params: params || {} }, true);
  }

  function back() {
    const prev = state.nav.pop();
    navigate(prev || { route: 'home' }, false);
  }

  function render() {
    const page = $('page');
    const fn = PAGES[state.route];
    page.innerHTML = fn ? fn() : empty('该页面仍在开发中……');
    page.scrollTop = 0;

    /* 底部标签栏：详情、成功页隐藏 */
    const tabbar = $('tabbar');
    tabbar.classList.toggle('hide', state.route === 'detail' || state.route === 'success');
    const tabs = tabbar.querySelectorAll('.tab');
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('on', tabs[i].getAttribute('data-route') === state.route);
    }
  }

  /* ================= 交互 ================= */

  function handleClick(e) {
    const el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) return;

    const action = el.getAttribute('data-action');
    const route = el.getAttribute('data-route');
    const type = el.getAttribute('data-type');

    if (action === 'go' || action === 'tab') { go(route); return; }
    if (action === 'back') { back(); return; }
    if (action === 'publish') { go('publish', { type: type }); return; }
    if (action === 'detail') { go('detail', { id: el.getAttribute('data-id') }); return; }
    if (action === 'home-type') { state.homeType = type; render(); return; }
  }

  /* ================= 初始化 ================= */

  function init() {
    document.addEventListener('click', handleClick);
    render();
  }

  /* 对外暴露，方便调试与后续页面复用 */
  LF.ui = { state: state, store: store, go: go, back: back, toast: toast, render: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
