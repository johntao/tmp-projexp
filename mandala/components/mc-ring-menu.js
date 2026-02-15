export default class McRingMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
:host {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}
.overlay {
  width: 100%;
  height: 100%;
}
.ring {
  position: absolute;
  width: 160px;
  height: 160px;
  pointer-events: none;
}
.cmd {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  pointer-events: none;
  transition: transform 0.1s, border-color 0.1s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.cmd.active {
  border-color: #0066cc;
  transform: scale(1.2);
  background: #e8f0fe;
}
.cmd-top    { left: 58px; top: 0; }
.cmd-bottom { left: 58px; bottom: 0; }
.cmd-left   { left: 0; top: 58px; }
.cmd-right  { right: 0; top: 58px; }
</style>
<div class="overlay">
  <div class="ring">
    <div class="cmd cmd-top" data-cmd="create">💡</div>
    <div class="cmd cmd-right" data-cmd="detail">🔍</div>
    <div class="cmd cmd-bottom" data-cmd="delete">🗑</div>
    <div class="cmd cmd-left" data-cmd="inline">📝</div>
  </div>
</div>
    `;
    this._ring = this.shadowRoot.querySelector('.ring');
    this._cmds = this.shadowRoot.querySelectorAll('.cmd');
    this._isOpen = false;
    this._selected = null;
    this._cx = 0;
    this._cy = 0;
  }

  get isOpen() { return this._isOpen; }
  get selectedCommand() { return this._selected; }

  show(x, y) {
    const rw = 160, rh = 160;
    const vw = window.innerWidth, vh = window.innerHeight;
    const cx = Math.max(rw / 2, Math.min(x, vw - rw / 2));
    const cy = Math.max(rh / 2, Math.min(y, vh - rh / 2));
    this._cx = cx;
    this._cy = cy;
    this._ring.style.left = (cx - rw / 2) + 'px';
    this._ring.style.top = (cy - rh / 2) + 'px';
    this._selected = null;
    this._clearActive();
    this.style.display = 'block';
    this._isOpen = true;
  }

  hide() {
    this.style.display = 'none';
    this._isOpen = false;
    this._selected = null;
    this._clearActive();
  }

  track(px, py) {
    if (!this._isOpen) return;
    const dx = px - this._cx;
    const dy = py - this._cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this._clearActive();
    this._selected = null;

    if (dist < 20) return;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let cmd;
    if (angle >= -45 && angle < 45) cmd = 'detail';
    else if (angle >= 45 && angle < 135) cmd = 'delete';
    else if (angle >= -135 && angle < -45) cmd = 'create';
    else cmd = 'inline';

    this._selected = cmd;
    const el = this.shadowRoot.querySelector(`[data-cmd="${cmd}"]`);
    if (el) el.classList.add('active');
  }

  _clearActive() {
    this._cmds.forEach(c => c.classList.remove('active'));
  }
}
