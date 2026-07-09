const fs = require('fs');
const path = require('path');

// 設定專案目錄與上一層目錄的路徑
const projectDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(projectDir, '..');

// 尋找對應的 HTML 檔案
const files = fs.readdirSync(parentDir);
const themes = {
  fuzhe: { pattern: /福澤系統/, file: null },
  plants: { pattern: /植物・作物/, file: null },
  monsters: { pattern: /精怪・地景/, file: null },
  talismans: { pattern: /符咒・法器/, file: null },
  temples: { pattern: /廟宇神靈/, file: null }
};

for (const file of files) {
  for (const key in themes) {
    if (themes[key].pattern.test(file)) {
      themes[key].file = path.join(parentDir, file);
    }
  }
}

// 用於排除的分類／索引 ID
const excludeIds = new Set([
  'todo', 'indigenous', 'culture-index', 'cat-index', 'region-index', 'use-index', 'plant-index',
  'overview', 'common-fuzhe', 'process', 'image-status', 'north', 'nw', 'central', 'south', 'east',
  'mountain', 'islands', 'amis', 'paiwan', 'rukai', 'atayal', 'bunun', 'pinuyumayan', 'tao', 'tsou',
  'hakka', 'hoklo', 'military', 'japan', 'newtw', 'regional-fuzhe', 'tudigong-link', 'system-index',
  'frog-index', 'name-index', 'deity-index', 'att-index', 'story-index', 'other-index', 'source-index',
  'overview-index', 'common-index', 'regional-index', 'link-index', 'att-index', 'story-index',
  'item-index'
]);

// 輔助函數：清理 HTML 標籤
function cleanText(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

// 輔助函數：提取 chips 文字
function extractChips(html) {
  if (!html) return [];
  const chips = [];
  const chipRegex = /<a class="chip"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = chipRegex.exec(html))) {
    const text = cleanText(match[1]);
    if (text) chips.push(text);
  }
  
  // 如果沒有晶片標籤，但有一般列表或逗號分隔，也嘗試解析
  if (chips.length === 0) {
    const clean = cleanText(html);
    if (clean) {
      return clean.split(/[、，,;；\n]+/).map(s => s.trim()).filter(Boolean);
    }
  }
  return chips;
}

