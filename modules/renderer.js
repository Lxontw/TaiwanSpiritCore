/**
 * TaiwanSpiritCore - UI 渲染引擎模組
 * 負責側邊知識樹（details/summary 結構）與主要內容區（詳細卡片流、圖片虛線占位、平滑滾動定位）
 */

const Renderer = {
  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  escapeAttr(value) {
    return this.escapeHtml(value).replace(/`/g, '&#96;');
  },

  safeUrl(value) {
    const url = String(value ?? '').trim();
    if (!url) return '';
    if (/^(javascript|data|vbscript):/i.test(url)) return '';
    return url;
  },

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
      const safeTheme = this.escapeAttr(theme);
      const safeDisplayName = this.escapeHtml(displayName);
      // 若路由的主題與當前主題一致，則預設展開
      const isOpen = activeParams.theme === theme ? 'open' : '';
      
      const itemLinks = items.map(item => {
        const isActive = activeParams.item === item.id ? 'active' : '';
        const safeId = this.escapeAttr(item.id);
        const safeTitle = this.escapeHtml(item.title);
        const safeTitleAttr = this.escapeAttr(item.title);
        const safeCategory = this.escapeAttr(item.category || '');
        return `
          <li class="tree-item ${isActive}" data-id="${safeId}" data-title="${safeTitleAttr}" data-category="${safeCategory}">
            <a id="link-item-${safeId}" href="#/theme/${safeTheme}/item/${safeId}">
              <span class="tree-id">${safeId}</span>
              <span class="tree-title">${safeTitle}</span>
            </a>
          </li>
        `;
      }).join('');

      return `
        <details class="tree-group" data-theme="${safeTheme}" ${isOpen}>
          <summary class="tree-group-toggle" id="toggle-group-${safeTheme}">
            <span class="arrow">▼</span> ${safeDisplayName} (${items.length})
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
    const safeItemId = this.escapeAttr(item.id);
    const safeTitle = this.escapeHtml(item.title);
    const safeTitleAttr = this.escapeAttr(item.title);
    const safeSubtitle = this.escapeHtml(item.subtitle || '');
    const safeTheme = this.escapeAttr(item.theme);
    const safeThemeName = this.escapeHtml(window.THEME_MAPPING?.[item.theme] || item.theme);
    const safeCategory = this.escapeHtml(item.category || '未分類');
    const safeStatus = this.escapeHtml(item.meta?.status || 'Active');
    
    // 跨主題標籤聯動：若匹配到福澤蛙條目，則點擊後變更 Hash 跳轉
    const regions = item.content?.regions?.map(r => {
      const matchedFuzhe = this.findFuzheItemByRegion(r);
      const safeRegion = this.escapeHtml(r);
      if (matchedFuzhe) {
        return `<a href="#/theme/fuzhe/item/${this.escapeAttr(matchedFuzhe.id)}" class="chip tag-region">${safeRegion}</a>`;
      }
      return `<span class="chip tag-region">${safeRegion}</span>`;
    }).join('') || '<span class="empty-tag">無</span>';

    const cities = item.content?.cities?.map(c => `<span class="chip tag-city">${this.escapeHtml(c)}</span>`).join('') || '<span class="empty-tag">無</span>';
    const landscapes = item.content?.landscapes?.map(l => `<span class="chip tag-landscape">${this.escapeHtml(l)}</span>`).join('') || '<span class="empty-tag">無</span>';
    const transformations = item.content?.transformations?.map(t => `<li>${this.escapeHtml(t)}</li>`).join('') || '<li class="empty-section">暫無化身資料</li>';
    const tips = item.content?.tips?.map(t => `<li>${this.escapeHtml(t)}</li>`).join('') || '<li class="empty-section">暫無設計提示</li>';

    // 處理圖片渲染與未加載時的 pending 虛線框占位
    let imageHtml = '';
    const safeImage = this.safeUrl(item.image);
    if (safeImage) {
      imageHtml = `
        <div class="imagebox">
          <img src="${this.escapeAttr(safeImage)}" alt="${safeTitleAttr}" style="max-width:100%; max-height:100%; object-fit:cover;">
        </div>
      `;
    } else {
      imageHtml = `
        <div class="imagebox pending">
          <div class="pending-content">
            <span class="pending-icon">🖼️</span>
            <p>圖片未載入，建議參考搜尋：<br><strong>${safeTitle}</strong></p>
          </div>
        </div>
      `;
    }

    return `
      <article class="card detail-card animate-fade-in" id="card-item-${safeItemId}" data-id="${safeItemId}">
        <div class="card-header">
          <div class="breadcrumbs">
            <a href="#/">首頁</a> &gt; 
            <a href="#/theme/${safeTheme}">${safeThemeName}</a> &gt;
            <span>${safeTitle}</span>
          </div>
          <h1 class="content-title">${safeTitle}</h1>
          ${item.subtitle ? `<p class="content-subtitle">${safeSubtitle}</p>` : ''}
          <div class="content-meta">
            <span class="meta-item"><span class="meta-label">ID:</span> <code class="meta-val">${this.escapeHtml(item.id)}</code></span>
            <span class="meta-item"><span class="meta-label">層級/屬性:</span> <span class="meta-val">${safeCategory}</span></span>
            <span class="meta-item"><span class="meta-label">狀態:</span> <span class="meta-val badge">${safeStatus}</span></span>
          </div>
        </div>
        
        <div class="card-body">
          ${imageHtml}
          
          <section class="info-section">
            <h2>靈格概要</h2>
            <div class="summary-box">
              <p>${this.escapeHtml(summary).replace(/\n/g, '<br>')}</p>
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
      const db = window.DataLoader ? window.DataLoader.getAll() : {};
      const fuzheCount = db.fuzhe?.length || 0;
      const plantsCount = db.plants?.length || 0;
      const monstersCount = db.monsters?.length || 0;
      const talismansCount = db.talismans?.length || 0;
      const templesCount = db.temples?.length || 0;
      const totalCount = fuzheCount + plantsCount + monstersCount + talismansCount + templesCount;

      container.innerHTML = `
        <div class="home-dashboard animate-fade-in">
          <div class="home-header">
            <h1 class="home-title">《台灣靈格》知識檢索系統</h1>
            <p class="home-subtitle">整合福澤系統、特有植物、精怪地景、符咒法器、廟宇神靈 ── 台灣民俗符號網絡與世界觀建構</p>
          </div>
          
          <div class="stats-bento">
            <div class="bento-card main-stats">
              <span class="bento-label">全域收錄條目</span>
              <span class="bento-val">${totalCount} <span class="unit">筆</span></span>
              <div class="bento-bg-icon">◆</div>
            </div>
            
            <a href="#/theme/fuzhe" class="bento-card theme-stats card-fuzhe">
              <span class="bento-label">福澤系統 (fuzhe)</span>
              <span class="bento-val">${fuzheCount} <span class="unit">條目</span></span>
              <p class="bento-desc">台北樹蛙、盤古蟾蜍等台灣本土兩棲物種之文化福澤印記</p>
            </a>

            <a href="#/theme/plants" class="bento-card theme-stats card-plants">
              <span class="bento-label">特有植物 (plants)</span>
              <span class="bento-val">${plantsCount} <span class="unit">條目</span></span>
              <p class="bento-desc">榕樹、檳榔等特有作物與族群象徵、巫覡植物特徵</p>
            </a>

            <a href="#/theme/talismans" class="bento-card theme-stats card-talismans">
              <span class="bento-label">符咒法器 (talismans)</span>
              <span class="bento-val">${talismansCount} <span class="unit">條目</span></span>
              <p class="bento-desc">民俗法器、辟邪符令物與祭典科儀符號</p>
            </a>

            <a href="#/theme/monsters" class="bento-card theme-stats card-monsters">
              <span class="bento-label">精怪地景 (monsters)</span>
              <span class="bento-val">${monstersCount} <span class="unit">條目</span></span>
              <p class="bento-desc">本土精怪、荒野怪談與地理空間的文化投射</p>
            </a>

            <a href="#/theme/temples" class="bento-card theme-stats card-temples">
              <span class="bento-label">廟宇神靈 (temples)</span>
              <span class="bento-val">${templesCount} <span class="unit">條目</span></span>
              <p class="bento-desc">地方顯化故事、庄頭信仰與神祇譜系整理</p>
            </a>
          </div>

          <div class="brand-decorative" style="margin-top: 40px; margin-bottom: 20px;">
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
    const safeTheme = this.escapeHtml(theme);
    const safeThemeName = this.escapeHtml(themeName);

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="content-error">
          <h2>主題未找到</h2>
          <p>無法在資料庫中找到主題 "${safeTheme}"，或是該主題下目前沒有條目。</p>
          <a href="#/" class="btn-back">返回首頁</a>
        </div>
      `;
      container.dataset.theme = '';
      return;
    }

    const headerHtml = `
      <div class="content-header animate-fade-in">
        <div class="breadcrumbs">
          <a href="#/">首頁</a> &gt; <span>${safeThemeName}</span>
        </div>
        <h1 class="content-title">主題：${safeThemeName}</h1>
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
    const safeKeyword = this.escapeHtml(keyword);

    if (results.length === 0) {
      container.innerHTML = `
        <div class="content-header animate-fade-in">
          <div class="breadcrumbs">
            <a href="#/">首頁</a> &gt; <span>搜尋結果</span>
          </div>
          <h1 class="content-title">搜尋："${safeKeyword}"</h1>
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
        <h1 class="content-title">搜尋："${safeKeyword}"</h1>
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
