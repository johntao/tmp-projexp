import { truncate } from "./shared.js";

// ─── <tt-ring-menu> ─────────────────────────────────────────────────────────
export class TtRingMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._items = [];
    this._activeIndex = -1;
    this._isOpen = false;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: none; position: fixed; inset: 0; z-index: 2000; touch-action: none; user-select: none; }
        :host([open]) { display: block; }
        .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.18); }
        svg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .item-arc { fill: #fff; stroke: #ddd; stroke-width: 1; cursor: pointer; transition: fill 0.1s; }
        .item-arc.active { fill: #d63851; }
        .item-label { fill: #444; font-size: 12px; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
        .item-label.active { fill: #fff; font-weight: bold; }
        .cancel-zone { fill: #f5f5f5; stroke: #ccc; stroke-width: 1; }
        .cancel-text { fill: #999; font-size: 11px; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
        .empty-msg { fill: #888; font-size: 14px; text-anchor: middle; dominant-baseline: central; }
      </style>
      <div class="backdrop"></div>
      <svg viewBox="-160 -160 320 320" width="320" height="320"></svg>
    `;

    this._svg = this.shadowRoot.querySelector('svg');
    this.addEventListener('pointermove', e => this._onMove(e));
    this.addEventListener('pointerup', e => this._onUp(e));
    this.addEventListener('pointercancel', e => this._onUp(e));
  }

  show(items) {
    this._items = items;
    this._activeIndex = -1;
    this.setAttribute('open', '');
    this._isOpen = true;
    this._render();
  }

  hide() {
    this.removeAttribute('open');
    this._isOpen = false;
  }

  _getItemIndex(e) {
    const rect = this._svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 35) return -1;
    if (this._items.length === 0) return -1;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    return Math.floor(angle / (360 / this._items.length)) % this._items.length;
  }

  _onMove(e) {
    if (!this._isOpen) return;
    this._activeIndex = this._getItemIndex(e);
    this._render();
  }

  _onUp(e) {
    if (!this._isOpen) return;
    const idx = this._getItemIndex(e);
    this.hide();
    if (idx >= 0 && idx < this._items.length) {
      this.dispatchEvent(new CustomEvent('task-selected', {
        bubbles: true, composed: true, detail: { task: this._items[idx] }
      }));
    }
  }

  _render() {
    const n = this._items.length;
    let html = `<circle class="cancel-zone" cx="0" cy="0" r="35" />`;
    html += `<text class="cancel-text" x="0" y="0">Cancel</text>`;
    if (n === 0) {
      html += `<text class="empty-msg" x="0" y="-60">No tasks for current segment</text>`;
      this._svg.innerHTML = html;
      return;
    }
    const innerR = 45, outerR = 130, labelR = 88;
    const sliceAngle = 360 / n;
    for (let i = 0; i < n; i++) {
      const startAngle = (i * sliceAngle - 90) * Math.PI / 180;
      const endAngle = ((i + 1) * sliceAngle - 90) * Math.PI / 180;
      const x1i = innerR * Math.cos(startAngle), y1i = innerR * Math.sin(startAngle);
      const x2i = innerR * Math.cos(endAngle), y2i = innerR * Math.sin(endAngle);
      const x1o = outerR * Math.cos(startAngle), y1o = outerR * Math.sin(startAngle);
      const x2o = outerR * Math.cos(endAngle), y2o = outerR * Math.sin(endAngle);
      const largeArc = sliceAngle > 180 ? 1 : 0;
      const isActive = i === this._activeIndex;
      html += `<path class="item-arc${isActive ? ' active' : ''}" d="M ${x1i} ${y1i} L ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i} Z" />`;
      const midAngle = ((i + 0.5) * sliceAngle - 90) * Math.PI / 180;
      const task = this._items[i];
      const label = task.estimationDuration ? `[${task.estimationDuration}m] ${task.name}` : task.name;
      html += `<text class="item-label${isActive ? ' active' : ''}" x="${labelR * Math.cos(midAngle)}" y="${labelR * Math.sin(midAngle)}">${truncate(label)}</text>`;
    }
    this._svg.innerHTML = html;
  }
}
