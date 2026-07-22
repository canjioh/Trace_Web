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

/* Stroke weights, gathered so the whole drawing can be made lighter in one
   place. Loop corrections are drawn a shade lighter than the tree they sit on,
   which keeps a busy one-loop figure readable. */
const STROKE = {
  line: 1.1,
  loop: 0.95,
  vertexR: 2.5,
  arrow: 5.0,      // fermion-flow arrowhead on a tree line
  arrowLoop: 4.2,  // on a closed fermion loop, smaller again
};

/* Straight line with a fermion-flow arrowhead at its midpoint. */
function drawFermion(ctx, a, b, forward, width = STROKE.line) {
  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  let dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  if (!forward) { dx = -dx; dy = -dy; }
  drawArrowhead(ctx, mx, my, dx, dy, STROKE.arrow);
}

function drawArrowhead(ctx, x, y, dx, dy, s) {
  const nx = -dy, ny = dx;
  ctx.fillStyle = COL.ink;
  ctx.beginPath();
  ctx.moveTo(x + dx * s, y + dy * s);
  ctx.lineTo(x - dx * s * 0.5 + nx * s * 0.48, y - dy * s * 0.5 + ny * s * 0.48);
  ctx.lineTo(x - dx * s * 0.5 - nx * s * 0.48, y - dy * s * 0.5 - ny * s * 0.48);
  ctx.closePath();
  ctx.fill();
}

/* A photon: a sinusoid riding on a quadratic Bézier from a to b.

   Two things make this precise rather than approximate. The wave is placed by
   ARC LENGTH along the curve rather than by the Bézier parameter, so the
   wavelength stays uniform instead of stretching where the curve is fast; and
   it is offset along the curve's TRUE NORMAL rather than the chord's, which on
   a bulged arc are not the same direction. Doing both on the chord is what made
   the loop corrections look uneven near their ends.

   The number of half-wavelengths is rounded to a whole number, so the wave
   meets both endpoints exactly at zero with no taper needed. */
