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
window.THEME_MAPPING = THEME_MAPPING;

// 取得主題的顯示名稱
function getThemeDisplayName(theme) {
  return THEME_MAPPING[theme] || theme;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const treeContainer = document.getElementById('tree-container');
  const db = DataLoader.getAll();
  const currentParams = Router.parseHash(window.location.hash);

  // 1. 生成左側分類清單（details/summary 結構）
  Renderer.renderTree(treeContainer, db, currentParams);
  
  // 2. 初始化搜尋
  initSearch();
  
  // 3. 初始化路由
  Router.init((params) => {
    console.log('Route changed:', params);
    
    // 路由改變時，若為具體條目或主題，清空搜尋文字並還原樹狀圖狀態
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      resetTreeFilter();
    }
    
    // 路由高亮與展開知識樹
    highlightTreeItem(params);
    
    // 渲染右側主要內容區
    Renderer.renderContent(document.getElementById('content'), params);
  });
});

// 還原左側分類樹項目顯示
function resetTreeFilter() {
  const treeItems = document.querySelectorAll('.tree-item');
  const treeGroups = document.querySelectorAll('.tree-group');
  
  treeItems.forEach(item => item.style.display = '');
  treeGroups.forEach(group => {
    group.style.display = '';
    
    // 根據當前路由還原 details 的展開狀態
    const currentParams = Router.parseHash(window.location.hash);
    if (group.dataset.theme === currentParams.theme) {
      group.setAttribute('open', '');
    } else {
      group.removeAttribute('open');
    }
  });
}

// 初始化搜尋
function initSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const contentEl = document.getElementById('content');
    
    // 調用 Search 進行跨主題搜尋（其內部包含 300ms 防抖動，包括清空輸入的情況）
    Search.query(query, (results) => {
      if (!query) {
        resetTreeFilter();
        const currentParams = Router.parseHash(window.location.hash);
        Renderer.renderContent(contentEl, currentParams);
        return;
      }

      // 1. 渲染右側搜尋結果
      Renderer.renderSearchResults(contentEl, query, results);
      
      // 2. 過濾左側樹
      const matchedIds = new Set(results.map(r => r.id));
      const treeGroups = document.querySelectorAll('.tree-group');
      
      treeGroups.forEach(group => {
        let hasVisibleItem = false;
        const itemsInGroup = group.querySelectorAll('.tree-item');
        
        itemsInGroup.forEach(item => {
          const id = item.dataset.id;
          if (matchedIds.has(id)) {
            item.style.display = '';
            hasVisibleItem = true;
          } else {
            item.style.display = 'none';
          }
        });

        // 若該主題組內有符合的項目則展開，否則隱藏
        if (hasVisibleItem) {
          group.style.display = '';
          group.setAttribute('open', '');
        } else {
          group.style.display = 'none';
          group.removeAttribute('open');
        }
      });
    });
  });
}

// 高亮目前路由對應的項目並平滑定位
function highlightTreeItem(params) {
  // 清除所有 active
  document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
  
  if (params.item) {
    try {
      // 使用 CSS.escape 來確保 data-id 包含特殊字元時 querySelector 依然能正常定位且不崩潰
      const escapedId = CSS.escape(params.item);
      const targetEl = document.querySelector(`.tree-item[data-id="${escapedId}"]`);
      
      if (targetEl) {
        targetEl.classList.add('active');
        
        // 確保父層 details 被打開
        const groupEl = targetEl.closest('.tree-group');
        if (groupEl) {
          groupEl.setAttribute('open', '');
        }
        
        // 捲動至知識樹可見區域
        targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } catch (e) {
      console.error('Failed to highlight tree item:', params.item, e);
    }
  }
}
