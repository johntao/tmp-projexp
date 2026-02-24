// ─── <tt-dial> ──────────────────────────────────────────────────────────────
export class TtDial extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._mode = 'time';
    this._initialMinute = 0;
    this._initialHour = 0;
    this._currentStep = 0;
    this._hourAccum = 0;
    this._lastStep = 0;
    this._dragging = false;
    this._cancelled = false;
    this._pointerDown = false;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 220px; height: 220px; margin: 10px auto; user-select: none; touch-action: none; }
        svg { width: 100%; height: 100%; }
        .dial-bg { fill: #e8edf3; }
        .cancel-zone { fill: #f5f5f5; stroke: #ccc; stroke-width: 1; }
        .step-marker { fill: #bcc; }
        .step-marker.active { fill: #d63851; }
        .hand { stroke: #d63851; stroke-width: 3; stroke-linecap: round; }
        .center-text { fill: #333; font-size: 16px; font-family: monospace; text-anchor: middle; dominant-baseline: central; }
        .label-text { fill: #888; font-size: 11px; text-anchor: middle; }
        .step-label { fill: #999; font-size: 9px; text-anchor: middle; dominant-baseline: central; }
      </style>
      <svg viewBox="0 0 220 220"></svg>
    `;
    this._svg = this.shadowRoot.querySelector('svg');
    this._render();

    this._svg.addEventListener('pointerdown', e => this._onPointerDown(e));
    this._svg.addEventListener('pointermove', e => this._onPointerMove(e));
    this._svg.addEventListener('pointerup', e => this._onPointerUp(e));
    this._svg.addEventListener('pointercancel', e => this._onPointerUp(e));
  }

  configure(mode, hour, minute) {
    this._mode = mode;
    this._initialHour = hour;
    this._initialMinute = minute;
    this._hourAccum = (mode === 'duration-additive') ? 0 : hour;
    this._currentStep = Math.round(minute / 5) % 12;
    if (mode === 'duration-additive') this._currentStep = 0;
    this._lastStep = this._currentStep;
    this._cancelled = false;
    this._dragging = false;
    this._render();
  }

  _stepToAngle(step) {
    return (step * 30 - 90) * Math.PI / 180;
  }

  _angleToStep(angle) {
    let deg = angle * 180 / Math.PI + 90;
    if (deg < 0) deg += 360;
    return Math.round(deg / 30) % 12;
  }

  _getPointerAngle(e) {
    const rect = this._svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx);
  }

  _getPointerDist(e) {
    const rect = this._svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    return Math.sqrt(dx * dx + dy * dy) / (rect.width / 2);
  }

  _onPointerDown(e) {
    this._pointerDown = true;
    this._dragging = true;
    this._cancelled = false;
    this._svg.setPointerCapture(e.pointerId);
    const angle = this._getPointerAngle(e);
    const step = this._angleToStep(angle);
    this._lastStep = this._currentStep;
    this._currentStep = step;
    this._render();
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    const dist = this._getPointerDist(e);
    if (dist < 0.25) { this._cancelled = true; this._render(); return; }
    this._cancelled = false;
    const angle = this._getPointerAngle(e);
    const step = this._angleToStep(angle);
    const diff = step - this._lastStep;
    if (diff > 6) this._hourAccum -= 1;
    else if (diff < -6) this._hourAccum += 1;
    if (this._mode === 'duration-assignment' && this._hourAccum < 0) {
      this._hourAccum = 0; this._lastStep = step; this._currentStep = step; this._render(); return;
    }
    this._lastStep = step;
    this._currentStep = step;
    this._render();
  }

  _onPointerUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    this._pointerDown = false;
    this._svg.releasePointerCapture(e.pointerId);
    if (this._cancelled) {
      this.dispatchEvent(new CustomEvent('dial-cancel', { bubbles: true, composed: true }));
      return;
    }
    const minutes = this._currentStep * 5;
    const hours = this._hourAccum;
    this.dispatchEvent(new CustomEvent('dial-commit', {
      bubbles: true, composed: true,
      detail: { mode: this._mode, hours, minutes, totalMinutes: hours * 60 + minutes }
    }));
  }

  _getDisplayValue() {
    const min = this._currentStep * 5;
    if (this._mode === 'time') {
      let h = ((this._hourAccum % 24) + 24) % 24;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
    if (this._mode === 'duration-additive') {
      const sign = this._hourAccum < 0 ? '-' : '+';
      return `${sign}${Math.abs(this._hourAccum)}:${String(min).padStart(2, '0')}`;
    }
    return `${this._hourAccum}:${String(min).padStart(2, '0')}`;
  }

  _render() {
    const cx = 110, cy = 110, r = 90, cancelR = 25;
    const stepR = r - 12;

    let html = `<circle class="dial-bg" cx="${cx}" cy="${cy}" r="${r}" />`;
    html += `<circle class="cancel-zone" cx="${cx}" cy="${cy}" r="${cancelR}" opacity="${this._cancelled ? 0.8 : 0.4}" />`;

    for (let i = 0; i < 12; i++) {
      const a = this._stepToAngle(i);
      const mx = cx + stepR * Math.cos(a);
      const my = cy + stepR * Math.sin(a);
      const isActive = i === this._currentStep && !this._cancelled;
      html += `<circle class="step-marker${isActive ? ' active' : ''}" cx="${mx}" cy="${my}" r="${i % 3 === 0 ? 5 : 3}" />`;
      const lx = cx + (r - 28) * Math.cos(a);
      const ly = cy + (r - 28) * Math.sin(a);
      html += `<text class="step-label" x="${lx}" y="${ly}">${i * 5}</text>`;
    }

    if (!this._cancelled) {
      const a = this._stepToAngle(this._currentStep);
      const hx = cx + (stepR - 8) * Math.cos(a);
      const hy = cy + (stepR - 8) * Math.sin(a);
      html += `<line class="hand" x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" />`;
    }

    html += `<text class="center-text" x="${cx}" y="${cy}" dy="-4">${this._getDisplayValue()}</text>`;
    const modeLabel = this._mode === 'time' ? 'TIME' : this._mode === 'duration-additive' ? 'DURATION +/-' : 'DURATION SET';
    html += `<text class="label-text" x="${cx}" y="${cy + 18}">${modeLabel}</text>`;
    if (this._cancelled) {
      html += `<text class="label-text" x="${cx}" y="${cy + 34}" style="fill:#d63851">CANCEL</text>`;
    }
    this._svg.innerHTML = html;
  }
}
