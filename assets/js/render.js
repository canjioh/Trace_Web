/* TRACE — diagram rendering on a plain 2D canvas. No libraries.

   The layout is derived from the topology, not hardcoded per process: if a
   vertex carries both initial legs the diagram is drawn in the "annihilation"
   arrangement (internal line horizontal), otherwise in the "exchange"
   arrangement (internal line vertical). That covers every tree 2->2 topology. */

/* The palette is strictly monochrome and comes from the stylesheet, so that
   swapping paper for blackboard inverts every canvas too. Lines are told apart
   by shape and stroke weight, never by hue — which is how they are told apart
   in print anyway. */
function inkColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (n, fallback) => (cs.getPropertyValue(n) || fallback).trim();
  return {
    ink: get('--ink', '#000'),
    paper: get('--paper', '#fff'),
    mid: get('--mid', '#888'),
  };
}

/* Cached: reading computed styles is expensive and the hero redraws on every
   animation frame. Invalidated explicitly when the theme changes. */
let COL = { ink: '#000', paper: '#fff', mid: '#888' };
let inkDirty = true;
function refreshInk() {
  if (!inkDirty) return;
  COL = inkColors();
  inkDirty = false;
}
function invalidateInk() { inkDirty = true; }

/* Reassigning canvas.width reallocates the backing store, so only touch it when
   the size actually changed — the hero calls this on every animation frame. */
function setupCanvas(canvas, w, h) {
  const dpr = window.devicePixelRatio || 1;
  const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* Straight line with a fermion-flow arrowhead at its midpoint. */
function drawFermion(ctx, a, b, forward) {
  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  let dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  if (!forward) { dx = -dx; dy = -dy; }
  const s = 7;
  ctx.fillStyle = COL.ink;
  ctx.beginPath();
  ctx.moveTo(mx + dx * s, my + dy * s);
  ctx.lineTo(mx - dx * s * 0.55 - dy * s * 0.5, my - dy * s * 0.55 + dx * s * 0.5);
  ctx.lineTo(mx - dx * s * 0.55 + dy * s * 0.5, my - dy * s * 0.55 - dx * s * 0.5);
  ctx.closePath();
  ctx.fill();
}

/* Sine wave along the segment, for a photon. `phase` lets the hero animate it. */
function drawPhoton(ctx, a, b, phase = 0) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const amp = 5.5;
  const wl = 13;
  const n = Math.max(2, Math.round(len / wl));

  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const steps = n * 14;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    // Taper the ends to zero so the wave meets the vertices cleanly.
    const env = Math.sin(Math.PI * Math.min(1, Math.max(0, f))) ** 0.35;
    const off = Math.sin(f * n * 2 * Math.PI - phase) * amp * env;
    const x = a.x + ux * len * f + nx * off;
    const y = a.y + uy * len * f + ny * off;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawVertex(ctx, p) {
  ctx.fillStyle = COL.ink;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3.4, 0, 2 * Math.PI);
  ctx.fill();
}

function drawLabel(ctx, p, text, align) {
  ctx.fillStyle = COL.ink;
  ctx.font = '600 14px ui-monospace, "Cascadia Mono", Consolas, monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  ctx.fillText(text, p.x + (align === 'right' ? -8 : 8), p.y);
}

/* Does the fermion-number arrow point INTO the vertex? */
function flowsToVertex(leg) {
  const k = PARTICLES[leg.particle].kind;
  if (k === 'fermion') return leg.role === 'in';
  if (k === 'antifermion') return leg.role === 'out';
  return null;
}

function drawExternal(ctx, leg, endpoint, vertex, phase = 0) {
  const P = PARTICLES[leg.particle];
  if (P.kind === 'boson') {
    drawPhoton(ctx, endpoint, vertex, phase);
  } else {
    // Draw from endpoint to vertex; `forward` means along endpoint -> vertex.
    drawFermion(ctx, endpoint, vertex, flowsToVertex(leg));
  }
  const align = endpoint.x < vertex.x ? 'right' : 'left';
  const sub = SUBS[leg.idx];
  drawLabel(ctx, endpoint, `${P.label}${sub}`, align);
}

function renderDiagram(canvas, diagram, opts = {}) {
  const W = opts.width || 300, H = opts.height || 210;
  refreshInk();
  const ctx = setupCanvas(canvas, W, H);
  ctx.clearRect(0, 0, W, H);

  const { legs } = diagram;
  const A = diagram.legsA, B = diagram.legsB;
  const bothInA = A.every((i) => legs[i].role === 'in');

  let vA, vB, ends;

  if (bothInA) {
    vA = { x: 0.34 * W, y: 0.5 * H };
    vB = { x: 0.66 * W, y: 0.5 * H };
    ends = new Map([
      [A[0], { x: 0.12 * W, y: 0.20 * H }],
      [A[1], { x: 0.12 * W, y: 0.80 * H }],
      [B[0], { x: 0.88 * W, y: 0.20 * H }],
      [B[1], { x: 0.88 * W, y: 0.80 * H }],
    ]);
  } else {
    vA = { x: 0.5 * W, y: 0.28 * H };
    vB = { x: 0.5 * W, y: 0.72 * H };
    const place = (pair, y) => {
      const inLeg = pair.find((i) => legs[i].role === 'in');
      const outLeg = pair.find((i) => legs[i].role === 'out');
      return [
        [inLeg, { x: 0.12 * W, y }],
        [outLeg, { x: 0.88 * W, y }],
      ];
    };
    ends = new Map([...place(A, 0.12 * H), ...place(B, 0.88 * H)]);
  }

  // Internal line first, so vertices sit on top.
  const phase = opts.phase || 0;
  const intP = PARTICLES[diagram.internal];
  if (intP.kind === 'boson') {
    drawPhoton(ctx, vA, vB, phase);
  } else {
    // Fermion flows from the vertex holding the non-barred spinor to the other.
    const nonbar = [...A, ...B].find((i) => legType(legs[i]) === 'nonbar');
    const startAtA = A.includes(nonbar);
    drawFermion(ctx, startAtA ? vA : vB, startAtA ? vB : vA, true);
  }

  // Internal-line tag
  ctx.fillStyle = COL.mid;
  ctx.font = '11px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const mid = { x: (vA.x + vB.x) / 2, y: (vA.y + vB.y) / 2 };
  ctx.fillText(intP.label, mid.x + (bothInA ? 0 : 16), mid.y - (bothInA ? 10 : 0));

  for (const [idx, pt] of ends) drawExternal(ctx, legs[idx], pt, A.includes(idx) ? vA : vB, phase);

  drawVertex(ctx, vA);
  drawVertex(ctx, vB);
}
