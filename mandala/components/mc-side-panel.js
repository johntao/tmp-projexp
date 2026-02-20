export default class McSidePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
:host {
  position: relative;
  display: block;
  width: 48px;
  min-width: 48px;
  overflow: visible;
  transition: width 0.2s, min-width 0.2s;
}
:host(.collapsed) {
  width: 0;
  min-width: 0;
}
.side-buttons {
  position: absolute;
  left: -32px;
  top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
}
.side-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  line-height: 22px;
  text-align: center;
  padding: 0;
  color: #666;
}
.side-btn:hover {
  background: #f0f0f0;
}
.panel-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 4px;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.panel-content button,
.panel-content select {
  display: block;
  width: 100%;
  padding: 6px 2px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 11px;
  font-family: monospace;
  text-align: center;
  box-sizing: border-box;
}
.panel-content button:hover,
.panel-content select:hover {
  background: #f5f5f5;
}
.section-label {
  font-size: 9px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  margin: 4px 0 0 0;
  padding: 0;
}
input[type="file"] { display: none; }
</style>
<div class="side-buttons">
  <button class="side-btn toggle-btn">◀</button>
  <button class="side-btn help-btn">?</button>
</div>
<div class="panel-content">
  <div class="section-label">File</div>
  <button class="btn-export" title="Export data to file">Save</button>
  <button class="btn-import" title="Import data from file">Load</button>
  <input type="file" class="file-input" accept=".md,.txt">
  <div class="section-label">Layout</div>
  <select class="layout-select" title="Keyboard layout">
    <option value="qwerty">QWE</option>
    <option value="dvorak">DVK</option>
  </select>
  <div class="section-label">Demo</div>
  <button class="btn-goal" title="Load goal planning demo">Goal</button>
  <button class="btn-task" title="Load task tracking demo">Task</button>
  <button class="btn-tpl" title="Load blank template">Tpl</button>
</div>
    `;
    this._expanded = true;
    this._toggleBtn = this.shadowRoot.querySelector('.toggle-btn');
    this._helpBtn = this.shadowRoot.querySelector('.help-btn');
    this._panelContent = this.shadowRoot.querySelector('.panel-content');
    this._fileInput = this.shadowRoot.querySelector('.file-input');
    this._layoutSelect = this.shadowRoot.querySelector('.layout-select');
    this._layoutSelect.value = localStorage.getItem('mandala-v6-keyboard') || 'qwerty';

    this._toggleBtn.addEventListener('click', () => this.toggle());
    this._helpBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('toggle-help', { bubbles: true }));
    });

    // File operations
    this.shadowRoot.querySelector('.btn-export').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('migration-export', { bubbles: true }));
    });
    this.shadowRoot.querySelector('.btn-import').addEventListener('click', () => this._fileInput.click());
    this._fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.dispatchEvent(new CustomEvent('migration-import', {
            bubbles: true,
            detail: { content: ev.target.result, fileName: file.name }
          }));
        };
        reader.readAsText(file);
      }
      this._fileInput.value = '';
    });

    // Keyboard layout
    this._layoutSelect.addEventListener('change', () => {
      localStorage.setItem('mandala-v6-keyboard', this._layoutSelect.value);
      this.dispatchEvent(new CustomEvent('keyboard-change', {
        bubbles: true,
        detail: { layout: this._layoutSelect.value }
      }));
    });

    // Demo data
    this.shadowRoot.querySelector('.btn-goal').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('load-sample', { bubbles: true, detail: { file: 'goal-01.txt' } }));
    });
    this.shadowRoot.querySelector('.btn-task').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('load-sample', { bubbles: true, detail: { file: 'task-01.txt' } }));
    });
    this.shadowRoot.querySelector('.btn-tpl').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('load-sample', { bubbles: true, detail: { file: 'tpl-01.txt' } }));
    });
  }

  expand() {
    this._expanded = true;
    this.classList.remove('collapsed');
    this._panelContent.style.display = '';
    this._toggleBtn.textContent = '◀';
  }

  collapse() {
    this._expanded = false;
    this.classList.add('collapsed');
    this._panelContent.style.display = 'none';
    this._toggleBtn.textContent = '▶';
  }

  toggle() {
    if (this._expanded) this.collapse();
    else this.expand();
  }
}
