/**
 * VIM Keys Game - Level Data
 * This file defines all game levels: demo levels, predefined levels, and dynamic level generation
 */

const LEVELS = {
  // Demo levels - always playable, no scoring
  demo: [
    {
      id: 'demo_1',
      name: 'Demo 1: Coins',
      type: 'demo',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 4, col: 4 },
      items: [
        { type: 'coinGreen', row: 2, col: 2 },
        { type: 'coinGreen', row: 2, col: 7 },
        { type: 'coinGreen', row: 7, col: 2 },
        { type: 'coinGreen', row: 7, col: 7 },
        { type: 'coinGreen', row: 5, col: 5 },
      ]
    },
    {
      id: 'demo_2',
      name: 'Demo 2: Coins + Sigils',
      type: 'demo',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 4, col: 4 },
      items: [
        { type: 'coinGreen', row: 1, col: 1 },
        { type: 'coinGreen', row: 1, col: 8 },
        { type: 'coinGreen', row: 8, col: 1 },
        { type: 'coinGreen', row: 8, col: 8 },
        { type: 'sigil', letter: 'a', row: 0, col: 0 },
        { type: 'sigil', letter: 'a', row: 9, col: 9 },
        { type: 'sigil', letter: 's', row: 2, col: 5 },
        { type: 'sigil', letter: 's', row: 7, col: 5 },
        { type: 'sigil', letter: 'd', row: 3, col: 3 },
        { type: 'sigil', letter: 'd', row: 6, col: 6 },
        { type: 'sigil', letter: 'f', row: 1, col: 4 },
        { type: 'sigil', letter: 'f', row: 8, col: 4 },
      ]
    },
    {
      id: 'demo_3',
      name: 'Demo 3: Coins + Portals + Obstacles',
      type: 'demo',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 4, col: 4 },
      items: [
        { type: 'coinGreen', row: 1, col: 1 },
        { type: 'coinGreen', row: 1, col: 8 },
        { type: 'coinGreen', row: 8, col: 1 },
        { type: 'coinGreen', row: 8, col: 8 },
        { type: 'obstacle', row: 3, col: 3 },
        { type: 'obstacle', row: 3, col: 6 },
        { type: 'obstacle', row: 6, col: 3 },
        { type: 'obstacle', row: 6, col: 6 },
        { type: 'obstacle', row: 5, col: 4 },
        { type: 'portal', pairId: 1, row: 0, col: 0 },
        { type: 'portal', pairId: 1, row: 9, col: 9 },
        { type: 'portal', pairId: 2, row: 0, col: 9 },
        { type: 'portal', pairId: 2, row: 9, col: 0 },
      ]
    },
    {
      id: 'demo_4',
      name: 'Demo 4: All Items',
      type: 'demo',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 4, col: 4 },
      items: [
        { type: 'coinGreen', row: 2, col: 2 },
        { type: 'coinGreen', row: 2, col: 7 },
        { type: 'coinGreen', row: 7, col: 2 },
        { type: 'coinGreen', row: 7, col: 7 },
        { type: 'obstacle', row: 4, col: 2 },
        { type: 'obstacle', row: 4, col: 7 },
        { type: 'obstacle', row: 2, col: 4 },
        { type: 'obstacle', row: 7, col: 4 },
        { type: 'portal', pairId: 1, row: 0, col: 4 },
        { type: 'portal', pairId: 1, row: 9, col: 4 },
        { type: 'sigil', letter: 'a', row: 1, col: 1 },
        { type: 'sigil', letter: 'a', row: 8, col: 8 },
        { type: 'sigil', letter: 's', row: 3, col: 5 },
        { type: 'sigil', letter: 's', row: 6, col: 5 },
        { type: 'sigil', letter: 'd', row: 0, col: 2 },
        { type: 'sigil', letter: 'd', row: 9, col: 7 },
        { type: 'sigil', letter: 'f', row: 1, col: 5 },
        { type: 'sigil', letter: 'f', row: 8, col: 5 },
      ]
    }
  ],

  // Predefined levels - fixed layouts with all mechanics
  predefined: [
    {
      id: 'level_1',
      name: 'Level 1',
      type: 'predefined',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 0, col: 0 },
      items: [
        { type: 'coinGreen', row: 2, col: 2 },
        { type: 'coinGreen', row: 2, col: 7 },
        { type: 'coinGreen', row: 7, col: 2 },
        { type: 'coinGreen', row: 7, col: 7 },
        { type: 'coinGreen', row: 5, col: 5 },
      ]
    },
    {
      id: 'level_2',
      name: 'Level 2',
      type: 'predefined',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 5, col: 5 },
      items: [

        { type: 'coinGreen', row: 1, col: 1 },
        { type: 'coinGreen', row: 1, col: 8 },
        { type: 'coinGreen', row: 8, col: 1 },
        { type: 'coinGreen', row: 8, col: 8 },
        { type: 'sigil', letter: 'a', row: 0, col: 0 },
        { type: 'sigil', letter: 'a', row: 9, col: 9 },
        { type: 'sigil', letter: 's', row: 2, col: 5 },
        { type: 'sigil', letter: 's', row: 7, col: 5 },
        { type: 'sigil', letter: 'd', row: 3, col: 3 },
        { type: 'sigil', letter: 'd', row: 6, col: 6 },
        { type: 'sigil', letter: 'f', row: 1, col: 4 },
        { type: 'sigil', letter: 'f', row: 8, col: 4 },
      ]
    },
    {
      id: 'level_3',
      name: 'Level 3',
      type: 'predefined',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 9, col: 9 },
      items: [
        { type: 'coinGreen', row: 1, col: 1 },
        { type: 'coinGreen', row: 1, col: 8 },
        { type: 'coinGreen', row: 8, col: 1 },
        { type: 'coinGreen', row: 8, col: 8 },
        { type: 'obstacle', row: 3, col: 3 },
        { type: 'obstacle', row: 3, col: 6 },
        { type: 'obstacle', row: 6, col: 3 },
        { type: 'obstacle', row: 6, col: 6 },
        { type: 'obstacle', row: 5, col: 4 },
        { type: 'portal', pairId: 1, row: 0, col: 0 },
        { type: 'portal', pairId: 1, row: 9, col: 9 },
        { type: 'portal', pairId: 2, row: 0, col: 9 },
        { type: 'portal', pairId: 2, row: 9, col: 0 },
      ]
    },
    {
      id: 'level_4',
      name: 'Level 4',
      type: 'predefined',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 0, col: 0 },
      items: [
        { type: 'coinGreen', row: 3, col: 3 },
        { type: 'coinGreen', row: 3, col: 6 },
        { type: 'coinGreen', row: 6, col: 3 },
        { type: 'coinGreen', row: 6, col: 6 },
        { type: 'obstacle', row: 4, col: 4 },
        { type: 'obstacle', row: 4, col: 5 },
        { type: 'obstacle', row: 5, col: 4 },
        { type: 'obstacle', row: 5, col: 5 },
        { type: 'portal', pairId: 1, row: 0, col: 9 },
        { type: 'portal', pairId: 1, row: 9, col: 0 },
        { type: 'sigil', letter: 'a', row: 1, col: 1 },
        { type: 'sigil', letter: 'a', row: 8, col: 8 },
        { type: 'sigil', letter: 's', row: 2, col: 4 },
        { type: 'sigil', letter: 's', row: 7, col: 4 },
        { type: 'sigil', letter: 'd', row: 0, col: 4 },
        { type: 'sigil', letter: 'd', row: 9, col: 4 },
        { type: 'sigil', letter: 'f', row: 2, col: 2 },
        { type: 'sigil', letter: 'f', row: 7, col: 7 },
      ]
    },
    {
      id: 'level_5',
      name: 'Level 5',
      type: 'predefined',
      grid: { rows: 10, cols: 10 },
      playerSpawn: { row: 4, col: 4 },
      items: [
        { type: 'coinGreen', row: 0, col: 4 },
        { type: 'coinGreen', row: 4, col: 0 },
        { type: 'coinGreen', row: 4, col: 9 },
        { type: 'coinGreen', row: 9, col: 4 },
        { type: 'obstacle', row: 1, col: 4 },
        { type: 'obstacle', row: 4, col: 1 },
        { type: 'obstacle', row: 4, col: 8 },
        { type: 'obstacle', row: 8, col: 4 },
        { type: 'obstacle', row: 2, col: 2 },
        { type: 'obstacle', row: 2, col: 7 },
        { type: 'obstacle', row: 7, col: 2 },
        { type: 'obstacle', row: 7, col: 7 },
        { type: 'portal', pairId: 1, row: 0, col: 0 },
        { type: 'portal', pairId: 1, row: 9, col: 9 },
        { type: 'portal', pairId: 2, row: 0, col: 9 },
        { type: 'portal', pairId: 2, row: 9, col: 0 },
        { type: 'portal', pairId: 3, row: 3, col: 3 },
        { type: 'portal', pairId: 3, row: 6, col: 6 },
        { type: 'sigil', letter: 'a', row: 1, col: 1 },
        { type: 'sigil', letter: 'a', row: 8, col: 8 },
        { type: 'sigil', letter: 's', row: 0, col: 2 },
        { type: 'sigil', letter: 's', row: 9, col: 7 },
        { type: 'sigil', letter: 'd', row: 3, col: 4 },
        { type: 'sigil', letter: 'd', row: 5, col: 4 },
        { type: 'sigil', letter: 'f', row: 0, col: 5 },
        { type: 'sigil', letter: 'f', row: 9, col: 5 },
      ]
    },
    // {
    //   id: 'level_6',
    //   name: 'Level 6',
    //   type: 'predefined',
    //   grid: { rows: 10, cols: 10 },
    //   playerSpawn: { row: 5, col: 5 },
    //   items: [
    //     { type: 'coinGreen', row: 0, col: 0 },
    //     { type: 'coinGreen', row: 0, col: 9 },
    //     { type: 'coinGreen', row: 9, col: 0 },
    //     { type: 'coinGreen', row: 9, col: 9 },
    //     { type: 'obstacle', row: 2, col: 2 },
    //     { type: 'obstacle', row: 2, col: 7 },
    //     { type: 'obstacle', row: 7, col: 2 },
    //     { type: 'obstacle', row: 7, col: 7 },
    //     { type: 'obstacle', row: 3, col: 4 },
    //     { type: 'obstacle', row: 3, col: 5 },
    //     { type: 'obstacle', row: 6, col: 4 },
    //     { type: 'obstacle', row: 6, col: 5 },
    //     { type: 'portal', pairId: 1, row: 1, col: 4 },
    //     { type: 'portal', pairId: 1, row: 8, col: 5 },
    //     { type: 'portal', pairId: 2, row: 4, col: 1 },
    //     { type: 'portal', pairId: 2, row: 5, col: 8 },
    //     { type: 'sigil', letter: 'a', row: 1, col: 1 },
    //     { type: 'sigil', letter: 'a', row: 8, col: 8 },
    //     { type: 'sigil', letter: 's', row: 0, col: 4 },
    //     { type: 'sigil', letter: 's', row: 9, col: 5 },
    //     { type: 'sigil', letter: 'd', row: 3, col: 3 },
    //     { type: 'sigil', letter: 'd', row: 6, col: 6 },
    //     { type: 'sigil', letter: 'f', row: 4, col: 4 },
    //     { type: 'sigil', letter: 'f', row: 5, col: 5 },
    //   ]
    // },
    // {
    //   id: 'level_7',
    //   name: 'Level 7',
    //   type: 'predefined',
    //   grid: { rows: 10, cols: 10 },
    //   playerSpawn: { row: 9, col: 9 },
    //   items: [
    //     { type: 'coinGreen', row: 1, col: 4 },
    //     { type: 'coinGreen', row: 4, col: 1 },
    //     { type: 'coinGreen', row: 4, col: 8 },
    //     { type: 'coinGreen', row: 8, col: 4 },
    //     { type: 'obstacle', row: 0, col: 5 },
    //     { type: 'obstacle', row: 5, col: 0 },
    //     { type: 'obstacle', row: 5, col: 9 },
    //     { type: 'obstacle', row: 9, col: 5 },
    //     { type: 'obstacle', row: 4, col: 4 },
    //     { type: 'obstacle', row: 4, col: 5 },
    //     { type: 'obstacle', row: 5, col: 4 },
    //     { type: 'obstacle', row: 5, col: 5 },
    //     { type: 'portal', pairId: 1, row: 0, col: 0 },
    //     { type: 'portal', pairId: 1, row: 9, col: 0 },
    //     { type: 'portal', pairId: 2, row: 0, col: 9 },
    //     { type: 'portal', pairId: 2, row: 2, col: 2 },
    //     { type: 'sigil', letter: 'a', row: 1, col: 1 },
    //     { type: 'sigil', letter: 'a', row: 8, col: 8 },
    //     { type: 'sigil', letter: 's', row: 3, col: 3 },
    //     { type: 'sigil', letter: 's', row: 6, col: 6 },
    //     { type: 'sigil', letter: 'd', row: 2, col: 4 },
    //     { type: 'sigil', letter: 'd', row: 7, col: 4 },
    //     { type: 'sigil', letter: 'f', row: 2, col: 7 },
    //     { type: 'sigil', letter: 'f', row: 7, col: 2 },
    //   ]
    // },
  ],

  // Dynamic level - generated randomly
  dynamic: {
    id: 'dynamic',
    name: 'Dynamic Level',
    type: 'dynamic',
    grid: { rows: 10, cols: 10 }
  }
};

/**
 * Get all levels in order: demo -> predefined -> dynamic
 */
function getAllLevels() {
  // return [...LEVELS.demo, ...LEVELS.predefined, LEVELS.dynamic];
  return [...LEVELS.predefined, LEVELS.dynamic];
}

/**
 * Get level by index
 */
function getLevelByIndex(index) {
  const allLevels = getAllLevels();
  return allLevels[index] || allLevels[0];
}

/**
 * Get total level count
 */
function getLevelCount() {
  return getAllLevels().length;
}
