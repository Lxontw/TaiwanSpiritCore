// 台灣靈格系統主應用程式入口

// 主題名稱映射，使其更具台灣在地氛圍與可讀性
const THEME_MAPPING = {
  fuzhe: '福澤蛙',
  plants: '特有植物',
  creatures: '靈格生物',
  deities: '神靈系統',
  guardians: '守護者',
  temples: '廟宇信仰',
  artifacts: '法器系統',
  spells: '符咒系統',
  rituals: '祭典儀式',
  stories: '傳說故事',
  characters: '核心角色',
  cities: '城市研究'
};

// 取得主題的顯示名稱
function getThemeDisplayName(theme) {
  return THEME_MAPPING[theme] || theme;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  buildTree();
  initSearch();
  
  Router.init((params) => {
    console.log('Route changed:', params);
    highlightTreeItem(params);
    renderContent(params);
  });
});

// 建立知識樹
function buildTree() {
  const treeContainer = document.getElementById('tree-container');
  if (!treeContainer) return;

  const db = DataLoader.getAll();
  if (!db) {
    treeContainer.innerHTML = '<p class="content-error">資料庫載入失敗或為空</p>';
    return;
  }

  const themes = Object.keys(db);
  const html = themes.map(theme => {
    const items = db[theme];
    const displayName = getThemeDisplayName(theme);
    const itemLinks = items.map(item => `
      <li class="tree-item" data-id="${item.id}" data-title="${item.title}" data-category="${item.category || ''}">
        <a id="link-item-${item.id}" href="#/theme/${theme}/item/${item.id}">
          <span class="tree-id">${item.id}</span>
          <span class="tree-title">${item.title}</span>
        </a>
      </li>
    `).join('');

    return `
      <div class="tree-group" data-theme="${theme}">
        <button class="tree-group-toggle" type="button" id="toggle-group-${theme}">
          <span class="arrow">▼</span> ${displayName} (${items.length})
        </button>
        <ul class="tree-items">
          ${itemLinks}
        </ul>
      </div>
    `;
  }).join('');

  treeContainer.innerHTML = html;

  // 綁定折疊事件
  treeContainer.querySelectorAll('.tree-group-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.parentElement;
      group.classList.toggle('collapsed');
      const arrow = btn.querySelector('.arrow');
      if (arrow) {
        arrow.textContent = group.classList.contains('collapsed') ? '▶' : '▼';
      }
    });
  });
}

// 防抖動函數
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 初始化搜尋
function initSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value.toLowerCase().trim();
    const treeItems = document.querySelectorAll('.tree-item');
    const treeGroups = document.querySelectorAll('.tree-group');

    if (!query) {
      // 清空搜尋時，恢復所有顯示，並展開
      treeItems.forEach(item => item.style.display = '');
      treeGroups.forEach(group => {
        group.style.display = '';
        group.classList.remove('collapsed');
        const arrow = group.querySelector('.arrow');
        if (arrow) arrow.textContent = '▼';
      });
      return;
    }

    // 過濾項目
    treeGroups.forEach(group => {
      let hasVisibleItem = false;
      const itemsInGroup = group.querySelectorAll('.tree-item');
      
      itemsInGroup.forEach(item => {
        const id = item.dataset.id.toLowerCase();
        const title = item.dataset.title.toLowerCase();
        const category = (item.dataset.category || '').toLowerCase();
        
        if (id.includes(query) || title.includes(query) || category.includes(query)) {
          item.style.display = '';
          hasVisibleItem = true;
        } else {
          item.style.display = 'none';
        }
      });

      // 如果該組有符合的項目，顯示該組並展開，否則隱藏
      if (hasVisibleItem) {
        group.style.display = '';
        group.classList.remove('collapsed');
        const arrow = group.querySelector('.arrow');
        if (arrow) arrow.textContent = '▼';
      } else {
        group.style.display = 'none';
      }
    });
  }, 300));
}

