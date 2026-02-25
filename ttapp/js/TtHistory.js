import { Store, formatDate } from "./shared.js";

// ─── <tt-history> ───────────────────────────────────────────────────────────
export class TtHistory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; flex: 1; overflow-y: auto; padding: 10px 12px; }
        .empty { text-align: center; color: #aaa; padding: 40px 0; font-size: 14px; }
        .empty .hint { margin-top: 8px; font-size: 12px; color: #bbb; }
        .btn-demo {
          margin-top: 12px; padding: 8px 20px; border: none; border-radius: 8px;
          background: #d63851; color: #fff; font-size: 13px; cursor: pointer;
        }
        .btn-demo:hover { background: #c02a43; }
        .date-header { color: #2a7ab5; font-size: 12px; font-weight: 600; padding: 8px 4px 4px; margin-top: 8px; }
        .date-header:first-child { margin-top: 0; }
      </style>
      <div id="list"></div>
    `;
  }

  async _loadSample() {
    try {
      const res = await fetch('./sample/config.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const imported = await res.json();
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      const oldTasksets = Store.getTasksets();
      const oldTab = Store.getActiveTab();
      const tasksets = imported.map(ts => ({
        description: ts.description || '',
        tasks: (ts.tasks || []).map(t => ({
          uuid: t.uuid || crypto.randomUUID(),
          name: String(t.name || '').slice(0, 20),
          estimationDuration: typeof t.estimationDuration === 'number' && t.estimationDuration > 0 ? t.estimationDuration : null
        }))
      }));
      if (tasksets.length === 0) tasksets.push({ description: '', tasks: [] });
      Store.setTasksets(tasksets);
      Store.setActiveTab(0);
      this.dispatchEvent(new CustomEvent('show-toast', {
        bubbles: true, composed: true,
        detail: {
          message: 'Demo loaded.',
          undo: () => {
            Store.setTasksets(oldTasksets);
            Store.setActiveTab(oldTab);
          }
        }
      }));
    } catch (err) {
      this.dispatchEvent(new CustomEvent('show-toast', {
        bubbles: true, composed: true,
        detail: { message: 'Failed to load demo: ' + err.message }
      }));
    }
  }

  set entries(val) {
    const list = this.shadowRoot.getElementById('list');
    if (!val || val.length === 0) {
      const hasTasks = Store.getTasksets().some(ts => ts.tasks && ts.tasks.length > 0);
      if (hasTasks) {
        list.innerHTML = '<div class="empty">No entries yet. Start tracking!<br>Or tap 🔧 to configure tasks</div>';
      } else {
        list.innerHTML = '';
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.innerHTML = 'No entries yet.<div class="hint">Load demo data or tap 🔧 to configure tasks.</div>';
        const btn = document.createElement('button');
        btn.className = 'btn-demo';
        btn.textContent = 'Load Demo';
        btn.addEventListener('click', () => this._loadSample());
        empty.appendChild(btn);
        list.appendChild(empty);
      }
      return;
    }
    const sorted = [...val].sort((a, b) => b.startTime - a.startTime);
    list.innerHTML = '';
    let lastDate = '';
    sorted.forEach(entry => {
      const date = formatDate(entry.startTime);
      if (date !== lastDate) {
        const header = document.createElement('div');
        header.className = 'date-header';
        header.textContent = date;
        list.appendChild(header);
        lastDate = date;
      }
      const el = document.createElement('tt-entry');
      el.entry = entry;
      list.appendChild(el);
    });
  }
}
