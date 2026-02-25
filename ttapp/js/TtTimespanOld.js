import { formatTime, formatDuration } from "./shared.js";

// ═══════════════════════════════════════════════════════════════════════════════
// <tt-timespan> — Standalone timespan editor
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
    this._addBarActive = false;
    this._addBarSign = 1;
    this._barSelectedStep = 0;
    this._barOriginY = 0;

    this.shadowRoot.innerHTML = `
      <style>
:host { display: block; color: #444; }
.temporal { display: flex; gap: 10px; position: relative; }
.time-field {
  flex: 1; text-align: center; padding: 10px 6px; background: #f5f5f5; border-radius: 8px;
  cursor: pointer; transition: background 0.15s; position: relative; border: 2px solid transparent;
}
.time-field:hover { background: #eef2ff; }
.time-field.active { border-color: #d63851; }
.time-field .val { font-size: 18px; font-family: monospace; color: #333; }
.time-field .lbl { font-size: 11px; color: #888; }
.lock-icon { position: absolute; top: 4px; right: 6px; font-size: 10px; color: #d63851; }

#du-field { position: relative; }
.dur-adjust {
  position: absolute; right: 0; margin-top: 6px; display: flex; gap: 8px;
}
.dur-adjust button {
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid #ddd;
  background: #fff; font-size: 20px; font-weight: bold; color: #555; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06); touch-action: none; user-select: none;
  transition: background 0.1s;
}
.dur-adjust button:hover { background: #f0f0f0; }
.dur-adjust button:active { background: #e8e8e8; }

.dial-container { min-height: 0; overflow: hidden; transition: min-height 0.2s; }
.dial-container.open { min-height: 240px; }

/* Step bar overlay */
.step-bar-overlay {
  display: none; position: fixed; inset: 0; z-index: 3000;
  touch-action: none; user-select: none;
}
.step-bar-overlay.open { display: block; }
.step-bar-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.15); }
.step-bar {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 64px; background: #fff; border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15); padding: 8px 0; display: flex;
  flex-direction: column; align-items: center;
}
.step-bar .bar-label { font-size: 11px; color: #888; margin-bottom: 6px; font-weight: 600; }
.step-bar .bar-value { font-size: 16px; font-family: monospace; color: #d63851; font-weight: 700; margin-bottom: 6px; }
.step-bar .step {
  width: 48px; height: 28px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-family: monospace; color: #666; border-radius: 4px;
  transition: background 0.08s;
}
.step-bar .step.active { background: #d63851; color: #fff; font-weight: 700; }
.step-bar .step.in-range { background: #fde8e8; color: #d63851; }
      </style>

      <div class="temporal">
        <div class="time-field" data-field="start">
          <span class="lock-icon">🔒</span>
          <div class="val" id="start-val">--:--</div>
          <div class="lbl">Start</div>
        </div>
        <div class="time-field" data-field="end">
          <span class="lock-icon" style="display:none">🔒</span>
          <div class="val" id="end-val">--:--</div>
          <div class="lbl">End</div>
        </div>
        <div id="du-field" class="time-field" data-field="duration">
          <div class="val" id="dur-val">--:--</div>
          <div class="lbl">Duration</div>
          <div class="dur-adjust">
            <button id="btn-dur-plus" title="Add duration">+</button>
            <button id="btn-dur-minus" title="Subtract duration">−</button>
          </div>
        </div>
      </div>

      <div class="dial-container" id="dial-container">
        <tt-dial></tt-dial>
      </div>

      <div class="step-bar-overlay" id="step-bar-overlay">
        <div class="step-bar-backdrop"></div>
        <div class="step-bar" id="step-bar">
          <div class="bar-label" id="bar-label">+</div>
          <div class="bar-value" id="bar-value">0:00</div>
        </div>
      </div>
    `;

    this._dial = this.shadowRoot.querySelector('tt-dial');
    this._dialContainer = this.shadowRoot.getElementById('dial-container');
    this._stepBarOverlay = this.shadowRoot.getElementById('step-bar-overlay');
    this._stepBar = this.shadowRoot.getElementById('step-bar');
    this._barLabel = this.shadowRoot.getElementById('bar-label');
    this._barValue = this.shadowRoot.getElementById('bar-value');

    // Build step elements ascending: 5m at top → 60m at bottom
    this._stepEls = [];
    for (let i = 1; i <= 12; i++) {
      const el = document.createElement('div');
      el.className = 'step';
      el.dataset.step = i;
      el.textContent = `${i * 5}m`;
      this._stepBar.appendChild(el);
      this._stepEls.push(el);
    }

    // Field taps
    this.shadowRoot.querySelectorAll('.time-field').forEach(el => {
      el.addEventListener('click', () => this._onFieldTap(el.dataset.field));
    });

    // Dial events
    this._dial.addEventListener('dial-commit', e => this._onDialCommit(e.detail));
    this._dial.addEventListener('dial-cancel', () => this._rearmDial());

    // +/− button hold gesture
    this._setupDurButton(this.shadowRoot.getElementById('btn-dur-plus'), 1);
    this._setupDurButton(this.shadowRoot.getElementById('btn-dur-minus'), -1);

    // Step bar pointer tracking (fallback for overlay)
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
    this._dialContainer.classList.remove('open');
    this._updateFields();
  }

  // ─── Field display ─────────────────────────────────────────────────────────

  _updateFields() {
    this.shadowRoot.getElementById('start-val').textContent = formatTime(this._startTime);
    this.shadowRoot.getElementById('end-val').textContent = formatTime(this._endTime);
    this.shadowRoot.getElementById('dur-val').textContent = formatDuration(this._endTime - this._startTime);

    this.shadowRoot.querySelector('[data-field="start"] .lock-icon').style.display = this._locked === 'start' ? '' : 'none';
    this.shadowRoot.querySelector('[data-field="end"] .lock-icon').style.display = this._locked === 'end' ? '' : 'none';

    this.shadowRoot.querySelectorAll('.time-field').forEach(el => el.classList.remove('active'));
    if (this._dialTarget) {
      this.shadowRoot.querySelector(`[data-field="${this._dialTarget}"]`)?.classList.add('active');
    }
  }

  _emitChange() {
    this.dispatchEvent(new CustomEvent('timespan-change', {
      bubbles: true, composed: true,
      detail: { startTime: this._startTime, endTime: this._endTime }
    }));
  }

  // ─── Field tap → dial ──────────────────────────────────────────────────────

  _onFieldTap(field) {
    if (field === 'start') {
      this._locked = 'start';
      this._dialTarget = 'start';
      const d = new Date(this._startTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (field === 'end') {
      this._locked = 'end';
      this._dialTarget = 'end';
      const d = new Date(this._endTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (field === 'duration') {
      this._dialTarget = 'duration';
      const totalMin = Math.floor((this._endTime - this._startTime) / 60000);
      this._dial.configure('duration-assignment', Math.floor(totalMin / 60), totalMin % 60);
    }
    this._dialContainer.classList.add('open');
    this._updateFields();
  }

  _onDialCommit(detail) {
    const { hours, minutes, totalMinutes } = detail;

    if (this._dialTarget === 'start' || this._dialTarget === 'end') {
      const h = ((hours % 24) + 24) % 24;
      const key = this._dialTarget === 'start' ? '_startTime' : '_endTime';
      const d = new Date(this[key]);
      d.setHours(h, minutes, 0, 0);
      const newTime = d.getTime();
      if (key === '_startTime' && newTime >= this._endTime) { this._rearmDial(); return; }
      if (key === '_endTime' && newTime <= this._startTime) { this._rearmDial(); return; }
      this[key] = newTime;
    } else if (this._dialTarget === 'duration') {
      const newDurMs = totalMinutes * 60000;
      if (newDurMs <= 0) { this._rearmDial(); return; }
      if (this._locked === 'start') this._endTime = this._startTime + newDurMs;
      else this._startTime = this._endTime - newDurMs;
    }

    this._updateFields();
    this._emitChange();
    this._rearmDial();
  }

  _rearmDial() {
    if (!this._dialTarget) return;
    if (this._dialTarget === 'start') {
      const d = new Date(this._startTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (this._dialTarget === 'end') {
      const d = new Date(this._endTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (this._dialTarget === 'duration') {
      const totalMin = Math.floor((this._endTime - this._startTime) / 60000);
      this._dial.configure('duration-assignment', Math.floor(totalMin / 60), totalMin % 60);
    }
    this._updateFields();
  }

  // ─── +/− button hold → vertical step bar ──────────────────────────────────

  _setupDurButton(btn, sign) {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      this._addBarSign = sign;
      this._barSelectedStep = 0;
      this._barOriginY = e.clientY;
      this._openStepBar(sign);
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

  _openStepBar(sign) {
    this._addBarActive = true;
    this._barSelectedStep = 0;
    this._barLabel.textContent = sign > 0 ? '+' : '−';
    this._barValue.textContent = '0:00';
    this._stepEls.forEach(el => el.classList.remove('active', 'in-range'));
    this._stepBarOverlay.classList.add('open');
  }

  _onBarMove(e) {
    if (!this._addBarActive) return;
    const delta = e.clientY - this._barOriginY;
    const stepHeight = this._stepEls[0]?.getBoundingClientRect().height || 28;
    const rawStep = Math.floor(delta / stepHeight);
    this._barSelectedStep = Math.max(0, Math.min(12, rawStep));
    this._renderBarHighlight();
  }

  _renderBarHighlight() {
    const sel = this._barSelectedStep;
    const totalMin = sel * 5;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const sign = this._addBarSign > 0 ? '+' : '−';
    this._barValue.textContent = sel === 0 ? '0:00' : `${sign}${h}:${String(m).padStart(2, '0')}`;
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

    this._updateFields();
    this._emitChange();
    if (this._dialTarget === 'duration') this._rearmDial();
  }
}