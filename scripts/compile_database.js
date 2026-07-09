const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const projectDir = path.resolve(__dirname, '..');
const dbPath = path.join(projectDir, 'data', 'database.js');
const plantsDir = path.join(projectDir, 'data', 'plants');
const talismansDir = path.join(projectDir, 'data', 'talismans');
const extractScriptPath = path.join(projectDir, 'scripts', 'extract_data.js');

// 檢查目錄是否存在且包含 json 檔案
function hasJsonFiles(dir) {
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  return files.some(file => file.endsWith('.json'));
}

const hasPlants = hasJsonFiles(plantsDir);
const hasTalismans = hasJsonFiles(talismansDir);

let baseDb = {
  fuzhe: [],
  plants: [],
  monsters: [],
  talismans: [],
  temples: []
};

// 降級判斷：如果兩者都沒有 JSON 檔案，執行 Task 1 的 HTML 提取
if (!hasPlants && !hasTalismans) {
  console.log("[Info] 未檢測到 plants 或 talismans JSON 資料，降級執行 Task 1 HTML 提取邏輯...");
  try {
    execSync(`node "${extractScriptPath}"`, { stdio: 'inherit' });
    console.log("[Success] Task 1 HTML 提取執行完成。");
  } catch (err) {
    console.error("[Error] 執行 extract_data.js 失敗:", err.message);
    process.exit(1);
  }
} else {
  // 如果有 JSON 檔案，我們需要載入 database.js 來取得 fuzhe, monsters, temples 的基本資料
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

  // 讀取 plants JSON 檔案
  if (hasPlants) {
    const plantFiles = fs.readdirSync(plantsDir).filter(file => file.endsWith('.json'));
    const plants = [];
    plantFiles.forEach(file => {
      try {
        const filePath = path.join(plantsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        plants.push(JSON.parse(content));
      } catch (e) {
        console.error(`[Error] 讀取/解析 ${file} 失敗:`, e.message);
      }
    });
    baseDb.plants = plants;
    console.log(`[Success] 從 ${plantsDir} 載入了 ${plants.length} 筆植物條目。`);
  }

  // 讀取 talismans JSON 檔案
  if (hasTalismans) {
    const talismanFiles = fs.readdirSync(talismansDir).filter(file => file.endsWith('.json'));
    const talismans = [];
    talismanFiles.forEach(file => {
      try {
        const filePath = path.join(talismansDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        talismans.push(JSON.parse(content));
      } catch (e) {
        console.error(`[Error] 讀取/解析 ${file} 失敗:`, e.message);
      }
    });
    baseDb.talismans = talismans;
    console.log(`[Success] 從 ${talismansDir} 載入了 ${talismans.length} 筆法器條目。`);
  }

  // 重新將合併後的資料寫入 database.js
  const fileContent = `window.TAIWAN_SPIRIT_DB = ${JSON.stringify(baseDb, null, 2)};\n`;
  fs.writeFileSync(dbPath, fileContent, 'utf8');
  console.log(`[Success] 已將合併後的資料重新編譯並寫入至 ${dbPath}`);
}
