export default class McHelpModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._lang = navigator.language?.startsWith('zh') ? 'zh' : 'en';

    this.shadowRoot.innerHTML = `
<style>
:host { display: none; }
:host(.open) { display: block; }
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.dialog {
  background: #fff;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.tab-bar {
  display: flex;
  border-bottom: 1px solid #ddd;
  padding: 0 16px;
}
.tab {
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #888;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tab.active {
  color: #333;
  border-bottom-color: #333;
}
.tab:hover:not(.active) {
  color: #555;
}
.content {
  padding: 20px 24px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}
h2 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 700;
}
h3 {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
h3 {
  margin-block: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
}
p {
  margin: 6px 0;
}
.keys {
  min-width: 100px;
  display: flex;
  gap: 3px;
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
  max-width: fit-content;
}
.key-grid kbd {
  width: 20px;
  text-align: center;
  padding: 2px;
}
.close-hint {
  text-align: center;
  padding: 8px;
  border-top: 1px solid #eee;
  font-size: 11px;
  color: #999;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3px;
  align-items: center;
}
.crud {
  grid-column:1/3;
}
@media (max-height: 920px) {
  .desktop {
    display: none;
  }
}
</style>
<div class="overlay">
  <div class="dialog">
    <div class="tab-bar">
      <button class="tab" data-lang="en">English</button>
      <button class="tab" data-lang="zh">中文</button>
    </div>
    <div class="content"></div>
    <div class="close-hint">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</div>
  </div>
</div>
    `;

    this._overlay = this.shadowRoot.querySelector('.overlay');
    this._content = this.shadowRoot.querySelector('.content');
    this._tabs = this.shadowRoot.querySelectorAll('.tab');

    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    this._tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this._lang = tab.dataset.lang;
        this._renderContent();
      });
    });
  }

  get isOpen() { return this._isOpen; }

  open() {
    this._isOpen = true;
    this.classList.add('open');
    this._renderContent();
  }

  close() {
    this._isOpen = false;
    this.classList.remove('open');
  }

  toggle() {
    if (this._isOpen) this.close();
    else this.open();
  }

  _renderContent() {
    this._tabs.forEach(t => t.classList.toggle('active', t.dataset.lang === this._lang));
    this._content.innerHTML = this._lang === 'zh' ? this._zhContent() : this._enContent();
  }

  _enContent() {
    return `
<h2>Mandala Chart</h2>
<p>A 9×9 grid tool for goal decomposition and task planning. The center cell is your root goal, surrounded by 8 sub-goals, each with 8 action items.</p>

<h3>Levels & Status</h3>
<div class="grid">
  <div class="keys">Root (center)</div><div>🎯 Always active, no status toggle</div>
  <div class="keys">Level 1 (sub-goals)</div><div>📄 NA → 🎯 Goal</div>
  <div class="keys">Level 2 (tasks)</div><div>📄 NA → 🟩 Now → ✅ Done</div>
</div>

<h3>Ring Menu</h3>
<div class="grid">
  <div class="crud">💡 Create &nbsp; 🔍 Detail &nbsp; 📝 Inline &nbsp; 🗑 Delete</div>
  <div class="keys">Click status icon</div><div>Toggle status 📄 🎯 🟩 ✅</div>
  <div class="keys">Hold + drag</div><div>Swipe to fire command (big screen)</div>
  <div class="keys">Click cell</div><div>Open ring menu (small screen)</div>
</div>

<h3>Side Panel</h3>
<div class="grid">
  <div class="keys">Save / Load</div><div>Export or import data as text file</div>
  <div class="keys">Goal / Task / Tpl</div><div>Load demo data or blank template</div>
  <div class="keys">QWE / DVK</div><div>Switch keyboard layout (QWERTY / Dvorak)</div>
</div>

<div class="desktop">
<h3>Editing</h3>
<div class="grid">
  <div class="keys"><kbd>u</kbd></div><div>Create record / add child</div>
  <div class="keys"><kbd>i</kbd></div><div>Inline edit title</div>
  <div class="keys"><kbd>o</kbd> <kbd>Enter</kbd></div><div>Detail edit (modal)</div>
  <div class="keys"><kbd>Del</kbd></div><div>Delete record</div>
  <div class="keys"><kbd>y</kbd></div><div>Cycle status</div>
</div>

<h3>Cell Walk</h3>
<div class="grid">
  <div class="keys"><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd></div><div>Move 1 cell</div>
  <div class="keys"><kbd>⬅</kbd><kbd>⬇</kbd><kbd>⬆</kbd><kbd>➡</kbd></div><div>Move 1 cell</div>
  <div class="keys"><kbd>H</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd></div><div>Move 3 cells</div>
</div>

<h3>Inner Jump</h3>
<div class="grid">
  <div class="key-grid"><kbd>w</kbd><kbd>e</kbd><kbd>r</kbd><kbd>s</kbd><kbd>d</kbd><kbd>f</kbd><kbd>x</kbd><kbd>c</kbd><kbd>v</kbd></div>
  <div>Jump within current 3×3 block</div>
</div>

<h3>Outer Jump</h3>
<div class="grid">
  <div class="key-grid"><kbd>W</kbd><kbd>E</kbd><kbd>R</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd><kbd>X</kbd><kbd>C</kbd><kbd>V</kbd></div>
  <div>Jump across 3×3 blocks</div>
</div>
<h3>Other</h3>
<div class="grid">
<div class="keys"><kbd>]</kbd></div><div>Toggle side panel</div>
<div class="keys"><kbd>?</kbd></div><div>Toggle this help</div>
<div class="keys"><kbd>Esc</kbd></div><div>Close popup / cancel edit</div>
</div>
</div>
    `;
  }

  _zhContent() {
    return `
<h2>曼陀羅九宮格</h2>
<p>一個 9×9 的網格工具，用於目標分解與任務規劃。中心格是你的核心目標，周圍有 8 個子目標，每個子目標下又有 8 個行動項目。</p>

<h3>層級與狀態</h3>
<div class="grid">
  <div class="keys">根節點（中心）</div><div>🎯 始終啟用，無狀態切換</div>
  <div class="keys">第一層（子目標）</div><div>📄 未啟用 → 🎯 目標</div>
  <div class="keys">第二層（任務）</div><div>📄 未啟用 → 🟩 進行中 → ✅ 完成</div>
</div>

<h3>環形選單</h3>
<div class="grid">
  <div class="crud">💡 新增 &nbsp; 🔍 詳細 &nbsp; 📝 行內 &nbsp; 🗑 刪除</div>
  <div class="keys">點擊狀態圖示</div><div>切換狀態 📄 🎯 🟩 ✅</div>
  <div class="keys">按住 + 拖曳</div><div>滑動觸發指令（大螢幕）</div>
  <div class="keys">點擊格子</div><div>開啟環形選單（小螢幕）</div>
</div>

<h3>側面板</h3>
<div class="grid">
  <div class="keys">Save / Load</div><div>匯出或匯入資料為文字檔</div>
  <div class="keys">Goal / Task / Tpl</div><div>載入範例資料或空白模板</div>
  <div class="keys">QWE / DVK</div><div>切換鍵盤佈局（QWERTY / Dvorak）</div>
</div>

<div class="desktop">
<h3>編輯</h3>
<div class="grid">
  <div class="keys"><kbd>u</kbd></div><div>新增紀錄 / 新增子項</div>
  <div class="keys"><kbd>i</kbd></div><div>行內編輯標題</div>
  <div class="keys"><kbd>o</kbd> <kbd>Enter</kbd></div><div>詳細編輯（彈窗）</div>
  <div class="keys"><kbd>Del</kbd></div><div>刪除紀錄</div>
  <div class="keys"><kbd>y</kbd></div><div>切換狀態</div>
</div>

<h3>格子移動</h3>
<div class="grid">
  <div class="keys"><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd></div><div>移動 1 格</div>
  <div class="keys"><kbd>⬅</kbd><kbd>⬇</kbd><kbd>⬆</kbd><kbd>➡</kbd></div><div>移動 1 格</div>
  <div class="keys"><kbd>H</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd></div><div>移動 3 格</div>
</div>

<h3>區內跳轉</h3>
<div class="grid">
  <div class="key-grid"><kbd>w</kbd><kbd>e</kbd><kbd>r</kbd><kbd>s</kbd><kbd>d</kbd><kbd>f</kbd><kbd>x</kbd><kbd>c</kbd><kbd>v</kbd></div>
  <div>在當前 3×3 區塊內跳轉</div>
</div>

<h3>區間跳轉</h3>
<div class="grid">
  <div class="key-grid"><kbd>W</kbd><kbd>E</kbd><kbd>R</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd><kbd>X</kbd><kbd>C</kbd><kbd>V</kbd></div>
  <div>跨 3×3 區塊跳轉</div>
</div>

<h3>其他</h3>
<div class="grid">
<div class="keys"><kbd>]</kbd></div><div>切換側面板</div>
<div class="keys"><kbd>?</kbd></div><div>切換此說明</div>
<div class="keys"><kbd>Esc</kbd></div><div>關閉彈窗 / 取消編輯</div>
</div>
</div>
    `;
  }
}
