import { calcProgress, calcRootProgress } from './utility.js';

const STATUS_ICONS = { 'na': '📄', 'now': '🟩', 'done': '✅', 'goal': '🎯' };

export default class McCell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
:host {
  display: block;
  background: #fff;
  padding: 4px;
  font-size: 12px;
  overflow: hidden;
  touch-action: manipulation;
  -webkit-touch-callout: none;
}
:host(:focus) {
  outline: 2px solid #0066cc;
  outline-offset: -1px;
  cursor: pointer;
}
.empty {
  color: #bbb;
  font-size: 10px;
  text-align: center;
  padding-top: 30px;
}
.mr {
  height: 100%;
  word-break: break-word;
}
.mr[hidden] { display: none; }
.mr-icon {
  font-size: 11px;
}
:host(:focus) .mr-icon {
  cursor: pointer;
}
.mr-progress {
  font-size: 10px;
  color: #666;
  cursor: default;
}
.mr-title {
  font-weight: 500;
}
.inline-edit {
  display: block;
  width: 100%;
  border: none;
  background: #fffde7;
  font: inherit;
  font-weight: 500;
  padding: 2px;
  outline: 1px dashed #0066cc;
  resize: none;
  min-height: 100%;
  box-sizing: border-box;
}
</style>
<div class="empty"></div>
<div class="mr" hidden></div>
    `;
    this._empty = this.shadowRoot.querySelector('.empty');
    this._mrEl = this.shadowRoot.querySelector('.mr');
    this._record = null;
    this._level = -1;
    this._isEditing = false;
    this._isSynced = false;
    this._wasFocused = false;
  }

  connectedCallback() {
    this.setAttribute('tabindex', '0');

    this.addEventListener('contextmenu', (e) => e.preventDefault());

    this.addEventListener('mousedown', () => {
      this._wasFocused = document.activeElement === this;
    });

    this.addEventListener('click', (e) => {
      if (!this._wasFocused || this._isEditing) return;
      const path = e.composedPath();
      const onIcon = path.some(el => el.classList?.contains('mr-icon'));
      if (onIcon) {
        this.dispatchEvent(new CustomEvent('cell-click-status', { bubbles: true }));
      }
    });
  }

  get record() { return this._record; }
  get isEditing() { return this._isEditing; }
  get cellIndex() { return parseInt(this.dataset.index); }

  setRecord(record, isSynced = false, level = -1) {
    this._record = record;
    this._isSynced = isSynced;
    this._level = level;
    this._render();
  }

  _render() {
    if (!this._record) {
      this._empty.hidden = false;
      this._mrEl.hidden = true;
      return;
    }
    this._empty.hidden = true;
    this._mrEl.hidden = false;

    const level = this._level;
    const title = this._record.title;

    if (level === 0) {
      const prog = calcRootProgress(this._record);
      const progHtml = prog
        ? `<span class="mr-progress" title="${prog.done} / ${prog.total}">${prog.pct}%</span> `
        : '';
      this._mrEl.innerHTML = `<span class="mr-icon">🎯</span> ${progHtml}<span class="mr-title">${this._esc(title)}</span>`;
    } else if (level === 1) {
      const icon = STATUS_ICONS[this._record.status || 'na'] || '📄';
      const prog = calcProgress(this._record);
      const progHtml = prog
        ? `<span class="mr-progress" title="${prog.done} / ${prog.total}">${prog.pct}%</span> `
        : '';
      this._mrEl.innerHTML = `<span class="mr-icon">${icon}</span> ${progHtml}<span class="mr-title">${this._esc(title)}</span>`;
    } else if (level === 2) {
      const icon = STATUS_ICONS[this._record.status || 'na'] || '📄';
      this._mrEl.innerHTML = `<span class="mr-icon">${icon}</span> <span class="mr-title">${this._esc(title)}</span>`;
    } else {
      this._mrEl.innerHTML = `<span class="mr-title">${this._esc(title)}</span>`;
    }
  }

  _esc(str) {
    const d = document.createElement('span');
    d.textContent = str;
    return d.innerHTML;
  }

  startInlineEdit() {
    if (!this._record) return;
    this._isEditing = true;
    const original = this._record.title;
    const ta = document.createElement('textarea');
    ta.className = 'inline-edit';
    ta.value = original;

    this._mrEl.innerHTML = '';
    this._mrEl.appendChild(ta);
    ta.focus();
    ta.select();

    const finish = (save) => {
      this._isEditing = false;
      const newVal = ta.value.trim();
      if (save && newVal) {
        this._record.title = newVal;
        this.dispatchEvent(new CustomEvent('cell-change', { bubbles: true }));
      }
      this._render();
      this.focus();
    };

    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      e.stopPropagation();
    });
    ta.addEventListener('blur', () => finish(true));
  }
}