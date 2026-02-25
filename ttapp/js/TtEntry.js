import { truncate, formatTime, formatDuration } from "./shared.js";

// ─── <tt-entry> ─────────────────────────────────────────────────────────────
export class TtEntry extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._entry = null;
    this.shadowRoot.innerHTML = `
      <style>
:host { display: block; }
.row {
  display: flex; align-items: stretch; padding: 10px 14px;
  background: #fff; border-radius: 8px; margin-bottom: 6px; cursor: pointer;
  transition: background 0.15s; border: 1px solid #e8e8e8;
}
.row>* { align-content: center; }
.row:hover { background: #f0f4ff; }
.task-name { font-weight: 600; color: #d63851; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.description { color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: none; }
.description.visible { display: block; }
.times { color: #888; font-family: monospace; }
.duration { color: #2a7ab5; font-family: monospace; text-align: right; }
.delete-btn { background: none; border: none; color: #bbb; cursor: pointer; padding-right: 0; }
.delete-btn:hover { color: #d63851; }

.task-name { flex: 1; }
.description { flex: 3; }
.row>* { font-size: 11px; }
.duration { margin-left: 6px; }
.delete-btn { padding-left: 10px; }
@media (min-width: 769px) {
  .description { flex: 4; }
  .row>* { font-size: 14px; }
  .duration { margin-left: 12px; }
  .delete-btn { padding-left: 12px; }
}

      </style>
      <div class="row">
        <span class="task-name"></span>
        <span class="description"></span>
        <span class="times"></span>
        <span class="duration"></span>
        <button class="delete-btn" title="Delete">🗑</button>
      </div>
    `;
    this.shadowRoot.querySelector('.row').addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      this.dispatchEvent(new CustomEvent('entry-edit', {
        bubbles: true, composed: true, detail: { uuid: this._entry?.uuid }
      }));
    });
    this.shadowRoot.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.dispatchEvent(new CustomEvent('entry-delete', {
        bubbles: true, composed: true, detail: { uuid: this._entry?.uuid }
      }));
    });
  }

  set entry(val) {
    this._entry = val;
    if (!val) return;
    this.shadowRoot.querySelector('.task-name').textContent = truncate(val.taskName);
    this.shadowRoot.querySelector('.times').textContent = `${formatTime(val.startTime)}–${formatTime(val.endTime)}`;
    this.shadowRoot.querySelector('.duration').textContent = formatDuration(val.endTime - val.startTime);
    const descEl = this.shadowRoot.querySelector('.description');
    if (val.description) {
      descEl.textContent = val.description;
      descEl.classList.add('visible');
    } else {
      descEl.textContent = '';
      descEl.classList.remove('visible');
    }
  }
}
