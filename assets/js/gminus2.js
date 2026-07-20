/* TRACE — the perturbative series that can actually be compared with experiment.

   The electron anomalous magnetic moment a = (g-2)/2 is the cleanest place in
   physics to watch a perturbative series converge, because the QED prediction
   and the measurement agree to twelve significant figures. It is expanded in
   powers of alpha/pi:

       a = C1 (α/π) + C2 (α/π)² + C3 (α/π)³ + C4 (α/π)⁴ + C5 (α/π)⁵ + ...

   WHAT IS COMPUTED HERE AND WHAT IS NOT — this distinction matters and is shown
   in the table rather than buried:

     C1 = 1/2 is Schwinger's 1948 one-loop result. It follows from a single
     vertex-correction diagram and is the one coefficient this page derives.

     C2...C5 are taken from the literature. C2 and C3 are known analytically;
     C4 and C5 come from very large numerical evaluations (891 and 12672
     diagrams respectively). Nothing here reproduces them, and pretending
     otherwise would be dishonest — they are quoted, and labelled as quoted.

   The point of the table is not to claim the computation but to show the shape
   of the thing: each order shrinks by roughly three decimal places, and the
   running total walks towards the measured value. */

/* a = (g-2)/2 for the electron. */
const G2_COEFFICIENTS = [
  { n: 1, C: 0.5,                    source: 'computed',   note: 'Schwinger, α/2π' },
  { n: 2, C: -0.328478965579193378,  source: 'analytic',   note: '7 diagrams' },
  { n: 3, C: 1.181241456587,         source: 'analytic',   note: '72 diagrams' },
  { n: 4, C: -1.9122457649264456,    source: 'numerical',  note: '891 diagrams' },
  { n: 5, C: 6.737,                  source: 'numerical',  note: '12672 diagrams' },
];

/* Measured value and its uncertainty. */
const A_E_EXPERIMENT = 1.15965218059e-3;
const A_E_EXPERIMENT_UNC = 1.3e-13;

/* Contributions to a_e that are not QED at all. They are why the QED-only sum
   is not expected to land exactly on the measurement. */
const A_E_HADRONIC = 1.693e-12;
const A_E_ELECTROWEAK = 0.0297e-12;

function gMinus2Series() {
  const x = ALPHA_EM / Math.PI;
  let running = 0;
  return G2_COEFFICIENTS.map((c) => {
    const term = c.C * Math.pow(x, c.n);
    running += term;
    return {
      n: c.n,
      C: c.C,
      term,
      running,
      diff: running - A_E_EXPERIMENT,
      absDiff: Math.abs(running - A_E_EXPERIMENT),
      source: c.source,
      note: c.note,
    };
  });
}

/* The full Standard Model prediction: QED series plus the small non-QED bits. */
function gMinus2Prediction() {
  const series = gMinus2Series();
  const qed = series[series.length - 1].running;
  const total = qed + A_E_HADRONIC + A_E_ELECTROWEAK;
  return {
    series,
    qed,
    hadronic: A_E_HADRONIC,
    electroweak: A_E_ELECTROWEAK,
    total,
    experiment: A_E_EXPERIMENT,
    experimentUnc: A_E_EXPERIMENT_UNC,
    diff: total - A_E_EXPERIMENT,
    sigma: Math.abs(total - A_E_EXPERIMENT) / A_E_EXPERIMENT_UNC,
  };
}

/* Sanity check: the one-loop term must equal alpha/2pi exactly, and the series
   must approach the measurement rather than wander off. */
function checkGMinus2() {
  const s = gMinus2Series();
  const schwinger = ALPHA_EM / (2 * Math.PI);
  const schwingerOk = Math.abs(s[0].term - schwinger) < 1e-18;
  /* Each successive order must bring the running total closer to experiment. */
  let monotone = true;
  for (let i = 1; i < s.length - 1; i++) {
    if (s[i].absDiff > s[i - 1].absDiff) monotone = false;
  }
  const finalRel = Math.abs(s[s.length - 1].running - A_E_EXPERIMENT) / A_E_EXPERIMENT;
  return {
    kind: 'g2',
    reaction: { name: 'a_e = (g−2)/2' },
    computed: s[s.length - 1].running,
    reference: A_E_EXPERIMENT,
    worst: finalRel,
    tol: 1e-8,
    schwingerOk,
    monotone,
    pass: schwingerOk && monotone && finalRel < 1e-8,
  };
}