function drawPhotonCurve(ctx, a, b, opts = {}) {
  const bulge = opts.bulge || 0;
  const phase = opts.phase || 0;
  const amp = opts.amp || 4.6;
  const targetWL = opts.wavelength || 11;
  const width = opts.width || STROKE.line;

  const dx = b.x - a.x, dy = b.y - a.y;
  const chord = Math.hypot(dx, dy) || 1;
  const nx0 = -dy / chord, ny0 = dx / chord;
  // Control point: the midpoint pushed along the chord normal. The factor of
  // two makes the curve pass through `bulge` at its apex.
  const cx = (a.x + b.x) / 2 + nx0 * bulge * 2;
  const cy = (a.y + b.y) / 2 + ny0 * bulge * 2;

  const N = Math.max(120, Math.round(chord * 2.4));
  const pts = [];
  let total = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N, mt = 1 - t;
    const x = mt * mt * a.x + 2 * mt * t * cx + t * t * b.x;
    const y = mt * mt * a.y + 2 * mt * t * cy + t * t * b.y;
    const tx = 2 * mt * (cx - a.x) + 2 * t * (b.x - cx);
    const ty = 2 * mt * (cy - a.y) + 2 * t * (b.y - cy);
    const tl = Math.hypot(tx, ty) || 1;
    if (i > 0) total += Math.hypot(x - pts[i - 1].x, y - pts[i - 1].y);
    pts.push({ x, y, nx: -ty / tl, ny: tx / tl, s: total });
  }

  if (total < 1e-6) return; // degenerate: the two ends coincide
  const halfWaves = Math.max(3, Math.round(total / (targetWL / 2)));

  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const p of pts) {
    const f = p.s / total;
    // Only the animated hero needs a taper: a travelling wave does not sit at
    // zero on the endpoints, whereas a static one already does.
    const env = phase ? Math.sin(Math.PI * f) ** 0.3 : 1;
    const off = Math.sin(f * halfWaves * Math.PI - phase) * amp * env;
    const x = p.x + p.nx * off, y = p.y + p.ny * off;
    if (p.s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
}

/* Straight photon — the common case. */
function drawPhoton(ctx, a, b, phase = 0) {
  drawPhotonCurve(ctx, a, b, { phase, amp: 4.8, wavelength: 12 });
}

function drawVertex(ctx, p) {
  ctx.fillStyle = COL.ink;
  ctx.beginPath();
  ctx.arc(p.x, p.y, STROKE.vertexR, 0, 2 * Math.PI);
  ctx.fill();
}

/* Particle label, set as base glyph + raised charge + lowered index.

   Composing it from Unicode superscripts ("e⁻₁") looks wrong, because those
   codepoints carry their own metrics and do not sit on a common baseline with
   the base glyph. Placing three runs by hand gives the alignment a formula
   deserves, and matches how the same symbol is set in the text. */
const LABEL_SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

function drawParticleLabel(ctx, p, sym, sup, sub, align) {
  const base = 15;
  const script = 10;
  const baseFont = `italic ${base}px ${LABEL_SERIF}`;
  const scriptFont = `${script}px ${LABEL_SERIF}`;

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = COL.ink;

  ctx.font = baseFont;
  const wSym = ctx.measureText(sym).width;
  ctx.font = scriptFont;
  const wSup = sup ? ctx.measureText(sup).width : 0;
  const wSub = sub ? ctx.measureText(sub).width : 0;
  // Superscript and subscript are stacked, so the group is only as wide as the
  // base plus whichever script is wider.
  const total = wSym + Math.max(wSup, wSub) + 1;

  const gap = 9;
  const x = align === 'right' ? p.x - gap - total : p.x + gap;
  const y = p.y + base * 0.35; // optical centring on the endpoint

  ctx.font = baseFont;
  ctx.fillText(sym, x, y);
  ctx.font = scriptFont;
  if (sup) ctx.fillText(sup, x + wSym + 1, y - base * 0.42);
  if (sub) ctx.fillText(sub, x + wSym + 1, y + base * 0.22);
}

/* Plain text label, for the internal-line tag. */
function drawLabel(ctx, p, text, align) {
  ctx.fillStyle = COL.ink;
  ctx.font = `italic 14px ${LABEL_SERIF}`;
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
  drawParticleLabel(ctx, endpoint, P.sym, P.sup, String(leg.idx + 1), align);
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
  if (opts.skipInternal) {
    // The caller draws it: a vacuum-polarization insertion interrupts the line.
  } else if (intP.kind === 'boson') {
    drawPhoton(ctx, vA, vB, phase);
  } else {
    // Fermion flows from the vertex holding the non-barred spinor to the other.
    const nonbar = [...A, ...diagram.legsB].find((i) => legType(legs[i]) === 'nonbar');
    const startAtA = A.includes(nonbar);
    drawFermion(ctx, startAtA ? vA : vB, startAtA ? vB : vA, true);
  }

  if (labels) {
    ctx.fillStyle = COL.mid;
    ctx.font = `italic 12px ${LABEL_SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const mid = { x: (vA.x + vB.x) / 2, y: (vA.y + vB.y) / 2 };
    ctx.fillText(intP.sym, mid.x + (bothInA ? 0 : 16), mid.y - (bothInA ? 11 : 0));
  }

  for (const [idx, pt] of ends) {
    drawExternal(ctx, legs[idx], pt, A.includes(idx) ? vA : vB, phase, labels);
  }

  drawVertex(ctx, vA);
  drawVertex(ctx, vB);
  return layout;
}

/* --- one-loop corrections: drawn, never evaluated --- */

/* Photon carrying a one-loop correction: same curve machinery, drawn lighter
   and with a shorter wavelength so it reads as subordinate to the tree. */
function drawPhotonArc(ctx, p1, p2, bulge) {
  drawPhotonCurve(ctx, p1, p2, {
    bulge,
    amp: 3.6,
    wavelength: 9,
    width: STROKE.loop,
  });
}

/* Closed fermion loop, drawn as a circle with fermion-number arrowheads at the
   top and bottom. This is the standard textbook rendering of a vacuum
   polarization insertion: the photon line stops on the loop and resumes on the
   far side, rather than passing through it. */
function drawFermionLoop(ctx, centre, along, radius) {
  const len = Math.hypot(along.x, along.y) || 1;
  const ux = along.x / len, uy = along.y / len;
  const nx = -uy, ny = ux;

  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = STROKE.loop;
  ctx.beginPath();
  ctx.arc(centre.x, centre.y, radius, 0, 2 * Math.PI);
  ctx.stroke();

  /* Arrowheads on the two extremes of the axis perpendicular to the photon,
     pointing in opposite directions along the loop: particle one way round,
     antiparticle the other. */
  for (const sgn of [1, -1]) {
    const px = centre.x + nx * sgn * radius;
    const py = centre.y + ny * sgn * radius;
    drawArrowhead(ctx, px, py, ux * sgn, uy * sgn, STROKE.arrowLoop);
  }
}

/* Draw a tree diagram with one one-loop correction superimposed.

   The four families are drawn the way a textbook draws them (Griffiths §6.6):
   a vacuum polarization interrupts the internal line with a closed fermion
   loop; a self-energy is a photon that leaves a line and returns to it; a
   vertex correction closes a triangle with the vertex its two lines share; a
   box spans two lines that share nothing. */
function renderLoopDiagram(canvas, topo, opts = {}) {
  const W = opts.width || 260, H = opts.height || 170;
  const diagram = topo.tree;
  const layout = renderDiagram(canvas, diagram, {
    width: W,
    height: H,
    labels: false,
    skipInternal: topo.family === 'vacuum-pol',
  });
  const ctx = canvas.getContext('2d');
  const [la, lb] = topo.lines;
  const { vA, vB } = layout;

  if (topo.family === 'vacuum-pol') {
    /* The photon runs into the loop and out the other side. Drawing the full
       photon and laying a circle on top of it — which is what this used to do —
       reads as a photon with a blob stuck on it, not as an insertion. */
    const centre = { x: (vA.x + vB.x) / 2, y: (vA.y + vB.y) / 2 };
    const dx = vB.x - vA.x, dy = vB.y - vA.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const radius = Math.min(len * 0.26, Math.min(W, H) * 0.15);

    const inEdge = { x: centre.x - ux * radius, y: centre.y - uy * radius };
    const outEdge = { x: centre.x + ux * radius, y: centre.y + uy * radius };
    drawPhoton(ctx, vA, inEdge);
    drawPhoton(ctx, outEdge, vB);
    drawFermionLoop(ctx, centre, { x: ux, y: uy }, radius);
    drawVertex(ctx, inEdge);
    drawVertex(ctx, outEdge);
  } else if (topo.family === 'self-energy') {
    /* A photon leaving the line and rejoining it, bulging away from the body of
       the diagram so the arc stays clear of everything else. */
    const g1 = pointOnLine(diagram, layout, la.idx, 0.32);
    const g2 = pointOnLine(diagram, layout, la.idx, 0.72);
    const mid = { x: (g1.p.x + g2.p.x) / 2, y: (g1.p.y + g2.p.y) / 2 };
    const bulge = outwardBulge(g1.p, g2.p, mid, { x: W / 2, y: H / 2 }, Math.min(W, H) * 0.19);
    drawPhotonArc(ctx, g1.p, g2.p, bulge);
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

/* Signed bulge that makes an arc bow away from `from` — used to keep loop
   corrections clear of the diagram they sit on. */
function outwardBulge(p1, p2, mid, from, size) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const away = (mid.x - from.x) * nx + (mid.y - from.y) * ny;
  return (away >= 0 ? 1 : -1) * size;
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
