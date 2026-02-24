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
          display: flex; align-items: center; padding: 10px 14px; gap: 10px;
          background: #fff; border-radius: 8px; margin-bottom: 6px; cursor: pointer;
          transition: background 0.15s; border: 1px solid #e8e8e8;
        }
        .row:hover { background: #f0f4ff; }
        .task-name { flex: 1; font-weight: 600; color: #d63851; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .times { font-size: 13px; color: #888; font-family: monospace; }
        .duration { font-size: 13px; color: #2a7ab5; font-family: monospace; min-width: 60px; text-align: right; }
        .delete-btn {
          background: none; border: none; color: #bbb; font-size: 16px; cursor: pointer; padding: 2px 6px;
        }
        .delete-btn:hover { color: #d63851; }
      </style>
      <div class="row">
        <span class="task-name"></span>
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
    this.shadowRoot.querySelector('.times').textContent = `${formatTime(val.startTime)} – ${formatTime(val.endTime)}`;
    this.shadowRoot.querySelector('.duration').textContent = formatDuration(val.endTime - val.startTime);
  }
}
