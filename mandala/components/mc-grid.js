import { JUMP_KEYS, HJKL_MAP, HJKL_MAP_FAST, positionToIndex, indexToPosition } from './utility.js';

function dissect(input) {
  return [Math.floor(input / 3), input % 3];
}

function compose(main, sub) {
  return main * 3 + sub;
}

function fromMS1dToGlobalRC(ms1d) {
  const [mainIndex, subIndex] = ms1d;
  const [mRow, mCol] = dissect(mainIndex);
  const [sRow, sCol] = dissect(subIndex);
  return [compose(mRow, sRow), compose(mCol, sCol)];
}

function _zzz(globalRC) {
  const [globalRow, globalCol] = globalRC;
  const [mRow, sRow] = dissect(globalRow);
  const [mCol, sCol] = dissect(globalCol);
  return [compose(mRow, mCol), compose(sRow, sCol)];
}

export default class McGrid extends HTMLElement {
  constructor() {
    super();
    this._cells = [];
  }

  connectedCallback() {
    for (let og = 0; og < 9; og++) {
      const row = document.createElement('grid-row');
      for (let ig = 0; ig < 9; ig++) {
        const cell = document.createElement('mc-cell');
        const [gRow, gCol] = fromMS1dToGlobalRC([og, ig]);
        cell.dataset.index = gRow * 9 + gCol;
        row.appendChild(cell);
      }
      this.appendChild(row);
    }
    this._cells = [...this.querySelectorAll('mc-cell')];
    // sort by index for direct access
    this._cells.sort((a, b) => a.cellIndex - b.cellIndex);
  }

  get cells() { return this._cells; }

  cellAt(index) { return this._cells[index]; }

  navigate(key, fromCell) {
    const index = fromCell.cellIndex;
    const pos = indexToPosition(index);
    const allCells = this._cells;

    if (HJKL_MAP[key] || HJKL_MAP_FAST[key]) {
      const [gRow, gCol] = [pos.mgRow * 3 + pos.sgRow, pos.mgCol * 3 + pos.sgCol];
      const [dRow, dCol] = HJKL_MAP[key] || HJKL_MAP_FAST[key];
      const nRow = gRow + dRow;
      const nCol = gCol + dCol;
      if (nRow < 0 || nRow > 8 || nCol < 0 || nCol > 8) return;
      allCells[nRow * 9 + nCol].focus();
    } else if (JUMP_KEYS[key] && key === key.toLowerCase()) {
      const [sgRow, sgCol] = JUMP_KEYS[key];
      allCells[positionToIndex(pos.mgRow, pos.mgCol, sgRow, sgCol)].focus();
    } else if (JUMP_KEYS[key] && key !== key.toLowerCase()) {
      const [mgRow, mgCol] = JUMP_KEYS[key];
      allCells[positionToIndex(mgRow, mgCol, pos.sgRow, pos.sgCol)].focus();
    }
  }
}