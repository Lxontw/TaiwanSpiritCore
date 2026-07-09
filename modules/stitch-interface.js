/**
 * Google Stitch integration bridge.
 * Exposes stable design context without changing the visible application UI.
 */
const StitchInterface = {
  version: '0.1.0',
  designSpecPath: 'DESIGN.md',
  themes: ['fuzhe', 'plants', 'monsters', 'talismans', 'temples'],
  tokens: {
    colors: {
      canvas: '#0F0F11',
      sidebar: '#151518',
      card: '#1B1B22',
      border: '#2B2B35',
      text: '#F0F0F5',
      muted: '#A0A0B0',
      accent: '#C8A84B'
    },
    typography: {
      sans: '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
      mono: 'monospace',
      baseSize: '14px',
      lineHeight: 1.6
    },
    layout: {
      desktopGridAreas: 'sidebar content',
      mobileBreakpoint: 600,
      tabletBreakpoint: 900,
      cardRadius: '8px'
    }
  },

  getDesignContext() {
    const db = window.DataLoader ? window.DataLoader.getAll() : {};
    const route = window.Router ? window.Router.parseHash(window.location.hash) : { theme: null, item: null };
    const counts = this.themes.reduce((acc, theme) => {
      acc[theme] = Array.isArray(db[theme]) ? db[theme].length : 0;
      return acc;
    }, {});

    return {
      route,
      counts,
      themes: this.themes,
      tokens: this.tokens,
      designSpecPath: this.designSpecPath
    };
  }
};

window.StitchInterface = StitchInterface;
