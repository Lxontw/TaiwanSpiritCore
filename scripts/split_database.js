const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 設定路徑
const projectDir = path.resolve(__dirname, '..');
const dbPath = path.join(projectDir, 'data', 'database.js');
const themes = ['fuzhe', 'plants', 'monsters', 'talismans', 'temples'];

// 確保目錄存在
themes.forEach(theme => {
  const dir = path.join(projectDir, 'data', theme);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

themes.forEach(theme => {
  if (!Array.isArray(db[theme])) {
    console.warn(`[Warning] database.js 中沒有 ${theme} 資料。`);
    return;
  }

  const dir = path.join(projectDir, 'data', theme);
  db[theme].forEach(item => {
    if (item.id) {
      const filePath = path.join(dir, `${item.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf8');
    }
  });
  console.log(`[Success] 成功拆分並寫入 ${db[theme].length} 筆 ${theme} 條目至 ${dir}`);
});
