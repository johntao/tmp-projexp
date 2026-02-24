import { formatDate } from "./shared.js";

// ─── <tt-history> ───────────────────────────────────────────────────────────
export class TtHistory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; flex: 1; overflow-y: auto; padding: 10px 12px; }
        .empty { text-align: center; color: #aaa; padding: 40px 0; font-size: 14px; }
        .date-header { color: #2a7ab5; font-size: 12px; font-weight: 600; padding: 8px 4px 4px; margin-top: 8px; }
        .date-header:first-child { margin-top: 0; }
      </style>
      <div id="list"></div>
    `;
  }

  set entries(val) {
    const list = this.shadowRoot.getElementById('list');
    if (!val || val.length === 0) {
      list.innerHTML = '<div class="empty">No entries yet. Start tracking!</div>';
      return;
    }
    const sorted = [...val].sort((a, b) => b.startTime - a.startTime);
    list.innerHTML = '';
    let lastDate = '';
    sorted.forEach(entry => {
      const date = formatDate(entry.startTime);
      if (date !== lastDate) {
        const header = document.createElement('div');
        header.className = 'date-header';
        header.textContent = date;
        list.appendChild(header);
        lastDate = date;
      }
      const el = document.createElement('tt-entry');
      el.entry = entry;
      list.appendChild(el);
    });
  }
}
