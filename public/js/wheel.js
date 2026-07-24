class SpinWheel {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.items = options.items || [];
    this.rotation = 0;
    this.isSpinning = false;
    this.onSpinEnd = options.onSpinEnd || (() => {});
    this.hubColor = options.hubColor || '#1a0a2e';
    this.hubColorLight = options.hubColorLight || '#4a2c7a';
    this.pointerEl = options.pointerEl || null;
    this.muted = options.muted || false;

    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.radius = Math.min(this.centerX, this.centerY) - 10;

    this.winningIndex = -1;
    this.winFlashStart = 0;
    this.idleRunning = false;
    this.spinPhase = 'IDLE';
    this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._audioCtx = null;
    this._ptrHoldTimer = null;

    this.draw();
    if (!this.reducedMotion) this.startIdleLoop();
  }

  setItems(items) {
    this.items = items;
    this.winningIndex = -1;
    this.draw();
  }

  startIdleLoop() {
    if (this.idleRunning) return;
    this.idleRunning = true;
    const loop = (now) => {
      if (this.isSpinning) { this.idleRunning = false; return; }
      this.draw(now);
      if (this.idleRunning) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Rainbow palette for wedges (cycles if more than 8 items)
  static RAINBOW = [
    '#FF9800', '#FF5252', '#E91E8C', '#7B4FE0',
    '#5C6BC0', '#42A5F5', '#66BB6A', '#C0CA33'
  ];

  draw(now) {
    if (now === undefined) now = this.reducedMotion ? 0 : performance.now();
    const ctx = this.ctx;
    const { centerX: cx, centerY: cy, radius: r } = this;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.items.length) return;

    const n = this.items.length;
    const sliceAngle = (2 * Math.PI) / n;
    const rimThickness = Math.max(12, r * 0.09);
    const wedgeR = r - rimThickness;
    const hubR = r * 0.16;
    const hubFaceR = hubR * 0.82;

    // Base shadow disk (violet bezel color, gives the whole wheel its drop shadow)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 24;
    ctx.fillStyle = '#4a2c7a';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ===== Rotating group: wedges + chips + labels =====
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    this.items.forEach((item, i) => {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      const wedgeColor = item.color || SpinWheel.RAINBOW[i % SpinWheel.RAINBOW.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, wedgeR, startAngle, endAngle);
      ctx.closePath();

      const grad = ctx.createRadialGradient(0, 0, wedgeR * 0.08, 0, 0, wedgeR);
      grad.addColorStop(0, this.lighten(wedgeColor, 18));
      grad.addColorStop(1, wedgeColor);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = Math.max(3, r * 0.01);
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);

      const chipR = wedgeR * 0.14;
      const chipX = wedgeR * 0.6;
      const labelR = wedgeR * 0.34;

      const isWin = i === this.winningIndex;
      let popScale = 1;
      let winGlow = 0;
      if (isWin && !this.reducedMotion) {
        const t = Math.min((now - this.winFlashStart) / 600, 1);
        popScale = 1 + 0.35 * Math.sin(t * Math.PI);
        winGlow = (1 - t) * 0.9;
      }

      // Icon chip
      ctx.save();
      ctx.translate(chipX, 0);
      ctx.scale(popScale, popScale);

      if (winGlow > 0) {
        ctx.shadowColor = 'rgba(255,255,255,' + winGlow + ')';
        ctx.shadowBlur = 28;
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
      }

      const chipGrad = ctx.createRadialGradient(-chipR * 0.3, -chipR * 0.3, chipR * 0.1, 0, 0, chipR);
      chipGrad.addColorStop(0, '#FFFFFF');
      chipGrad.addColorStop(0.7, '#FFF8E1');
      chipGrad.addColorStop(1, '#FFE082');
      ctx.beginPath();
      ctx.arc(0, 0, chipR, 0, Math.PI * 2);
      ctx.fillStyle = chipGrad;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.lineWidth = Math.max(2, chipR * 0.1);
      ctx.strokeStyle = this.toRgba(wedgeColor, 0.8);
      ctx.stroke();

      if (item.emoji) {
        ctx.font = (chipR * 1.1) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.emoji, 0, chipR * 0.05);
      }
      ctx.restore();

      // Label text — bold white with dark stroke for legibility on all wedge colors
      ctx.font = 'bold ' + Math.max(11, r * 0.068) + "px 'Nunito', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, r * 0.011);
      ctx.strokeStyle = 'rgba(10,5,24,0.8)';
      ctx.lineJoin = 'round';
      if (item.label) {
        const lbl = item.label.length > 12 ? item.label.slice(0, 11) + '\u2026' : item.label;
        ctx.strokeText(lbl, labelR, 0);
        ctx.fillText(lbl, labelR, 0);
      }

      ctx.restore();
    });

    ctx.restore(); // end rotating group

    // ===== Violet bezel rim (stationary, 3D bevel) =====
    ctx.save();
    ctx.translate(cx, cy);

    // Main bezel ring — diagonal gradient: bright highlight top-left, deep shadow bottom-right
    ctx.beginPath();
    ctx.arc(0, 0, wedgeR + rimThickness * 0.5, 0, Math.PI * 2);
    ctx.lineWidth = rimThickness;
    const rimGrad = ctx.createLinearGradient(-r * 0.7, -r * 0.7, r * 0.7, r * 0.7);
    rimGrad.addColorStop(0, '#D1B3FF');
    rimGrad.addColorStop(0.25, '#9574E8');
    rimGrad.addColorStop(0.5, '#6A45C7');
    rimGrad.addColorStop(0.75, '#4A2E8C');
    rimGrad.addColorStop(1, '#2E1A5C');
    ctx.strokeStyle = rimGrad;
    ctx.stroke();

    // Bright highlight arc along top-left edge (light catches here)
    ctx.beginPath();
    ctx.arc(0, 0, wedgeR + rimThickness * 0.25, -Math.PI * 0.95, -Math.PI * 0.55);
    ctx.lineWidth = Math.max(2, rimThickness * 0.22);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Deep shadow arc along bottom-right edge
    ctx.beginPath();
    ctx.arc(0, 0, r - 1, Math.PI * 0.1, Math.PI * 0.65);
    ctx.lineWidth = Math.max(2, rimThickness * 0.2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Inner bezel: thin dark ring where rim meets wedge face (rim sits proud of wedge surface)
    ctx.beginPath();
    ctx.arc(0, 0, wedgeR, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(3, rimThickness * 0.18);
    ctx.strokeStyle = 'rgba(10,5,24,0.75)';
    ctx.stroke();

    // Faint inner highlight just inside the bezel, top-left (catches light on the recessed lip)
    ctx.beginPath();
    ctx.arc(0, 0, wedgeR - Math.max(2, rimThickness * 0.1), -Math.PI * 0.9, -Math.PI * 0.6);
    ctx.lineWidth = Math.max(1.5, rimThickness * 0.1);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.restore();

    // ===== Center hub: clean dark badge + gold ring + gold star =====
    ctx.save();
    ctx.translate(cx, cy);
    this.drawHub(ctx, hubR, hubFaceR, now);
    ctx.restore();
  }

  drawHub(ctx, hubR, faceR, now) {
    ctx.save();
    // Drop shadow for lift
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;

    // Gold ring border
    const ringGrad = ctx.createRadialGradient(-hubR * 0.3, -hubR * 0.3, hubR * 0.2, 0, 0, hubR);
    ringGrad.addColorStop(0, '#FFE27A');
    ringGrad.addColorStop(0.6, '#FFD700');
    ringGrad.addColorStop(1, '#F57F17');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Dark navy/purple inner face
    const faceGrad = ctx.createRadialGradient(-faceR * 0.3, -faceR * 0.3, faceR * 0.1, 0, 0, faceR);
    faceGrad.addColorStop(0, '#4a2c7a');
    faceGrad.addColorStop(1, '#1a0a2e');
    ctx.beginPath();
    ctx.arc(0, 0, faceR, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();

    // Gold star icon centered on the hub
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#F57F17';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    const starR = faceR * 0.55;
    const starInner = starR * 0.45;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? starR : starInner;
      const sx = Math.cos(a) * rad;
      const sy = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // ====================================================================
  // SPIN — robust two-stage motion.
  //
  // Stage 1 (FREE_SPIN): the smooth ease-out deceleration. The winning
  //   slice is pre-selected up front (uniform random, preserving the
  //   app's existing fair distribution) and the end rotation is computed
  //   so that slice lands at the pointer. Peg crossings during this
  //   stage fire cosmetic "tick" contacts (sound + pointer flick) on top
  //   of the smooth rotation — they do NOT alter the curve. Ticks are
  //   naturally rapid early and stretch out as the wheel slows.
  // Stage 2 (SETTLE): the final-rest behavior depends on WHERE the
  //   pointer ends up relative to the pegs:
  //     • ON A PEG (boundary): the clicker catches the peg → full rebound
  //       embellishment (nudge → stall/hold → rebound → settle, thunk).
  //     • BETWEEN PEGS (mid-slice): the wheel simply runs out of momentum
  //       between pegs → soft ease to rest with a single light tick, NO
  //       rebound. The pointer just settles where it stopped.
  //   The final resting slice ALWAYS matches the predetermined winner.
  // ====================================================================
  spin(duration = 5000, minSpins = 5, maxSpins = 10) {
    if (this.isSpinning) return;
    const n = this.items.length;
    if (!n) return;
    const sliceAngle = (2 * Math.PI) / n;
    const TWO_PI = Math.PI * 2;

    this.isSpinning = true;
    this.winningIndex = -1;
    this.idleRunning = false;
    this.spinPhase = 'FREE_SPIN';
    this.ensureAudio();

    // --- Pre-select the winning slice (fair, uniform). ---
    const targetIndex = Math.floor(Math.random() * n);

    // --- Decide whether the pointer ends ON A PEG or BETWEEN PEGS.
    //     ~25% on a peg (triggers rebound), ~75% between pegs (just stops).
    //     This makes it clearly random — most spins don't land on a peg. ---
    const landsOnPeg = Math.random() < 0.25;

    // --- Compute the exact final rotation that lands the pointer inside
    //     the winning slice (targetIndex).
    //     getWinnerIndex returns targetIndex when
    //       ((-rotation mod 2π) + 2π) mod 2π ∈ [k*sliceAngle, (k+1)*sliceAngle)
    //     i.e. -rotation mod 2π = k*sliceAngle + offset,  offset ∈ [0, sliceAngle).
    //     Pegs sit at slice boundaries (offset = 0 or sliceAngle). ---
    let offsetInSlice;
    if (landsOnPeg) {
      // Land exactly on the leading boundary peg of the slice.
      offsetInSlice = 0;
    } else {
      // Land clearly BETWEEN pegs — middle 60% of the slice so it's
      // visually unambiguous that the pointer isn't on a peg.
      offsetInSlice = sliceAngle * (0.2 + Math.random() * 0.6);
    }

    const startRotation = this.rotation;
    const targetMod = ((-(targetIndex * sliceAngle + offsetInSlice)) % TWO_PI + TWO_PI) % TWO_PI;
    const startMod = ((startRotation % TWO_PI) + TWO_PI) % TWO_PI;
    let delta = targetMod - startMod;
    if (delta <= 0) delta += TWO_PI;
    const fullSpins = Math.floor(minSpins + Math.random() * (maxSpins - minSpins));
    const finalRotation = startRotation + fullSpins * TWO_PI + delta;

    // The smooth spin eases ALL the way to the exact final position — no
    // approachPad. For on-peg: the wheel ends precisely on the peg, then the
    // rebound plays from there (hold → back → forward). For between-pegs: the
    // wheel ends between pegs and just stops. No "nudge onto peg" that would
    // make it look like the wheel rebounded from a near-but-not-on position.
    const smoothTarget = finalRotation;

    const startTime = performance.now();
    let lastPegFloor = Math.floor(this.rotation / sliceAngle);
    let lastRotation = this.rotation;
    let lastFrameTime = startTime;

    const detectPegCrossing = (velocity) => {
      const pf = Math.floor(this.rotation / sliceAngle);
      if (pf !== lastPegFloor) {
        lastPegFloor = pf;
        this.handlePegContact('tick', velocity);
      }
    };

    const freeSpinStep = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out quartic

      lastRotation = this.rotation;
      this.rotation = startRotation + (smoothTarget - startRotation) * eased;

      const dt = Math.max(1, now - lastFrameTime);
      const velocity = (this.rotation - lastRotation) / dt;
      lastFrameTime = now;

      detectPegCrossing(velocity);
      this.draw(now);

      if (progress < 1) {
        requestAnimationFrame(freeSpinStep);
      } else {
        this.spinPhase = 'SETTLE';
        if (landsOnPeg) {
          // Pointer is exactly on a peg → rebound action.
          this.runSettleEmbellishment(finalRotation, sliceAngle, now);
        } else {
          // Pointer is between pegs → just stop, no rebound.
          this.runSoftSettle(targetIndex, now);
        }
      }
    };

    requestAnimationFrame(freeSpinStep);
  }

  // ===== Stage 2 (between pegs): wheel is already at rest. Just fire a
  // soft tick and finalize. No rebound, no tween. =====
  runSoftSettle(targetIndex, now) {
    this.handlePegContact('settle', 0.001);
    this.finalizeSpin(targetIndex, now || performance.now());
  }

  // ===== Stage 2 (on peg): wheel is sitting exactly on a peg. The clicker
  // catches and holds → rebounds randomly FORWARD or BACKWARD → STAYS at
  // the rebounded position (does NOT return to the peg). The winner is
  // determined by where the pointer actually ends up. Guaranteed to
  // terminate (no loops). =====
  runSettleEmbellishment(finalRot, sliceAngle, now) {
    const direction = Math.random() < 0.5 ? 1 : -1; // 1=forward, -1=backward
    const reboundAmt = sliceAngle * (0.18 + Math.random() * 0.10); // 18-28% of a slice
    const reboundTo = finalRot + direction * reboundAmt;

    // Phase A: clicker catches the peg — hold for a beat (stall thunk).
    this.handlePegContact('stall', sliceAngle / 1500);
    setTimeout(() => {
      // Phase B: rebound to the new position and STAY there.
      this.tweenRotation(finalRot, reboundTo, 220,
        (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, // ease-in-out
        (endNow) => {
          this.rotation = reboundTo;
          this.handlePegContact('settle', sliceAngle / 2200);
          // Winner is whatever slice the pointer is now on.
          const winnerIdx = this.getWinnerIndex();
          this.finalizeSpin(winnerIdx, endNow || performance.now());
        });
    }, this.reducedMotion ? 0 : 220); // hold ~220ms to sell the catch
  }

  // ===== Tween helper: animate rotation from->to over dur with easing. =====
  tweenRotation(from, to, dur, easeFn, onDone) {
    if (this.reducedMotion) {
      this.rotation = to;
      this.draw(0);
      if (onDone) onDone(performance.now());
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e = easeFn(p);
      this.rotation = from + (to - from) * e;
      this.draw(now);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        this.rotation = to;
        if (onDone) onDone(now);
      }
    };
    requestAnimationFrame(step);
  }

  // ===== Finalize: flash the winner, hand back to the page. The winner
  // index passed in is authoritative — for between-pegs it's the pre-
  // selected target; for on-peg rebound it's getWinnerIndex() at the
  // actual rebounded position. No rotation snapping (the wheel stays
  // exactly where the rebound left it). =====
  finalizeSpin(winnerIdx, now) {
    this.winningIndex = winnerIdx;
    this.winFlashStart = now;
    this.isSpinning = false;
    this.spinPhase = 'SETTLED';

    this.playLanding(() => {
      this.winningIndex = -1;
      this.spinPhase = 'IDLE';
      const winner = this.items[winnerIdx];
      this.onSpinEnd(winner);
      if (!this.reducedMotion) this.startIdleLoop();
      else this.draw(0);
    });
  }

  playLanding(done) {
    if (this.reducedMotion) { done(); return; }
    const start = performance.now();
    const dur = 650;
    const loop = (now) => {
      this.draw(now);
      if (now - start < dur) requestAnimationFrame(loop);
      else done();
    };
    requestAnimationFrame(loop);
  }

  // ===== Peg contact: pointer deflection + click sound (one event = one sound) =====
  handlePegContact(type, velocity) {
    // velocity is rad/ms; convert to a 0..1 "intensity" for scaling.
    const v = Math.abs(velocity);
    const intensity = Math.max(0.05, Math.min(1, v / 0.02));

    // --- Pointer deflection (DOM) ---
    if (this.pointerEl && !this.reducedMotion) {
      if (type === 'tick') {
        // Fast spin: small quick flick. Slow: bigger, slower bend.
        const deg = 4 + intensity * 10; // 4..14 deg
        const flickMs = 90 + (1 - intensity) * 120;
        this.deflectPointer(deg, flickMs, 0);
      } else if (type === 'stall') {
        // Catch and HOLD against the peg — sell the moment of resistance.
        const deg = 16;
        this.deflectPointer(deg, 260, 220); // hold ~220ms before springing back
      } else if (type === 'settle') {
        // Soft final tap, small settle wobble.
        this.deflectPointer(6, 220, 0);
      }
    }

    // --- Click sound (Web Audio, synthesized) ---
    this.playClick(type, intensity);
  }

  deflectPointer(deg, durationMs, holdMs) {
    const el = this.pointerEl;
    if (!el) return;
    clearTimeout(this._ptrHoldTimer);
    // Bend (quick ease-out).
    el.style.transition = 'transform ' + Math.max(40, durationMs * 0.35) + 'ms ease-out';
    el.style.transform = 'rotate(' + deg + 'deg)';
    if (holdMs > 0) {
      // Hold deflected, then spring back.
      this._ptrHoldTimer = setTimeout(() => {
        el.style.transition = 'transform ' + durationMs + 'ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.transform = 'rotate(0deg)';
      }, holdMs);
    } else {
      // Immediate spring back (overshoot-and-settle).
      this._ptrHoldTimer = setTimeout(() => {
        el.style.transition = 'transform ' + durationMs + 'ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.transform = 'rotate(0deg)';
      }, Math.max(30, durationMs * 0.25));
    }
  }

  resetPointer() {
    if (!this.pointerEl) return;
    clearTimeout(this._ptrHoldTimer);
    this.pointerEl.style.transition = 'transform 120ms ease-out';
    this.pointerEl.style.transform = 'rotate(0deg)';
  }

  // ===== Audio =====
  ensureAudio() {
    if (this.reducedMotion || this.muted) { this._audioCtx = null; return; }
    if (this._audioCtx) {
      if (this._audioCtx.state === 'suspended') {
        try { this._audioCtx.resume(); } catch (e) {}
      }
      return this._audioCtx;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { this._audioCtx = null; return null; }
      this._audioCtx = new Ctx();
    } catch (e) {
      this._audioCtx = null;
    }
    return this._audioCtx;
  }

  playClick(type, intensity) {
    if (this.reducedMotion || this.muted) return;
    const ctx = this._audioCtx;
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      // Pitch & volume scaled by impact: fast=sharp/high, near-stall=dull/low.
      // 'stall' uses a lower, heavier thunk; 'tick'/'settle' a crisp pluck.
      let freq, vol, decay, wave;
      if (type === 'stall') {
        freq = 150 + intensity * 80;
        vol = 0.32 + intensity * 0.1;
        decay = 0.12;
        wave = 'triangle';
      } else {
        freq = 900 + intensity * 700;          // higher when faster
        vol = 0.08 + intensity * 0.14;
        decay = 0.045;
        wave = 'square';
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.5), t0 + decay);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay + 0.02);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + decay + 0.05);

      // Add a tiny noise transient for the "tick" character on pass-throughs.
      if (type !== 'stall') {
        const buf = ctx.createBuffer(1, 64, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(vol * 0.5, t0);
        ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        noise.connect(filter).connect(ng).connect(ctx.destination);
        noise.start(t0);
        noise.stop(t0 + 0.04);
      }
    } catch (e) {
      // Audio is non-critical; swallow.
    }
  }

  getWinnerIndex() {
    if (!this.items.length) return 0;
    const sliceAngle = (2 * Math.PI) / this.items.length;
    let angle = (-this.rotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    return Math.floor(angle / sliceAngle) % this.items.length;
  }

  getWinner() {
    return this.items[this.getWinnerIndex()];
  }

  toRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const rr = (n >> 16) & 0xFF;
    const gg = (n >> 8) & 0xFF;
    const bb = n & 0xFF;
    return 'rgba(' + rr + ',' + gg + ',' + bb + ',' + alpha + ')';
  }

  lighten(hex, percent) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const rr = Math.min(255, ((n >> 16) & 0xFF) + Math.round(255 * percent / 100));
    const gg = Math.min(255, ((n >> 8) & 0xFF) + Math.round(255 * percent / 100));
    const bb = Math.min(255, (n & 0xFF) + Math.round(255 * percent / 100));
    return 'rgb(' + rr + ',' + gg + ',' + bb + ')';
  }

  getContrastColor(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const rr = (n >> 16) & 0xFF;
    const gg = (n >> 8) & 0xFF;
    const bb = n & 0xFF;
    const luminance = (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255;
    return luminance > 0.55 ? '#1a1035' : '#ffffff';
  }
}
