// ─── <tt-modal> ─────────────────────────────────────────────────────────────
export class TtModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: none; position: fixed; inset: 0; z-index: 1000; }
        :host([open]) { display: flex; }
        .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.25); }
        .panel {
          position: relative; margin: auto; background: #fff; border-radius: 12px;
          padding: 20px; max-width: 480px; width: 90%; max-height: 85vh; overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 1;
        }
        .close-btn {
          position: absolute; top: 10px; right: 14px; background: none; border: none;
          color: #999; font-size: 24px; cursor: pointer; line-height: 1;
        }
        .close-btn:hover { color: #333; }
      </style>
      <div class="backdrop"></div>
      <div class="panel">
        <button class="close-btn">&times;</button>
        <slot></slot>
      </div>
    `;
    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.close());
    this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => this.close());

    this._onKeyDown = e => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    };
    document.addEventListener('keydown', this._onKeyDown);
  }

  open() { this.setAttribute('open', ''); }
  close() {
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
  }

  get isOpen() { return this.hasAttribute('open'); }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeyDown);
  }
}
