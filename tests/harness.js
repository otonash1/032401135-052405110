/**
 * tests/harness.js —— 极简测试框架
 *
 * 为什么自己写而不用 jest / mocha：
 * 这个作业是纯前端网页，评审者不一定装了 Node.js。
 * 这里只依赖浏览器，双击 tests/test.html 就能看到全部用例的执行结果。
 */
(function () {
  'use strict';

  const LF = (window.LF = window.LF || {});

  /** 已注册的用例 */
  const cases = [];

  /** 注册一个用例：name 是用例说明，fn 里用 assert 做断言 */
  function test(name, fn) {
    cases.push({ name: name, fn: fn });
  }

  function show(value) {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }

  /** 断言工具，失败时抛出带说明的异常 */
  const assert = {
    ok: function (value, message) {
      if (!value) throw new Error((message || '断言失败') + '：期望为真，实际为 ' + show(value));
    },

    equal: function (actual, expected, message) {
      if (actual !== expected) {
        throw new Error((message || '断言失败') + '：期望 ' + show(expected) + '，实际 ' + show(actual));
      }
    },

    deepEqual: function (actual, expected, message) {
      if (show(actual) !== show(expected)) {
        throw new Error((message || '断言失败') + '：期望 ' + show(expected) + '，实际 ' + show(actual));
      }
    },

    /** 断言函数不抛异常（用于校验「非法输入不应崩」） */
    notThrow: function (fn, message) {
      try {
        fn();
      } catch (e) {
        throw new Error((message || '断言失败') + '：不应抛出异常，实际抛出 ' + e.message);
      }
    }
  };

  /**
   * 执行所有已注册用例。
   * @returns {{total:number, pass:number, fail:number, details:Array}}
   */
  function runTests(label) {
    const details = [];
    let pass = 0;

    if (typeof console !== 'undefined' && console.log) {
      console.log('\n' + (label || '单元测试'));
      console.log('--------------------------------');
    }

    cases.forEach(function (item, index) {
      const record = { index: index + 1, name: item.name, ok: true, message: '' };
      try {
        item.fn();
        pass++;
      } catch (err) {
        record.ok = false;
        record.message = err && err.message ? err.message : String(err);
      }
      details.push(record);
      if (typeof console !== 'undefined' && console.log) {
        console.log('  ' + record.index + '. ' + (record.ok ? '✓' : '✗') + ' ' + record.name +
          (record.ok ? '' : '\n      ' + record.message));
      }
    });

    const summary = {
      total: cases.length,
      pass: pass,
      fail: cases.length - pass,
      details: details
    };

    if (typeof console !== 'undefined' && console.log) {
      console.log('--------------------------------');
      console.log('共 ' + summary.total + ' 个用例：通过 ' + summary.pass + '，失败 ' + summary.fail);
    }
    return summary;
  }

  LF.test = test;
  LF.assert = assert;
  LF.runTests = runTests;
})();
