import { Store } from "./shared.js";

// ─── <tt-toolbar> (fixed top bar) ───────────────────────────────────────────
export class TtToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
:host {
  user-select: none; background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.bar {
  display: flex; align-items: center; padding: 6px 12px; gap: 6px;
}
.tabs { display: flex; gap: 4px; flex: 1; }
.tabs button {
  width: 32px; height: 32px; border-radius: 6px; background: #f5f5f5;
  border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 13px; font-weight: 600; color: #555;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.tabs button:hover { background: #eef2ff; }
.tabs button.active { background: #d63851; color: #fff; border-color: #d63851; }
.actions { display: flex; gap: 4px; }
.actions button {
  width: 32px; height: 32px; border-radius: 6px; background: #f5f5f5;
  border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 15px; color: #555;
  transition: background 0.15s;
}
.actions button:hover { background: #eef2ff; }
      </style>
      <div class="bar">
        <div class="tabs" id="tabs"></div>
        <div class="actions">
          <button id="btn-config" title="Config">🔧</button>
          <button id="btn-help" title="Help">?</button>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('btn-config').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('open-config', { bubbles: true, composed: true }));
    });
    this.shadowRoot.getElementById('btn-help').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('open-help', { bubbles: true, composed: true }));
    });

    Store.subscribe(() => this._renderTabs());
  }

  connectedCallback() {
    this._renderTabs();
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
      btn.addEventListener('click', () => {
        Store.setActiveTab(i);
        this._renderTabs();
      });
      tabsEl.appendChild(btn);
    });
  }
}
