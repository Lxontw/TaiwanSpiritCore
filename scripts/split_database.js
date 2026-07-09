const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 設定路徑
const projectDir = path.resolve(__dirname, '..');
const dbPath = path.join(projectDir, 'data', 'database.js');
const plantsDir = path.join(projectDir, 'data', 'plants');
const talismansDir = path.join(projectDir, 'data', 'talismans');

// 確保目錄存在
if (!fs.existsSync(plantsDir)) {
  fs.mkdirSync(plantsDir, { recursive: true });
}
if (!fs.existsSync(talismansDir)) {
  fs.mkdirSync(talismansDir, { recursive: true });
}

// 讀取並執行 database.js
if (!fs.existsSync(dbPath)) {
  console.error(`Error: ${dbPath} 不存在！無法進行拆分。`);
  process.exit(1);
}

const dbContent = fs.readFileSync(dbPath, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dbContent, sandbox);
const db = sandbox.window.TAIWAN_SPIRIT_DB;

if (!db) {
  console.error("Error: window.TAIWAN_SPIRIT_DB 未定義！");
  process.exit(1);
}

// 拆分 plants
if (db.plants && Array.isArray(db.plants)) {
  db.plants.forEach(item => {
    if (item.id) {
      const filePath = path.join(plantsDir, `${item.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf8');
    }
  });
  console.log(`[Success] 成功拆分並寫入 ${db.plants.length} 筆植物條目至 ${plantsDir}`);
} else {
  console.warn("[Warning] database.js 中沒有 plants 資料。");
}

// 拆分 talismans
if (db.talismans && Array.isArray(db.talismans)) {
  db.talismans.forEach(item => {
    if (item.id) {
      const filePath = path.join(talismansDir, `${item.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf8');
    }
  });
  console.log(`[Success] 成功拆分並寫入 ${db.talismans.length} 筆法器條目至 ${talismansDir}`);
} else {
  console.warn("[Warning] database.js 中沒有 talismans 資料。");
}
