// ─── <tt-toast> ─────────────────────────────────────────────────────────────
// Fixed at bottom of screen. Shows messages with optional undo button.
// API:
//   .show(message, { undo })  — show a toast; undo is a callback or null
//   Auto-dismisses after 5 seconds (or 8 if undoable)

export class TtToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._timer = null;

    this.shadowRoot.innerHTML = `
      <style>
:host {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 2000; pointer-events: none;
}
.toast {
  display: none; align-items: center; gap: 10px;
  background: #333; color: #fff; padding: 10px 16px; border-radius: 10px;
  font-size: 13px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  pointer-events: auto; max-width: 90vw;
  animation: slide-up 0.2s ease-out;
}
.toast.visible { display: flex; }
.msg { flex: 1; }
.btn-undo {
  background: none; border: 1px solid rgba(255,255,255,0.4); color: #ffd166;
  padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
  font-weight: 600; white-space: nowrap;
}
.btn-undo:hover { background: rgba(255,255,255,0.1); }
.btn-dismiss {
  background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer;
  font-size: 16px; line-height: 1; padding: 0 2px;
}
.btn-dismiss:hover { color: #fff; }
@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
      </style>
      <div class="toast" id="toast">
        <span class="msg" id="msg"></span>
        <button class="btn-undo" id="btn-undo" style="display:none">Undo</button>
        <button class="btn-dismiss" id="btn-dismiss">&times;</button>
      </div>
    `;

    this._toast = this.shadowRoot.getElementById('toast');
    this._msg = this.shadowRoot.getElementById('msg');
    this._undoBtn = this.shadowRoot.getElementById('btn-undo');
    this._dismissBtn = this.shadowRoot.getElementById('btn-dismiss');
    this._undoFn = null;

    this._undoBtn.addEventListener('click', () => {
      if (this._undoFn) {
        this._undoFn();
        this._undoFn = null;
      }
      this._hide();
    });
    this._dismissBtn.addEventListener('click', () => this._hide());
  }

  show(message, { undo } = {}) {
    clearTimeout(this._timer);
    this._msg.textContent = message;
    this._undoFn = typeof undo === 'function' ? undo : null;
    this._undoBtn.style.display = this._undoFn ? '' : 'none';
    this._toast.classList.add('visible');
    const timeout = this._undoFn ? 8000 : 5000;
    this._timer = setTimeout(() => this._hide(), timeout);
  }

  _hide() {
    clearTimeout(this._timer);
    this._toast.classList.remove('visible');
    this._undoFn = null;
  }
}
