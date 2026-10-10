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
    route: 'home',        /* 当前页面 */
    params: {},           /* 当前页面参数（如详情页的 id） */
    nav: [],              /* 历史栈，供返回使用 */
    homeType: 'all',      /* 首页类型筛选：all / lost / found */
    homeCate: 'all',      /* 首页类别筛选：all 或具体类别名 */
    publishType: 'lost',  /* 发布表单当前选中的类型 */
    editId: '',           /* 编辑模式下的信息编号（空表示新建） */
    lastPublishedId: '',  /* 刚发布成功的信息编号，供成功页跳详情 */
    searchKw: '',         /* 搜索页当前关键词 */
    searchFilter: 'all'   /* 搜索结果的筛选：all / lost / found / done */
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
    const all = store.list();

    const chips = [['all', '全部'], ['lost', '寻物'], ['found', '招领']].map(function (pair) {
      const on = state.homeType === pair[0];
      return '<div class="chip' + (on ? ' on' : '') + '" data-action="home-type" data-type="' + pair[0] + '">' + pair[1] + '</div>';
    }).join('');

    /* 类别筛选：全部 + 各物品类别 */
    const cateChips = ['全部'].concat(seed.CATEGORIES).map(function (c) {
      const val = c === '全部' ? 'all' : c;
      const on = state.homeCate === val;
      return '<div class="chip' + (on ? ' on' : '') + '" data-action="home-cate" data-cate="' + utils.escapeHtml(val) + '">' + utils.escapeHtml(c) + '</div>';
    }).join('');

    /* 概览统计：全部 / 寻物 / 招领 条数 */
    const lostCount = search.filterByType(all, 'lost').length;
    const foundCount = search.filterByType(all, 'found').length;
    const stats = '' +
      '<div class="stats">' +
        '<div class="s"><div class="n">' + all.length + '</div><div class="l">全部信息</div></div>' +
        '<div class="s"><div class="n">' + lostCount + '</div><div class="l">寻物</div></div>' +
        '<div class="s"><div class="n">' + foundCount + '</div><div class="l">招领</div></div>' +
      '</div>';

    let list = search.filterByType(all, state.homeType);
    list = search.filterByCategory(list, state.homeCate);
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
      stats +
      '<div class="filter">' + chips + '</div>' +
      '<div class="filter">' + cateChips + '</div>' +
      '<div class="list">' + (list.map(itemCard).join('') || empty('暂时还没有信息')) + '</div>';
  }

  /* ================= 页面：发布信息 ================= */

  /** 一个带标签、输入控件与错误提示的字段块 */
  function field(key, label, control, required) {
    return '' +
      '<div class="field" data-field="' + key + '">' +
        '<div class="label">' + label + (required ? ' <span class="req">*</span>' : '') + '</div>' +
        control +
        '<div class="err"></div>' +
      '</div>';
  }

  function renderPublish() {
    const editing = state.params.editId ? store.get(state.params.editId) : null;
    if (editing) {
      state.editId = editing.id;
      state.publishType = editing.type;
    } else {
      state.editId = '';
      if (state.params.type === 'lost' || state.params.type === 'found') {
        state.publishType = state.params.type;
      }
    }
    state.params = {};

    const isLost = state.publishType === 'lost';
    const segLost = '<div class="seg' + (isLost ? ' on' : '') + '" data-action="seg" data-type="lost">发布寻物</div>';
    const segFound = '<div class="seg' + (!isLost ? ' on' : '') + '" data-action="seg" data-type="found">发布招领</div>';

    const cateOptions = seed.CATEGORIES.map(function (c) {
      const sel = editing && editing.cate === c ? ' selected' : '';
      return '<option value="' + utils.escapeHtml(c) + '"' + sel + '>' + utils.escapeHtml(c) + '</option>';
    }).join('');

    const v = function (key) { return editing ? utils.escapeHtml(editing[key]) : ''; };

    return '' +
      navbar(editing ? '编辑信息' : '发布信息') +
      '<div class="form">' +
        '<div class="segment">' + segLost + segFound + '</div>' +
        field('name', '物品名称',
          '<input id="f-name" maxlength="30" placeholder="例如：黑色雨伞 / 一卡通" value="' + v('name') + '">', true) +
        field('cate', '物品类别',
          '<select id="f-cate">' + cateOptions + '</select>', true) +
        field('place', '<span id="lbl-place">' + (isLost ? '丢失地点' : '拾获地点') + '</span>',
          '<input id="f-place" maxlength="40" placeholder="例如：紫金楼 302 教室 / 三区食堂二楼" value="' + v('place') + '">', true) +
        field('time', '<span id="lbl-time">' + (isLost ? '丢失时间' : '拾获时间') + '</span>',
          '<input id="f-time" maxlength="40" placeholder="例如：2026-09-24 下午 3 点左右" value="' + v('time') + '">', true) +
        field('desc', '补充描述',
          '<textarea id="f-desc" maxlength="200" placeholder="颜色、特征、有无姓名贴等，描述越详细越容易被认出来">' + v('desc') + '</textarea>', false) +
        field('contact', '联系方式',
          '<input id="f-contact" maxlength="40" placeholder="微信号 / QQ / 手机号（仅对方点击后可见）" value="' + v('contact') + '">', true) +
        '<div class="tips">发布后可在「我的发布」中修改状态为「已完成」，或编辑、删除。</div>' +
        '<button class="btn btn-main" data-action="submit">' + (editing ? '保存修改' : '发布') + '</button>' +
      '</div>';
  }

  /* ================= 页面：发布成功 ================= */

  function renderSuccess() {
    const isLost = state.publishType === 'lost';
    const tip = isLost
      ? '你的寻物信息已经发布啦<br>有线索的同学可以通过详情页联系你'
      : '你的招领信息已经发布啦<br>谢谢你的热心，失主可以联系你认领';
    return '' +
      '<div class="result">' +
        '<div class="circle">✓</div>' +
        '<h3>发布成功</h3>' +
        '<p>' + tip + '</p>' +
        '<div class="acts">' +
          '<button class="btn btn-main" data-action="success-detail">查看详情</button>' +
          '<button class="btn btn-ghost" data-action="success-again">继续发布</button>' +
          '<button class="btn btn-ghost" data-action="tab" data-route="home">返回首页</button>' +
        '</div>' +
      '</div>';
  }

  /* ================= 页面：搜索 ================= */

  function renderSearch() {
    const hotWords = ['校园卡', '钥匙', '雨伞', '耳机', '水杯', '充电宝'];
    const quickWords = ['紫金楼', '图书馆', '三区食堂', '一区宿舍'];
    const kwTag = function (word) {
      return '<span data-action="quick-kw" data-kw="' + utils.escapeHtml(word) + '">' + utils.escapeHtml(word) + '</span>';
    };

    const filterChips = [['all', '全部'], ['lost', '寻物'], ['found', '招领'], ['done', '已完成']].map(function (pair) {
      const on = state.searchFilter === pair[0];
      return '<div class="chip' + (on ? ' on' : '') + '" data-action="s-filter" data-type="' + pair[0] + '">' + pair[1] + '</div>';
    }).join('');

    const hasKw = state.searchKw.trim() !== '';

    return '' +
      '<div class="search-head">' +
        '<div class="box"><span>🔍</span>' +
          '<input id="kw" maxlength="30" placeholder="输入物品名称 / 关键词" value="' + utils.escapeHtml(state.searchKw) + '">' +
        '</div>' +
        '<div class="cancel" data-action="tab" data-route="home">取消</div>' +
      '</div>' +
      '<div id="search-hot"' + (hasKw ? ' style="display:none"' : '') + '>' +
        '<div class="sec"><div class="sec-title">热门搜索</div><div class="kw">' + hotWords.map(kwTag).join('') + '</div></div>' +
        '<div class="sec"><div class="sec-title">快捷筛选</div><div class="kw">' + quickWords.map(kwTag).join('') + '</div></div>' +
      '</div>' +
      '<div id="search-result"' + (hasKw ? '' : ' style="display:none"') + '>' +
        '<div class="filter-row">' + filterChips + '</div>' +
        '<div class="res-head" id="res-head"></div>' +
        '<div class="list" id="res-list"></div>' +
      '</div>';
  }

  /* ================= 页面：详情 ================= */

  function renderDetail() {
    const item = store.get(state.params.id);
    if (!item) {
      return navbar('信息详情') + empty('这条信息可能已经被删除或不见了');
    }

    const isLost = item.type === 'lost';
    const done = item.status === 'done';
    const tagText = isLost ? '寻物' : '招领';

    return '' +
      '<div class="detail-hero">' + cateIcon(item) + '</div>' +
      '<div class="detail-card">' +
        '<div class="name-row">' +
          '<span class="name">' + utils.escapeHtml(item.name) + '</span>' +
          '<span class="tag ' + item.type + '">' + tagText + '</span>' +
          '<span class="status' + (done ? ' done' : '') + '">' + (done ? '已完成' : '进行中') + '</span>' +
        '</div>' +
        '<div class="desc">' + utils.escapeHtml(item.desc) + '</div>' +
      '</div>' +
      '<div class="rows">' +
        '<div class="r"><span class="k">' + (isLost ? '丢失地点' : '拾获地点') + '</span><span class="v">' + utils.escapeHtml(item.place) + '</span></div>' +
        '<div class="r"><span class="k">' + (isLost ? '丢失时间' : '拾获时间') + '</span><span class="v">' + utils.escapeHtml(item.time) + '</span></div>' +
        '<div class="r"><span class="k">物品类别</span><span class="v">' + utils.escapeHtml(item.cate) + '</span></div>' +
        '<div class="r"><span class="k">信息编号</span><span class="v">' + utils.escapeHtml(item.id) + '</span></div>' +
      '</div>' +
      '<div class="publisher">' +
        '<div class="avatar">' + utils.escapeHtml(String(item.pub).charAt(0)) + '</div>' +
        '<div class="pu-info">' +
          '<div class="pu-name">' + utils.escapeHtml(item.pub) + '</div>' +
          '<div class="pu-sub">' + utils.escapeHtml(item.dept) + ' · ' + utils.formatPubTime(item.createdAt) + '</div>' +
        '</div>' +
        '<button class="contact-btn" data-action="contact" id="contact-toggle">联系 TA</button>' +
      '</div>' +
      '<div class="contact-box" id="contact-box" style="display:none">' +
        '<div class="c-label">发布者联系方式</div>' +
        '<div class="c-row">' +
          '<span class="c-value" id="contact-value">' + utils.escapeHtml(item.contact) + '</span>' +
          '<button class="copy-btn" data-action="copy">复制</button>' +
        '</div>' +
      '</div>' +
      '<div class="notice">为保护同学隐私，联系方式默认隐藏，点击「联系 TA」后显示；请勿在公开评论中留下个人信息，谨防冒领与诈骗。</div>' +
      '<div class="detail-actions">' +
        '<button class="btn btn-ghost" data-action="report">举报</button>' +
        '<button class="btn btn-main" data-action="contact">查看联系方式</button>' +
      '</div>';
  }

  /* ================= 页面：我的发布 ================= */

  function renderMine() {
    const me = seed.CURRENT_USER;
    const list = search.sortByTimeDesc(store.listMine());

    const items = list.map(function (item) {
      const done = item.status === 'done';
      const id = utils.escapeHtml(item.id);
      return '' +
        '<div class="my-item">' +
          '<div class="top">' +
            '<span class="tag ' + item.type + '">' + (item.type === 'lost' ? '寻物' : '招领') + '</span>' +
            '<span class="name">' + utils.escapeHtml(item.name) + '</span>' +
            '<select data-action="status" data-id="' + id + '">' +
              '<option value="open"' + (done ? '' : ' selected') + '>进行中</option>' +
              '<option value="done"' + (done ? ' selected' : '') + '>已完成</option>' +
            '</select>' +
          '</div>' +
          '<div class="meta">📍 ' + utils.escapeHtml(item.place) + '<br>🕒 ' + utils.escapeHtml(item.time) + '</div>' +
          '<div class="acts">' +
            '<span data-action="detail" data-id="' + id + '">查看</span>' +
            '<span data-action="edit" data-id="' + id + '">编辑</span>' +
            '<span class="danger" data-action="remove" data-id="' + id + '">删除</span>' +
          '</div>' +
        '</div>';
    }).join('');

    return '' +
      '<div class="mine-head">' +
        '<div class="avatar">' + utils.escapeHtml(me.name.charAt(0)) + '</div>' +
        '<div>' +
          '<div class="nm">' + utils.escapeHtml(me.name) + '</div>' +
          '<div class="sub">' + utils.escapeHtml(me.dept) + ' · 我的发布（' + list.length + '）</div>' +
        '</div>' +
      '</div>' +
      '<div class="list" style="margin-top:12px">' + (items || empty('你还没有发布过信息')) + '</div>';
  }

  /* ================= 路由 ================= */

  const PAGES = {
    home: renderHome,
    publish: renderPublish,
    success: renderSuccess,
    search: renderSearch,
    detail: renderDetail,
    mine: renderMine
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

    /* 搜索页：渲染后按当前关键词填充结果区 */
    if (state.route === 'search') doSearch();

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
    if (action === 'home-cate') { state.homeCate = el.getAttribute('data-cate'); render(); return; }
    if (action === 'seg') { setPublishType(type); return; }
    if (action === 'submit') { submitPublish(); return; }
    if (action === 'success-detail') { go('detail', { id: state.lastPublishedId }); return; }
    if (action === 'success-again') { go('publish', { type: state.publishType }); return; }
    if (action === 'quick-kw') { quickKw(el.getAttribute('data-kw')); return; }
    if (action === 's-filter') { setSFilter(type); return; }
    if (action === 'contact') { revealContact(); return; }
    if (action === 'copy') { copyContact(); return; }
    if (action === 'report') { toast('已提交举报，等待管理员处理'); return; }
    if (action === 'edit') { go('publish', { editId: el.getAttribute('data-id') }); return; }
    if (action === 'remove') { removeItem(el.getAttribute('data-id')); return; }
  }

  /** 下拉框切换状态 */
  function handleChange(e) {
    const el = e.target;
    if (!el || !el.getAttribute || el.getAttribute('data-action') !== 'status') return;
    changeStatus(el.getAttribute('data-id'), el.value);
  }

  /** 输入时清掉该字段的错误提示；搜索框则实时检索 */
  function handleInput(e) {
    if (e.target && e.target.id === 'kw') { doSearch(); return; }
    const box = e.target.closest ? e.target.closest('[data-field]') : null;
    if (!box) return;
    box.classList.remove('invalid');
    const err = box.querySelector('.err');
    if (err) err.textContent = '';
  }

  /** 切换「寻物 / 招领」，同步分段按钮与地点、时间的措辞 */
  function setPublishType(type) {
    state.publishType = type === 'found' ? 'found' : 'lost';
    const segs = document.querySelectorAll('.segment .seg');
    for (let i = 0; i < segs.length; i++) {
      segs[i].classList.toggle('on', segs[i].getAttribute('data-type') === state.publishType);
    }
    const lp = $('lbl-place');
    const lt = $('lbl-time');
    if (lp) lp.textContent = state.publishType === 'lost' ? '丢失地点' : '拾获地点';
    if (lt) lt.textContent = state.publishType === 'lost' ? '丢失时间' : '拾获时间';
  }

  /** 收集表单内容 */
  function readDraft() {
    const val = function (id) { const el = $(id); return el ? el.value : ''; };
    return {
      type: state.publishType,
      name: val('f-name'),
      cate: val('f-cate'),
      place: val('f-place'),
      time: val('f-time'),
      desc: val('f-desc'),
      contact: val('f-contact')
    };
  }

  /** 把校验结果标到对应字段上 */
  function showErrors(errors) {
    const keys = Object.keys(errors);
    const boxes = document.querySelectorAll('.form .field');
    for (let i = 0; i < boxes.length; i++) {
      const key = boxes[i].getAttribute('data-field');
      const err = boxes[i].querySelector('.err');
      if (Object.prototype.hasOwnProperty.call(errors, key)) {
        boxes[i].classList.add('invalid');
        if (err) err.textContent = errors[key];
      } else {
        boxes[i].classList.remove('invalid');
        if (err) err.textContent = '';
      }
    }
    /* 滚动到第一个出错的字段 */
    if (keys.length) {
      const first = document.querySelector('.form .field[data-field="' + keys[0] + '"]');
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center' });
    }
  }

  /** 提交发布／保存编辑 */
  function submitPublish() {
    const draft = readDraft();
    const result = LF.validate.validateDraft(draft);
    if (!result.ok) {
      showErrors(result.errors);
      toast('还有信息没填好，请检查标红的字段');
      return;
    }
    const clean = LF.validate.normalizeDraft(draft);

    if (state.editId) {
      const id = state.editId;
      store.update(id, clean);
      state.editId = '';
      toast('修改已保存');
      state.nav = [];
      navigate({ route: 'mine' }, false);
      return;
    }

    const item = store.add(clean);
    state.lastPublishedId = item.id;
    go('success');
  }

  /* ================= 搜索逻辑 ================= */

  /** 按当前关键词与筛选更新搜索结果区；只改局部，保持输入框焦点 */
  function doSearch() {
    const input = $('kw');
    if (!input) return;
    const kw = input.value.trim();
    state.searchKw = kw;

    const hot = $('search-hot');
    const res = $('search-result');
    if (!kw) {
      if (hot) hot.style.display = 'block';
      if (res) res.style.display = 'none';
      return;
    }
    if (hot) hot.style.display = 'none';
    if (res) res.style.display = 'block';

    let list = LF.search.searchItems(store.list(), kw);
    if (state.searchFilter === 'done') list = LF.search.filterByStatus(list, 'done');
    else if (state.searchFilter !== 'all') list = LF.search.filterByType(list, state.searchFilter);
    list = LF.search.sortByTimeDesc(list);

    const head = $('res-head');
    if (head) head.textContent = '找到 ' + list.length + ' 条与「' + kw + '」相关的信息';
    const box = $('res-list');
    if (box) box.innerHTML = list.map(itemCard).join('') || empty('没有找到相关信息，换个关键词试试');
  }

  /** 点热门 / 快捷词：填进输入框并立即搜索 */
  function quickKw(kw) {
    const input = $('kw');
    if (input) input.value = kw;
    state.searchKw = kw;
    doSearch();
  }

  /** 搜索结果筛选：all / lost / found / done */
  function setSFilter(filter) {
    state.searchFilter = filter;
    const chips = document.querySelectorAll('.filter-row .chip');
    for (let i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('on', chips[i].getAttribute('data-type') === filter);
    }
    doSearch();
  }

  /* ================= 详情逻辑 ================= */

  /** 展开联系方式（默认隐藏，点击后显示） */
  function revealContact() {
    const box = $('contact-box');
    if (!box) return;
    box.style.display = 'block';
    const btn = $('contact-toggle');
    if (btn) btn.textContent = '已显示';
    toast('已显示联系方式，请核验身份，谨防冒领');
  }

  /** 一键复制联系方式：优先用剪贴板 API，不可用时回退到临时输入框 */
  function copyContact() {
    const el = $('contact-value');
    const text = el ? el.textContent : '';
    if (!text) return;

    const done = function () { toast('联系方式已复制：' + text); };
    const fallback = function () {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? '联系方式已复制：' + text : '复制失败，请手动长按选择');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* ================= 我的发布逻辑 ================= */

  /** 修改信息状态：open 进行中 / done 已完成 */
  function changeStatus(id, status) {
    const item = store.setStatus(id, status);
    if (!item) return;
    toast(item.status === 'done' ? '已标记为「已完成」' : '已恢复为「进行中」');
  }

  /** 删除信息（二次确认） */
  function removeItem(id) {
    const item = store.get(id);
    if (!item) return;
    if (!window.confirm('确定删除「' + item.name + '」吗？删除后不可恢复。')) return;
    store.remove(id);
    toast('已删除该信息');
    render();
  }

  /* ================= 初始化 ================= */

  function init() {
    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
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
