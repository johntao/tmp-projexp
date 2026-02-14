export default class McNotifier extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
  :host { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 200; }
  :host(:not([open])) { display: none; }
  .toast { background: #333; color: #fff; padding: 10px 16px; border-radius: 4px; font-size: 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
  .message { flex: 1; }
  button { background: transparent; border: 1px solid #fff; color: #fff; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 13px; }
  button:hover { background: rgba(255,255,255,0.1); }
  .close-btn { border: none; padding: 0 4px; font-size: 16px; }
</style>
<div class="toast">
  <span class="message"></span>
  <button type="button" class="undo-btn">Undo</button>
  <button type="button" class="close-btn">&times;</button>
</div>
    `;
    this._message = this.shadowRoot.querySelector('.message');
    this._undoBtn = this.shadowRoot.querySelector('.undo-btn');
    this._closeBtn = this.shadowRoot.querySelector('.close-btn');
    this._timeout = null;
    this._undoCallback = null;

    this._undoBtn.addEventListener('click', () => {
      if (this._undoCallback) this._undoCallback();
      this.hide();
    });
    this._closeBtn.addEventListener('click', () => this.hide());
  }

  show(msg, undoCallback) {
    this._message.textContent = msg;
    this._undoCallback = undoCallback;
    this._undoBtn.hidden = !undoCallback;
    this.setAttribute('open', '');
    if (this._timeout) clearTimeout(this._timeout);
    this._timeout = setTimeout(() => this.hide(), 5000);
  }

  hide() {
    this.removeAttribute('open');
    if (this._timeout) { clearTimeout(this._timeout); this._timeout = null; }
    this._undoCallback = null;
  }
}