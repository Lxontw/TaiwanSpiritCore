const fs = require('fs');
const dbContent = fs.readFileSync('data/database.js', 'utf8');
// 簡單的 eval 或是解析 window.TAIWAN_SPIRIT_DB
const dbText = dbContent.replace('window.TAIWAN_SPIRIT_DB =', 'module.exports =');
fs.writeFileSync('data/database_test_temp.js', dbText);
const db = require('../data/database_test_temp.js');
console.log(`植物條目數: ${db.plants.length} (預期 >= 50)`);
console.log(`法器條目數: ${db.talismans.length} (預期 >= 80)`);
console.log(`福澤條目數: ${db.fuzhe.length}`);
console.log(`精怪條目數: ${db.monsters.length}`);
console.log(`廟宇條目數: ${db.temples.length}`);
fs.unlinkSync('data/database_test_temp.js');
if (db.plants.length < 50 || db.talismans.length < 80) {
  console.error("FAIL: 條目提取數量不足！");
  process.exit(1);
}
console.log("PASS: 資料提取數量驗證通過！");
