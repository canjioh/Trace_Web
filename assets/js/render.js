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

function drawExternal(ctx, leg, endpoint, vertex, phase = 0, labels = true) {
  const P = PARTICLES[leg.particle];
  if (P.kind === 'boson') {
    drawPhoton(ctx, endpoint, vertex, phase);
  } else {
    // Draw from endpoint to vertex; `forward` means along endpoint -> vertex.
    drawFermion(ctx, endpoint, vertex, flowsToVertex(leg));
  }
  if (!labels) return;
  const align = endpoint.x < vertex.x ? 'right' : 'left';
  drawLabel(ctx, endpoint, `${P.label}${SUBS[leg.idx]}`, align);
}

/* Geometry of a tree diagram, separated from the drawing so that the one-loop
   renderer can place a correction on top of exactly the same layout. */
function diagramLayout(diagram, W, H) {
  const { legs } = diagram;
  const A = diagram.legsA, B = diagram.legsB;
  const bothInA = A.every((i) => legs[i].role === 'in');

  let vA, vB, ends;

  if (bothInA) {
    // Annihilation: internal line horizontal, initial pair on the left.
    vA = { x: 0.34 * W, y: 0.5 * H };
    vB = { x: 0.66 * W, y: 0.5 * H };
    ends = new Map([
      [A[0], { x: 0.12 * W, y: 0.20 * H }],
      [A[1], { x: 0.12 * W, y: 0.80 * H }],
      [B[0], { x: 0.88 * W, y: 0.20 * H }],
      [B[1], { x: 0.88 * W, y: 0.80 * H }],
    ]);
  } else {
    // Exchange: internal line vertical, each fermion line running left to right.
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
  return { vA, vB, ends, bothInA };
}

/* A representative point on a given line of the diagram, and the direction of
   that line — used to hang a loop correction off it. */
function pointOnLine(diagram, layout, lineIdx, frac = 0.55) {
  const { vA, vB, ends } = layout;
  if (lineIdx === 4) {
    return {
      p: { x: vA.x + (vB.x - vA.x) * 0.5, y: vA.y + (vB.y - vA.y) * 0.5 },
      a: vA,
      b: vB,
    };
  }
  const end = ends.get(lineIdx);
  const vtx = diagram.legsA.includes(lineIdx) ? vA : vB;
  return {
    p: { x: end.x + (vtx.x - end.x) * frac, y: end.y + (vtx.y - end.y) * frac },
    a: end,
    b: vtx,
  };
}

function renderDiagram(canvas, diagram, opts = {}) {
  const W = opts.width || 300, H = opts.height || 210;
  refreshInk();
  const ctx = setupCanvas(canvas, W, H);
  ctx.clearRect(0, 0, W, H);

  const { legs } = diagram;
  const A = diagram.legsA;
  const layout = diagramLayout(diagram, W, H);
  const { vA, vB, ends, bothInA } = layout;
  const labels = opts.labels !== false;
  const phase = opts.phase || 0;

  // Internal line first, so vertices sit on top.
  const intP = PARTICLES[diagram.internal];
  if (intP.kind === 'boson') {
    drawPhoton(ctx, vA, vB, phase);
  } else {
    // Fermion flows from the vertex holding the non-barred spinor to the other.
    const nonbar = [...A, ...diagram.legsB].find((i) => legType(legs[i]) === 'nonbar');
    const startAtA = A.includes(nonbar);
    drawFermion(ctx, startAtA ? vA : vB, startAtA ? vB : vA, true);
  }

  if (labels) {
    ctx.fillStyle = COL.mid;
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const mid = { x: (vA.x + vB.x) / 2, y: (vA.y + vB.y) / 2 };
    ctx.fillText(intP.label, mid.x + (bothInA ? 0 : 16), mid.y - (bothInA ? 10 : 0));
  }

  for (const [idx, pt] of ends) {
    drawExternal(ctx, legs[idx], pt, A.includes(idx) ? vA : vB, phase, labels);
  }

  drawVertex(ctx, vA);
  drawVertex(ctx, vB);
  return layout;
}

/* --- one-loop corrections: drawn, never evaluated --- */

/* Photon arc bulging away from the straight chord between two points. */
function drawPhotonArc(ctx, p1, p2, bulge) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const amp = 4.2;
  const wl = 11;
  const n = Math.max(2, Math.round(len / wl));

  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  const steps = n * 14;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    // Quadratic arc, with the wiggle superimposed along its normal.
    const arc = 4 * bulge * f * (1 - f);
    const env = Math.sin(Math.PI * f) ** 0.4;
    const off = arc + Math.sin(f * n * 2 * Math.PI) * amp * env;
    const x = p1.x + dx * f + nx * off;
    const y = p1.y + dy * f + ny * off;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/* Fermion bubble inserted into a line: an ellipse with two arrowheads. */
function drawBubble(ctx, centre, along, size) {
  const len = Math.hypot(along.x, along.y) || 1;
  const ux = along.x / len, uy = along.y / len;
  const ang = Math.atan2(uy, ux);

  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, size, size * 0.68, ang, 0, 2 * Math.PI);
  ctx.stroke();

  // Arrowheads at top and bottom of the ellipse, showing fermion-number flow.
  const nx = -uy, ny = ux;
  const s = 5;
  for (const sgn of [1, -1]) {
    const px = centre.x + nx * sgn * size * 0.68;
    const py = centre.y + ny * sgn * size * 0.68;
    const dx = ux * sgn, dy = uy * sgn;
    ctx.fillStyle = COL.ink;
    ctx.beginPath();
    ctx.moveTo(px + dx * s, py + dy * s);
    ctx.lineTo(px - dx * s * 0.5 - nx * s * 0.45, py - dy * s * 0.5 - ny * s * 0.45);
    ctx.lineTo(px - dx * s * 0.5 + nx * s * 0.45, py - dy * s * 0.5 + ny * s * 0.45);
    ctx.closePath();
    ctx.fill();
  }
}

