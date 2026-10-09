/**
 * seed.js —— 基础数据
 *
 * 包含物品类别、类别图标、当前用户，以及首次打开时写入的示例数据。
 * 示例数据让评审者一打开页面就能浏览、搜索，不必先自己发布几条。
 */
(function () {
  'use strict';

  const LF = (window.LF = window.LF || {});

  /** 物品类别：发布表单下拉框与首页筛选共用同一份定义 */
  const CATEGORIES = ['校园卡/证件', '钥匙', '水杯', '雨伞', '耳机', '书籍/资料', '其他'];

  /** 类别 -> 展示图标 */
  const CATE_ICON = {
    '校园卡/证件': '💳',
    '钥匙': '🔑',
    '水杯': '🥤',
    '雨伞': '☂️',
    '耳机': '🎧',
    '书籍/资料': '📚',
    '其他': '🎒'
  };

  /**
   * 当前用户。
   * 本作业未接入真实账号体系，固定一个用户来演示「我的发布」与联系方式。
   */
  const CURRENT_USER = { name: 'Otonash1', dept: '计算机与大数据学院' };

  /** 构造 2026 年的时间戳，让示例数据的时间顺序稳定可预期 */
  function ts(month, day, hour, minute) {
    return new Date(2026, month - 1, day, hour, minute).getTime();
  }

  /**
   * 示例信息。
   * type：lost 寻物 / found 招领
   * status：open 进行中 / done 已完成
   * mine：是否属于当前用户（决定它会不会出现在「我的发布」里）
   */
  const SEED_ITEMS = [
    {
      id: 'LF20260924001', name: '黑色长柄雨伞', type: 'lost', cate: '雨伞',
      place: '紫金楼 302 教室', time: '2026-09-24 15:00 左右',
      pub: CURRENT_USER.name, dept: CURRENT_USER.dept,
      contact: '微信 lf_0924', status: 'open', mine: true, createdAt: ts(9, 24, 15, 0),
      desc: '黑色八骨长柄伞，伞柄上贴有一张写名字的白色标签，伞面有一处小修补痕迹。'
    },
    {
      id: 'LF20260924002', name: '校园卡（一卡通）', type: 'found', cate: '校园卡/证件',
      place: '三区食堂二楼', time: '2026-09-24 12:20 左右',
      pub: '陈同学', dept: '土木工程学院',
      contact: '手机 138****6621', status: 'open', mine: false, createdAt: ts(9, 24, 12, 20),
      desc: '在三区食堂二楼靠窗餐桌上捡到，卡面有轻微磨损，姓名首字为「陈」，已交至食堂一楼服务台暂存。'
    },
    {
      id: 'LF20260924003', name: '校园卡（一卡通）', type: 'lost', cate: '校园卡/证件',
      place: '图书馆一楼大厅', time: '2026-09-24 09:40 左右',
      pub: '郑同学', dept: '数学与统计学院',
      contact: '微信 zheng_card', status: 'open', mine: false, createdAt: ts(9, 24, 9, 40),
      desc: '卡面贴有一张透明保护膜，姓名首字为「郑」，9 月 24 日上午在图书馆一楼刷卡进馆后发现丢失。'
    },
    {
      id: 'LF20260923001', name: '白色蓝牙耳机盒', type: 'lost', cate: '耳机',
      place: '图书馆 4 楼自习区', time: '2026-09-23 20:40 左右',
      pub: '吴同学', dept: '外国语学院',
      contact: 'QQ 1024***88', status: 'open', mine: false, createdAt: ts(9, 23, 20, 40),
      desc: '白色充电仓，盒盖上有一道细细的划痕，里面是两只入耳式耳机。'
    },
    {
      id: 'LF20260923002', name: '一串宿舍钥匙', type: 'found', cate: '钥匙',
      place: '一区 7 号楼楼下', time: '2026-09-23 18:05 左右',
      pub: CURRENT_USER.name, dept: CURRENT_USER.dept,
      contact: '微信 wang_7h', status: 'open', mine: true, createdAt: ts(9, 23, 18, 5),
      desc: '三把钥匙串在一个蓝色挂绳上，挂绳末端有一个小玩偶挂件。'
    },
    {
      id: 'LF20260922001', name: '银色保温水杯', type: 'lost', cate: '水杯',
      place: '田径场看台', time: '2026-09-22 17:30 左右',
      pub: '张同学', dept: '经济与管理学院',
      contact: '微信 zhang_cup', status: 'open', mine: false, createdAt: ts(9, 22, 17, 30),
      desc: '银色不锈钢保温杯，杯底有一圈黑色防滑垫，杯身有轻微凹痕。'
    },
    {
      id: 'LF20260922002', name: '《数据结构》课本', type: 'found', cate: '书籍/资料',
      place: '东二教学楼 201', time: '2026-09-22 16:10 左右',
      pub: '李同学', dept: '计算机与大数据学院',
      contact: 'QQ 771***20', status: 'done', mine: false, createdAt: ts(9, 22, 16, 10),
      desc: '课本扉页写有姓名，已联系到失主并当面归还。'
    },
    {
      id: 'LF20260921001', name: '粉色充电宝', type: 'lost', cate: '其他',
      place: '校医院门口', time: '2026-09-21 09:15 左右',
      pub: '赵同学', dept: '生物科学与工程学院',
      contact: '微信 zhao_pb', status: 'done', mine: false, createdAt: ts(9, 21, 9, 15),
      desc: '粉色外壳，10000 mAh，侧面有一处贴纸。已由好心同学送回。'
    }
  ];

  LF.seed = {
    CATEGORIES: CATEGORIES,
    CATE_ICON: CATE_ICON,
    CURRENT_USER: CURRENT_USER,
    SEED_ITEMS: SEED_ITEMS
  };
})();
