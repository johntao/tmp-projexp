// ─── Data Layer ─────────────────────────────────────────────────────────────

export const Store = {
  _listeners: [],

  getTasks() {
    try { return JSON.parse(localStorage.getItem('tt-tasks')) || []; }
    catch { return []; }
  },
  setTasks(tasks) {
    localStorage.setItem('tt-tasks', JSON.stringify(tasks));
    this._notify();
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

export const TIME_SEGMENTS = [
  { id: 'seg0', label: 'night',     ranges: [[0, 6], [22, 24]] },
  { id: 'seg1', label: 'morning',   ranges: [[6, 10]] },
  { id: 'seg2', label: 'midday',    ranges: [[10, 14]] },
  { id: 'seg3', label: 'afternoon', ranges: [[14, 18]] },
  { id: 'seg4', label: 'evening',   ranges: [[18, 22]] },
];

function getCurrentSegment() {
  const hour = new Date().getHours();
  return TIME_SEGMENTS.find(seg => seg.ranges.some(([s, e]) => hour >= s && hour < e));
}

export function getAvailableTasks(tasks) {
  const seg = getCurrentSegment();
  if (!seg) return tasks;
  return tasks.filter(t => !t.timesegs || t.timesegs.length === 0 || t.timesegs.includes(seg.id));
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

