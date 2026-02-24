import { Store, TIME_SEGMENTS, formatDate } from "./shared.js";

// ─── <tt-config> ────────────────────────────────────────────────────────────
export class TtConfig extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._tasks = [];
    this.shadowRoot.innerHTML = `
      <style>
:host { display: block; color: #444; }
h3 { color: #d63851; margin-bottom: 12px; font-size: 16px; }
.task-list { margin-bottom: 16px; }
.task-item {
  background: #f5f5f5; border-radius: 8px; padding: 10px; margin-bottom: 8px;
  border: 1px solid #e8e8e8;
}
.task-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.task-row input[type="text"] {
  flex: 1; padding: 6px 8px; background: #fff; color: #333; border: 1px solid #ddd;
  border-radius: 4px; font-size: 13px;
}
.task-row input[type="number"] {
  width: 70px; padding: 6px 8px; background: #fff; color: #333; border: 1px solid #ddd;
  border-radius: 4px; font-size: 13px;
}
.segs { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
.segs label { font-size: 11px; display: flex; align-items: center; gap: 2px; color: #666; }
.segs input { accent-color: #d63851; }
button {
  padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
}
.btn-remove { background: #fde8e8; color: #c02a43; }
.btn-move { background: #e8e8e8; color: #666; font-size: 11px; padding: 4px 8px; }
.btn-add { background: #d63851; color: #fff; margin-bottom: 16px; }
.btn-add:disabled { background: #ddd; color: #999; }
h4 { color: #2a7ab5; margin: 16px 0 8px; font-size: 14px; }
.btn-io { background: #e8f0fe; color: #2a7ab5; }
.btn-io:hover { background: #d4e4fc; }
.btn-save-config { background: #d63851; color: #fff; width: 100%; padding: 10px; margin-top: 16px; font-size: 14px; }
.btn-save-config:hover { background: #c02a43; }
#io-section { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; font-size: 13px; }
#io-section b { justify-self: start; align-self: center; }
      </style>
      <h3>Predefined Tasks</h3>
      <div class="task-list" id="task-list"></div>
      <button class="btn-add" id="btn-add">+ Add Task</button>

<div id="io-section">
  <b>Task Config</b>
  <button class="btn-io" id="btn-export-config">Export Config</button>
  <button class="btn-io" id="btn-import-config">Import Config</button>
  <button class="btn-io" id="btn-load-sample">Load Sample</button>
  <b>Entry Data</b>
  <button class="btn-io" id="btn-export">Export Entries</button>
  <button class="btn-io" id="btn-import">Import Entries</button>
</div>
      <input type="file" id="file-input-config" accept=".json" style="display:none">
      <input type="file" id="file-input" accept=".json" style="display:none">

      <button class="btn-save-config" id="btn-save">Save Configuration</button>
    `;

    this.shadowRoot.getElementById('btn-add').addEventListener('click', () => this._addTask());
    this.shadowRoot.getElementById('btn-export').addEventListener('click', () => this._export());
    this.shadowRoot.getElementById('btn-import').addEventListener('click', () => {
      this.shadowRoot.getElementById('file-input').click();
    });
    this.shadowRoot.getElementById('file-input').addEventListener('change', e => this._import(e));
    this.shadowRoot.getElementById('btn-export-config').addEventListener('click', () => this._exportConfig());
    this.shadowRoot.getElementById('btn-import-config').addEventListener('click', () => {
      this.shadowRoot.getElementById('file-input-config').click();
    });
    this.shadowRoot.getElementById('file-input-config').addEventListener('change', e => this._importConfig(e));
    this.shadowRoot.getElementById('btn-load-sample').addEventListener('click', () => this._loadSample());
    this.shadowRoot.getElementById('btn-save').addEventListener('click', () => this._saveConfig());
  }

  load() {
    this._tasks = Store.getTasks().map(t => ({
      ...t,
      uuid: t.uuid || crypto.randomUUID()
    }));
    this._renderTasks();
  }

  _renderTasks() {
    const container = this.shadowRoot.getElementById('task-list');
    container.innerHTML = '';
    this._tasks.forEach((task, i) => {
      const div = document.createElement('div');
      div.className = 'task-item';
      div.innerHTML = `
        <div class="task-row">
          <input type="text" maxlength="20" value="${task.name}" data-idx="${i}" class="name-input" placeholder="Task name">
          <input type="number" min="0" value="${task.estimationDuration || ''}" data-idx="${i}" class="est-input" placeholder="min" title="Estimation (minutes)">
          <button class="btn-move" data-dir="up" data-idx="${i}">▲</button>
          <button class="btn-move" data-dir="down" data-idx="${i}">▼</button>
          <button class="btn-remove" data-idx="${i}">✕</button>
        </div>
        <div class="segs">
          ${TIME_SEGMENTS.map(seg => `
            <label><input type="checkbox" data-idx="${i}" data-seg="${seg.id}" ${task.timesegs && task.timesegs.includes(seg.id) ? 'checked' : ''}> ${seg.label}</label>
          `).join('')}
        </div>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('.name-input').forEach(input => {
      input.addEventListener('input', e => {
        this._tasks[+e.target.dataset.idx].name = e.target.value.slice(0, 20);
      });
    });
    container.querySelectorAll('.est-input').forEach(input => {
      input.addEventListener('input', e => {
        const val = parseInt(e.target.value);
        this._tasks[+e.target.dataset.idx].estimationDuration = isNaN(val) || val <= 0 ? null : val;
      });
    });
    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        this._tasks.splice(+e.target.dataset.idx, 1);
        this._renderTasks();
      });
    });
    container.querySelectorAll('.btn-move').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = +e.target.dataset.idx;
        const dir = e.target.dataset.dir;
        if (dir === 'up' && idx > 0) [this._tasks[idx - 1], this._tasks[idx]] = [this._tasks[idx], this._tasks[idx - 1]];
        else if (dir === 'down' && idx < this._tasks.length - 1) [this._tasks[idx], this._tasks[idx + 1]] = [this._tasks[idx + 1], this._tasks[idx]];
        this._renderTasks();
      });
    });
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', e => {
        const idx = +e.target.dataset.idx;
        const seg = e.target.dataset.seg;
        let segs = this._tasks[idx].timesegs || [];
        if (e.target.checked) segs = [...segs, seg];
        else segs = segs.filter(s => s !== seg);
        this._tasks[idx].timesegs = segs.length > 0 ? segs : null;
      });
    });

    this.shadowRoot.getElementById('btn-add').disabled = this._tasks.length >= 8;
  }

  _addTask() {
    if (this._tasks.length >= 8) return;
    this._tasks.push({ uuid: crypto.randomUUID(), name: '', timesegs: null, estimationDuration: null });
    this._renderTasks();
  }

  _saveConfig() {
    const valid = this._tasks.filter(t => t.name.trim());
    Store.setTasks(valid);
    this.dispatchEvent(new CustomEvent('config-saved', { bubbles: true, composed: true }));
  }

  _export() {
    const entries = Store.getEntries();
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `time-entries-${formatDate(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  _import(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        const existing = Store.getEntries();
        const byUuid = new Map(existing.map(e => [e.uuid, e]));
        let added = 0, updated = 0;

        for (const entry of imported) {
          if (!entry.uuid) entry.uuid = crypto.randomUUID();

          if (byUuid.has(entry.uuid)) {
            // Update existing entry in place
            Object.assign(byUuid.get(entry.uuid), entry);
            updated++;
          } else {
            byUuid.set(entry.uuid, entry);
            added++;
          }
        }

        Store.setEntries([...byUuid.values()]);
        alert(`Imported: ${added} added, ${updated} updated.`);
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  _exportConfig() {
    const tasks = this._tasks.filter(t => t.name.trim());
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `task-config-${formatDate(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async _loadSample() {
    try {
      const res = await fetch('./sample/config.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const imported = await res.json();
      if (!Array.isArray(imported)) throw new Error('Invalid format');

      const byUuid = new Map(this._tasks.map(t => [t.uuid, t]));
      let added = 0, updated = 0;

      for (const t of imported) {
        if (!t.name || typeof t.name !== 'string') continue;
        if (!t.uuid) t.uuid = crypto.randomUUID();

        const parsed = {
          uuid: t.uuid,
          name: String(t.name).slice(0, 20),
          timesegs: Array.isArray(t.timesegs) ? t.timesegs : null,
          estimationDuration: typeof t.estimationDuration === 'number' && t.estimationDuration > 0 ? t.estimationDuration : null
        };

        if (byUuid.has(t.uuid)) {
          Object.assign(byUuid.get(t.uuid), parsed);
          updated++;
        } else {
          if (this._tasks.length >= 8) continue;
          this._tasks.push(parsed);
          byUuid.set(t.uuid, parsed);
          added++;
        }
      }

      this._renderTasks();
      alert(`Sample loaded: ${added} added, ${updated} updated.`);
    } catch (err) {
      alert('Failed to load sample: ' + err.message);
    }
  }

  _importConfig(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');

        const byUuid = new Map(this._tasks.map(t => [t.uuid, t]));
        let added = 0, updated = 0;

        for (const t of imported) {
          if (!t.name || typeof t.name !== 'string') continue;
          if (!t.uuid) t.uuid = crypto.randomUUID();

          const parsed = {
            uuid: t.uuid,
            name: String(t.name).slice(0, 20),
            timesegs: Array.isArray(t.timesegs) ? t.timesegs : null,
            estimationDuration: typeof t.estimationDuration === 'number' && t.estimationDuration > 0 ? t.estimationDuration : null
          };

          if (byUuid.has(t.uuid)) {
            // Update existing task in place
            Object.assign(byUuid.get(t.uuid), parsed);
            updated++;
          } else {
            if (this._tasks.length >= 8) continue;
            this._tasks.push(parsed);
            byUuid.set(t.uuid, parsed);
            added++;
          }
        }

        this._renderTasks();
        alert(`Imported: ${added} added, ${updated} updated.`);
      } catch (err) {
        alert('Config import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
}
