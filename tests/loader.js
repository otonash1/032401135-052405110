'use strict';
/**
 * loader.js —— 在 Node 中加载浏览器脚本（可选，方便有 Node 的同学跑测试）
 *
 * 项目里的 js/*.js 是给浏览器用的普通脚本，通过 window.LF 命名空间互相引用。
 * 这里用 new Function('window', code) 把它们放进一个有 window 的环境里执行，
 * 于是不用改动源码、也不用打包工具，就能在 Node 里跑单元测试。
 *
 * 平时更推荐直接双击 tests/test.html 在浏览器里跑，见 test.html。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** 浏览器脚本的加载顺序 = 依赖顺序：utils/seed 在前，store 在后 */
const SCRIPT_FILES = ['js/utils.js', 'js/seed.js', 'js/validate.js', 'js/search.js', 'js/store.js'];

/** 测试文件：harness 提供 test/assert，其余注册用例 */
const TEST_FILES = [
  'tests/harness.js',
  'tests/utils.test.js',
  'tests/validate.test.js',
  'tests/search.test.js',
  'tests/store.test.js'
];

function loadLF() {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.console = console;
  SCRIPT_FILES.concat(TEST_FILES).forEach(function (rel) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    // eslint-disable-next-line no-new-func
    new Function('window', code)(sandbox);
  });
  return sandbox.LF;
}

module.exports = { loadLF: loadLF, SCRIPT_FILES: SCRIPT_FILES, TEST_FILES: TEST_FILES };
