/**
 * TaiwanSpiritCore - UI 渲染引擎模組
 * 負責側邊知識樹（details/summary 結構）與主要內容區（詳細卡片流、圖片虛線占位、平滑滾動定位）
 */

const Renderer = {
  /**
   * 動態生成左側分類知識樹
   * @param {HTMLElement} container 知識樹容器
   * @param {Object} db 資料庫
   * @param {Object} activeParams 當前啟用的路由參數 { theme, item }
   */
  renderTree(container, db, activeParams) {
    if (!container || !db) return;
    
    const themes = Object.keys(db);
    const html = themes.map(theme => {
      const items = db[theme];
      const displayName = window.THEME_MAPPING?.[theme] || theme;
      // 若路由的主題與當前主題一致，則預設展開
      const isOpen = activeParams.theme === theme ? 'open' : '';
      
      const itemLinks = items.map(item => {
        const isActive = activeParams.item === item.id ? 'active' : '';
        return `
          <li class="tree-item ${isActive}" data-id="${item.id}" data-title="${item.title}" data-category="${item.category || ''}">
            <a id="link-item-${item.id}" href="#/theme/${theme}/item/${item.id}">
              <span class="tree-id">${item.id}</span>
              <span class="tree-title">${item.title}</span>
            </a>
          </li>
        `;
      }).join('');

      return `
        <details class="tree-group" data-theme="${theme}" ${isOpen}>
          <summary class="tree-group-toggle" id="toggle-group-${theme}">
            <span class="arrow">▼</span> ${displayName} (${items.length})
          </summary>
          <ul class="tree-items">
            ${itemLinks}
          </ul>
        </details>
      `;
    }).join('');

    container.innerHTML = html;
  },

  /**
   * 尋找福澤蛙主題 (fuzhe) 下最相近的地域項目，供跨主題地區標籤聯動跳轉
   * @param {string} regionName 地區標籤名稱
   * @returns {Object|null} 匹配的福澤蛙條目
   */
  findFuzheItemByRegion(regionName) {
    if (!window.DataLoader) return null;
    const fuzheItems = window.DataLoader.getByTheme('fuzhe');
    if (!fuzheItems) return null;
    
    const cleanName = regionName.replace('靈格區', '').trim();
    return fuzheItems.find(item => {
      return item.content?.regions?.some(r => {
        const cleanR = r.replace('靈格區', '').trim();
        return cleanR.includes(cleanName) || cleanName.includes(cleanR);
      });
    });
  },

  /**
   * 動態生成單個條目詳細卡片的 HTML 字串
   * @param {Object} item 條目資料
   * @returns {string} HTML 字串
   */
  renderItemCard(item) {
    const summary = item.content?.summary || '暫無概要說明';
    
    // 跨主題標籤聯動：若匹配到福澤蛙條目，則點擊後變更 Hash 跳轉
    const regions = item.content?.regions?.map(r => {
      const matchedFuzhe = this.findFuzheItemByRegion(r);
      if (matchedFuzhe) {
        return `<a href="#/theme/fuzhe/item/${matchedFuzhe.id}" class="chip tag-region">${r}</a>`;
      }
      return `<span class="chip tag-region">${r}</span>`;
    }).join('') || '<span class="empty-tag">無</span>';

    const cities = item.content?.cities?.map(c => `<span class="chip tag-city">${c}</span>`).join('') || '<span class="empty-tag">無</span>';
    const landscapes = item.content?.landscapes?.map(l => `<span class="chip tag-landscape">${l}</span>`).join('') || '<span class="empty-tag">無</span>';
    const transformations = item.content?.transformations?.map(t => `<li>${t}</li>`).join('') || '<li class="empty-section">暫無化身資料</li>';
    const tips = item.content?.tips?.map(t => `<li>${t}</li>`).join('') || '<li class="empty-section">暫無設計提示</li>';

    // 處理圖片渲染與未加載時的 pending 虛線框占位
    let imageHtml = '';
    if (item.image) {
      imageHtml = `
        <div class="imagebox">
          <img src="${item.image}" alt="${item.title}" style="max-width:100%; max-height:100%; object-fit:cover;">
        </div>
      `;
    } else {
      const searchKeyword = item.title;
      imageHtml = `
        <div class="imagebox pending">
          <div class="pending-content">
            <span class="pending-icon">🖼️</span>
            <p>圖片未載入，建議參考搜尋：<br><strong>${searchKeyword}</strong></p>
          </div>
        </div>
      `;
    }

    return `
      <article class="card detail-card animate-fade-in" id="card-item-${item.id}" data-id="${item.id}">
        <div class="card-header">
          <div class="breadcrumbs">
            <a href="#/">首頁</a> &gt; 
            <a href="#/theme/${item.theme}">${window.THEME_MAPPING?.[item.theme] || item.theme}</a> &gt; 
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
        
        <div class="card-body">
          ${imageHtml}
          
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
      </article>
    `;
  },

  /**
   * 主要內容區渲染 (包括單個條目與整個主題詳細卡片流)
   * @param {HTMLElement} container 內容區容器
   * @param {Object} params 路由參數 { theme, item }
   */
  renderContent(container, params) {
    if (!container) return;

    if (!params.theme && !params.item) {
      container.innerHTML = `
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
      container.dataset.theme = '';
      return;
    }

    const theme = params.theme || (params.item ? window.DataLoader.getItem(params.item)?.theme : null);
    if (!theme) {
      container.innerHTML = `
        <div class="content-error">
          <h2>條目未找到</h2>
          <p>無法在資料庫中找到對應的條目或主題。</p>
          <a href="#/" class="btn-back">返回首頁</a>
        </div>
      `;
      container.dataset.theme = '';
      return;
    }

    // 若主題未變更且已是該主題的詳細卡片流，則直接平滑定位
    if (container.dataset.theme === theme && container.querySelector('.theme-detail-flow')) {
      if (params.item) {
        this.scrollToItem(container, params.item);
      } else {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const items = window.DataLoader.getByTheme(theme);
    const themeName = window.THEME_MAPPING?.[theme] || theme;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="content-error">
          <h2>主題未找到</h2>
          <p>無法在資料庫中找到主題 "${theme}"，或是該主題下目前沒有條目。</p>
          <a href="#/" class="btn-back">返回首頁</a>
        </div>
      `;
      container.dataset.theme = '';
      return;
    }

    const headerHtml = `
      <div class="content-header animate-fade-in">
        <div class="breadcrumbs">
          <a href="#/">首頁</a> &gt; <span>${themeName}</span>
        </div>
        <h1 class="content-title">主題：${themeName}</h1>
        <p class="content-subtitle">此主題下共收錄 ${items.length} 個靈格條目</p>
      </div>
    `;

    const cardsHtml = items.map(item => this.renderItemCard(item)).join('');

    container.innerHTML = `
      ${headerHtml}
      <div class="content-body theme-detail-flow">
        ${cardsHtml}
      </div>
    `;
    container.dataset.theme = theme;

    if (params.item) {
      // 稍微延遲以確保 DOM 已完成渲染排版，才能精確滾動定位
      setTimeout(() => {
        this.scrollToItem(container, params.item);
      }, 50);
    } else {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  /**
   * 平滑定位到右側特定卡片，包含 querySelector 特殊字元防護
   * @param {HTMLElement} container 內容區容器
   * @param {string} itemId 條目 ID
   */
  scrollToItem(container, itemId) {
    try {
      // 使用 CSS.escape 來確保包含特殊字元時 querySelector 不會崩潰
      const escapedId = CSS.escape(`card-item-${itemId}`);
      const cardEl = container.querySelector(`#${escapedId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 添加短暫高亮提示
        container.querySelectorAll('.card.detail-card').forEach(el => el.classList.remove('highlighted'));
        cardEl.classList.add('highlighted');
      }
    } catch (e) {
      console.error('Renderer.scrollToItem error:', itemId, e);
    }
  },

  /**
   * 渲染全局搜尋結果
   * @param {HTMLElement} container 內容區容器
   * @param {string} keyword 搜尋關鍵字
   * @param {Array} results 搜尋結果陣列
   */
  renderSearchResults(container, keyword, results) {
    if (!container) return;

    container.dataset.theme = 'search';

    if (results.length === 0) {
      container.innerHTML = `
        <div class="content-header animate-fade-in">
          <div class="breadcrumbs">
            <a href="#/">首頁</a> &gt; <span>搜尋結果</span>
          </div>
          <h1 class="content-title">搜尋："${keyword}"</h1>
          <p class="content-subtitle">未找到符合的靈格條目</p>
        </div>
        <div class="content-body">
          <div class="content-placeholder">
            <p>請嘗試使用其他關鍵字，如「盤古蟾蜍」、「避邪」等。</p>
          </div>
        </div>
      `;
      return;
    }

    const headerHtml = `
      <div class="content-header animate-fade-in">
        <div class="breadcrumbs">
          <a href="#/">首頁</a> &gt; <span>搜尋結果</span>
        </div>
        <h1 class="content-title">搜尋："${keyword}"</h1>
        <p class="content-subtitle">共找到 ${results.length} 個符合的靈格條目</p>
      </div>
    `;

    const cardsHtml = results.map(item => this.renderItemCard(item)).join('');

    container.innerHTML = `
      ${headerHtml}
      <div class="content-body theme-detail-flow">
        ${cardsHtml}
      </div>
    `;

    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.Renderer = Renderer;
