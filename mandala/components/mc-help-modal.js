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
  width: 560px;
  max-width: 90vw;
  max-height: 80vh;
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
  margin: 14px 0 6px 0;
  font-size: 13px;
  font-weight: 600;
  color: #555;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
td {
  padding: 3px 0;
  vertical-align: top;
}
td:first-child {
  width: 140px;
  white-space: nowrap;
}
kbd {
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid #ccc;
  font-family: monospace;
  font-size: 11px;
}
p {
  margin: 6px 0;
}
.close-hint {
  text-align: center;
  padding: 8px;
  border-top: 1px solid #eee;
  font-size: 11px;
  color: #999;
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
<table>
  <tr><td>Root (center)</td><td>🎯 Always active, no status toggle</td></tr>
  <tr><td>Level 1 (sub-goals)</td><td>📄 NA → 🎯 Goal</td></tr>
  <tr><td>Level 2 (tasks)</td><td>📄 NA → 🟩 Now → ✅ Done</td></tr>
</table>

<h3>Editing</h3>
<table>
  <tr><td><kbd>u</kbd></td><td>Create record / add child</td></tr>
  <tr><td><kbd>i</kbd></td><td>Inline edit title</td></tr>
  <tr><td><kbd>o</kbd> / <kbd>Enter</kbd></td><td>Detail edit (modal)</td></tr>
  <tr><td><kbd>Del</kbd></td><td>Delete record</td></tr>
  <tr><td><kbd>y</kbd></td><td>Cycle status</td></tr>
</table>

<h3>Cell Walk</h3>
<table>
  <tr><td><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd> / Arrows</td><td>Move 1 cell</td></tr>
  <tr><td><kbd>H</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd></td><td>Move 3 cells</td></tr>
</table>

<h3>Inner Jump</h3>
<table>
  <tr><td><kbd>w</kbd><kbd>e</kbd><kbd>r</kbd><kbd>s</kbd><kbd>d</kbd><kbd>f</kbd><kbd>x</kbd><kbd>c</kbd><kbd>v</kbd></td><td>Jump within current 3×3 block</td></tr>
</table>

<h3>Outer Jump</h3>
<table>
  <tr><td><kbd>W</kbd><kbd>E</kbd><kbd>R</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd><kbd>X</kbd><kbd>C</kbd><kbd>V</kbd></td><td>Jump across 3×3 blocks</td></tr>
</table>

<h3>Mouse (focused cell only)</h3>
<table>
  <tr><td>Click status icon</td><td>Toggle status</td></tr>
  <tr><td>Click title</td><td>Inline edit</td></tr>
  <tr><td>Single click elsewhere</td><td>Open detail / create</td></tr>
  <tr><td>Double click</td><td>Create child</td></tr>
</table>

<h3>Other</h3>
<table>
  <tr><td><kbd>]</kbd></td><td>Toggle side panel</td></tr>
  <tr><td><kbd>?</kbd></td><td>Toggle this help</td></tr>
  <tr><td><kbd>Esc</kbd></td><td>Close popup / cancel edit</td></tr>
</table>
    `;
  }

  _zhContent() {
    return `
<h2>曼陀羅九宮格</h2>
<p>一個 9×9 的網格工具，用於目標分解與任務規劃。中心格是你的核心目標，周圍有 8 個子目標，每個子目標下又有 8 個行動項目。</p>

<h3>層級與狀態</h3>
<table>
  <tr><td>根節點（中心）</td><td>🎯 始終啟用，無狀態切換</td></tr>
  <tr><td>第一層（子目標）</td><td>📄 未啟用 → 🎯 目標</td></tr>
  <tr><td>第二層（任務）</td><td>📄 未啟用 → 🟩 進行中 → ✅ 完成</td></tr>
</table>

<h3>編輯</h3>
<table>
  <tr><td><kbd>u</kbd></td><td>新增紀錄 / 新增子項</td></tr>
  <tr><td><kbd>i</kbd></td><td>行內編輯標題</td></tr>
  <tr><td><kbd>o</kbd> / <kbd>Enter</kbd></td><td>詳細編輯（彈窗）</td></tr>
  <tr><td><kbd>Del</kbd></td><td>刪除紀錄</td></tr>
  <tr><td><kbd>y</kbd></td><td>切換狀態</td></tr>
</table>

<h3>格子移動</h3>
<table>
  <tr><td><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd> / 方向鍵</td><td>移動 1 格</td></tr>
  <tr><td><kbd>H</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd></td><td>移動 3 格</td></tr>
</table>

<h3>區內跳轉</h3>
<table>
  <tr><td><kbd>w</kbd><kbd>e</kbd><kbd>r</kbd><kbd>s</kbd><kbd>d</kbd><kbd>f</kbd><kbd>x</kbd><kbd>c</kbd><kbd>v</kbd></td><td>在當前 3×3 區塊內跳轉</td></tr>
</table>

<h3>區間跳轉</h3>
<table>
  <tr><td><kbd>W</kbd><kbd>E</kbd><kbd>R</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd><kbd>X</kbd><kbd>C</kbd><kbd>V</kbd></td><td>跨 3×3 區塊跳轉</td></tr>
</table>

<h3>滑鼠操作（僅限已聚焦的格子）</h3>
<table>
  <tr><td>點擊狀態圖示</td><td>切換狀態</td></tr>
  <tr><td>點擊標題</td><td>行內編輯</td></tr>
  <tr><td>單擊其他區域</td><td>開啟詳細 / 新增</td></tr>
  <tr><td>雙擊</td><td>新增子項</td></tr>
</table>

<h3>其他</h3>
<table>
  <tr><td><kbd>]</kbd></td><td>切換側面板</td></tr>
  <tr><td><kbd>?</kbd></td><td>切換此說明</td></tr>
  <tr><td><kbd>Esc</kbd></td><td>關閉彈窗 / 取消編輯</td></tr>
</table>
    `;
  }
}
