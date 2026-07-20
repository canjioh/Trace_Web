/* TRACE — self-validation.

   The whole point of the tool is that you can trust the number it prints, so
   the checks ship with it rather than living in a test file nobody runs.

   Two independent kinds of check:
     1. against the textbook massless-limit formulas for <|M|^2>;
     2. the Ward identity, which tests gauge invariance and therefore the
        relative sign and the propagator numerator, without any reference value.
*/

const REFERENCE_M2 = {
  ee_mumu:  (s, t, u, e4) => 2 * e4 * (t * t + u * u) / (s * s),
  ee_tautau:(s, t, u, e4) => 2 * e4 * (t * t + u * u) / (s * s),
  emu:      (s, t, u, e4) => 2 * e4 * (s * s + u * u) / (t * t),
  bhabha:   (s, t, u, e4) => 2 * e4 * ((t * t + u * u) / (s * s) + (s * s + u * u) / (t * t) + 2 * u * u / (s * t)),
  moller:   (s, t, u, e4) => 2 * e4 * ((s * s + u * u) / (t * t) + (s * s + t * t) / (u * u) + 2 * s * s / (t * u)),
  compton:  (s, t, u, e4) => 2 * e4 * (-u / s - s / u),
  gg_ee:    (s, t, u, e4) => 2 * e4 * (u / t + t / u),
};

const REFERENCE_NAME = {
  ee_mumu:  '2e⁴(t²+u²)/s²',
  ee_tautau:'2e⁴(t²+u²)/s²',
  emu:      '2e⁴(s²+u²)/t²',
  bhabha:   '2e⁴[(t²+u²)/s² + (s²+u²)/t² + 2u²/(st)]',
  moller:   '2e⁴[(s²+u²)/t² + (s²+t²)/u² + 2s²/(tu)]',
  compton:  '2e⁴[−u/s − s/u]',
  gg_ee:    '2e⁴[u/t + t/u]',
};

/* Compare the numeric spin-averaged |M|^2 with the textbook formula, at an
   energy where all masses are negligible. */
function checkAgainstReference(reaction, sqrtS = 500) {
  const ref = REFERENCE_M2[reaction.id];
  if (!ref) return null;

  const diagrams = generateDiagrams(reaction);
  assignSigns(diagrams);
  const masses = [...reaction.in, ...reaction.out].map((p) => PARTICLES[p].mass);
  const e4 = Math.pow(E_CHARGE, 4);

  /* The reference formulas hold in the massless limit, so they are only
     accurate up to relative corrections of order m^2/s. Comparing against a
     fixed tolerance would wrongly flag the tau channel, whose mass is not
     negligible. The tolerance below is that physical error budget plus a floor
     for double-precision roundoff. */
  const mMax = Math.max(...masses);
  const tol = 1e-9 + 100 * (mMax * mMax) / (sqrtS * sqrtS);

  let worst = 0;
  const samples = [];
  for (const ct of [-0.8, -0.4, -0.1, 0.3, 0.6, 0.85]) {
    const kin = cmKinematics(masses, sqrtS, ct);
    if (!kin) continue;
    const res = evaluate(reaction, diagrams, kin);
    const expected = ref(kin.s, kin.t, kin.u, e4);
    const rel = Math.abs(res.m2avg - expected) / Math.abs(expected);
    worst = Math.max(worst, rel);
    samples.push({ ct, num: res.m2avg, ana: expected, rel });
  }
  return {
    kind: 'reference',
    formula: REFERENCE_NAME[reaction.id],
    sqrtS,
    worst,
    tol,
    massRatio: (mMax * mMax) / (sqrtS * sqrtS),
    pass: worst < tol,
    samples,
  };
}

/* Ward identity: for a process with an external photon, replacing that
   photon's polarization vector by its own momentum must give zero once all
   diagrams are summed. Individual diagrams do NOT vanish — only the sum does,
   which is exactly why this tests the relative sign. */
function checkWardIdentity(reaction, sqrtS = 500) {
  const legs = externalLegs(reaction);
  const photon = legs.find((l) => PARTICLES[l.particle].kind === 'boson');
  if (!photon) return null;

  const diagrams = generateDiagrams(reaction);
  assignSigns(diagrams);
  const masses = [...reaction.in, ...reaction.out].map((p) => PARTICLES[p].mass);
  const kin = cmKinematics(masses, sqrtS, 0.4);

  const combos = [];
  const rec = (i, acc) => {
    if (i === 4) { combos.push([...acc]); return; }
    for (const h of [+1, -1]) { acc.push(h); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);

  let physicalScale = 0;
  let violation = 0;
  const kAsPol = kin.p[photon.idx].map((x) => C(x, 0));

  for (const hel of combos) {
    let sum = C(), sumW = C();
    for (const d of diagrams) {
      sum = cadd(sum, diagramAmplitude(d, kin.p, hel));
      sumW = cadd(sumW, diagramAmplitude(d, kin.p, hel, { [photon.idx]: kAsPol }));
    }
    physicalScale = Math.max(physicalScale, Math.sqrt(cabs2(sum)));
    violation = Math.max(violation, Math.sqrt(cabs2(sumW)));
  }

  const ratio = violation / physicalScale;
  return {
    kind: 'ward',
    photon: photon.idx + 1,
    violation,
    physicalScale,
    ratio,
    pass: ratio < 1e-9,
  };
}

function runAllChecks() {
  const out = [];
  /* The reference formulas are tree-level, so the running coupling must be off
     while they are being checked, whatever the UI switch happens to say. */
  const wasRunning = typeof USE_RUNNING_ALPHA !== 'undefined' && USE_RUNNING_ALPHA;
  if (typeof setRunningAlpha === 'function') setRunningAlpha(false);

  for (const R of REACTIONS) {
    const r = checkAgainstReference(R);
    if (r) out.push({ reaction: R, ...r });
    const w = checkWardIdentity(R);
    if (w) out.push({ reaction: R, ...w });
  }
  if (typeof checkRunningAlpha === 'function') out.push(checkRunningAlpha());
  if (typeof checkGMinus2 === 'function') out.push(checkGMinus2());

  if (typeof setRunningAlpha === 'function') setRunningAlpha(wasRunning);
  return out;
}
