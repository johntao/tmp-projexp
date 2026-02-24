import { truncate, formatDuration, Store } from "./shared.js";

// ─── <tt-trigger-widget> (center of screen) ────────────────────────────────
export class TtTriggerWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._selectedTask = null;
    this._tracking = false;
    this._timerInterval = null;
    this._currentEntry = null;
    this._notified = false;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          z-index: 100; display: flex; flex-direction: column; align-items: center; gap: 12px;
          user-select: none;
        }
        .task-trigger {
          padding: 10px 24px; background: #fff; border: 2px solid #ddd; border-radius: 24px;
          color: #d63851; font-size: 15px; font-weight: 600; cursor: pointer;
          min-width: 120px; text-align: center; max-width: 220px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          touch-action: none; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
        }
        .task-trigger:hover { border-color: #d63851; box-shadow: 0 2px 16px rgba(214,56,81,0.15); }
        .task-trigger.tracking { border-color: #d63851; background: #fef2f2; pointer-events: none; opacity: 0.7; }
        .timer {
          font-family: monospace; font-size: 32px; color: #333; letter-spacing: 1px;
        }
        .timer.countdown { color: #c87a00; }
        .timer.overtime { color: #d63851; }
        .controls { display: flex; gap: 10px; }
        .controls button {
          width: 44px; height: 44px; border-radius: 50%; border: 1px solid #ddd;
          background: #fff; font-size: 18px; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: background 0.15s;
        }
        .controls button:hover:not(:disabled) { background: #f0f0f0; }
        .controls button:disabled { opacity: 0.3; cursor: default; }
        .controls button.hidden { display: none; }
      </style>
      <div class="task-trigger" id="trigger">Select task…</div>
      <div class="timer" id="timer">00:00</div>
      <div class="controls">
        <button id="btn-toggle" title="Start" disabled>▶</button>
        <button id="btn-discard" title="Discard" class="hidden">🗑</button>
        <button id="btn-merge" title="Merge" class="hidden">⇅</button>
      </div>
    `;

    this.shadowRoot.getElementById('trigger').addEventListener('pointerdown', e => {
      if (this._tracking) return; // disable when tracking
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('ring-menu-open', { bubbles: true, composed: true }));
    });
    this.shadowRoot.getElementById('btn-toggle').addEventListener('click', () => {
      if (this._tracking) {
        this.dispatchEvent(new CustomEvent('tracking-stop', { bubbles: true, composed: true }));
      } else {
        this.dispatchEvent(new CustomEvent('tracking-start', { bubbles: true, composed: true }));
      }
    });
    this.shadowRoot.getElementById('btn-discard').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('tracking-discard', { bubbles: true, composed: true }));
    });
    this.shadowRoot.getElementById('btn-merge').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('tracking-merge', { bubbles: true, composed: true }));
    });
  }

  set selectedTask(task) {
    this._selectedTask = task;
    const trigger = this.shadowRoot.getElementById('trigger');
    trigger.textContent = task ? truncate(task.name) : 'Select task…';
    this._updateButtons();
  }

  get selectedTask() { return this._selectedTask; }

  set trackingState({ tracking, currentEntry, showMerge }) {
    this._tracking = tracking;
    this._currentEntry = currentEntry;
    this._updateButtons();

    const trigger = this.shadowRoot.getElementById('trigger');
    trigger.classList.toggle('tracking', tracking);

    const mergeBtn = this.shadowRoot.getElementById('btn-merge');
    mergeBtn.classList.toggle('hidden', !showMerge);

    const discardBtn = this.shadowRoot.getElementById('btn-discard');
    discardBtn.classList.toggle('hidden', !tracking);

    if (tracking && currentEntry) {
      this._startTimer();
    } else {
      this._stopTimer();
      this._showIdleTimer();
    }

  }

  _showIdleTimer() {
    const timer = this.shadowRoot.getElementById('timer');
    // Show estimation duration as the idle display if task has one
    const task = this._selectedTask;
    if (task && task.estimationDuration) {
      const ms = task.estimationDuration * 60000;
      timer.className = 'timer countdown';
      timer.textContent = formatDuration(ms);
    } else {
      timer.className = 'timer';
      timer.textContent = '00:00';
    }
  }

  _updateButtons() {
    const toggleBtn = this.shadowRoot.getElementById('btn-toggle');
    if (this._tracking) {
      toggleBtn.textContent = '💾';
      toggleBtn.title = 'Stop';
      toggleBtn.disabled = false;
    } else {
      toggleBtn.textContent = '▶';
      toggleBtn.title = 'Start';
      toggleBtn.disabled = !this._selectedTask;
    }
  }

  _startTimer() {
    this._stopTimer();
    this._updateTimerDisplay();
    this._timerInterval = setInterval(() => this._updateTimerDisplay(), 1000);
  }

  _stopTimer() {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  }

  _updateTimerDisplay() {
    if (!this._currentEntry) return;
    const timer = this.shadowRoot.getElementById('timer');
    const tasks = Store.getTasks();
    const taskDef = tasks.find(t => t.name === this._currentEntry.taskName);
    const estMin = taskDef?.estimationDuration;
    const elapsed = Date.now() - this._currentEntry.startTime;

    if (estMin) {
      const remaining = estMin * 60000 - elapsed;
      timer.className = 'timer ' + (remaining <= 0 ? 'overtime' : 'countdown');
      timer.textContent = remaining <= 0 ? '-' + formatDuration(-remaining) : formatDuration(remaining);

      if (remaining <= 0 && remaining > -1100 && !this._notified) {
        this._notified = true;
        this._notify(this._currentEntry.taskName, estMin);
      }
    } else {
      timer.className = 'timer';
      timer.textContent = formatDuration(elapsed);
    }
  }

  _notify(taskName, estMin) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Time\'s up!', { body: `${taskName} — ${estMin} min elapsed` });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  disconnectedCallback() {
    this._stopTimer();
  }
}
