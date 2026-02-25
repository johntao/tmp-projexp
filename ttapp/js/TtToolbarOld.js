import { Store } from "./shared.js";

// ─── <tt-toolbar> (floating ⋮ menu, top-right) ─────────────────────────────
export class TtToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._open = false;

    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; top: 12px; right: 12px; z-index: 500; user-select: none; }
        .toolbar-row {
          display: flex; align-items: center; gap: 6px; justify-content: flex-end;
        }
        .tabs {
          display: none; flex-direction: row; gap: 4px;
        }
        .tabs.open { display: flex; }
        .tabs button {
          width: 32px; height: 32px; border-radius: 50%; background: #fff; border: 1px solid #ddd;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          font-size: 13px; font-weight: 600; color: #555; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .tabs button:hover { background: #eef2ff; }
        .tabs button.active { background: #d63851; color: #fff; border-color: #d63851; }
        .kebab {
          width: 36px; height: 36px; border-radius: 50%; background: #fff; border: 1px solid #ddd;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          font-size: 20px; color: #555; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: background 0.15s;
        }
        .kebab:hover { background: #f0f0f0; }
        .menu {
          display: none; flex-direction: column; gap: 6px; margin-top: 8px;
          align-items: flex-end;
        }
        .menu.open { display: flex; }
        .menu button {
          width: 36px; height: 36px; border-radius: 50%; background: #fff; border: 1px solid #ddd;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          font-size: 16px; color: #555; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: background 0.15s;
        }
        .menu button:hover { background: #f0f0f0; }
      </style>
      <div class="toolbar-row">
        <div class="tabs" id="tabs"></div>
        <div class="kebab" id="kebab">⋮</div>
      </div>
      <div class="menu" id="menu">
        <button id="btn-config" title="Config">🔧</button>
        <button id="btn-help" title="Help">?</button>
      </div>
    `;

    this.shadowRoot.getElementById('kebab').addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggle();
    });
    this.shadowRoot.getElementById('btn-config').addEventListener('click', () => {
      this._close();
      this.dispatchEvent(new CustomEvent('open-config', { bubbles: true, composed: true }));
    });
    this.shadowRoot.getElementById('btn-help').addEventListener('click', () => {
      this._close();
      this.dispatchEvent(new CustomEvent('open-help', { bubbles: true, composed: true }));
    });

    // Close on outside click
    this._outsideClick = () => this._close();
    document.addEventListener('click', this._outsideClick);

    // Listen for store changes to update tabs
    Store.subscribe(() => this._renderTabs());
  }

  connectedCallback() {
    this._renderTabs();
  }

  _toggle() {
    this._open = !this._open;
    this.shadowRoot.getElementById('menu').classList.toggle('open', this._open);
    this.shadowRoot.getElementById('tabs').classList.toggle('open', this._open);
    if (this._open) this._renderTabs();
  }

  _close() {
    this._open = false;
    this.shadowRoot.getElementById('menu').classList.remove('open');
    this.shadowRoot.getElementById('tabs').classList.remove('open');
  }

  _renderTabs() {
    const tabsEl = this.shadowRoot.getElementById('tabs');
    const tasksets = Store.getTasksets();
    const activeTab = Store.getActiveTab();
    tabsEl.innerHTML = '';
    tasksets.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      if (i === activeTab) btn.classList.add('active');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Store.setActiveTab(i);
        this._renderTabs();
      });
      tabsEl.appendChild(btn);
    });
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._outsideClick);
  }
}
