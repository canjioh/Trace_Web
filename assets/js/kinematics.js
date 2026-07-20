/* TRACE — 2 -> 2 kinematics in the centre-of-mass frame.
   Beam along z, scattering in the xz plane (phi = 0: for unpolarized 2->2
   nothing depends on phi, so we fix it). */

function cmKinematics(masses, sqrtS, cosTheta) {
  const [m1, m2, m3, m4] = masses;
  const s = sqrtS * sqrtS;

  const E1 = (s + m1 * m1 - m2 * m2) / (2 * sqrtS);
  const E2 = (s + m2 * m2 - m1 * m1) / (2 * sqrtS);
  const E3 = (s + m3 * m3 - m4 * m4) / (2 * sqrtS);
  const E4 = (s + m4 * m4 - m3 * m3) / (2 * sqrtS);

  const p2i = E1 * E1 - m1 * m1;
  const p2f = E3 * E3 - m3 * m3;
  if (p2i <= 0 || p2f <= 0) return null; // below threshold

  const pi = Math.sqrt(p2i);
  const pf = Math.sqrt(p2f);
  const st = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));

  const p1 = [E1, 0, 0, pi];
  const p2 = [E2, 0, 0, -pi];
  const p3 = [E3, pf * st, 0, pf * cosTheta];
  const p4 = [E4, -pf * st, 0, -pf * cosTheta];

  const sM = dotReal(addReal(p1, p2), addReal(p1, p2));
  const tM = dotReal(subReal(p1, p3), subReal(p1, p3));
  const uM = dotReal(subReal(p1, p4), subReal(p1, p4));

  return { p: [p1, p2, p3, p4], s: sM, t: tM, u: uM, pi, pf, sqrtS, cosTheta };
}

/* Threshold: smallest sqrt(s) at which the final state can be produced. */
function threshold(masses) {
  return Math.max(masses[0] + masses[1], masses[2] + masses[3]);
}

/* dsigma/dOmega = |M|^2 / (64 pi^2 s) * pf/pi, in GeV^-2.
   Multiply by GEV2_TO_PB for picobarn. */
const GEV2_TO_PB = 3.8937966e8;

function dSigmaDOmega(m2avg, kin) {
  return (m2avg / (64 * Math.PI * Math.PI * kin.s)) * (kin.pf / kin.pi);
}

/* Total cross section by Gauss-Legendre over cos(theta).
   `identicalFinal` halves the result to avoid double counting. */
const GL16_X = [
  -0.0950125098376374, 0.0950125098376374, -0.2816035507792589, 0.2816035507792589,
  -0.4580167776572274, 0.4580167776572274, -0.6178762444026438, 0.6178762444026438,
  -0.7554044083550030, 0.7554044083550030, -0.8656312023878318, 0.8656312023878318,
  -0.9445750230732326, 0.9445750230732326, -0.9894009349916499, 0.9894009349916499,
];
const GL16_W = [
  0.1894506104550685, 0.1894506104550685, 0.1826034150449236, 0.1826034150449236,
  0.1691565193950025, 0.1691565193950025, 0.1495959888165767, 0.1495959888165767,
  0.1246289712555339, 0.1246289712555339, 0.0951585116824928, 0.0951585116824928,
  0.0622535239386479, 0.0622535239386479, 0.0271524594117541, 0.0271524594117541,
];

function integrateCosTheta(fn, cutoff = 0.999) {
  let acc = 0;
  for (let i = 0; i < GL16_X.length; i++) {
    const c = GL16_X[i] * cutoff;
    acc += GL16_W[i] * cutoff * fn(c);
  }
  return acc * 2 * Math.PI; // trivial phi integral
}
