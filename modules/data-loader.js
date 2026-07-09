const DataLoader = {
  getAll() { return window.TAIWAN_SPIRIT_DB; },
  getByTheme(theme) { return window.TAIWAN_SPIRIT_DB[theme] || []; },
  getItem(id) {
    for (const theme in window.TAIWAN_SPIRIT_DB) {
      const found = window.TAIWAN_SPIRIT_DB[theme].find(item => item.id === id);
      if (found) return found;
    }
    return null;
  }
};
window.DataLoader = DataLoader;
