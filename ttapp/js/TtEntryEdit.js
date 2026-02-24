import { Store, truncate, formatTime, formatDuration } from "./shared.js";

// ─── <tt-entry-edit> ────────────────────────────────────────────────────────
export class TtEntryEdit extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._entry = null;
    this._draft = null;
    this._locked = 'start';
    this._dialTarget = null;
    this._addBarActive = false;
    this._addBarSign = 1;

    this.shadowRoot.innerHTML = `
      <style>
:host { display: block; color: #444; }
h3 { color: #d63851; margin-bottom: 14px; font-size: 16px; }
.field { margin-bottom: 12px; }
label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
select { width: 100%; padding: 8px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.temporal { display: flex; gap: 10px; margin-bottom: 0; position: relative; }
.time-field {
  flex: 1; text-align: center; padding: 10px 6px; background: #f5f5f5; border-radius: 8px;
  cursor: pointer; transition: background 0.15s; position: relative; border: 2px solid transparent;
}
.time-field:hover { background: #eef2ff; }
.time-field.active { border-color: #d63851; }
.time-field .val { font-size: 18px; font-family: monospace; color: #333; }
.time-field .lbl { font-size: 11px; color: #888; }
.lock-icon { position: absolute; top: 4px; right: 6px; font-size: 10px; color: #d63851; }

/* Vertical step bar overlay */
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
.step-bar .bar-label {
  font-size: 11px; color: #888; margin-bottom: 6px; font-weight: 600;
}
.step-bar .bar-value {
  font-size: 16px; font-family: monospace; color: #d63851; font-weight: 700;
  margin-bottom: 6px;
}
.step-bar .step {
  width: 48px; height: 28px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-family: monospace; color: #666; border-radius: 4px;
  transition: background 0.08s;
}
.step-bar .step.active { background: #d63851; color: #fff; font-weight: 700; }
.step-bar .step.in-range { background: #fde8e8; color: #d63851; }

.dial-container { min-height: 0; overflow: hidden; transition: min-height 0.2s; }
.dial-container.open { min-height: 240px; }
.actions { display: flex; gap: 10px; margin-top: 14px; }
.actions button {
  flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;
}
.btn-save { background: #d63851; color: #fff; }
.btn-save:hover { background: #c02a43; }
.btn-cancel { background: #e8e8e8; color: #666; }
.btn-cancel:hover { background: #ddd; }
#du-field { position: relative; }
/* +/- buttons anchored below duration field */
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
      </style>
      <h3>Edit Entry</h3>
      <div class="field">
        <label>Task</label>
        <select class="task-select"></select>
      </div>
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

      <div class="actions">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-save">Save</button>
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

    // Temporal field clicks
    this.shadowRoot.querySelectorAll('.time-field').forEach(el => {
      el.addEventListener('click', () => this._onFieldTap(el.dataset.field));
    });

    this._dial.addEventListener('dial-commit', e => this._onDialCommit(e.detail));
    this._dial.addEventListener('dial-cancel', () => this._onDialCancel());

    // +/- button hold gesture
    this._setupDurButton(this.shadowRoot.getElementById('btn-dur-plus'), 1);
    this._setupDurButton(this.shadowRoot.getElementById('btn-dur-minus'), -1);

    // Step bar pointer tracking
    this._stepBarOverlay.addEventListener('pointermove', e => this._onBarMove(e));
    this._stepBarOverlay.addEventListener('pointerup', e => this._onBarRelease(e));
    this._stepBarOverlay.addEventListener('pointercancel', e => this._onBarRelease(e));

    this.shadowRoot.querySelector('.btn-save').addEventListener('click', () => this._save());
    this.shadowRoot.querySelector('.btn-cancel').addEventListener('click', () => this._cancel());
  }

  set entry(val) {
    this._entry = val;
    this._draft = { ...val };
    this._locked = 'start';
    this._dialTarget = null;
    this._dialContainer.classList.remove('open');
    this._updateFields();
    this._populateTaskSelect();
  }

  _populateTaskSelect() {
    const sel = this.shadowRoot.querySelector('.task-select');
    const tasks = Store.getTasks();
    sel.innerHTML = tasks.map(t => `<option value="${t.name}" ${t.name === this._draft.taskName ? 'selected' : ''}>${truncate(t.name)}</option>`).join('');
    if (!tasks.find(t => t.name === this._draft.taskName)) {
      sel.innerHTML = `<option value="${this._draft.taskName}" selected>${truncate(this._draft.taskName)}</option>` + sel.innerHTML;
    }
    sel.onchange = () => { this._draft.taskName = sel.value; };
  }

  _updateFields() {
    if (!this._draft) return;
    this.shadowRoot.getElementById('start-val').textContent = formatTime(this._draft.startTime);
    this.shadowRoot.getElementById('end-val').textContent = formatTime(this._draft.endTime);
    this.shadowRoot.getElementById('dur-val').textContent = formatDuration(this._draft.endTime - this._draft.startTime);
    this.shadowRoot.querySelector('[data-field="start"] .lock-icon').style.display = this._locked === 'start' ? '' : 'none';
    this.shadowRoot.querySelector('[data-field="end"] .lock-icon').style.display = this._locked === 'end' ? '' : 'none';

    // Highlight active field
    this.shadowRoot.querySelectorAll('.time-field').forEach(el => el.classList.remove('active'));
    if (this._dialTarget) {
      this.shadowRoot.querySelector(`[data-field="${this._dialTarget}"]`)?.classList.add('active');
    }
  }

  _onFieldTap(field) {
    if (field === 'start') {
      this._locked = 'start';
      this._dialTarget = 'start';
      const d = new Date(this._draft.startTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (field === 'end') {
      this._locked = 'end';
      this._dialTarget = 'end';
      const d = new Date(this._draft.endTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (field === 'duration') {
      this._dialTarget = 'duration';
      const dur = this._draft.endTime - this._draft.startTime;
      const totalMin = Math.floor(dur / 60000);
      this._dial.configure('duration-assignment', Math.floor(totalMin / 60), totalMin % 60);
    }
    this._dialContainer.classList.add('open');
    this._updateFields();
  }

  _onDialCancel() {
    // Cancel just reverts the dial — keep the active field focused
    this._rearmDial();
  }

  _onDialCommit(detail) {
    const { mode, hours, minutes, totalMinutes } = detail;

    if (this._dialTarget === 'start' || this._dialTarget === 'end') {
      let h = ((hours % 24) + 24) % 24;
      const target = this._dialTarget === 'start' ? 'startTime' : 'endTime';
      const d = new Date(this._draft[target]);
      d.setHours(h, minutes, 0, 0);
      const newTime = d.getTime();
      if (target === 'startTime' && newTime >= this._draft.endTime) { this._rearmDial(); return; }
      if (target === 'endTime' && newTime <= this._draft.startTime) { this._rearmDial(); return; }
      this._draft[target] = newTime;
    } else if (this._dialTarget === 'duration') {
      // Assignment mode only
      const newDurMs = totalMinutes * 60000;
      if (newDurMs <= 0) { this._rearmDial(); return; }
      if (this._locked === 'start') this._draft.endTime = this._draft.startTime + newDurMs;
      else this._draft.startTime = this._draft.endTime - newDurMs;
    }

    this._updateFields();
    // Retain focus: re-arm the dial for the same field
    this._rearmDial();
  }

  /** Re-configure the dial for the currently focused field so it stays usable. */
  _rearmDial() {
    if (!this._dialTarget) return;
    if (this._dialTarget === 'start') {
      const d = new Date(this._draft.startTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (this._dialTarget === 'end') {
      const d = new Date(this._draft.endTime);
      this._dial.configure('time', d.getHours(), d.getMinutes());
    } else if (this._dialTarget === 'duration') {
      const dur = this._draft.endTime - this._draft.startTime;
      const totalMin = Math.floor(dur / 60000);
      this._dial.configure('duration-assignment', Math.floor(totalMin / 60), totalMin % 60);
    }
    this._updateFields();
  }

  // ─── +/- button hold → vertical step bar ──────────────────────────────────

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
    this._stepEls.forEach(el => { el.classList.remove('active', 'in-range'); });
    this._stepBarOverlay.classList.add('open');
  }

  _onBarMove(e) {
    if (!this._addBarActive) return;

    // Delta from the pointer origin (where the button was pressed)
    const delta = e.clientY - this._barOriginY;

    // Each step maps to one step-element height (28px as styled)
    const stepHeight = this._stepEls[0]?.getBoundingClientRect().height || 28;

    // Positive delta (dragging down) = increasing steps
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
    if (steps <= 0) return; // cancelled / no selection

    const deltaMs = this._addBarSign * steps * 5 * 60000;
    const currentDur = this._draft.endTime - this._draft.startTime;
    const newDur = currentDur + deltaMs;
    if (newDur <= 0) return; // reject negative/zero

    if (this._locked === 'start') this._draft.endTime = this._draft.startTime + newDur;
    else this._draft.startTime = this._draft.endTime - newDur;

    this._updateFields();
    // If duration dial is open, re-arm it with new value
    if (this._dialTarget === 'duration') this._rearmDial();
  }

  _save() {
    this.dispatchEvent(new CustomEvent('entry-save', {
      bubbles: true, composed: true, detail: { entry: { ...this._draft } }
    }));
  }

  _cancel() {
    this.dispatchEvent(new CustomEvent('entry-edit-cancel', { bubbles: true, composed: true }));
  }
}
