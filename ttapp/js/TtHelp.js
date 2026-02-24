// ─── <tt-help> ──────────────────────────────────────────────────────────────
export class TtHelp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; color: #444; font-size: 14px; line-height: 1.6; }
        h2 { color: #d63851; margin-bottom: 12px; font-size: 18px; }
        h3 { color: #fff; background: #d63851; display: inline-block; padding: 2px 8px;
             border-radius: 4px; font-size: 13px; margin: 12px 0 6px; }
        p, li { margin-bottom: 6px; }
        ul { padding-left: 20px; }
        code { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-size: 13px; color: #333; }
      </style>
      <h2>How to Use</h2>

      <h3>Ring Menu</h3>
      <p><strong>Hold</strong> the task name area, <strong>drag</strong> to a task, then <strong>release</strong> to select it.</p>

      <h3>Start / Stop</h3>
      <ul>
        <li>Select a task first, then tap <code>▶</code> to start tracking.</li>
        <li>Tap <code>⏹</code> to stop and save the entry.</li>
      </ul>

      <h3>Merge</h3>
      <p>If you accidentally stopped and restarted the same task, tap <code>⇅</code> to merge the current session with the previous entry.</p>

      <h3>Editing Entries</h3>
      <ul>
        <li>Tap an entry in the history to edit it.</li>
        <li>Tap a time field to open the <strong>dial control</strong>.</li>
        <li>Lock a field (tap it) to keep it fixed while adjusting others.</li>
      </ul>

      <h3>Dial Control</h3>
      <ul>
        <li><strong>Time mode:</strong> Drag the hand to set hours:minutes. Crossing 12 changes the hour.</li>
        <li><strong>Duration – single tap:</strong> Additive mode. Dial delta is added/subtracted from current duration.</li>
        <li><strong>Duration – double tap:</strong> Assignment mode. Dial value replaces the duration directly.</li>
        <li>Drag to <strong>center</strong> to cancel.</li>
      </ul>

      <h3>Time Segments</h3>
      <p>Tasks can be limited to specific time segments (night, morning, midday, afternoon, evening). Only tasks matching the current segment appear in the ring menu.</p>

      <h3>Configuration</h3>
      <p>Tap <code>🔧</code> to manage predefined tasks (up to 8). Set name, time segments, and optional countdown duration.</p>

      <h3>Import / Export</h3>
      <p>Export entries as JSON for backup. Import merges entries by UUID (duplicates are skipped).</p>

      <h3>Countdown Timer</h3>
      <p>If a task has an <em>estimation duration</em>, the timer counts down instead of up. A notification fires when it reaches zero.</p>
    `;
  }
}