/* Draw a tree diagram with one one-loop correction superimposed. */
function renderLoopDiagram(canvas, topo, opts = {}) {
  const W = opts.width || 260, H = opts.height || 170;
  const diagram = topo.tree;
  const layout = renderDiagram(canvas, diagram, { width: W, height: H, labels: false });
  const ctx = canvas.getContext('2d');
  const [la, lb] = topo.lines;

  if (topo.family === 'vacuum-pol') {
    // Fermion loop sitting in the middle of the internal photon line.
    const { p } = pointOnLine(diagram, layout, 4);
    const along = { x: layout.vB.x - layout.vA.x, y: layout.vB.y - layout.vA.y };
    drawBubble(ctx, p, along, Math.min(W, H) * 0.13);
  } else if (topo.family === 'self-energy') {
    // Photon leaving and rejoining the same line.
    const g1 = pointOnLine(diagram, layout, la.idx, 0.35);
    const g2 = pointOnLine(diagram, layout, la.idx, 0.75);
    drawPhotonArc(ctx, g1.p, g2.p, Math.min(W, H) * 0.16);
    drawVertex(ctx, g1.p);
    drawVertex(ctx, g2.p);
  } else {
    /* Photon spanning two distinct lines. Both families are drawn at the same
       fraction along their legs so the photon is long enough to read as a
       photon; what distinguishes them on the page is that a vertex correction
       bows away from the shared vertex, closing a small triangle with it, while
       a box runs straight across between two legs that share nothing. */
    const g1 = pointOnLine(diagram, layout, la.idx, 0.5);
    const g2 = pointOnLine(diagram, layout, lb.idx, 0.5);

    let bulge = 0;
    if (topo.family === 'vertex') {
      const shared = sharedVertexPoint(diagram, layout, la, lb);
      if (shared) {
        // Bow away from the shared vertex, so the triangle it forms is visible.
        const mid = { x: (g1.p.x + g2.p.x) / 2, y: (g1.p.y + g2.p.y) / 2 };
        const dx = g2.p.x - g1.p.x, dy = g2.p.y - g1.p.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const away = (mid.x - shared.x) * nx + (mid.y - shared.y) * ny;
        bulge = (away >= 0 ? 1 : -1) * Math.min(W, H) * 0.1;
      }
    }
    drawPhotonArc(ctx, g1.p, g2.p, bulge);
    drawVertex(ctx, g1.p);
    drawVertex(ctx, g2.p);
  }
}

/* The vertex two lines have in common, if any. */
function sharedVertexPoint(diagram, layout, la, lb) {
  const vertexOf = (l) =>
    l.kind === 'internal' ? null : diagram.legsA.includes(l.idx) ? layout.vA : layout.vB;
  const a = vertexOf(la), b = vertexOf(lb);
  if (a && b && a === b) return a;
  // A leg paired with the internal line meets it at that leg's own vertex.
  return a || b;
}
