import { formatTime, formatDuration } from "./shared.js";

// ═══════════════════════════════════════════════════════════════════════════════
// <tt-timespan> — Self-contained timespan bar editor
//
// External API:
//   .timespan = { startTime, endTime }   ← set
//   .timespan → { startTime, endTime }   ← get
//   Emits 'timespan-change' with detail: { startTime, endTime }
// ═══════════════════════════════════════════════════════════════════════════════

export class TtTimespan extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._startTime = 0;
    this._endTime = 0;
    this._locked = 'start';      // 'start' | 'end'
    this._dialTarget = null;     // 'start' | 'end' | 'duration' | null
    this._dialActive = false;    // true while dial overlay is shown
    this._addBarActive = false;
    this._addBarSign = 1;
    this._barSelectedStep = 0;

    this.shadowRoot.innerHTML = `
      <style>
:host { display: block; color: #444; max-width: 320px; margin-inline: auto; }

/* ── Bar line ── */
.bar-line { height: 3px; background: #d63851; border-radius: 2px; position: relative; }
.bar-line::before, .bar-line::after {
  content: ''; position: absolute; top: 50%; width: 9px; height: 9px;
  background: #d63851; border-radius: 50%; transform: translateY(-50%);
}
.bar-line::before { left: 0; }
.bar-line::after { right: 0; }
.bar-lock {
  position: absolute; top: 50%; font-size: 12px; line-height: 1;
  transform: translate(-50%, -130%); transition: left 0.2s;
}
.bar-lock.left { left: 0; }
.bar-lock.right { left: 100%; }

/* ── Bar labels ── */
.bar-labels { display: flex; align-items: center; margin-top: 6px; gap: 4px; }
.bar-labels span {
  font-family: monospace; font-size: 13px; color: #555;
  cursor: pointer; user-select: none; touch-action: none;
  padding: 4px 8px; border-radius: 6px; background: #fff; border: 1px solid #ddd;
  transition: background 0.1s, color 0.1s;
}
.bar-labels span:hover { background: #eef2ff; color: #d63851; }
.bar-labels span:active { background: #d63851; color: #fff; }
.bar-labels .bar-time { flex: none; }
.bar-labels .bar-sign {
  flex: 1; text-align: center; font-size: 18px; font-weight: bold;
  color: #999; padding: 2px 0;
}
.bar-labels .bar-sign:hover { color: #d63851; }
.bar-labels .bar-sign:active { background: #d63851; color: #fff; }
.bar-labels .bar-dur { flex: none; color: #888; }

/* ── Shared overlay base ── */
.overlay {
  display: none; position: fixed; inset: 0; z-index: 3000;
  touch-action: none; user-select: none;
}
.overlay.open { display: block; }
.overlay-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.15); }

/* ── Dial overlay ── */
.dial-panel {
  position: absolute; transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ── Step bar overlay ── */
.step-bar {
  position: absolute; transform: translateX(-50%);
  width: 64px; background: #fff; border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15); padding: 8px 0; display: flex;
  flex-direction: column; align-items: center;
}
.step-bar .sb-label { font-size: 11px; color: #888; margin-bottom: 6px; font-weight: 600; }
.step-bar .sb-value { font-size: 16px; font-family: monospace; color: #d63851; font-weight: 700; margin-bottom: 6px; }
.step-bar .step {
  width: 48px; height: 28px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-family: monospace; color: #666; border-radius: 4px;
  transition: background 0.08s;
}
.step-bar .step.active { background: #d63851; color: #fff; font-weight: 700; }
.step-bar .step.in-range { background: #fde8e8; color: #d63851; }
      </style>

      <!-- Bar visualization -->
      <div class="bar-line">
        <span class="bar-lock left" id="bar-lock">🔒</span>
      </div>
      <div class="bar-labels">
        <span id="lbl-start" class="bar-time" data-field="start">--:--</span>
        <span id="lbl-minus" class="bar-sign" data-sign="-1">−</span>
        <span id="lbl-dur" class="bar-dur" data-field="duration">--:--</span>
        <span id="lbl-plus" class="bar-sign" data-sign="1">+</span>
        <span id="lbl-end" class="bar-time" data-field="end">--:--</span>
      </div>

      <!-- Dial overlay (hold to show) -->
      <div class="overlay" id="dial-overlay">
        <div class="overlay-backdrop"></div>
        <div class="dial-panel">
          <tt-dial></tt-dial>
        </div>
      </div>

      <!-- Step bar overlay (hold to show) -->
      <div class="overlay" id="stepbar-overlay">
        <div class="overlay-backdrop"></div>
        <div class="step-bar" id="step-bar">
          <div class="sb-label" id="sb-label">+</div>
          <div class="sb-value" id="sb-value">0:00</div>
        </div>
      </div>
    `;

    this._dial = this.shadowRoot.querySelector('tt-dial');
    this._dialOverlay = this.shadowRoot.getElementById('dial-overlay');
    this._stepBarOverlay = this.shadowRoot.getElementById('stepbar-overlay');
    this._stepBar = this.shadowRoot.getElementById('step-bar');
    this._sbLabel = this.shadowRoot.getElementById('sb-label');
    this._sbValue = this.shadowRoot.getElementById('sb-value');
    this._lockEl = this.shadowRoot.getElementById('bar-lock');
    this._dialPanel = this.shadowRoot.querySelector('.dial-panel');
    this._holdTimer = null;

    // Build step elements ascending: 5m → 60m
    this._stepEls = [];
    for (let i = 1; i <= 12; i++) {
      const el = document.createElement('div');
      el.className = 'step';
      el.dataset.step = i;
      el.textContent = `${i * 5}m`;
      this._stepBar.appendChild(el);
      this._stepEls.push(el);
    }

    // ── Wire dial label buttons (start / duration / end) ──
    this._setupDialButton(this.shadowRoot.getElementById('lbl-start'), 'start');
    this._setupDialButton(this.shadowRoot.getElementById('lbl-dur'), 'duration');
    this._setupDialButton(this.shadowRoot.getElementById('lbl-end'), 'end');

    // ── Wire +/− sign buttons ──
    this._setupSignButton(this.shadowRoot.getElementById('lbl-minus'), -1);
    this._setupSignButton(this.shadowRoot.getElementById('lbl-plus'), 1);

    // Dial commit / cancel
    this._dial.addEventListener('dial-commit', e => this._onDialCommit(e.detail));
    this._dial.addEventListener('dial-cancel', () => {}); // cancel = no-op, overlay stays

    // Step bar overlay fallback listeners
    this._stepBarOverlay.addEventListener('pointermove', e => this._onBarMove(e));
    this._stepBarOverlay.addEventListener('pointerup', e => this._onBarRelease(e));
    this._stepBarOverlay.addEventListener('pointercancel', e => this._onBarRelease(e));
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  get timespan() {
    return { startTime: this._startTime, endTime: this._endTime };
  }

  set timespan({ startTime, endTime }) {
    this._startTime = startTime;
    this._endTime = endTime;
    this._locked = 'start';
    this._dialTarget = null;
    this._dialActive = false;
    this._dialOverlay.classList.remove('open');
    this._updateDisplay();
  }

  // ─── Display ───────────────────────────────────────────────────────────────

  _updateDisplay() {
    this.shadowRoot.getElementById('lbl-start').textContent = formatTime(this._startTime);
    this.shadowRoot.getElementById('lbl-end').textContent = formatTime(this._endTime);
    this.shadowRoot.getElementById('lbl-dur').textContent = formatDuration(this._endTime - this._startTime);
    this._lockEl.className = `bar-lock ${this._locked === 'start' ? 'left' : 'right'}`;
  }

  _emitChange() {
    this.dispatchEvent(new CustomEvent('timespan-change', {
      bubbles: true, composed: true,
      detail: { startTime: this._startTime, endTime: this._endTime }
    }));
  }

  // ─── Dial hold gesture (start / duration / end labels) ─────────────────────

  _setupDialButton(btn, field) {
    const hasThreshold = field === 'start' || field === 'end';

    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);

      // Always set lock immediately for start / end
      if (field === 'start') this._locked = 'start';
      else if (field === 'end') this._locked = 'end';
      this._updateDisplay();

      // Stash pointer origin for positioning
      this._dialPointerX = e.clientX;
      this._dialPointerY = e.clientY;

      if (hasThreshold) {
        // Delay dial open — quick tap = lock only
        this._holdTimer = setTimeout(() => {
          this._holdTimer = null;
          this._openDialAt(field, this._dialPointerX, this._dialPointerY);
        }, 300);
      } else {
        this._openDialAt(field, e.clientX, e.clientY);
      }
    });

    btn.addEventListener('pointermove', e => {
      // Update stashed position so the dial opens at latest pointer pos
      this._dialPointerX = e.clientX;
      this._dialPointerY = e.clientY;
      if (!this._dialActive) return;
      this._dial.trackMove(e);
    });

    btn.addEventListener('pointerup', e => {
      btn.releasePointerCapture(e.pointerId);
      // If timer still pending, it was a quick tap — just lock, no dial
      if (this._holdTimer) {
        clearTimeout(this._holdTimer);
        this._holdTimer = null;
        return;
      }
      if (!this._dialActive) return;
      this._dial.endDrag();
      this._closeDial();
    });

    btn.addEventListener('pointercancel', e => {
      btn.releasePointerCapture(e.pointerId);
      if (this._holdTimer) { clearTimeout(this._holdTimer); this._holdTimer = null; }
      if (!this._dialActive) return;
      this._closeDial();
    });
  }

  _openDialAt(field, x, y) {
    this._dialTarget = field;
    this._configureDial(field);
    this._dialActive = true;
    // Position dial centered on pointer
    this._dialPanel.style.left = `${x}px`;
    this._dialPanel.style.top = `${y}px`;
    this._dialOverlay.classList.add('open');
    this._dial.beginDrag();
  }

  _configureDial(field) {
    if (field === 'start') {
      const d = new Date(this._startTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (field === 'end') {
      const d = new Date(this._endTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (field === 'duration') {
      const totalMin = Math.floor((this._endTime - this._startTime) / 60000);
      this._dial.configure('duration-assignment', Math.floor(totalMin / 60), totalMin % 60);
    }
  }

  _closeDial() {
    this._dialActive = false;
    this._dialTarget = null;
    this._dialOverlay.classList.remove('open');
    this._updateDisplay();
  }

  _onDialCommit(detail) {
    if (!this._dialTarget) return;
    const { hours, minutes, totalMinutes } = detail;

    if (this._dialTarget === 'start' || this._dialTarget === 'end') {
      const h = ((hours % 24) + 24) % 24;
      const key = this._dialTarget === 'start' ? '_startTime' : '_endTime';
      const d = new Date(this[key]);
      d.setHours(h, minutes, 0, 0);
      const newTime = d.getTime();
      // Reject invalid: start >= end
      if (key === '_startTime' && newTime >= this._endTime) { this._configureDial(this._dialTarget); return; }
      if (key === '_endTime' && newTime <= this._startTime) { this._configureDial(this._dialTarget); return; }
      this[key] = newTime;
    } else if (this._dialTarget === 'duration') {
      const newDurMs = totalMinutes * 60000;
      if (newDurMs <= 0) { this._configureDial(this._dialTarget); return; }
      if (this._locked === 'start') this._endTime = this._startTime + newDurMs;
      else this._startTime = this._endTime - newDurMs;
    }

    this._updateDisplay();
    this._emitChange();
    // Re-arm dial so continued dragging works from updated value
    this._configureDial(this._dialTarget);
  }

  // ─── Step bar hold gesture (+/− sign labels) ──────────────────────────────

  _setupSignButton(btn, sign) {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      this._addBarSign = sign;
      this._barSelectedStep = 0;
      this._openStepBar(sign, e.clientX, e.clientY);
    });
    btn.addEventListener('pointermove', e => {
      if (!this._addBarActive) return;
      this._onBarMove(e);
    });
    btn.addEventListener('pointerup', e => {
      if (!this._addBarActive) return;
      btn.releasePointerCapture(e.pointerId);
      this._onBarRelease(e);
    });
    btn.addEventListener('pointercancel', e => {
      if (!this._addBarActive) return;
      btn.releasePointerCapture(e.pointerId);
      this._onBarRelease(e);
    });
  }

  _openStepBar(sign, x, y) {
    this._addBarActive = true;
    this._barSelectedStep = 0;
    this._sbLabel.textContent = sign > 0 ? '+' : '−';
    this._sbValue.textContent = '0:00';
    this._stepEls.forEach(el => el.classList.remove('active', 'in-range'));
    // Position step bar: top-center at pointer
    this._stepBar.style.left = `${x}px`;
    this._stepBar.style.top = `${y}px`;
    this._stepBarOverlay.classList.add('open');
  }

  _onBarMove(e) {
    if (!this._addBarActive) return;
    // Hit-test against step elements directly
    const y = e.clientY;
    let selected = 0;
    for (const el of this._stepEls) {
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y < rect.bottom) {
        selected = parseInt(el.dataset.step);
        break;
      }
      // If pointer is below this step, it's at least this far
      if (y >= rect.bottom) selected = parseInt(el.dataset.step);
    }
    this._barSelectedStep = Math.max(0, Math.min(12, selected));
    this._renderBarHighlight();
  }

  _renderBarHighlight() {
    const sel = this._barSelectedStep;
    const totalMin = sel * 5;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const sign = this._addBarSign > 0 ? '+' : '−';
    this._sbValue.textContent = sel === 0 ? '0:00' : `${sign}${h}:${String(m).padStart(2, '0')}`;
    this._stepEls.forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle('active', s === sel && sel > 0);
      el.classList.toggle('in-range', s > 0 && s < sel);
    });
  }

  _onBarRelease(e) {
    if (!this._addBarActive) return;
    this._addBarActive = false;
    this._stepBarOverlay.classList.remove('open');

    const steps = this._barSelectedStep;
    if (steps <= 0) return;

    const deltaMs = this._addBarSign * steps * 5 * 60000;
    const currentDur = this._endTime - this._startTime;
    const newDur = currentDur + deltaMs;
    if (newDur <= 0) return;

    if (this._locked === 'start') this._endTime = this._startTime + newDur;
    else this._startTime = this._endTime - newDur;

    this._updateDisplay();
    this._emitChange();
  }
}
