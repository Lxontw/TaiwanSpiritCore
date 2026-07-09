const Router = {
  decodeSegment(segment) {
    try {
      return decodeURIComponent(segment);
    } catch (e) {
      console.warn('Router.decodeSegment failed:', segment, e);
      return segment;
    }
  },

  init(onRouteChanged) {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash;
      const params = this.parseHash(hash);
      onRouteChanged(params);
    });
    // 首次加載觸發一次
    onRouteChanged(this.parseHash(window.location.hash));
  },
  parseHash(hash) {
    // 解析邏輯，返回 { theme, item }
    if (!hash || hash === '#/') return { theme: null, item: null };
    
    // 移除開頭的 #/
    const cleanHash = hash.startsWith('#/') ? hash.slice(2) : (hash.startsWith('#') ? hash.slice(1) : hash);
    if (!cleanHash) return { theme: null, item: null };
    
    const parts = cleanHash.split('/');
    
    // 範例: theme/plants/item/betel -> { theme: 'plants', item: 'betel' }
    const themeIdx = parts.indexOf('theme');
    const itemIdx = parts.indexOf('item');
    
    return {
      theme: themeIdx !== -1 && themeIdx + 1 < parts.length ? this.decodeSegment(parts[themeIdx + 1]) : null,
      item: itemIdx !== -1 && itemIdx + 1 < parts.length ? this.decodeSegment(parts[itemIdx + 1]) : null
    };
  }
};
window.Router = Router;
