/* TRACE — Dirac algebra in the Weyl (chiral) representation.
   Metric (+,-,-,-). Spinor conventions follow Peskin & Schroeder.

   gamma^0 = [[0,1],[1,0]],  gamma^i = [[0,sigma^i],[-sigma^i,0]]  (2x2 blocks) */

function buildGammas() {
  const z = C(0, 0), o = C(1, 0), n = C(-1, 0), i = C(0, 1), ni = C(0, -1);

  const g0 = [
    [z, z, o, z],
    [z, z, z, o],
    [o, z, z, z],
    [z, o, z, z],
  ];
  const g1 = [
    [z, z, z, o],
    [z, z, o, z],
    [z, n, z, z],
    [n, z, z, z],
  ];
  const g2 = [
    [z, z, z, ni],
    [z, z, i, z],
    [z, i, z, z],
    [ni, z, z, z],
  ];
  const g3 = [
    [z, z, o, z],
    [z, z, z, n],
    [n, z, z, z],
    [z, o, z, z],
  ];
  return [g0, g1, g2, g3];
}

const GAMMA = buildGammas();

/* slash(v) = v_mu gamma^mu = v^0 g0 - v^1 g1 - v^2 g2 - v^3 g3.
   Accepts a complex 4-vector (array of {re,im}) — polarization vectors are complex. */
function slash(v) {
  let m = matScale(GAMMA[0], v[0]);
  for (let k = 1; k < 4; k++) m = matAdd(m, matScale(GAMMA[k], cscale(v[k], -1)));
  return m;
}

/* Convenience: slash of a real 4-momentum. */
function slashReal(p) {
  return slash(p.map((x) => C(x, 0)));
}

/* --- helicity two-spinors --- */
/* chi_+ and chi_- are eigenvectors of sigma.p_hat with eigenvalue +-1. */
function chiPlus(theta, phi) {
  return [
    C(Math.cos(theta / 2), 0),
    C(Math.sin(theta / 2) * Math.cos(phi), Math.sin(theta / 2) * Math.sin(phi)),
  ];
}

function chiMinus(theta, phi) {
  return [
    C(-Math.sin(theta / 2) * Math.cos(phi), Math.sin(theta / 2) * Math.sin(phi)),
    C(Math.cos(theta / 2), 0),
  ];
}

/* Polar angles of a spatial momentum. */
function angles(p) {
  const r = Math.hypot(p[1], p[2], p[3]);
  if (r < 1e-14) return { theta: 0, phi: 0, r: 0 };
  return { theta: Math.acos(Math.max(-1, Math.min(1, p[3] / r))), phi: Math.atan2(p[2], p[1]), r };
}

/* sqrt(E + |p|) and sqrt(E - |p|).

   The second one must NOT be computed as a literal subtraction: for an
   ultrarelativistic particle E and |p| agree to many digits and E - |p| loses
   almost all of its significant figures. Use the exact identity
       E - |p| = (E^2 - |p|^2) / (E + |p|) = m^2 / (E + |p|),
   which is stable everywhere, including at rest (it gives m, as it should).
   Without this the Ward identity is only satisfied to ~1e-8 instead of ~1e-15. */
function lightconeRoots(E, r, m) {
  const plus = E + r;
  return { sPlus: Math.sqrt(Math.max(0, plus)), sMinus: plus > 0 ? Math.sqrt((m * m) / plus) : 0 };
}

/* u(p, lambda) = ( sqrt(E - |p| lambda) chi_lambda , sqrt(E + |p| lambda) chi_lambda ) */
function uSpinor(p, m, lambda) {
  const { theta, phi, r } = angles(p);
  const { sPlus, sMinus } = lightconeRoots(p[0], r, m);
  const chi = lambda > 0 ? chiPlus(theta, phi) : chiMinus(theta, phi);
  const a = lambda > 0 ? sMinus : sPlus;
  const b = lambda > 0 ? sPlus : sMinus;
  return [cscale(chi[0], a), cscale(chi[1], a), cscale(chi[0], b), cscale(chi[1], b)];
}

/* v(p, lambda) = ( sqrt(E + |p| lambda) chi_-lambda , -sqrt(E - |p| lambda) chi_-lambda ) */
function vSpinor(p, m, lambda) {
  const { theta, phi, r } = angles(p);
  const { sPlus, sMinus } = lightconeRoots(p[0], r, m);
  const chi = lambda > 0 ? chiMinus(theta, phi) : chiPlus(theta, phi);
  const a = lambda > 0 ? sPlus : sMinus;
  const b = lambda > 0 ? sMinus : sPlus;
  return [cscale(chi[0], a), cscale(chi[1], a), cscale(chi[0], -b), cscale(chi[1], -b)];
}

/* bar(psi) = psi^dagger gamma^0 — returns a row vector. */
function barSpinor(psi) {
  const dag = psi.map(cconj);
  return rowMat(dag, GAMMA[0]);
}

/* Photon polarization vector, contravariant components.
   eps_pm = ∓(1/sqrt2)(0, cos t cos f ∓ i sin f, cos t sin f ± i cos f, -sin t) */
function polVector(k, lambda) {
  const { theta, phi } = angles(k);
  const ct = Math.cos(theta), st = Math.sin(theta);
  const cf = Math.cos(phi), sf = Math.sin(phi);
  const s = -lambda / Math.SQRT2; // the overall ∓ for lambda = ±1
  return [
    C(0, 0),
    cscale(C(ct * cf, -lambda * sf), s),
    cscale(C(ct * sf, lambda * cf), s),
    cscale(C(-st, 0), s),
  ];
}

const conjVector = (v) => v.map(cconj);

/* J^mu = bar(psi1) gamma^mu psi2, as a complex 4-vector. */
function current(bar, psi) {
  return [0, 1, 2, 3].map((mu) => rowCol(rowMat(bar, GAMMA[mu]), psi));
}
