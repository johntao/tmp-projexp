import { positionToIndex, indexToPosition, HJKL_MAP, HJKL_MAP_FAST, JUMP_KEYS, nextStatus, nextLvl1Status, STATUSES, LVL1_STATUSES, DVORAK_TO_QWERTY } from './utility.js';

const STORAGE_KEY = 'mandala-v6-data';
const CENTER_INDEX = 40;
const US = '\x1f';
const PLACEMENT_ORDER = [
  [0, 0], [0, 1], [0, 2],
  [1, 0], [1, 2],
  [2, 0], [2, 1], [2, 2]
];

export default class McApp extends HTMLElement {
  constructor() {
    super();
    // Tree data: root mc-record or null
    this._root = null;
  }

  connectedCallback() {
    this.innerHTML = `
<div class="mc-layout">
  <mc-grid></mc-grid>
  <mc-side-panel>
    <mc-toolbar></mc-toolbar>
  </mc-side-panel>
</div>
<mc-modal></mc-modal>
<mc-help-modal></mc-help-modal>
<mc-notifier></mc-notifier>
<mc-ring-menu></mc-ring-menu>
    `;

    this._grid = this.querySelector('mc-grid');
    this._modal = this.querySelector('mc-modal');
    this._helpModal = this.querySelector('mc-help-modal');
    this._notifier = this.querySelector('mc-notifier');
    this._sidePanel = this.querySelector('mc-side-panel');
    this._ringMenu = this.querySelector('mc-ring-menu');
    this._ringTimer = null;
    this._ringActive = false;
    this._ringJustUsed = false;

    this._loadFromStorage();
    this._ensureStructure();
    this._keyboardLayout = localStorage.getItem('mandala-v6-keyboard') || 'qwerty';
    this._renderTree();

    // Focus center cell
    requestAnimationFrame(() => {
      this._grid.cellAt(CENTER_INDEX)?.focus();
    });

    // Global keydown
    document.addEventListener('keydown', (e) => this._onKeydown(e));

    // Cell change (from inline edit)
    this._grid.addEventListener('cell-change', () => {
      this._saveToStorage();
      this._renderTree();
    });

    // Click events
    this._grid.addEventListener('cell-click-status', (e) => {
      this._handleCycleStatus(e.target);
    });
    this._grid.addEventListener('cell-click-open', (e) => {
      const cell = e.target;
      if (cell.record) this._handleDetailEdit(cell);
      else this._handleCreate(cell);
    });
    this._grid.addEventListener('cell-click-create', (e) => {
      this._handleCreate(e.target);
    });

    // Migration events
    this.addEventListener('migration-export', () => this._exportData());
    this.addEventListener('migration-import', (e) => this._importData(e.detail.content, e.detail.fileName));

    // Sample data
    this.addEventListener('load-sample', (e) => this._loadSampleData(e.detail.file));

    // Keyboard layout
    this.addEventListener('keyboard-change', (e) => {
      this._keyboardLayout = e.detail.layout;
    });

    // Ring menu: long-press on focused cell
    this._grid.addEventListener('pointerdown', (e) => {
      const cell = e.target.closest('mc-cell');
      if (!cell || cell.isEditing) return;
      if (document.activeElement !== cell) return;
      clearTimeout(this._ringTimer);
      this._ringTimer = setTimeout(() => {
        this._ringMenu.show(e.clientX, e.clientY);
        this._ringActive = true;
      }, 300);
    });

    document.addEventListener('pointermove', (e) => {
      if (!this._ringActive) return;
      this._ringMenu.track(e.clientX, e.clientY);
    });

    document.addEventListener('pointerup', (e) => {
      clearTimeout(this._ringTimer);
      if (!this._ringActive) return;
      const cmd = this._ringMenu.selectedCommand;
      this._ringMenu.hide();
      this._ringActive = false;
      if (cmd) {
        this._ringJustUsed = true;
        setTimeout(() => { this._ringJustUsed = false; }, 0);
        const focused = document.activeElement;
        if (focused && focused.tagName === 'MC-CELL') {
          this._dispatchRingCommand(cmd, focused);
        }
      }
    });

    document.addEventListener('pointercancel', () => {
      clearTimeout(this._ringTimer);
      if (this._ringActive) {
        this._ringMenu.hide();
        this._ringActive = false;
      }
    });

    // Click suppression after ring menu use
    this._grid.addEventListener('click', (e) => {
      if (this._ringJustUsed) {
        e.stopImmediatePropagation();
      }
    }, true);
  }

  // === Tree-to-grid mapping ===

