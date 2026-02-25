import { Store } from "./shared.js";

// ─── <tt-app> ───────────────────────────────────────────────────────────────
export class TtApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._selectedTask = null;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: flex; flex-direction: column; height: 100vh; width: 100%; }
      </style>
      <tt-toolbar></tt-toolbar>
      <tt-trigger-widget></tt-trigger-widget>
      <tt-history></tt-history>
      <tt-ring-menu></tt-ring-menu>
      <tt-modal id="modal-config"><tt-config></tt-config></tt-modal>
      <tt-modal id="modal-help"><tt-help></tt-help></tt-modal>
      <tt-modal id="modal-edit"><tt-entry-edit></tt-entry-edit></tt-modal>
      <tt-toast></tt-toast>
    `;

    this._toolbar = this.shadowRoot.querySelector('tt-toolbar');
    this._trigger = this.shadowRoot.querySelector('tt-trigger-widget');
    this._history = this.shadowRoot.querySelector('tt-history');
    this._ringMenu = this.shadowRoot.querySelector('tt-ring-menu');
    this._configModal = this.shadowRoot.getElementById('modal-config');
    this._helpModal = this.shadowRoot.getElementById('modal-help');
    this._editModal = this.shadowRoot.getElementById('modal-edit');
    this._config = this.shadowRoot.querySelector('tt-config');
    this._entryEdit = this.shadowRoot.querySelector('tt-entry-edit');
    this._toast = this.shadowRoot.querySelector('tt-toast');

    this.shadowRoot.addEventListener('ring-menu-open', () => {
      if (Store.getCurrent()) return; // block while tracking
      const available = Store.getTasks();
      this._ringMenu.show(available);
      this._trigger._ringMenu = this._ringMenu;  // allow trigger to forward pointer events
    });

    this.shadowRoot.addEventListener('task-selected', e => {
      this._selectedTask = e.detail.task;
      this._trigger.selectedTask = this._selectedTask;
      // Auto-start tracking on task selection
      this._startTracking();
    });

    this.shadowRoot.addEventListener('tracking-start', () => this._startTracking());
    this.shadowRoot.addEventListener('tracking-stop', () => this._stopTracking());
    this.shadowRoot.addEventListener('tracking-discard', () => this._discardTracking());
    this.shadowRoot.addEventListener('tracking-merge', () => this._mergeTracking());

    this.shadowRoot.addEventListener('open-config', () => {
      this._config.load();
      this._configModal.open();
    });
    this.shadowRoot.addEventListener('open-help', () => this._helpModal.open());

    this.shadowRoot.addEventListener('entry-edit', e => {
      const entry = Store.getEntries().find(en => en.uuid === e.detail.uuid);
      if (entry) {
        this._entryEdit.entry = entry;
        this._editModal.open();
      }
    });

    this.shadowRoot.addEventListener('entry-delete', e => {
      const allEntries = Store.getEntries();
      const deleted = allEntries.find(en => en.uuid === e.detail.uuid);
      const entries = allEntries.filter(en => en.uuid !== e.detail.uuid);
      Store.setEntries(entries);
      this._refreshState();
      if (deleted) {
        this._toast.show('Entry deleted.', {
          undo: () => {
            const cur = Store.getEntries();
            cur.push(deleted);
            Store.setEntries(cur);
            this._refreshState();
          }
        });
      }
    });

    this.shadowRoot.addEventListener('entry-save', e => {
      const updated = e.detail.entry;
      const entries = Store.getEntries().map(en => en.uuid === updated.uuid ? updated : en);
      Store.setEntries(entries);
      this._editModal.close();
      this._refreshState();
    });

    this.shadowRoot.addEventListener('entry-edit-cancel', () => {
      this._editModal.close();
    });

    this.shadowRoot.addEventListener('show-toast', e => {
      this._toast.show(e.detail.message, { undo: e.detail.undo });
    });

    Store.subscribe(() => this._refreshState());

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  connectedCallback() {
    this._refreshState();
  }

  _refreshState() {
    const entries = Store.getEntries();
    const current = Store.getCurrent();

    this._history.entries = entries;

    const tracking = !!current;
    const showMerge = tracking && this._shouldShowMerge(current, entries);

    this._trigger.trackingState = { tracking, currentEntry: current, showMerge };
    this._trigger._notified = false;

    if (current && !this._selectedTask) {
      const task = Store.getTasks().find(t => t.name === current.taskName);
      if (task) {
        this._selectedTask = task;
        this._trigger.selectedTask = task;
      }
    }
  }

  _shouldShowMerge(current, entries) {
    if (!current) return false;
    const sorted = [...entries].sort((a, b) => b.startTime - a.startTime);
    const prev = sorted[0];
    return prev && prev.taskName === current.taskName;
  }

  _startTracking() {
    if (!this._selectedTask) return;
    Store.setCurrent({ taskName: this._selectedTask.name, startTime: Date.now() });
    this._trigger._notified = false;
    this._refreshState();
  }

  _stopTracking() {
    const current = Store.getCurrent();
    if (!current) return;
    const entries = Store.getEntries();
    entries.push({ uuid: crypto.randomUUID(), taskName: current.taskName, startTime: current.startTime, endTime: Date.now(), description: '' });
    Store.setEntries(entries);
    Store.setCurrent(null);
    // Keep selected task loaded (don't clear this._selectedTask)
    this._refreshState();
  }

  _discardTracking() {
    Store.setCurrent(null);
    // Keep selected task loaded (don't clear this._selectedTask)
    this._refreshState();
  }

  _mergeTracking() {
    const current = Store.getCurrent();
    if (!current) return;
    const entries = Store.getEntries();
    const sorted = [...entries].sort((a, b) => b.startTime - a.startTime);
    const prev = sorted[0];
    if (prev && prev.taskName === current.taskName) {
      // Keep running task, adopt previous entry's start time, delete previous entry
      current.startTime = prev.startTime;
      Store.setCurrent(current);
      Store.setEntries(entries.filter(e => e.uuid !== prev.uuid));
      this._refreshState();
    }
  }
}
