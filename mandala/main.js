import McCell from './components/mc-cell.js';
import McGrid from './components/mc-grid.js';
import McModal from './components/mc-modal.js';
import McNotifier from './components/mc-notifier.js';
import McToolbar from './components/mc-toolbar.js';
import McSidePanel from './components/mc-side-panel.js';
import McHelpModal from './components/mc-help-modal.js';
import McRingMenu from './components/mc-ring-menu.js';
import McApp from './components/mc-app.js';

customElements.define('mc-cell', McCell);

customElements.define('grid-row', class GridRow extends HTMLElement { });

customElements.define('mc-grid', McGrid);

customElements.define('mc-modal', McModal);

customElements.define('mc-notifier', McNotifier);

customElements.define('mc-toolbar', McToolbar);

customElements.define('mc-side-panel', McSidePanel);

customElements.define('mc-help-modal', McHelpModal);

customElements.define('mc-ring-menu', McRingMenu);

customElements.define('mc-app', McApp);