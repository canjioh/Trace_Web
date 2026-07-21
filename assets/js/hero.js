/* TRACE — the animated masthead.

   Not decoration bolted on: these are real diagrams, produced by the same
   generator that drives the calculator. The only animation is the travelling
   phase of the photon waves, which is enough to make the page feel alive
   without turning a printed figure into a toy.

   Honours prefers-reduced-motion by drawing a single static frame. */

const HERO_SPECS = [
  { in: ['e-', 'e+'], out: ['mu-', 'mu+'], pick: 's' },
  { in: ['e-', 'mu-'], out: ['e-', 'mu-'], pick: 't' },
  { in: ['e-', 'e-'], out: ['e-', 'e-'], pick: 'u' },
  { in: ['e-', 'A'], out: ['e-', 'A'], pick: 's' },
];

let heroDiagrams = null;
let heroRaf = null;

function buildHeroDiagrams() {
  return HERO_SPECS.map((spec) => {
    const r = { id: 'hero', name: '', in: spec.in, out: spec.out };
    const ds = generateDiagrams(r);
    assignSigns(ds);
    return ds.find((d) => d.channel === spec.pick) || ds[0];
  }).filter(Boolean);
}

function heroSize(host) {
  const n = heroDiagrams.length;
  const gap = 14;
  const perRow = host.clientWidth < 720 ? 2 : n;
  const w = Math.max(150, Math.floor((host.clientWidth - gap * (perRow - 1)) / perRow));
  return { w, h: Math.round(w * 0.68) };
}

function initHero(host) {
  if (heroRaf) cancelAnimationFrame(heroRaf);
  heroDiagrams = buildHeroDiagrams();
  host.innerHTML = '';

  const { w, h } = heroSize(host);
  const canvases = heroDiagrams.map(() => {
    const c = document.createElement('canvas');
    host.appendChild(c);
    return c;
  });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Redrawing four diagrams is not free; 30 fps is plenty for a drifting wave
     and leaves the main thread alone the rest of the time. */
  const MIN_DT = 1000 / 30;
  let last = -Infinity;

  const frame = (ts) => {
    if (!reduced) heroRaf = requestAnimationFrame(frame);
    if (ts - last < MIN_DT) return;
    last = ts;
    const phase = reduced ? 0 : ts / 380;
    heroDiagrams.forEach((d, i) => {
      // No leg labels here: on the cover these are ornament, and the lettering
      // only clutters the line work at this size.
      renderDiagram(canvases[i], d, { width: w, height: h, phase: phase + i * 1.1, labels: false });
    });
  };
  frame(0);
}