  _renderTree() {
    const cells = this._grid.cells;
    // Clear all cells
    cells.forEach(c => c.setRecord(null));

    if (!this._root) return;

    // Place root at center
    cells[CENTER_INDEX].setRecord(this._root, false, 0);

    const children = this._root.children || [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child) continue;
      const [sgRow, sgCol] = PLACEMENT_ORDER[i];
      const [mgRow, mgCol] = PLACEMENT_ORDER[i];

      // Place in center outergrid
      const centerIdx = positionToIndex(1, 1, sgRow, sgCol);
      cells[centerIdx].setRecord(child, false, 1);

      // Sync to corresponding outergrid center
      const syncIdx = positionToIndex(mgRow, mgCol, 1, 1);
      cells[syncIdx].setRecord(child, true, 1);

      // Place lvl2 children
      const grandchildren = child.children || [];
      for (let j = 0; j < grandchildren.length; j++) {
        const gc = grandchildren[j];
        if (!gc) continue;
        const [sg2Row, sg2Col] = PLACEMENT_ORDER[j];
        const lvl2Idx = positionToIndex(mgRow, mgCol, sg2Row, sg2Col);
        cells[lvl2Idx].setRecord(gc, false, 2);
      }
    }
  }

  // === Determine what a cell represents in the tree ===

  _getCellTreeInfo(cellIndex) {
    if (cellIndex === CENTER_INDEX) {
      return { level: 0, record: this._root, parent: null, childIndex: -1 };
    }

    const pos = indexToPosition(cellIndex);
    const children = this._root?.children || [];

    // Check if it's a lvl1 node in center outergrid
    if (pos.mgRow === 1 && pos.mgCol === 1 && !(pos.sgRow === 1 && pos.sgCol === 1)) {
      const idx = PLACEMENT_ORDER.findIndex(([r, c]) => r === pos.sgRow && c === pos.sgCol);
      if (idx !== -1 && idx < children.length && children[idx]) {
        return { level: 1, record: children[idx], parent: this._root, childIndex: idx };
      }
      // Empty lvl1 slot (null)
      return { level: 1, record: null, parent: this._root, childIndex: idx, slotIndex: idx };
    }

    // Check if it's a synced lvl1 node (center of an outer grid)
    if (pos.sgRow === 1 && pos.sgCol === 1 && !(pos.mgRow === 1 && pos.mgCol === 1)) {
      const idx = PLACEMENT_ORDER.findIndex(([r, c]) => r === pos.mgRow && c === pos.mgCol);
      if (idx !== -1 && idx < children.length && children[idx]) {
        return { level: 1, record: children[idx], parent: this._root, childIndex: idx, isSynced: true };
      }
      return { level: 1, record: null, parent: this._root, childIndex: idx, slotIndex: idx, isSynced: true };
    }

    // Check if it's a lvl2 node in an outer outergrid
    if (!(pos.mgRow === 1 && pos.mgCol === 1) && !(pos.sgRow === 1 && pos.sgCol === 1)) {
      const parentIdx = PLACEMENT_ORDER.findIndex(([r, c]) => r === pos.mgRow && c === pos.mgCol);
      if (parentIdx !== -1 && parentIdx < children.length && children[parentIdx]) {
        const parentRecord = children[parentIdx];
        const grandchildren = parentRecord.children || [];
        const gcIdx = PLACEMENT_ORDER.findIndex(([r, c]) => r === pos.sgRow && c === pos.sgCol);
        if (gcIdx !== -1 && gcIdx < grandchildren.length && grandchildren[gcIdx]) {
          return { level: 2, record: grandchildren[gcIdx], parent: parentRecord, childIndex: gcIdx };
        }
        return { level: 2, record: null, parent: parentRecord, childIndex: gcIdx, slotIndex: gcIdx };
      }
      // Parent slot is null or uninitialized — lvl2 with no parent
      if (parentIdx !== -1) {
        return { level: 2, record: null, parent: null, childIndex: -1, parentSlotIndex: parentIdx };
      }
      return { level: -1, record: null, parent: null, childIndex: -1 };
    }

    return { level: -1, record: null, parent: null, childIndex: -1 };
  }

  _checkAvailability(cellIndex) {
    const info = this._getCellTreeInfo(cellIndex);
    if (!info.record) return false; // no record to add child to

    if (info.level === 0) {
      return (this._root.children || []).some(c => c === null);
    }
    if (info.level === 1) {
      return (info.record.children || []).some(c => c === null);
    }
    return false; // lvl2 always false
  }

  _dispatchRingCommand(cmd, cell) {
    switch (cmd) {
      case 'create': this._handleCreate(cell); break;
      case 'delete': this._handleDelete(cell); break;
      case 'inline': this._handleInlineEdit(cell); break;
      case 'detail': this._handleDetailEdit(cell); break;
    }
  }

  // === Keydown dispatch ===

  _translateKey(key) {
    if (this._keyboardLayout === 'dvorak') {
      return DVORAK_TO_QWERTY[key] || key;
    }
    return key;
  }

  _onKeydown(e) {
    if (this._modal.isOpen) return;

    const key = this._translateKey(e.key);

    if (key === '?') {
      e.preventDefault();
      this._helpModal.toggle();
      return;
    }

    if (this._helpModal.isOpen) {
      if (e.key === 'Escape') this._helpModal.close();
      return;
    }

    if (key === ']') {
      e.preventDefault();
      this._sidePanel.toggle();
      return;
    }

    const focused = document.activeElement;
    if (!focused || focused.tagName !== 'MC-CELL') return;
    if (focused.isEditing) return;

    // Navigation keys
    if (HJKL_MAP[key] || HJKL_MAP_FAST[key] || JUMP_KEYS[key]) {
      e.preventDefault();
      this._grid.navigate(key, focused);
      return;
    }

    // Cell action keys
    switch (key) {
      case 'u':
        e.preventDefault();
        this._handleCreate(focused);
        break;
      case 'i':
        e.preventDefault();
        this._handleInlineEdit(focused);
        break;
      case 'o':
      case 'Enter':
        e.preventDefault();
        this._handleDetailEdit(focused);
        break;
      case 'Delete':
        e.preventDefault();
        this._handleDelete(focused);
        break;
      case 'y':
        e.preventDefault();
        this._handleCycleStatus(focused);
        break;
    }
  }

  // === Cell actions ===

  _handleCreate(cell) {
    // Case 1: Root is null — teleport to center if needed, then create root
    if (!this._root) {
      if (cell.cellIndex !== CENTER_INDEX) {
        const rootCell = this._grid.cellAt(CENTER_INDEX);
        rootCell.focus();
        this._handleCreate(rootCell);
        return;
      }
      this._modal.open('create', { modalTitle: 'Create Root Record', hideStatus: true });
      this._modalListen((detail) => {
        this._root = { title: detail.title, description: detail.description, children: new Array(8).fill(null) };
        this._saveToStorage();
        this._renderTree();
        cell.focus();
      }, () => cell.focus());
      return;
    }

    const info = this._getCellTreeInfo(cell.cellIndex);

    // Case 2: lvl2 cell whose parent (lvl1) doesn't exist — teleport to parent's synced cell
    if (info.level === 2 && !info.parent && info.parentSlotIndex !== undefined) {
      const [mgRow, mgCol] = PLACEMENT_ORDER[info.parentSlotIndex];
      const parentCellIdx = positionToIndex(mgRow, mgCol, 1, 1);
      const parentCell = this._grid.cellAt(parentCellIdx);
      parentCell.focus();
      this._handleCreate(parentCell);
      return;
    }

    // Empty lvl1/lvl2 slot (null) — create record directly at that position
    if (!info.record && info.parent) {
      if (info.level === 1) {
        // lvl1 null slot: create lvl1 with 8 null children, default status 'na'
        this._modal.open('create', { modalTitle: 'Create Record', status: 'na', statusOptions: LVL1_STATUSES });
        this._modalListen((detail) => {
          const st = LVL1_STATUSES.includes(detail.status) ? detail.status : 'na';
          const newRecord = { title: detail.title, description: detail.description, status: st, children: new Array(8).fill(null) };
          this._root.children[info.slotIndex] = newRecord;
          this._saveToStorage();
          this._renderTree();
          cell.focus();
        }, () => cell.focus());
        return;
      }
      if (info.level === 2) {
        // lvl2 null slot: default depends on parent lvl1 status
        const defaultStatus = (info.parent.status || 'na') === 'na' ? 'na' : 'now';
        this._modal.open('create', { modalTitle: 'Create Record', status: defaultStatus, statusOptions: STATUSES });
        this._modalListen((detail) => {
          const newRecord = { title: detail.title, description: detail.description, status: detail.status || 'na' };
          info.parent.children[info.slotIndex] = newRecord;
          this._saveToStorage();
          this._renderTree();
          cell.focus();
        }, () => cell.focus());
        return;
      }
    }

    // Cell has a record — create a child in the first null slot
    if (info.record) {
      if (info.level === 2) {
        this._notifier.show('Lvl3 nodes are not supported');
        return;
      }
      if (!this._checkAvailability(cell.cellIndex)) {
        this._notifier.show('Maximum children reached (8)');
        return;
      }
      const nullIdx = (info.record.children || []).indexOf(null);
      if (nullIdx === -1) return;

      if (info.level === 0) {
        // Root creating lvl1 child
        this._modal.open('create', { modalTitle: 'Create Child Record', status: 'na', statusOptions: LVL1_STATUSES });
        this._modalListen((detail) => {
          const st = LVL1_STATUSES.includes(detail.status) ? detail.status : 'na';
          const newRecord = { title: detail.title, description: detail.description, status: st, children: new Array(8).fill(null) };
          info.record.children[nullIdx] = newRecord;
          this._saveToStorage();
          this._renderTree();
          cell.focus();
        }, () => cell.focus());
      } else if (info.level === 1) {
        // Lvl1 creating lvl2 child
        const defaultStatus = (info.record.status || 'na') === 'na' ? 'na' : 'now';
        this._modal.open('create', { modalTitle: 'Create Child Record', status: defaultStatus, statusOptions: STATUSES });
        this._modalListen((detail) => {
          const newRecord = { title: detail.title, description: detail.description, status: detail.status || 'na' };
          info.record.children[nullIdx] = newRecord;
          this._saveToStorage();
          this._renderTree();
          cell.focus();
        }, () => cell.focus());
      }
    }
  }

  _handleInlineEdit(cell) {
    if (!cell.record) { this._handleCreate(cell); return; }
    cell.startInlineEdit();
  }

  _handleDetailEdit(cell) {
    const info = this._getCellTreeInfo(cell.cellIndex);
    if (!info.record) { this._handleCreate(cell); return; }

    const modalData = {
      modalTitle: 'Update Record',
      title: info.record.title,
      description: info.record.description || '',
      children: info.level < 2 ? (info.record.children || []) : []
    };

    if (info.level === 0) {
      modalData.hideStatus = true;
    } else if (info.level === 1) {
      modalData.status = info.record.status || 'na';
      modalData.statusOptions = LVL1_STATUSES;
    } else {
      modalData.status = info.record.status || 'na';
      modalData.statusOptions = STATUSES;
    }

    this._modal.open('update', modalData);

    this._modalListen((detail) => {
      info.record.title = detail.title;
      info.record.description = detail.description;
      if (info.level === 1) {
        info.record.status = LVL1_STATUSES.includes(detail.status) ? detail.status : info.record.status;
      } else if (info.level === 2) {
        info.record.status = detail.status;
      }
      // root: no status to set
      if (detail.children) info.record.children = detail.children;
      this._saveToStorage();
      this._renderTree();
      cell.focus();
    }, () => cell.focus());
  }

  _handleDelete(cell) {
    const info = this._getCellTreeInfo(cell.cellIndex);
    if (!info.record) return;

    if (info.level === 0) {
      const backup = JSON.parse(JSON.stringify(this._root));
      this._root = null;
      this._saveToStorage();
      this._renderTree();
      this._notifier.show('Record deleted', () => {
        this._root = backup;
        this._saveToStorage();
        this._renderTree();
      });
    } else if (info.parent && info.childIndex >= 0) {
      const backup = JSON.parse(JSON.stringify(info.record));
      const backupIdx = info.childIndex;
      info.parent.children[info.childIndex] = null;
      this._saveToStorage();
      this._renderTree();
      this._notifier.show('Record deleted', () => {
        info.parent.children[backupIdx] = backup;
        this._saveToStorage();
        this._renderTree();
      });
    }
  }

  _handleCycleStatus(cell) {
    const info = this._getCellTreeInfo(cell.cellIndex);
    if (!info.record) return;
    if (info.level === 0) return; // root has no status
    if (info.level === 1) {
      info.record.status = nextLvl1Status(info.record.status);
    } else {
      info.record.status = nextStatus(info.record.status);
    }
    this._saveToStorage();
    this._renderTree();
  }

  _modalListen(onConfirm, onClose) {
    const modal = this._modal;
    const confirmHandler = (e) => {
      modal.removeEventListener('modal-confirm', confirmHandler);
      modal.removeEventListener('modal-close', closeHandler);
      onConfirm(e.detail);
    };
    const closeHandler = () => {
      modal.removeEventListener('modal-confirm', confirmHandler);
      modal.removeEventListener('modal-close', closeHandler);
      onClose();
    };
    modal.addEventListener('modal-confirm', confirmHandler);
    modal.addEventListener('modal-close', closeHandler);
  }

  // === Persistence ===

  _saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._root));
  }

  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) this._root = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }

  _ensureStructure() {
    if (!this._root) return;
    if (!this._root.children) this._root.children = [];
    while (this._root.children.length < 8) this._root.children.push(null);
    for (let i = 0; i < 8; i++) {
      const child = this._root.children[i];
      if (child) {
        if (!child.children) child.children = [];
        while (child.children.length < 8) child.children.push(null);
      }
    }
  }

  // === Import/Export ===

  _exportData() {
    if (!this._root) {
      this._notifier.show('No data to export');
      return;
    }
    const fileName = this._root.title || 'mandala';
    // Root line (no status for root)
    let output = [this._root.title, 0, this._root.description || ''].join(US) + '\n';
    const children = this._root.children || [];
    for (const child of children) {
      if (!child) {
        output += '- null\n';
        continue;
      }
      const stIdx = child.status === 'goal' ? 1 : 0;
      output += '- ' + [child.title, stIdx, child.description || ''].join(US) + '\n';
      const grandchildren = child.children || [];
      for (const gc of grandchildren) {
        if (!gc) {
          output += '\t- null\n';
          continue;
        }
        output += '\t- ' + [gc.title, STATUSES.indexOf(gc.status || 'na'), gc.description || ''].join(US) + '\n';
      }
    }
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _importData(content, fileName) {
    if (this._root) {
      if (!confirm('Current data will be replaced. Save your data first if needed.\n\nContinue?')) return;
    }

    const backup = this._root ? JSON.parse(JSON.stringify(this._root)) : null;

    try {
      const lines = content.split('\n');
      let lineIdx = 0;

      // Skip empty lines at start
      while (lineIdx < lines.length && !lines[lineIdx].trim()) lineIdx++;
      if (lineIdx >= lines.length) throw new Error('Empty file');

      // First line: root record (not starting with '- ')
      const firstLine = lines[lineIdx];
      let root;
      if (!firstLine.startsWith('- ') && !firstLine.startsWith('\t')) {
        // New format: root line present (root has no status)
        const parts = firstLine.split(US);
        root = {
          title: (parts[0] || '').trim(),
          description: (parts[2] || '').trim(),
          children: []
        };
        lineIdx++;
      } else {
        // Old format: no root line, derive name from fileName
        const name = fileName.replace(/\.(md|txt)$/, '');
        root = { title: name, description: '', children: [] };
      }

      let currentLvl1 = null;

      for (; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        if (!line.trim()) continue;

        if (line.startsWith('\t- ') || line.startsWith('  - ')) {
          // lvl2 item
          const text = line.startsWith('\t- ') ? line.slice(3) : line.slice(4);
          if (text.trim() === 'null') {
            if (currentLvl1) currentLvl1.children.push(null);
            continue;
          }
          if (!currentLvl1) throw new Error('lvl2 item without parent');
          const parts = text.split(US);
          currentLvl1.children.push({
            title: (parts[0] || '').trim(),
            description: (parts[2] || '').trim(),
            status: STATUSES[parseInt(parts[1])] || 'na'
          });
        } else if (line.startsWith('- ')) {
          // lvl1 item
          const text = line.slice(2);
          if (text.trim() === 'null') {
            root.children.push(null);
            currentLvl1 = null;
            continue;
          }
          const parts = text.split(US);
          const stIdx = parseInt(parts[1]);
          currentLvl1 = {
            title: (parts[0] || '').trim(),
            description: (parts[2] || '').trim(),
            status: LVL1_STATUSES[stIdx] || 'na',
            children: []
          };
          root.children.push(currentLvl1);
        }
      }

      if (root.children.length > 8) throw new Error(`Too many lvl1 items (${root.children.length}, max 8)`);
      for (const child of root.children) {
        if (child && (child.children || []).length > 8) {
          throw new Error(`Too many lvl2 items for "${child.title}" (${child.children.length}, max 8)`);
        }
      }

      this._root = root;
      this._ensureStructure();
      this._saveToStorage();
      this._renderTree();
      this._notifier.show('Data loaded', () => {
        this._root = backup;
        this._ensureStructure();
        this._saveToStorage();
        this._renderTree();
      });
    } catch (err) {
      this._notifier.show('Load error: ' + err.message);
    }
  }

  async _loadSampleData(fileName) {
    try {
      const resp = await fetch(`sample/${fileName}`);
      if (!resp.ok) throw new Error('Failed to fetch sample data');
      const content = await resp.text();
      this._importData(content, fileName);
    } catch (err) {
      this._notifier.show('Load error: ' + err.message);
    }
  }
}