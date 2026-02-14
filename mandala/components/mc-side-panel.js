export default class McSidePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
:host {
  display: block;
  width: 280px;
  min-width: 280px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  transition: width 0.2s, min-width 0.2s, opacity 0.2s;
}
:host(.collapsed) {
  width: 0;
  min-width: 0;
  border: none;
  opacity: 0;
  overflow: hidden;
}
.panel-content {
  padding: 16px;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
}
h3 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.section {
  margin-bottom: 18px;
}
.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #444;
}
.keys {
  min-width: 70px;
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}
kbd {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #ccc;
  font-family: monospace;
  font-size: 11px;
}
.key-grid {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 2px;
  margin-right: 4px;
}
.key-grid kbd {
  width: 20px;
  text-align: center;
  padding: 2px;
}
.toolbar-slot {
  padding-top: 12px;
  border-top: 1px solid #eee;
}
.demo-section {
  padding-top: 12px;
  border-top: 1px solid #eee;
  margin-top: 12px;
}
.demo-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.demo-buttons button {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  font-family: monospace;
}
.demo-buttons button:hover {
  background: #f5f5f5;
}
</style>
<div class="panel-content">
  <div class="section">
    <h3>Editing</h3>
    <div class="shortcut-list">
      <div class="shortcut-item"><div class="keys"><kbd>u</kbd></div><div>Create record / add child</div></div>
      <div class="shortcut-item"><div class="keys"><kbd>i</kbd></div><div>Inline edit title</div></div>
      <div class="shortcut-item"><div class="keys"><kbd>o</kbd> <kbd>Enter</kbd></div><div>Detail edit (modal)</div></div>
      <div class="shortcut-item"><div class="keys"><kbd>Del</kbd></div><div>Delete record</div></div>
      <div class="shortcut-item"><div class="keys"><kbd>y</kbd></div><div>Cycle status (lvl2: 📄→🟩→✅, lvl1: 📄→🎯)</div></div>
    </div>
  </div>
  <div class="section">
    <h3>Cell Walk</h3>
    <div class="shortcut-list">
      <div class="shortcut-item"><div class="keys"><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd></div><div>Move 1 cell</div></div>
      <div class="shortcut-item"><div class="keys"><kbd>H</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd></div><div>Move 3 cells</div></div>
    </div>
  </div>
  <div class="section">
    <h3>Inner Jump</h3>
    <div class="shortcut-list">
      <div class="shortcut-item">
        <div class="key-grid"><kbd>w</kbd><kbd>e</kbd><kbd>r</kbd><kbd>s</kbd><kbd>d</kbd><kbd>f</kbd><kbd>x</kbd><kbd>c</kbd><kbd>v</kbd></div>
        <div>Jump within current 3x3</div>
      </div>
    </div>
  </div>
  <div class="section">
    <h3>Outer Jump</h3>
    <div class="shortcut-list">
      <div class="shortcut-item">
        <div class="key-grid"><kbd>W</kbd><kbd>E</kbd><kbd>R</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd><kbd>X</kbd><kbd>C</kbd><kbd>V</kbd></div>
        <div>Jump across 3x3 blocks</div>
      </div>
    </div>
  </div>
  <div class="section">
    <h3>Other</h3>
    <div class="shortcut-list">
      <div class="shortcut-item"><div class="keys"><kbd>?</kbd></div><div>Toggle this panel</div></div>
      <div class="shortcut-item"><div class="keys"><kbd>Esc</kbd></div><div>Close popup / cancel edit</div></div>
    </div>
  </div>
  <div class="toolbar-slot">
    <slot></slot>
  </div>
  <div class="demo-section">
    <h3>Demo Data</h3>
    <div class="demo-buttons">
      <button class="btn-goal">Goal Demo</button>
      <button class="btn-task">Task Demo</button>
      <button class="btn-tpl">Template</button>
    </div>
  </div>
</div>
    `;
    this._expanded = true;

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
  }

  collapse() {
    this._expanded = false;
    this.classList.add('collapsed');
  }

  toggle() {
    if (this._expanded) this.collapse();
    else this.expand();
  }
}