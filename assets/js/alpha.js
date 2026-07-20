/* TRACE — the running coupling, from the one-loop vacuum polarization.

   This is the one higher-order effect the page can compute honestly rather than
   quote. The renormalized one-loop photon self-energy from a lepton of mass m
   gives, for the shift of the effective fine-structure constant,

       Δα(q²) = (2α/π) Σ_f ∫₀¹ dx · x(1−x) · ln| (m_f² − x(1−x) q²) / m_f² |

   Note the orientation of the ratio: at large |q²| the numerator dominates, the
   log is large and positive, and Δα > 0 — so the coupling GROWS with energy, as
   it must in QED, where the vacuum screens charge and probing closer means
   seeing less screening. Inverting this ratio reproduces the right magnitude
   with the wrong sign, which is an easy mistake to make and a hard one to spot.
   The high-energy limit is the familiar (α/3π)[ln(q²/m²) − 5/3].

   and the dressed coupling is α(q²) = α / (1 − Δα(q²)). Summing the geometric
   series of bubble insertions is what turns one loop into an all-orders
   leading-log statement, which is why this is worth doing at all.

   We integrate numerically, without the large-log approximation, so the result
   is valid at every q² including near and below threshold.

   For timelike q² > 4m² the polarization develops an imaginary part (the photon
   can produce a real pair). Taking |...| inside the log keeps the real part,
   which is what shifts the coupling; the absorptive part is a separate physical
   effect and is not modelled here.

   IMPORTANT HONESTY NOTE: only LEPTON loops are computed. Quark loops at low q²
   are not calculable in perturbation theory and are obtained in the literature
   from measured e+e- → hadrons data. That contribution is deliberately NOT
   included and NOT silently faked. */

const M_Z = 91.1876;
/* Literature value of the leptonic contribution at the Z pole, for validation.
   PDG / standard result. */
const DELTA_ALPHA_LEP_MZ_REF = 0.031498;
/* Hadronic + top contribution at M_Z, data-driven, quoted for context only. */
const DELTA_ALPHA_HAD_MZ_REF = 0.02766;

const LEPTONS = ['e-', 'mu-', 'tau-'];

/* 8-point Gauss-Legendre on [-1,1], applied compositely. The integrand has an
   integrable logarithmic singularity when x(1−x)q² = m², so we subdivide rather
   than raise the order. */
const GL8_X = [
  -0.1834346424956498, 0.1834346424956498, -0.5255324099163290, 0.5255324099163290,
  -0.7966664774136267, 0.7966664774136267, -0.9602898564975363, 0.9602898564975363,
];
const GL8_W = [
  0.3626837833783620, 0.3626837833783620, 0.3137066458778873, 0.3137066458778873,
  0.2223810344533745, 0.2223810344533745, 0.1012285362903763, 0.1012285362903763,
];

function integrate01(f, panels = 80) {
  let acc = 0;
  const h = 1 / panels;
  for (let p = 0; p < panels; p++) {
    const a = p * h, b = a + h;
    const mid = 0.5 * (a + b), half = 0.5 * (b - a);
    for (let k = 0; k < GL8_X.length; k++) {
      acc += GL8_W[k] * half * f(mid + half * GL8_X[k]);
    }
  }
  return acc;
}

/* Contribution of a single lepton flavour to Δα at four-momentum-squared q2. */
function deltaAlphaFlavour(q2, m) {
  const m2 = m * m;
  const f = (x) => {
    const w = x * (1 - x);
    const ratio = Math.abs((m2 - w * q2) / m2);
    if (!isFinite(ratio) || ratio <= 0) return 0; // exactly on the singular point
    return w * Math.log(ratio);
  };
  return (2 * ALPHA_EM / Math.PI) * integrate01(f);
}

/* Total leptonic Δα(q²).

   Memoized: the angular-distribution plot evaluates the amplitude at a few
   hundred kinematic points and sixteen helicity combinations each, but all
   sixteen share the same q², so caching turns ~6M logarithm evaluations per
   redraw into a few hundred thousand. */
const _dAlphaCache = new Map();

function deltaAlphaLeptonic(q2) {
  const hit = _dAlphaCache.get(q2);
  if (hit !== undefined) return hit;
  let sum = 0;
  for (const l of LEPTONS) sum += deltaAlphaFlavour(q2, PARTICLES[l].mass);
  if (_dAlphaCache.size > 4000) _dAlphaCache.clear();
  _dAlphaCache.set(q2, sum);
  return sum;
}

/* Dressed coupling. */
function alphaRunning(q2) {
  const d = deltaAlphaLeptonic(q2);
  return ALPHA_EM / (1 - d);
}

/* The factor multiplying a photon propagator carrying q², i.e. the resummed
   bubble chain. Applied in amplitude.js when running is switched on. */
function vacuumPolarizationFactor(q2) {
  return 1 / (1 - deltaAlphaLeptonic(q2));
}

/* Global switch, read by diagramAmplitude. */
let USE_RUNNING_ALPHA = false;
function setRunningAlpha(on) { USE_RUNNING_ALPHA = !!on; }

/* --- validation: does our integral reproduce the known value at the Z pole? --- */

/* Two independent things are worth checking, and conflating them would hide the
   physics:

   (a) the quadrature. The high-energy limit of the integral is the familiar
       (α/3π)[ln(q²/m²) − 5/3], derived analytically. At the Z pole every lepton
       is ultrarelativistic, so the numerical integral must reproduce it closely.
       This tests the integration, not the theory.

   (b) the physics. The literature value 0.031498 includes two- and three-loop
       leptonic corrections; we compute one loop, resummed. The two therefore
       differ by ~0.25%, and that gap is a real higher-order effect rather than
       an error. Demanding better agreement would be demanding a wrong answer,
       so the tolerance is set to admit it and the check reports the gap. */

function leadingLogDeltaAlpha(q2) {
  return LEPTONS.reduce((acc, l) => {
    const m = PARTICLES[l].mass;
    return acc + (ALPHA_EM / (3 * Math.PI)) * (Math.log(q2 / (m * m)) - 5 / 3);
  }, 0);
}

function checkRunningAlpha() {
  const computed = deltaAlphaLeptonic(M_Z * M_Z);
  const ll = leadingLogDeltaAlpha(M_Z * M_Z);
  const quadRel = Math.abs(computed - ll) / ll;
  const litRel = Math.abs(computed - DELTA_ALPHA_LEP_MZ_REF) / DELTA_ALPHA_LEP_MZ_REF;
  return {
    kind: 'alpha',
    reaction: { name: 'Δα_lep(M_Z²)' },
    computed,
    leadingLog: ll,
    reference: DELTA_ALPHA_LEP_MZ_REF,
    quadRel,
    worst: litRel,
    tol: 1e-2,
    pass: quadRel < 1e-3 && litRel < 1e-2,
  };
}
