const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const projectDir = path.resolve(__dirname, '..');
const dbPath = path.join(projectDir, 'data', 'database.js');
const extractScriptPath = path.join(projectDir, 'scripts', 'extract_data.js');
const themes = ['fuzhe', 'plants', 'monsters', 'talismans', 'temples'];

// 檢查目錄是否存在且包含 json 檔案
function hasJsonFiles(dir) {
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  return files.some(file => file.endsWith('.json'));
}

const themeDirs = Object.fromEntries(themes.map(theme => [theme, path.join(projectDir, 'data', theme)]));
const hasAnyThemeJson = themes.some(theme => hasJsonFiles(themeDirs[theme]));

let baseDb = Object.fromEntries(themes.map(theme => [theme, []]));

// 降級判斷：如果沒有任何主題 JSON 檔案，執行 Task 1 的 HTML 提取
if (!hasAnyThemeJson) {
  console.log("[Info] 未檢測到主題 JSON 資料，降級執行 Task 1 HTML 提取邏輯...");
  try {
    execSync(`node "${extractScriptPath}"`, { stdio: 'inherit' });
    console.log("[Success] Task 1 HTML 提取執行完成。");
  } catch (err) {
    console.error("[Error] 執行 extract_data.js 失敗:", err.message);
    process.exit(1);
  }
} else {
  // 如果有 JSON 檔案，我們先載入 database.js 作為 fallback，再用各主題 JSON 覆蓋。
  if (!fs.existsSync(dbPath)) {
    console.log("[Info] database.js 不存在，先執行 extract_data.js 以建立基本資料庫...");
    try {
      execSync(`node "${extractScriptPath}"`, { stdio: 'inherit' });
    } catch (err) {
      console.error("[Error] 執行 extract_data.js 失敗:", err.message);
      process.exit(1);
    }
  }

  // 讀取目前的 database.js
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(dbContent, sandbox);
  if (sandbox.window.TAIWAN_SPIRIT_DB) {
    baseDb = sandbox.window.TAIWAN_SPIRIT_DB;
  }

  themes.forEach(theme => {
    const dir = themeDirs[theme];
    if (!hasJsonFiles(dir)) return;

    const files = fs.readdirSync(dir).filter(file => file.endsWith('.json'));
    const items = [];
    files.forEach(file => {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        items.push(JSON.parse(content));
      } catch (e) {
        console.error(`[Error] 讀取/解析 ${file} 失敗:`, e.message);
      }
    });
    baseDb[theme] = items;
    console.log(`[Success] 從 ${dir} 載入了 ${items.length} 筆 ${theme} 條目。`);
  });

  // 重新將合併後的資料寫入 database.js
  const fileContent = `window.TAIWAN_SPIRIT_DB = ${JSON.stringify(baseDb, null, 2)};\n`;
  fs.writeFileSync(dbPath, fileContent, 'utf8');
  console.log(`[Success] 已將合併後的資料重新編譯並寫入至 ${dbPath}`);
}
