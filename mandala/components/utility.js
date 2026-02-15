export const JUMP_KEYS = {
  'w': [0, 0], 'e': [0, 1], 'r': [0, 2],
  's': [1, 0], 'd': [1, 1], 'f': [1, 2],
  'x': [2, 0], 'c': [2, 1], 'v': [2, 2],
  'W': [0, 0], 'E': [0, 1], 'R': [0, 2],
  'S': [1, 0], 'D': [1, 1], 'F': [1, 2],
  'X': [2, 0], 'C': [2, 1], 'V': [2, 2]
};

export const HJKL_MAP = {
  'h': [0, -1],
  'j': [1, 0],
  'k': [-1, 0],
  'l': [0, 1],
  'ArrowLeft': [0, -1],
  'ArrowDown': [1, 0],
  'ArrowUp': [-1, 0],
  'ArrowRight': [0, 1]
};

export const HJKL_MAP_FAST = {
  'H': [0, -3],
  'J': [3, 0],
  'K': [-3, 0],
  'L': [0, 3]
};

export function positionToIndex(mgRow, mgCol, sgRow, sgCol) {
  const row = mgRow * 3 + sgRow;
  const col = mgCol * 3 + sgCol;
  return row * 9 + col;
}

export function indexToPosition(index) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  return {
    mgRow: Math.floor(row / 3),
    mgCol: Math.floor(col / 3),
    sgRow: row % 3,
    sgCol: col % 3
  };
}

export const STATUSES = ['na', 'now', 'done'];
export const LVL1_STATUSES = ['na', 'goal'];

export function calcProgress(record) {
  const children = (record.children || []).filter(c => c !== null);
  const active = children.filter(c => (c.status || 'na') !== 'na');
  if (active.length === 0) return null;
  const doneCount = active.filter(c => (c.status || 'na') === 'done').length;
  return { pct: Math.round(doneCount / active.length * 100), done: doneCount, total: active.length };
}

export function calcRootProgress(root) {
  let done = 0, total = 0;
  for (const child of (root.children || [])) {
    if (!child) continue;
    for (const gc of (child.children || [])) {
      if (!gc) continue;
      const st = gc.status || 'na';
      if (st !== 'na') {
        total++;
        if (st === 'done') done++;
      }
    }
  }
  if (total === 0) return null;
  return { pct: Math.round(done / total * 100), done, total };
}

export function nextStatus(current) {
  const i = STATUSES.indexOf(current || 'na');
  return STATUSES[(i + 1) % STATUSES.length];
}

export function nextLvl1Status(current) {
  const i = LVL1_STATUSES.indexOf(current || 'na');
  return LVL1_STATUSES[(i + 1) % LVL1_STATUSES.length];
}

export const DVORAK_TO_QWERTY = {
  'g': 'u', 'c': 'i', 'r': 'o', 'f': 'y',
  'h': 'h', 't': 'j', 'n': 'k', 's': 'l',
  ',': 'w', '.': 'e', 'p': 'r', 'o': 's', 'e': 'd', 'u': 'f', 'q': 'x', 'j': 'c', 'k': 'v',
  '<': 'W', '>': 'E', 'P': 'R', 'O': 'S', 'E': 'D', 'U': 'F', 'Q': 'X', 'J': 'C', 'K': 'V',
  'G': 'U', 'F': 'Y', 'T': 'J', 'N': 'K',
  'Z': '?',
  '=': ']'
};