// 高亮目前路由對應的項目
function highlightTreeItem(params) {
  // 先清除所有高亮
  document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
  
  if (params.item) {
    const targetEl = document.querySelector(`.tree-item[data-id="${params.item}"]`);
    if (targetEl) {
      targetEl.classList.add('active');
      // 確保父層組是展開的
      const groupEl = targetEl.closest('.tree-group');
      if (groupEl && groupEl.classList.contains('collapsed')) {
        groupEl.classList.remove('collapsed');
        const arrow = groupEl.querySelector('.arrow');
        if (arrow) arrow.textContent = '▼';
      }
      // 捲動至可見區域
      targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

// 渲染右側內容
function renderContent(params) {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  if (!params.theme && !params.item) {
    contentEl.innerHTML = `
      <div class="content-placeholder">
        <h1>TaiwanSpiritCore 台灣靈格</h1>
        <p>請從左側知識樹選擇靈格條目，或在上方輸入關鍵字搜尋。</p>
        <div class="brand-decorative">
          <div class="line"></div>
          <div class="symbol">◆</div>
          <div class="line"></div>
        </div>
      </div>
    `;
    return;
  }

  if (params.item) {
    const item = DataLoader.getItem(params.item);
    if (!item) {
      contentEl.innerHTML = `
        <div class="content-error">
          <h2>條目未找到</h2>
          <p>無法在資料庫中找到 ID 為 "${params.item}" 的條目。</p>
          <a href="#/" class="btn-back">返回首頁</a>
        </div>
      `;
      return;
    }

    // 渲染條目詳細內容
    const summary = item.content?.summary || '暫無概要說明';
    const regions = item.content?.regions?.map(r => `<span class="tag tag-region">${r}</span>`).join('') || '<span class="empty-tag">無</span>';
    const cities = item.content?.cities?.map(c => `<span class="tag tag-city">${c}</span>`).join('') || '<span class="empty-tag">無</span>';
    const landscapes = item.content?.landscapes?.map(l => `<span class="tag tag-landscape">${l}</span>`).join('') || '<span class="empty-tag">無</span>';
    const transformations = item.content?.transformations?.map(t => `<li>${t}</li>`).join('') || '<li class="empty-section">暫無化身資料</li>';
    const tips = item.content?.tips?.map(t => `<li>${t}</li>`).join('') || '<li class="empty-section">暫無設計提示</li>';

    contentEl.innerHTML = `
      <div class="content-header animate-fade-in">
        <div class="breadcrumbs">
          <a href="#/">首頁</a> &gt; 
          <a href="#/theme/${item.theme}">${getThemeDisplayName(item.theme)}</a> &gt; 
          <span>${item.title}</span>
        </div>
        <h1 class="content-title">${item.title}</h1>
        ${item.subtitle ? `<p class="content-subtitle">${item.subtitle}</p>` : ''}
        <div class="content-meta">
          <span class="meta-item"><span class="meta-label">ID:</span> <code class="meta-val">${item.id}</code></span>
          <span class="meta-item"><span class="meta-label">層級/屬性:</span> <span class="meta-val">${item.category || '未分類'}</span></span>
          <span class="meta-item"><span class="meta-label">狀態:</span> <span class="meta-val badge">${item.meta?.status || 'Active'}</span></span>
        </div>
      </div>
      
      <div class="content-body animate-fade-in">
        <div class="content-markdown">
          <section class="info-section">
            <h2>靈格概要</h2>
            <div class="summary-box">
              <p>${summary.replace(/\n/g, '<br>')}</p>
            </div>
          </section>

          <div class="info-grid">
            <div class="grid-card">
              <h3>地域 & 空間特徵</h3>
              <div class="meta-group">
                <label>靈格分區：</label>
                <div class="tag-container">${regions}</div>
              </div>
              <div class="meta-group">
                <label>代表城市：</label>
                <div class="tag-container">${cities}</div>
              </div>
              <div class="meta-group">
                <label>地景特徵：</label>
                <div class="tag-container">${landscapes}</div>
              </div>
            </div>

            <div class="grid-card">
              <h3>變體與化身 (Transformations)</h3>
              <ul class="styled-list">
                ${transformations}
              </ul>
            </div>
          </div>

          <section class="info-section">
            <h2>視覺與寫作提示 (Design Tips)</h2>
            <ul class="styled-list tips-list">
              ${tips}
            </ul>
          </section>
        </div>
      </div>
    `;
  } else if (params.theme) {
    const items = DataLoader.getByTheme(params.theme);
    const themeName = getThemeDisplayName(params.theme);

    if (!items || items.length === 0) {
      contentEl.innerHTML = `
        <div class="content-error">
          <h2>主題未找到</h2>
          <p>無法在資料庫中找到主題 "${params.theme}"，或是該主題下目前沒有條目。</p>
          <a href="#/" class="btn-back">返回首頁</a>
        </div>
      `;
      return;
    }

    const itemsListHtml = items.map(item => `
      <div class="theme-item-card">
        <h3><a href="#/theme/${params.theme}/item/${item.id}">${item.title}</a></h3>
        <p class="theme-item-desc">${item.content?.summary ? item.content.summary.split('\n')[0].replace('【快速提示】', '') : '暫無概要'}</p>
        <div class="theme-item-footer">
          <code>${item.id}</code>
          <span>${item.category || ''}</span>
        </div>
      </div>
    `).join('');

    contentEl.innerHTML = `
      <div class="content-header animate-fade-in">
        <div class="breadcrumbs">
          <a href="#/">首頁</a> &gt; <span>${themeName}</span>
        </div>
        <h1 class="content-title">主題：${themeName}</h1>
        <p class="content-subtitle">此主題下共收錄 ${items.length} 個靈格條目</p>
      </div>
      <div class="content-body animate-fade-in">
        <div class="theme-grid">
          ${itemsListHtml}
        </div>
      </div>
    `;
  }
}
