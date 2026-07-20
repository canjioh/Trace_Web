/* TRACE — angular distribution plot. Log y-axis, because t-channel processes
   span many decades between backward and forward scattering.

   Strictly monochrome: curves are told apart by dash pattern and stroke weight,
   the way a printed figure does it. */

const DASH_PATTERNS = [[6, 4], [2, 3], [9, 3, 2, 3], [1, 3]];

function niceLogTicks(lo, hi) {
  const ticks = [];
  for (let e = Math.floor(lo); e <= Math.ceil(hi); e++) ticks.push(e);
  return ticks;
}

function renderPlot(canvas, series, opts = {}) {
  const W = opts.width || 620, H = opts.height || 320;
  refreshInk();
  const ctx = setupCanvas(canvas, W, H);
  ctx.clearRect(0, 0, W, H);

  const padL = 68, padR = 18, padT = 16, padB = 42;
  const pw = W - padL - padR, ph = H - padT - padB;
  if (pw <= 0 || ph <= 0) return;

  const all = series.flatMap((s) => s.pts.map((p) => p[1])).filter((v) => v > 0 && isFinite(v));
  if (!all.length) return;
  const lo = Math.floor(Math.log10(Math.min(...all)) - 0.15);
  const hi = Math.ceil(Math.log10(Math.max(...all)) + 0.15);

  const X = (c) => padL + ((c + 1) / 2) * pw;
  const Y = (v) => padT + ph * (1 - (Math.log10(v) - lo) / (hi - lo));

  ctx.font = '11px ui-monospace, Consolas, monospace';

  // grid
  ctx.strokeStyle = COL.mid;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 0.5;
  for (const e of niceLogTicks(lo, hi)) {
    const y = Y(Math.pow(10, e));
    if (y < padT - 1 || y > padT + ph + 1) continue;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
  }
  for (let c = -1; c <= 1.0001; c += 0.5) {
    const x = X(c);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // tick labels
  ctx.fillStyle = COL.mid;
  for (const e of niceLogTicks(lo, hi)) {
    const y = Y(Math.pow(10, e));
    if (y < padT - 1 || y > padT + ph + 1) continue;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`10${supScript(e)}`, padL - 10, y);
  }
  for (let c = -1; c <= 1.0001; c += 0.5) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(c.toFixed(1), X(c), padT + ph + 9);
  }

  // frame
  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(padL, padT, pw, ph);

  // axis titles
  ctx.fillStyle = COL.ink;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(t('plot.x'), padL + pw / 2, H - 6);
  ctx.save();
  ctx.translate(15, padT + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'top';
  ctx.fillText(t('plot.y'), 0, 0);
  ctx.restore();

  // curves
  ctx.strokeStyle = COL.ink;
  for (const s of series) {
    ctx.lineWidth = s.width || 1.2;
    ctx.globalAlpha = s.alpha || 1;
    ctx.setLineDash(s.dash || []);
    ctx.beginPath();
    let started = false;
    for (const [c, v] of s.pts) {
      if (!(v > 0) || !isFinite(v)) { started = false; continue; }
      const x = X(c), y = Y(v);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function supScript(n) {
  const map = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  return String(n).split('').map((c) => map[c] || c).join('');
}
