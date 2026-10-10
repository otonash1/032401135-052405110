/**
 * tests/validate.test.js —— validate.js 的单元测试
 * 重点覆盖异常路径：信息不完整、字段超长、类型非法
 */
(function () {
  'use strict';

  const LF = window.LF;
  const test = LF.test;
  const assert = LF.assert;
  const validate = LF.validate;

  /** 一份合法的表单草稿，各用例在此基础上只改一个字段制造异常 */
  function validDraft() {
    return {
      type: 'lost',
      name: '黑色雨伞',
      cate: '雨伞',
      place: '紫金楼 302',
      time: '2026-09-24 15:00',
      desc: '伞柄上有白色标签',
      contact: '微信 lf_0924'
    };
  }

  test('validateDraft：完整且合法的草稿校验通过', function () {
    const result = validate.validateDraft(validDraft());
    assert.equal(result.ok, true);
    assert.equal(Object.keys(result.errors).length, 0);
  });

  test('validateDraft：传入空对象不报错崩溃（异常输入）', function () {
    assert.notThrow(function () { validate.validateDraft(null); });
    assert.equal(validate.validateDraft(null).ok, false);
  });

  test('validateDraft：物品名称为空时报错', function () {
    const draft = validDraft();
    draft.name = '   ';
    const result = validate.validateDraft(draft);
    assert.equal(result.ok, false);
    assert.equal(result.errors.name, '请填写物品名称');
  });

  test('validateDraft：地点为空时报错', function () {
    const draft = validDraft();
    draft.place = '';
    assert.equal(validate.validateDraft(draft).errors.place, '请填写地点');
  });

  test('validateDraft：时间与类别为空时报错', function () {
    const draft = validDraft();
    draft.time = '';
    draft.cate = '';
    const errors = validate.validateDraft(draft).errors;
    assert.equal(errors.time, '请填写时间');
    assert.equal(errors.cate, '请选择物品类别');
  });

  test('validateDraft：联系方式为空时报错', function () {
    const draft = validDraft();
    draft.contact = '';
    assert.equal(validate.validateDraft(draft).errors.contact, '请填写联系方式');
  });

  test('validateDraft：联系方式过短时报错（边界值 2 < min 3）', function () {
    const draft = validDraft();
    draft.contact = 'ab';
    assert.equal(validate.validateDraft(draft).errors.contact, '联系方式长度应为 3-40 个字符');
  });

  test('validateDraft：名称刚好 30 字通过（边界值 = max）', function () {
    const draft = validDraft();
    draft.name = new Array(31).join('伞');
    assert.equal(validate.validateDraft(draft).ok, true);
  });

  test('validateDraft：名称 31 字超长报错（边界值 = max + 1）', function () {
    const draft = validDraft();
    draft.name = new Array(32).join('伞');
    assert.equal(validate.validateDraft(draft).errors.name, '物品名称不能超过 30 个字');
  });

  test('validateDraft：补充描述超过 200 字报错', function () {
    const draft = validDraft();
    draft.desc = new Array(202).join('描');
    assert.equal(validate.validateDraft(draft).errors.desc, '补充描述不能超过 200 个字');
  });

  test('validateDraft：信息类型不合法时报错', function () {
    const draft = validDraft();
    draft.type = 'unknown';
    assert.equal(validate.validateDraft(draft).errors.type, '请选择信息类型');
  });

  test('validateDraft：多个字段同时为空时逐项收集错误', function () {
    const result = validate.validateDraft({ type: 'lost' });
    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(result.errors).sort(), ['cate', 'contact', 'name', 'place', 'time']);
  });

  test('normalizeDraft：去掉首尾空格，描述为空时补默认文案', function () {
    const draft = validDraft();
    draft.name = '  黑色雨伞 ';
    draft.desc = '   ';
    const normalized = validate.normalizeDraft(draft);
    assert.equal(normalized.name, '黑色雨伞');
    assert.equal(normalized.desc, '（暂无补充描述）');
  });

  test('normalizeDraft：非法类型统一回落为 lost', function () {
    const draft = validDraft();
    draft.type = 'whatever';
    assert.equal(validate.normalizeDraft(draft).type, 'lost');
  });
})();
