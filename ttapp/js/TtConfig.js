import { Store, formatDate } from "./shared.js";

// ─── <tt-config> ────────────────────────────────────────────────────────────
export class TtConfig extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._tasksets = [];
    this._activeTab = 0;
    this._dragSrcIdx = null;

    this.shadowRoot.innerHTML = `
      <style>
:host { display: block; color: #444; }
h3 { color: #d63851; margin-block: 0 12px; font-size: 16px; }

/* ── Tabstrip ── */
.tabstrip { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; align-items: center; }
.tabstrip .tab {
  width: 32px; height: 32px; line-height: 32px; border-radius: 6px; border: 1px solid #ddd;
  background: #f5f5f5; font-size: 13px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s, border-color 0.1s;
}
.tabstrip .tab:hover { background: #eef2ff; }
.tabstrip .tab.active { background: #d63851; color: #fff; border-color: #d63851; }
.tabstrip .tab-action {
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid #ddd;
  background: #fff; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s;
}
.tabstrip .tab-action:hover { background: #eef2ff; }

/* ── Tab description ── */
.tab-desc {
  width: -moz-available; width: -webkit-fill-available; width: stretch;
  padding: 6px 8px; background: #f5f5f5; color: #333; border: 1px solid #ddd;
  border-radius: 6px; font-size: 13px; font-family: inherit; resize: vertical;
  min-height: 36px; margin-bottom: 12px;
}

/* ── Task list ── */
.task-list { margin-bottom: 16px; }
.task-item {
  display: flex; align-items: center; gap: 6px;
  background: #f5f5f5; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px;
  border: 1px solid #e8e8e8; transition: background 0.1s;
}
.task-item.drag-over { border-color: #d63851; background: #fef2f2; }
.task-item.blank { background: #fff; border-style: dashed; }
.drag-handle {
  cursor: grab; font-size: 14px; color: #bbb; padding: 0 4px; touch-action: none;
  user-select: none; -webkit-user-select: none;
}
.drag-handle:active { cursor: grabbing; }
.drag-handle.disabled { visibility: hidden; }
.task-item input[type="text"] {
  flex: 1; min-width: 0; padding: 6px 8px; background: #fff; color: #333; border: 1px solid #ddd;
  border-radius: 4px; font-size: 13px;
}
.task-item input[type="number"] {
  width: 60px; padding: 6px 8px; background: #fff; color: #333; border: 1px solid #ddd;
  border-radius: 4px; font-size: 13px;
}
.task-item button {
  width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer;
  font-size: 14px; display: flex; align-items: center; justify-content: center;
  background: transparent; color: #999; transition: background 0.1s, color 0.1s;
}
.task-item button:hover { background: #fde8e8; color: #d63851; }
.task-item .btn-add { color: #d63851; font-size: 18px; font-weight: 700; }
.task-item .btn-add:hover { background: #d63851; color: #fff; }

/* ── Delete tab ── */
.delete-tab-row {
  display: flex; justify-content: flex-end; margin-bottom: 12px;
}
.btn-delete-tab {
  padding: 4px 12px; border: 1px solid #fde8e8; border-radius: 6px;
  background: #fff; color: #c02a43; font-size: 12px; cursor: pointer;
}
.btn-delete-tab:hover { background: #fde8e8; }

/* ── IO section ── */
h4 { color: #2a7ab5; margin: 16px 0 8px; font-size: 14px; }
button { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-io { background: #e8f0fe; color: #2a7ab5; }
.btn-io:hover { background: #d4e4fc; }
#io-section { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; font-size: 13px; }
#io-section b { justify-self: start; align-self: center; }
.warn { color: #c87a00; font-size: 11px; margin-top: 4px; }
      </style>

      <h3>Task Sets</h3>
      <div class="tabstrip" id="tabstrip"></div>
      <textarea class="tab-desc" id="tab-desc" placeholder="Taskset description (optional)…"></textarea>
      <div class="task-list" id="task-list"></div>
      <div class="delete-tab-row" id="delete-tab-row">
        <button class="btn-delete-tab" id="btn-delete-tab">Delete this tab</button>
      </div>

<div id="io-section">
  <b>Task Config</b>
  <button class="btn-io" id="btn-export-config">Export</button>
  <button class="btn-io" id="btn-import-config">Import</button>
  <button class="btn-io" id="btn-load-sample">Demo</button>
  <b>Entry Data</b>
  <button class="btn-io" id="btn-export">Export</button>
  <button class="btn-io" id="btn-import">Import</button>
</div>
      <input type="file" id="file-input-config" accept=".json" style="display:none">
      <input type="file" id="file-input" accept=".json" style="display:none">
    `;

    this.shadowRoot.getElementById('tab-desc').addEventListener('input', e => {
      if (this._tasksets[this._activeTab]) {
        this._tasksets[this._activeTab].description = e.target.value;
        this._persist();
      }
    });

    this.shadowRoot.getElementById('btn-delete-tab').addEventListener('click', () => this._deleteTab());
    this.shadowRoot.getElementById('btn-export').addEventListener('click', () => this._export());
    this.shadowRoot.getElementById('btn-import').addEventListener('click', () => {
      if (Store.getEntries().length > 0 && !confirm('This will replace all task sets. Make sure you\'ve already saved a copy!')) return;
      this.shadowRoot.getElementById('file-input').click();
    });
    this.shadowRoot.getElementById('file-input').addEventListener('change', e => this._import(e));
    this.shadowRoot.getElementById('btn-export-config').addEventListener('click', () => this._exportConfig());
    this.shadowRoot.getElementById('btn-import-config').addEventListener('click', () => {
      if (this._hasTasks() && !confirm('This will replace all task sets. Make sure you\'ve already saved a copy!')) return;
      this.shadowRoot.getElementById('file-input-config').click();
    });
    this.shadowRoot.getElementById('file-input-config').addEventListener('change', e => this._importConfig(e));
    this.shadowRoot.getElementById('btn-load-sample').addEventListener('click', () => this._loadSample());
  }

  load() {
    this._tasksets = Store.getTasksets().map(ts => ({
      ...ts,
      tasks: (ts.tasks || []).map(t => ({ ...t, uuid: t.uuid || crypto.randomUUID() }))
    }));
    this._activeTab = Store.getActiveTab();
    if (this._tasksets.length === 0) {
      this._tasksets.push({ description: '', tasks: [] });
      this._activeTab = 0;
    }
    if (this._activeTab >= this._tasksets.length) this._activeTab = 0;
    this._render();
  }

  _persist() {
    Store.setTasksets(this._tasksets);
    Store.setActiveTab(this._activeTab);
  }

  _hasTasks() {
    return this._tasksets.some(ts => ts.tasks && ts.tasks.length > 0);
  }

  _toast(message, opts) {
    this.dispatchEvent(new CustomEvent('show-toast', {
      bubbles: true, composed: true,
      detail: { message, ...opts }
    }));
  }

  _render() {
    this._renderTabstrip();
    this._renderDescription();
    this._renderTasks();
    this.shadowRoot.getElementById('btn-delete-tab').style.display =
      this._tasksets.length > 1 ? '' : 'none';
  }

  // ── Tabstrip ────────────────────────────────────────────────────────────────

  _renderTabstrip() {
    const strip = this.shadowRoot.getElementById('tabstrip');
    strip.innerHTML = '';
    this._tasksets.forEach((_, i) => {
      const tab = document.createElement('button');
      tab.className = 'tab' + (i === this._activeTab ? ' active' : '');
      tab.textContent = i + 1;
      tab.addEventListener('click', () => {
        this._activeTab = i;
        this._persist();
        this._render();
      });
      strip.appendChild(tab);
    });
    // Add new tab button
    if (this._tasksets.length < 8) {
      const addBtn = document.createElement('button');
      addBtn.className = 'tab-action';
      addBtn.textContent = '+';
      addBtn.title = 'New blank tab';
      addBtn.addEventListener('click', () => this._addTab());
      strip.appendChild(addBtn);
    }
    // Duplicate tab button
    if (this._tasksets.length < 8) {
      const dupBtn = document.createElement('button');
      dupBtn.className = 'tab-action';
      dupBtn.textContent = '🗐';
      dupBtn.title = 'Duplicate current tab';
      dupBtn.addEventListener('click', () => this._duplicateTab());
      strip.appendChild(dupBtn);
    }
  }

  _addTab() {
    if (this._tasksets.length >= 8) return;
    this._tasksets.push({ description: '', tasks: [] });
    this._activeTab = this._tasksets.length - 1;
    this._persist();
    this._render();
  }

  _duplicateTab() {
    if (this._tasksets.length >= 8) return;
    const src = this._tasksets[this._activeTab];
    const dup = {
      description: src.description || '',
      tasks: (src.tasks || []).map(t => ({ ...t, uuid: crypto.randomUUID() }))
    };
    this._tasksets.push(dup);
    this._activeTab = this._tasksets.length - 1;
    this._persist();
    this._render();
  }

  _deleteTab() {
    if (this._tasksets.length <= 1) return;
    const removedIdx = this._activeTab;
    const [removed] = this._tasksets.splice(this._activeTab, 1);
    if (this._activeTab >= this._tasksets.length) this._activeTab = this._tasksets.length - 1;
    this._persist();
    this._render();
    this._toast('Tab deleted.', {
      undo: () => {
        this._tasksets.splice(removedIdx, 0, removed);
        this._activeTab = removedIdx;
        this._persist();
        this._render();
      }
    });
  }

  // ── Description ─────────────────────────────────────────────────────────────

  _renderDescription() {
    const el = this.shadowRoot.getElementById('tab-desc');
    el.value = (this._tasksets[this._activeTab] && this._tasksets[this._activeTab].description) || '';
  }

  // ── Task list with drag-and-drop ────────────────────────────────────────────

  _renderTasks() {
    const container = this.shadowRoot.getElementById('task-list');
    container.innerHTML = '';
    const tasks = this._tasksets[this._activeTab]?.tasks || [];

    // Blank row for insertion
    container.appendChild(this._createBlankRow());

    // Task rows
    tasks.forEach((task, i) => {
      container.appendChild(this._createTaskRow(task, i));
    });
  }

  _createBlankRow() {
    const div = document.createElement('div');
    div.className = 'task-item blank';

    const handle = document.createElement('span');
    handle.className = 'drag-handle disabled';
    handle.textContent = '☰';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 20;
    nameInput.placeholder = 'New task name…';
    nameInput.className = 'blank-name';

    const estInput = document.createElement('input');
    estInput.type = 'number';
    estInput.min = '0';
    estInput.placeholder = 'min';
    estInput.title = 'Estimation (minutes)';
    estInput.className = 'blank-est';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.textContent = '+';
    addBtn.title = 'Add task';

    const doAdd = () => {
      const name = nameInput.value.trim().slice(0, 20);
      if (!name) return;
      const estVal = parseInt(estInput.value);
      const est = isNaN(estVal) || estVal <= 0 ? null : estVal;
      const tasks = this._tasksets[this._activeTab].tasks;
      if (tasks.length >= 8) return;
      tasks.push({ uuid: crypto.randomUUID(), name, estimationDuration: est });
      this._persist();
      this._renderTasks();
      // Re-focus the blank name input
      const blankName = this.shadowRoot.querySelector('.blank-name');
      if (blankName) blankName.focus();
    };

    addBtn.addEventListener('click', doAdd);

    // Enter key shortcut on blank row inputs
    const onKey = e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } };
    nameInput.addEventListener('keydown', onKey);
    estInput.addEventListener('keydown', onKey);

    div.appendChild(handle);
    div.appendChild(nameInput);
    div.appendChild(estInput);
    div.appendChild(addBtn);
    return div;
  }

  _createTaskRow(task, idx) {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.dataset.idx = idx;

    // Drag handle
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '☰';
    this._setupDragHandle(handle, div, idx);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 20;
    nameInput.value = task.name;
    nameInput.placeholder = 'Task name';
    nameInput.addEventListener('input', () => {
      task.name = nameInput.value.slice(0, 20);
      this._persist();
    });

    const estInput = document.createElement('input');
    estInput.type = 'number';
    estInput.min = '0';
    estInput.value = task.estimationDuration || '';
    estInput.placeholder = 'min';
    estInput.title = 'Estimation (minutes)';
    estInput.addEventListener('input', () => {
      const val = parseInt(estInput.value);
      task.estimationDuration = isNaN(val) || val <= 0 ? null : val;
      this._persist();
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.title = 'Delete task';
    delBtn.addEventListener('click', () => {
      const [removed] = this._tasksets[this._activeTab].tasks.splice(idx, 1);
      this._persist();
      this._renderTasks();
      this._toast('Task deleted.', {
        undo: () => {
          this._tasksets[this._activeTab].tasks.splice(idx, 0, removed);
          this._persist();
          this._renderTasks();
        }
      });
    });

    div.appendChild(handle);
    div.appendChild(nameInput);
    div.appendChild(estInput);
    div.appendChild(delBtn);
    return div;
  }

  // ── Drag and drop (touch-compatible) ────────────────────────────────────────

  _setupDragHandle(handle, row, idx) {
    let startY = 0;
    let dragging = false;
    let placeholder = null;

    const onPointerDown = e => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      startY = e.clientY;
      this._dragSrcIdx = idx;
      dragging = false;
    };

    const onPointerMove = e => {
      if (this._dragSrcIdx !== idx) return;
      if (!dragging && Math.abs(e.clientY - startY) > 5) {
        dragging = true;
        row.style.opacity = '0.4';
      }
      if (!dragging) return;

      // Find drop target
      const container = this.shadowRoot.getElementById('task-list');
      const items = [...container.querySelectorAll('.task-item:not(.blank)')];
      items.forEach(el => el.classList.remove('drag-over'));
      for (const el of items) {
        const rect = el.getBoundingClientRect();
        if (e.clientY >= rect.top && e.clientY < rect.bottom) {
          el.classList.add('drag-over');
          break;
        }
      }
    };

    const onPointerUp = e => {
      if (this._dragSrcIdx !== idx) return;
      handle.releasePointerCapture(e.pointerId);
      row.style.opacity = '';

      if (dragging) {
        // Find drop index
        const container = this.shadowRoot.getElementById('task-list');
        const items = [...container.querySelectorAll('.task-item:not(.blank)')];
        items.forEach(el => el.classList.remove('drag-over'));
        let dropIdx = this._dragSrcIdx;
        for (let i = 0; i < items.length; i++) {
          const rect = items[i].getBoundingClientRect();
          if (e.clientY >= rect.top && e.clientY < rect.bottom) {
            dropIdx = i;
            break;
          }
        }
        if (dropIdx !== this._dragSrcIdx) {
          const tasks = this._tasksets[this._activeTab].tasks;
          const [moved] = tasks.splice(this._dragSrcIdx, 1);
          tasks.splice(dropIdx, 0, moved);
          this._persist();
          this._renderTasks();
        }
      }
      this._dragSrcIdx = null;
      dragging = false;
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', e => {
      handle.releasePointerCapture(e.pointerId);
      row.style.opacity = '';
      this._dragSrcIdx = null;
      dragging = false;
      const container = this.shadowRoot.getElementById('task-list');
      container.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over'));
    });
  }

  // ── Import / Export ─────────────────────────────────────────────────────────

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
        const oldEntries = Store.getEntries();
        const byUuid = new Map(oldEntries.map(e => [e.uuid, e]));
        let added = 0, updated = 0;

        for (const entry of imported) {
          if (!entry.uuid) entry.uuid = crypto.randomUUID();
          if (byUuid.has(entry.uuid)) {
            Object.assign(byUuid.get(entry.uuid), entry);
            updated++;
          } else {
            byUuid.set(entry.uuid, entry);
            added++;
          }
        }

        Store.setEntries([...byUuid.values()]);
        this._toast(`Imported: ${added} added, ${updated} updated.`, {
          undo: () => { Store.setEntries(oldEntries); }
        });
      } catch (err) {
        this._toast('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  _exportConfig() {
    const blob = new Blob([JSON.stringify(this._tasksets, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tasksets-${formatDate(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  _importConfig(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format: expected array of tasksets');
        const oldTasksets = JSON.parse(JSON.stringify(this._tasksets));
        const oldTab = this._activeTab;
        this._tasksets = imported.map(ts => ({
          description: ts.description || '',
          tasks: (ts.tasks || []).map(t => ({
            uuid: t.uuid || crypto.randomUUID(),
            name: String(t.name || '').slice(0, 20),
            estimationDuration: typeof t.estimationDuration === 'number' && t.estimationDuration > 0 ? t.estimationDuration : null
          }))
        }));
        if (this._tasksets.length === 0) this._tasksets.push({ description: '', tasks: [] });
        this._activeTab = 0;
        this._persist();
        this._render();
        this._toast('Config imported.', {
          undo: () => {
            this._tasksets = oldTasksets;
            this._activeTab = oldTab;
            this._persist();
            this._render();
          }
        });
      } catch (err) {
        this._toast('Config import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async _loadSample() {
    if (this._hasTasks() && !confirm('This will replace all task sets. Make sure you\'ve already saved a copy!')) return;
    try {
      const res = await fetch('./sample/config.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const imported = await res.json();
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      const oldTasksets = JSON.parse(JSON.stringify(this._tasksets));
      const oldTab = this._activeTab;
      this._tasksets = imported.map(ts => ({
        description: ts.description || '',
        tasks: (ts.tasks || []).map(t => ({
          uuid: t.uuid || crypto.randomUUID(),
          name: String(t.name || '').slice(0, 20),
          estimationDuration: typeof t.estimationDuration === 'number' && t.estimationDuration > 0 ? t.estimationDuration : null
        }))
      }));
      if (this._tasksets.length === 0) this._tasksets.push({ description: '', tasks: [] });
      this._activeTab = 0;
      this._persist();
      this._render();
      this._toast('Sample loaded.', {
        undo: () => {
          this._tasksets = oldTasksets;
          this._activeTab = oldTab;
          this._persist();
          this._render();
        }
      });
    } catch (err) {
      this._toast('Failed to load sample: ' + err.message);
    }
  }
}
