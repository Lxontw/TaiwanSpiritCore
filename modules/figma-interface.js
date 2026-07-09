/**
 * Figma integration bridge.
 * Keeps design tokens and screen metadata available for future Figma MCP export.
 */
const FigmaInterface = {
  version: '0.1.0',
  designSpecPath: 'DESIGN.md',
  frameDefaults: {
    desktop: { width: 1440, height: 1024 },
    tablet: { width: 900, height: 1024 },
    mobile: { width: 390, height: 844 }
  },
  componentMap: {
    appShell: ['sidebar', 'content'],
    navigation: ['tree-group', 'tree-item', 'search-input'],
    content: ['home-dashboard', 'detail-card', 'theme-detail-flow'],
    admin: ['collections', 'entry-editor', 'media-library']
  },

  getTokens() {
    return window.StitchInterface ? window.StitchInterface.tokens : {
      colors: {
        canvas: '#0F0F11',
        sidebar: '#151518',
        card: '#1B1B22',
        border: '#2B2B35',
        text: '#F0F0F5',
        muted: '#A0A0B0',
        accent: '#C8A84B'
      }
    };
  },

  getFrameSpec() {
    const context = window.StitchInterface ? window.StitchInterface.getDesignContext() : {};
    return {
      name: 'TaiwanSpiritCore Knowledge Console',
      designSpecPath: this.designSpecPath,
      frames: this.frameDefaults,
      componentMap: this.componentMap,
      context,
      tokens: this.getTokens()
    };
  }
};

window.FigmaInterface = FigmaInterface;
