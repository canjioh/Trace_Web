/* TRACE — complex arithmetic and 4x4 complex matrices.
   Everything downstream (spinors, gamma algebra, amplitudes) sits on top of this. */

const C = (re = 0, im = 0) => ({ re, im });

const cadd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
const csub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });
const cmul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cconj = (a) => ({ re: a.re, im: -a.im });
const cscale = (a, s) => ({ re: a.re * s, im: a.im * s });
const cabs2 = (a) => a.re * a.re + a.im * a.im;

const ZERO = C(0, 0);
const ONE = C(1, 0);
const I_UNIT = C(0, 1);

/* --- 4x4 complex matrices, stored as arrays of rows --- */

function matZero() {
  return [0, 1, 2, 3].map(() => [C(), C(), C(), C()]);
}

function matId() {
  const m = matZero();
  for (let i = 0; i < 4; i++) m[i][i] = C(1, 0);
  return m;
}

function matAdd(a, b) {
  const m = matZero();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) m[i][j] = cadd(a[i][j], b[i][j]);
  return m;
}

function matScale(a, s) {
  const m = matZero();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) m[i][j] = cmul(a[i][j], s);
  return m;
}

function matMul(a, b) {
  const m = matZero();
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let acc = C();
      for (let k = 0; k < 4; k++) acc = cadd(acc, cmul(a[i][k], b[k][j]));
      m[i][j] = acc;
    }
  }
  return m;
}

/* Row vector (bar-spinor) times matrix. */
function rowMat(row, m) {
  const out = [C(), C(), C(), C()];
  for (let j = 0; j < 4; j++) {
    let acc = C();
    for (let k = 0; k < 4; k++) acc = cadd(acc, cmul(row[k], m[k][j]));
    out[j] = acc;
  }
  return out;
}

/* Row vector times column vector -> scalar. No conjugation: the bar already carries it. */
function rowCol(row, col) {
  let acc = C();
  for (let k = 0; k < 4; k++) acc = cadd(acc, cmul(row[k], col[k]));
  return acc;
}

/* Minkowski contraction of two complex 4-vectors, metric (+,-,-,-). */
function dotMink(a, b) {
  let acc = cmul(a[0], b[0]);
  for (let i = 1; i < 4; i++) acc = csub(acc, cmul(a[i], b[i]));
  return acc;
}

/* Same, for two real 4-vectors given as plain number arrays. */
function dotReal(a, b) {
  return a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3];
}

const addReal = (a, b) => a.map((x, i) => x + b[i]);
const subReal = (a, b) => a.map((x, i) => x - b[i]);