// 核心提取函數
function extractThemeData(filePath, theme) {
  const items = [];
  if (!filePath) {
    console.warn(`[Warning] No file found for theme: ${theme}`);
    return items;
  }

  console.log(`[Info] Extracting theme: ${theme} from ${path.basename(filePath)}`);
  const content = fs.readFileSync(filePath, 'utf8');

  // 正則匹配所有 <section class="...section..." id="xxx">
  const sectionRegex = /<section class="[^"]*section[^"]*" id="([^"]+)">([\s\S]*?)<\/section>/g;
  let sectionMatch;

  while ((sectionMatch = sectionRegex.exec(content))) {
    const id = sectionMatch[1];
    const inner = sectionMatch[2];

    // 排除分類、索引、快速入口等 section
    const isCategory = id.includes('-index') || 
                       id.includes('indexbox') || 
                       id.startsWith('cat-') || 
                       id.startsWith('use-') ||
                       excludeIds.has(id);

    if (isCategory) {
      continue;
    }

    // 提取基本資訊
    const labelMatch = inner.match(/<div class="label">([\s\S]*?)<\/div>/);
    const h2Match = inner.match(/<h2>([\s\S]*?)<\/h2>/);
    const subtitleMatch = inner.match(/<p class="subtitle">([\s\S]*?)<\/p>/);

    const label = labelMatch ? cleanText(labelMatch[1]) : '';
    const title = h2Match ? cleanText(h2Match[1]) : '';
    const subtitle = subtitleMatch ? cleanText(subtitleMatch[1]) : '';

    // 建立條目物件
    const item = {
      id: id,
      theme: theme,
      category: label || theme,
      title: title || id,
      subtitle: subtitle,
      meta: {
        level: label || theme,
        status: '已放圖片'
      },
      content: {
        summary: '',
        regions: [],
        cities: [],
        landscapes: [],
        transformations: [],
        tips: []
      },
      image: '',
      source: {
        label: '',
        url: ''
      }
    };

    // 提取圖片資訊 (imagebox)
    const imageboxMatch = inner.match(/<div class="imagebox[^"]*">([\s\S]*?)<\/div>/);
    if (imageboxMatch) {
      const imgInner = imageboxMatch[1];
      const imgMatch = imgInner.match(/<img src="([^"]+)"/);
      if (imgMatch) {
        item.image = imgMatch[1];
      }
      
      const sourceLinkMatch = imgInner.match(/<a class="source-link"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (sourceLinkMatch) {
        item.source.url = sourceLinkMatch[1];
        item.source.label = cleanText(sourceLinkMatch[2]);
      } else {
        const linkMatch = imgInner.match(/href="([^"]+)"/);
        if (linkMatch) {
          item.source.url = linkMatch[1];
        }
      }
      
      if (imgInner.includes('pending') || imgInner.includes('placeholder')) {
        item.meta.status = '圖片待補';
      }
    }

    // 提取所有卡片資訊
    const cardRegex = /<(article|div) class="card">([\s\S]*?)<\/\1>/g;
    let cardMatch;
    let summaryParts = [];

    while ((cardMatch = cardRegex.exec(inner))) {
      const cardInner = cardMatch[2];
      const h3Match = cardInner.match(/<h3>([\s\S]*?)<\/h3>/);
      const h3 = h3Match ? cleanText(h3Match[1]) : '';
      const cardBody = h3Match ? cardInner.replace(/<h3>([\s\S]*?)<\/h3>/, '') : cardInner;

      // 根據卡片標題進行欄位映射
      if (['主要地區', '對應靈格區', '所屬靈格區', '主要分布'].includes(h3)) {
        item.content.regions = extractChips(cardBody);
      } else if (['對應城市／分布', '流傳／地區', '對應城市', '城市', '地區', '族群／文化脈絡', '分布地區'].includes(h3)) {
        item.content.cities = extractChips(cardBody);
      } else if (['相關地景', '關鍵地景', '地景'].includes(h3)) {
        item.content.landscapes = extractChips(cardBody);
      } else if (['福澤轉化', '《台灣靈格》轉化可能', '創作轉化'].includes(h3)) {
        item.content.transformations = extractChips(cardBody);
      } else if (['造形提示', '造形重點', '圖像重點', '造形指引', '提示'].includes(h3)) {
        item.content.tips = extractChips(cardBody);
      } else if (['資料狀態', '圖片狀態'].includes(h3)) {
        item.meta.status = cleanText(cardBody);
      } else {
        // 其他標題的卡片，都歸納到 summary 中
        const cleanBody = cleanText(cardBody);
        if (h3) {
          summaryParts.push(`【${h3}】\n${cleanBody}`);
        } else {
          summaryParts.push(cleanBody);
        }
      }
    }

    // 整合 summary 文字
    item.content.summary = summaryParts.join('\n\n');

    // 處理沒有卡片但有普通段落的情況
    if (!item.content.summary) {
      const pRegex = /<p>([\s\S]*?)<\/p>/g;
      let pMatch;
      const paragraphs = [];
      while ((pMatch = pRegex.exec(inner))) {
        if (!pMatch[0].includes('class="chip"') && !pMatch[0].includes('class="jump"')) {
          paragraphs.push(cleanText(pMatch[1]));
        }
      }
      item.content.summary = paragraphs.join('\n');
    }

    items.push(item);
  }

  console.log(`[Success] Extracted ${items.length} items for theme: ${theme}`);
  return items;
}

// 主程式執行
function main() {
  const db = {
    fuzhe: extractThemeData(themes.fuzhe.file, 'fuzhe'),
    plants: extractThemeData(themes.plants.file, 'plants'),
    monsters: extractThemeData(themes.monsters.file, 'monsters'),
    talismans: extractThemeData(themes.talismans.file, 'talismans'),
    temples: extractThemeData(themes.temples.file, 'temples')
  };

  // 生成 database.js 內容
  const outputFilePath = path.join(projectDir, 'data', 'database.js');
  const fileContent = `window.TAIWAN_SPIRIT_DB = ${JSON.stringify(db, null, 2)};\n`;

  fs.writeFileSync(outputFilePath, fileContent, 'utf8');
  console.log(`[Success] Saved combined database to ${outputFilePath}`);
}

main();
