/**
 * TaiwanSpiritCore - 搜尋引擎模組
 * 支援 300ms 防抖動 (Debounce) 的跨主題文字搜尋
 */

let searchDebounceTimer = null;

const Search = {
  /**
   * 搜尋資料庫中所有匹配的項目
   * @param {string} keyword 搜尋關鍵字
   * @param {function} callback 搜尋完成後的回呼函式，傳入結果陣列
   */
  query(keyword, callback) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      if (!keyword) return callback([]);
      
      const results = [];
      const db = window.TAIWAN_SPIRIT_DB;
      if (!db) {
        console.error('TAIWAN_SPIRIT_DB is not loaded.');
        return callback([]);
      }

      const cleanKeyword = keyword.trim().toLowerCase();
      
      for (const theme in db) {
        db[theme].forEach(item => {
          const id = item.id || '';
          const title = item.title || '';
          const subtitle = item.subtitle || '';
          const category = item.category || '';
          const summary = item.content?.summary || '';
          const transformations = item.content?.transformations?.join(' ') || '';
          const regions = item.content?.regions?.join(' ') || '';
          const cities = item.content?.cities?.join(' ') || '';
          const landscapes = item.content?.landscapes?.join(' ') || '';
          const tips = item.content?.tips?.join(' ') || '';

          // 構建全文檢索字串
          const textToSearch = `${id} ${title} ${subtitle} ${category} ${summary} ${transformations} ${regions} ${cities} ${landscapes} ${tips}`;
          
          if (textToSearch.toLowerCase().includes(cleanKeyword)) {
            results.push(item);
          }
        });
      }
      
      callback(results);
    }, 300);
  }
};

window.Search = Search;
