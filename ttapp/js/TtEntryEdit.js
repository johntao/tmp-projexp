import { Store, truncate } from "./shared.js";

// ─── <tt-entry-edit> ────────────────────────────────────────────────────────
export class TtEntryEdit extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._entry = null;
    this._draft = null;

    this.shadowRoot.innerHTML = `
      <style>
:host { display: block; color: #444; }
h3 { color: #d63851; margin-block: 0 12px; font-size: 16px; }
.field { margin-bottom: 12px; }
label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
select { width: 100%; padding: 8px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
textarea { width: -moz-available; width: -webkit-fill-available; width: stretch;
  padding: 8px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; font-family: inherit; resize: vertical; min-height: 48px; }
.actions { display: flex; gap: 10px; margin-top: 14px; }
.actions button {
  flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;
}
.btn-save { background: #d63851; color: #fff; }
.btn-save:hover { background: #c02a43; }
.btn-cancel { background: #e8e8e8; color: #666; }
.btn-cancel:hover { background: #ddd; }
tt-timespan { margin-block: 1.5rem; }
      </style>
      <h3>Edit Entry</h3>
      <div class="field">
        <label>Task</label>
        <select class="task-select"></select>
      </div>
      <div class="field">
        <label>Description</label>
        <textarea class="desc-input" placeholder="Optional description…"></textarea>
      </div>
      <tt-timespan></tt-timespan>
      <div class="actions">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-save">Save</button>
      </div>
    `;

    this._timespan = this.shadowRoot.querySelector('tt-timespan');

    this._timespan.addEventListener('timespan-change', e => {
      if (!this._draft) return;
      this._draft.startTime = e.detail.startTime;
      this._draft.endTime = e.detail.endTime;
    });

    this._descInput = this.shadowRoot.querySelector('.desc-input');
    this._descInput.addEventListener('input', () => {
      if (this._draft) this._draft.description = this._descInput.value;
    });

    this.shadowRoot.querySelector('.btn-save').addEventListener('click', () => this._save());
    this.shadowRoot.querySelector('.btn-cancel').addEventListener('click', () => this._cancel());
  }

  set entry(val) {
    this._entry = val;
    this._draft = { ...val };
    this._timespan.timespan = { startTime: val.startTime, endTime: val.endTime };
    this._descInput.value = val.description || '';
    this._populateTaskSelect();
  }

  _populateTaskSelect() {
    const sel = this.shadowRoot.querySelector('.task-select');
    const tasks = Store.getTasks();
    sel.innerHTML = tasks.map(t => `<option value="${t.name}" ${t.name === this._draft.taskName ? 'selected' : ''}>${truncate(t.name)}</option>`).join('');
    if (!tasks.find(t => t.name === this._draft.taskName)) {
      sel.innerHTML = `<option value="${this._draft.taskName}" selected>${truncate(this._draft.taskName)}</option>` + sel.innerHTML;
    }
    sel.onchange = () => { this._draft.taskName = sel.value; };
  }

  _save() {
    this.dispatchEvent(new CustomEvent('entry-save', {
      bubbles: true, composed: true, detail: { entry: { ...this._draft } }
    }));
  }

  _cancel() {
    this.dispatchEvent(new CustomEvent('entry-edit-cancel', { bubbles: true, composed: true }));
  }
}
