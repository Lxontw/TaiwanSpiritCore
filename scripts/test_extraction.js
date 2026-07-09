const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dbPath = path.resolve(__dirname, '../data/database.js');
const dbContent = fs.readFileSync(dbPath, 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dbContent, sandbox);
const db = sandbox.window.TAIWAN_SPIRIT_DB;

console.log(`植物條目數: ${db.plants.length} (預期 >= 50)`);
console.log(`法器條目數: ${db.talismans.length} (預期 >= 80)`);
console.log(`福澤條目數: ${db.fuzhe.length}`);
console.log(`精怪條目數: ${db.monsters.length}`);
console.log(`廟宇條目數: ${db.temples.length}`);

if (db.plants.length < 50 || db.talismans.length < 80) {
  console.error("FAIL: 條目提取數量不足！");
  process.exit(1);
}
console.log("PASS: 資料提取數量驗證通過！");
