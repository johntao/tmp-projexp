// ─── <tt-toolbar> (floating ⋮ menu, top-right) ─────────────────────────────
export class TtToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._open = false;

    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; top: 12px; right: 12px; z-index: 500; user-select: none; }
        .kebab {
          width: 36px; height: 36px; border-radius: 50%; background: #fff; border: 1px solid #ddd;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          font-size: 20px; color: #555; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: background 0.15s;
        }
        .kebab:hover { background: #f0f0f0; }
        .menu {
          display: none; flex-direction: column; gap: 6px; margin-top: 8px;
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
      <div class="kebab" id="kebab">⋮</div>
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
  }

  _toggle() {
    this._open = !this._open;
    this.shadowRoot.getElementById('menu').classList.toggle('open', this._open);
  }

  _close() {
    this._open = false;
    this.shadowRoot.getElementById('menu').classList.remove('open');
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._outsideClick);
  }
}
