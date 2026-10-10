'use strict';
/**
 * run.js —— 单元测试入口（Node 版，可选）
 *
 * 运行方式（需要本机装有 Node.js）：
 *     node tests/run.js
 *
 * 没装 Node.js 也没关系：直接双击 tests/test.html 就能在浏览器里跑同一批用例。
 */
const loader = require('./loader');

const LF = loader.loadLF();
const result = LF.runTests('校园失物招领 · 单元测试');

if (result.fail > 0) {
  process.exitCode = 1;
}
