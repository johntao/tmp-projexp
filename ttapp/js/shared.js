// ─── Data Layer ─────────────────────────────────────────────────────────────

export const Store = {
  _listeners: [],

  getTasksets() {
    try { return JSON.parse(localStorage.getItem('tt-tasksets')) || []; }
    catch { return []; }
  },
  setTasksets(tasksets) {
    localStorage.setItem('tt-tasksets', JSON.stringify(tasksets));
    this._notify();
  },

  getActiveTab() {
    try { return JSON.parse(localStorage.getItem('tt-active-tab')) || 0; }
    catch { return 0; }
  },
  setActiveTab(idx) {
    localStorage.setItem('tt-active-tab', JSON.stringify(idx));
    this._notify();
  },

  // Convenience: get tasks from active taskset
  getTasks() {
    const sets = this.getTasksets();
    const idx = this.getActiveTab();
    return (sets[idx] && sets[idx].tasks) || [];
  },
  setTasks(tasks) {
    const sets = this.getTasksets();
    const idx = this.getActiveTab();
    if (sets[idx]) {
      sets[idx].tasks = tasks;
      this.setTasksets(sets);
    }
  },

  getEntries() {
    try { return JSON.parse(localStorage.getItem('tt-entries')) || []; }
    catch { return []; }
  },
  setEntries(entries) {
    localStorage.setItem('tt-entries', JSON.stringify(entries));
    this._notify();
  },

  getCurrent() {
    try { return JSON.parse(localStorage.getItem('tt-current')); }
    catch { return null; }
  },
  setCurrent(entry) {
    localStorage.setItem('tt-current', JSON.stringify(entry));
    this._notify();
  },

  subscribe(fn) { this._listeners.push(fn); },
  _notify() { this._listeners.forEach(fn => fn()); }
};

export function getAvailableTasks(tasks) {
  return tasks;
}

export function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTime(epoch) {
  const d = new Date(epoch);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDate(epoch) {
  const d = new Date(epoch);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function truncate(str, max = 20) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

