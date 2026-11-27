// Мини-резолвер для eslint-plugin-boundaries: понимает алиас "@/..." → src/...
// (официальный eslint-import-resolver-typescript конфликтует по peer-зависимостям).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'src');
const exts = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

exports.interfaceVersion = 2;
exports.resolve = (source, file) => {
  let base;
  if (source.startsWith('@/')) base = path.join(root, source.slice(2));
  else if (source.startsWith('.')) base = path.resolve(path.dirname(file), source);
  else return { found: false };
  for (const ext of exts) {
    const p = base + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return { found: true, path: p };
  }
  return { found: false };
};
