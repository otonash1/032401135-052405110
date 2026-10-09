/**
 * validate.js —— 发布表单校验
 *
 * 单独抽出来的原因：
 * 1. 「信息不完整就提交」是必须覆盖的异常路径，规则集中在一起才好维护；
 * 2. 纯函数，不依赖页面，可以直接写单元测试。
 */
(function () {
  'use strict';

  const LF = (window.LF = window.LF || {});
  const trim = LF.utils.trim;

  const RULES = {
    name: { label: '物品名称', max: 30 },
    place: { label: '地点', max: 40 },
    time: { label: '时间', max: 40 },
    desc: { label: '补充描述', max: 200, optional: true },
    contact: { label: '联系方式', min: 3, max: 40 }
  };

  /**
   * 校验一条待发布的信息。
   * @param {Object} draft 表单原始内容，允许字段缺失
   * @returns {{ok: boolean, errors: Object}} errors 按字段名给出第一条错误提示
   */
  function validateDraft(draft) {
    const input = draft || {};
    const errors = {};

    if (input.type !== 'lost' && input.type !== 'found') {
      errors.type = '请选择信息类型';
    }

    if (!trim(input.name)) {
      errors.name = '请填写' + RULES.name.label;
    } else if (trim(input.name).length > RULES.name.max) {
      errors.name = RULES.name.label + '不能超过 ' + RULES.name.max + ' 个字';
    }

    if (!trim(input.cate)) {
      errors.cate = '请选择物品类别';
    }

    if (!trim(input.place)) {
      errors.place = '请填写' + RULES.place.label;
    } else if (trim(input.place).length > RULES.place.max) {
      errors.place = RULES.place.label + '不能超过 ' + RULES.place.max + ' 个字';
    }

    if (!trim(input.time)) {
      errors.time = '请填写' + RULES.time.label;
    } else if (trim(input.time).length > RULES.time.max) {
      errors.time = RULES.time.label + '不能超过 ' + RULES.time.max + ' 个字';
    }

    if (trim(input.desc).length > RULES.desc.max) {
      errors.desc = RULES.desc.label + '不能超过 ' + RULES.desc.max + ' 个字';
    }

    const contact = trim(input.contact);
    if (!contact) {
      errors.contact = '请填写' + RULES.contact.label;
    } else if (contact.length < RULES.contact.min || contact.length > RULES.contact.max) {
      errors.contact = RULES.contact.label + '长度应为 ' + RULES.contact.min + '-' + RULES.contact.max + ' 个字符';
    }

    return { ok: Object.keys(errors).length === 0, errors: errors };
  }

  /** 把表单内容整理成入库用的规范字段（去掉首尾空格、补默认值） */
  function normalizeDraft(draft) {
    const input = draft || {};
    return {
      type: input.type === 'found' ? 'found' : 'lost',
      name: trim(input.name),
      cate: trim(input.cate),
      place: trim(input.place),
      time: trim(input.time),
      desc: trim(input.desc) || '（暂无补充描述）',
      contact: trim(input.contact)
    };
  }

  LF.validate = {
    RULES: RULES,
    validateDraft: validateDraft,
    normalizeDraft: normalizeDraft
  };
})();
