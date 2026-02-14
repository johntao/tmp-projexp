export default class McModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
dialog { border: none; border-radius: 6px; padding: 20px; width: 360px; max-height: 80vh; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
dialog::backdrop { background: rgba(0,0,0,0.3); }
h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; }
label { display: block; font-size: 13px; color: #555; margin-bottom: 4px; }
input, textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; font-family: inherit; box-sizing: border-box; }
textarea { resize: vertical; min-height: 60px; }
select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; font-family: inherit; box-sizing: border-box; }
select:focus { outline: none; border-color: #0066cc; }
input:focus, textarea:focus { outline: none; border-color: #0066cc; }
input.error { border-color: #cc0000; }
.field { margin-bottom: 12px; }
.error-msg { color: #cc0000; font-size: 12px; margin-top: 4px; display: none; }
.error-msg.visible { display: block; }
.child-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
.child-section[hidden] { display: none; }
.child-section h4 { margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #555; }
.child-list { list-style: none; margin: 0; padding: 0; max-height: 150px; overflow-y: auto; }
.child-item { display: flex; align-items: center; padding: 6px 8px; background: #f5f5f5; border-radius: 4px; margin-bottom: 4px; cursor: grab; font-size: 13px; }
.child-item:active { cursor: grabbing; }
.child-item.dragging { opacity: 0.5; }
.child-item .handle { margin-right: 8px; color: #999; }
.child-item .title { flex: 1; }
.child-item .blank-title { color: #bbb; font-style: italic; }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.actions button { padding: 6px 14px; border-radius: 4px; font-size: 14px; cursor: pointer; }
.btn-cancel { background: #f0f0f0; border: 1px solid #ccc; }
.btn-confirm { background: #0066cc; border: 1px solid #0066cc; color: #fff; }
</style>
<dialog>
<h3 class="modal-title">Create Record</h3>
<div class="field">
  <label>Title *</label>
  <input type="text" class="input-title" placeholder="Enter title">
  <div class="error-msg">Title cannot be blank</div>
</div>
<div class="field">
  <label>Description</label>
  <textarea class="input-desc" placeholder="Enter description (optional)"></textarea>
</div>
<div class="field field-status" hidden>
  <label>Status</label>
  <select class="input-status">
    <option value="na">na</option>
    <option value="now">now</option>
    <option value="done">done</option>
  </select>
</div>
<div class="child-section" hidden>
  <h4>Childnodes (drag to reorder)</h4>
  <ul class="child-list"></ul>
</div>
<div class="actions">
  <button type="button" class="btn-cancel">Cancel</button>
  <button type="button" class="btn-confirm">Confirm</button>
</div>
</dialog>
    `;
    this._dialog = this.shadowRoot.querySelector('dialog');
    this._modalTitle = this.shadowRoot.querySelector('.modal-title');
    this._inputTitle = this.shadowRoot.querySelector('.input-title');
    this._inputDesc = this.shadowRoot.querySelector('.input-desc');
    this._errorMsg = this.shadowRoot.querySelector('.error-msg');
    this._childSection = this.shadowRoot.querySelector('.child-section');
    this._childList = this.shadowRoot.querySelector('.child-list');
    this._statusField = this.shadowRoot.querySelector('.field-status');
    this._inputStatus = this.shadowRoot.querySelector('.input-status');
    this._cancelBtn = this.shadowRoot.querySelector('.btn-cancel');
    this._confirmBtn = this.shadowRoot.querySelector('.btn-confirm');
    this._mode = null;
    this._children = [];
    this._draggedItem = null;
    this._boundKeydown = this._onKeydown.bind(this);

    this._cancelBtn.addEventListener('click', () => this.close());
    this._confirmBtn.addEventListener('click', () => this._confirm());
    this._inputTitle.addEventListener('input', () => this._clearError());
    this._dialog.addEventListener('close', () => {
      document.removeEventListener('keydown', this._boundKeydown, true);
    });
    this._childList.addEventListener('dragstart', (e) => this._onDragStart(e));
    this._childList.addEventListener('dragover', (e) => this._onDragOver(e));
    this._childList.addEventListener('dragend', () => this._onDragEnd());
  }

  get isOpen() { return this._dialog.open; }

  open(mode, data = {}) {
    this._mode = mode;
    this._clearError();
    this._inputTitle.value = data.title || '';
    this._inputDesc.value = data.description || '';
    this._modalTitle.textContent = data.modalTitle || 'Record';
    if (data.hideStatus) {
      this._statusField.hidden = true;
    } else {
      this._statusField.hidden = false;
      // Rebuild options if statusOptions provided
      if (data.statusOptions) {
        this._inputStatus.innerHTML = '';
        for (const st of data.statusOptions) {
          const opt = document.createElement('option');
          opt.value = st;
          opt.textContent = st;
          this._inputStatus.appendChild(opt);
        }
      } else {
        this._inputStatus.innerHTML = '<option value="na">na</option><option value="now">now</option><option value="done">done</option>';
      }
      this._inputStatus.value = data.status || 'na';
    }
    if (mode === 'update' && data.children && data.children.length > 0) {
      this._children = data.children.map(c => c ? { ...c } : null);
      this._renderChildList();
      this._childSection.hidden = false;
    } else {
      this._children = [];
      this._childSection.hidden = true;
    }
    document.addEventListener('keydown', this._boundKeydown, true);
    this._dialog.showModal();
    this._inputTitle.focus();
  }

  close() {
    this._dialog.close();
    this.dispatchEvent(new CustomEvent('modal-close'));
  }

  _onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation(); this.close();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      const active = this.shadowRoot.activeElement || document.activeElement;
      if (active?.tagName !== 'TEXTAREA') {
        e.preventDefault(); e.stopPropagation(); this._confirm();
      }
    }
  }

  _confirm() {
    const title = this._inputTitle.value.trim();
    if (!title) {
      this._errorMsg.classList.add('visible');
      this._inputTitle.classList.add('error');
      this._inputTitle.focus();
      this.dispatchEvent(new CustomEvent('modal-validation-error', { detail: { message: 'Title cannot be blank' } }));
      return;
    }
    const detail = { mode: this._mode, title, description: this._inputDesc.value.trim(), status: this._inputStatus.value };
    if (this._mode === 'update') detail.children = this._children;
    this._dialog.close();
    this.dispatchEvent(new CustomEvent('modal-confirm', { detail }));
  }

  _clearError() {
    this._errorMsg.classList.remove('visible');
    this._inputTitle.classList.remove('error');
  }

  _renderChildList() {
    this._childList.innerHTML = '';
    this._children.forEach((child, i) => {
      const li = document.createElement('li');
      li.className = 'child-item';
      li.draggable = true;
      li.dataset.index = i;
      if (child) {
        li.innerHTML = `<span class="handle">\u2807</span><span class="title">${this._esc(child.title)}</span>`;
      } else {
        li.innerHTML = `<span class="handle">\u2807</span><span class="title blank-title">[blank node]</span>`;
      }
      this._childList.appendChild(li);
    });
  }

  _esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

  _onDragStart(e) {
    if (!e.target.classList.contains('child-item')) return;
    this._draggedItem = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  _onDragOver(e) {
    e.preventDefault();
    if (!this._draggedItem) return;
    const target = e.target.closest('.child-item');
    if (!target || target === this._draggedItem) return;
    const items = [...this._childList.querySelectorAll('.child-item')];
    const dIdx = items.indexOf(this._draggedItem);
    const tIdx = items.indexOf(target);
    if (dIdx < tIdx) target.after(this._draggedItem);
    else target.before(this._draggedItem);
  }

  _onDragEnd() {
    if (!this._draggedItem) return;
    this._draggedItem.classList.remove('dragging');
    const items = [...this._childList.querySelectorAll('.child-item')];
    this._children = items.map(item => this._children[parseInt(item.dataset.index)]);
    this._renderChildList();
    this._draggedItem = null;
  }
}