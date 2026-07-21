/* TRACE — amplitude assembly.

   Given a topology and a helicity assignment, apply the Feynman rules and
   contract everything numerically. No symbolic Dirac algebra: we build the
   actual 4-component spinors and 4x4 gamma matrices and multiply them out.
   The spin-summed |M|^2 is then exact, including all masses.

   The one genuinely subtle ingredient is the RELATIVE SIGN between diagrams,
   which comes from the ordering of the external fermion operators. We read the
   external fermion labels off each fermion chain and compare the resulting
   permutation with the first diagram's. That is the standard Wick rule and it
   reproduces the known minus signs in Bhabha and Moller without being told. */

const SUBS = ['₁', '₂', '₃', '₄'];

function legType(leg) {
  const P = PARTICLES[leg.particle];
  if (P.kind === 'boson') return 'boson';
  const isFerm = P.kind === 'fermion';
  if (leg.role === 'out' && isFerm) return 'bar';      // u-bar
  if (leg.role === 'in' && !isFerm) return 'bar';      // v-bar
  return 'nonbar';                                     // u (in fermion) or v (out antifermion)
}

function legSymbol(leg) {
  const P = PARTICLES[leg.particle];
  const sub = SUBS[leg.idx];
  if (P.kind === 'boson') {
    return leg.role === 'in' ? `ε(k${sub})` : `ε*(k${sub})`;
  }
  if (P.kind === 'fermion') return leg.role === 'in' ? `u(p${sub})` : `ū(p${sub})`;
  return leg.role === 'in' ? `v̄(p${sub})` : `v(p${sub})`;
}

/* Wavefunction for one external leg at a given helicity. */
function wavefunction(leg, p, lambda) {
  const P = PARTICLES[leg.particle];
  const m = P.mass;
  if (P.kind === 'boson') {
    const eps = polVector(p, lambda);
    return leg.role === 'in' ? eps : conjVector(eps);
  }
  const type = legType(leg);
  if (P.kind === 'fermion') {
    return leg.role === 'in' ? uSpinor(p, m, lambda) : barSpinor(uSpinor(p, m, lambda));
  }
  return leg.role === 'in' ? barSpinor(vSpinor(p, m, lambda)) : vSpinor(p, m, lambda);
}

/* --- fermion chains and the relative sign --- */

/* For one diagram, return the list of chains as [barLegIdx, nonbarLegIdx]. */
function fermionChains(diagram) {
  const { legs, internal } = diagram;
  const chains = [];

  if (PARTICLES[internal].kind === 'boson') {
    for (const pair of [diagram.legsA, diagram.legsB]) {
      const bar = pair.find((i) => legType(legs[i]) === 'bar');
      const non = pair.find((i) => legType(legs[i]) === 'nonbar');
      chains.push([bar, non]);
    }
  } else {
    // Internal fermion: a single chain running through both vertices.
    const all = [...diagram.legsA, ...diagram.legsB];
    const bar = all.find((i) => legType(legs[i]) === 'bar');
    const non = all.find((i) => legType(legs[i]) === 'nonbar');
    chains.push([bar, non]);
  }
  chains.sort((x, y) => x[0] - y[0]); // deterministic; swapping whole chains is an even permutation
  return chains;
}

function chainSequence(diagram) {
  return fermionChains(diagram).flat();
}

/* Parity of the permutation taking `ref` to `seq`. */
function permutationSign(seq, ref) {
  const pos = seq.map((x) => ref.indexOf(x));
  const seen = new Array(pos.length).fill(false);
  let sign = 1;
  for (let i = 0; i < pos.length; i++) {
    if (seen[i]) continue;
    let len = 0, j = i;
    while (!seen[j]) { seen[j] = true; j = pos[j]; len++; }
    if (len % 2 === 0) sign = -sign;
  }
  return sign;
}

function assignSigns(diagrams) {
  if (!diagrams.length) return;
  const ref = chainSequence(diagrams[0]);
  diagrams.forEach((d) => { d.sign = permutationSign(chainSequence(d), ref); });
}

/* --- the amplitude itself --- */

/* One diagram, one helicity configuration -> complex number.
   `override` optionally replaces the wavefunction of a given leg; the Ward
   identity check uses it to substitute a photon's polarization by its own
   momentum, which must make the summed amplitude vanish. */
function diagramAmplitude(diagram, momenta, helicities, override = null) {
  const { legs, internal } = diagram;
  const q = internalMomentum(diagram, momenta);
  const q2 = dotReal(q, q);
  const e = E_CHARGE;

  const wf = (i) =>
    override && override[i] ? override[i] : wavefunction(legs[i], momenta[i], helicities[i]);

  let amp;

  if (PARTICLES[internal].kind === 'boson') {
    // Two fermion currents joined by -i g_mu_nu / q^2.
    const build = (pair, vertex) => {
      const bi = pair.find((i) => legType(legs[i]) === 'bar');
      const ni = pair.find((i) => legType(legs[i]) === 'nonbar');
      const J = current(wf(bi), wf(ni));
      // vertex factor i Q e
      return J.map((c) => cmul(c, C(0, vertex.coupling * e)));
    };
    const JA = build(diagram.legsA, diagram.vertexA);
    const JB = build(diagram.legsB, diagram.vertexB);
    /* -i g_mu_nu / q^2, optionally dressed by the resummed one-loop vacuum
       polarization bubble chain — which is exactly what promotes alpha to
       alpha(q^2). See alpha.js. */
    const vp = USE_RUNNING_ALPHA ? vacuumPolarizationFactor(q2) : 1;
    const prop = C(0, -vp / q2); // -i / q^2
    amp = cmul(dotMink(JA, JB), prop);
  } else {
    // Internal fermion: bar . (vertex) . propagator . (vertex) . nonbar
    const m = PARTICLES[internal].mass;
    const all = [...diagram.legsA, ...diagram.legsB];
    const bi = all.find((i) => legType(legs[i]) === 'bar');
    const ni = all.find((i) => legType(legs[i]) === 'nonbar');
    const inA = diagram.legsA.includes(ni);
    const nonbarVertexLegs = inA ? diagram.legsA : diagram.legsB;
    const barVertexLegs = inA ? diagram.legsB : diagram.legsA;
    const vtx = inA ? diagram.vertexA : diagram.vertexB;

    const photonAtNonbar = nonbarVertexLegs.find((i) => i !== ni);
    const photonAtBar = barVertexLegs.find((i) => i !== bi);

    // Momentum flowing along the fermion line, out of the nonbar vertex.
    let qf = [0, 0, 0, 0];
    for (const i of nonbarVertexLegs) {
      const s = legs[i].role === 'in' ? 1 : -1;
      qf = addReal(qf, momenta[i].map((x) => s * x));
    }
    const qf2 = dotReal(qf, qf);

    const num = matAdd(slashReal(qf), matScale(matId(), C(m, 0)));
    const propMat = matScale(num, C(0, 1 / (qf2 - m * m))); // i (q-slash + m)/(q^2 - m^2)

    const vFactor = C(0, vtx.coupling * e); // i Q e
    const gEpsNonbar = matScale(slash(wf(photonAtNonbar)), vFactor);
    const gEpsBar = matScale(slash(wf(photonAtBar)), vFactor);

    const M = matMul(gEpsBar, matMul(propMat, gEpsNonbar));
    amp = rowCol(rowMat(wf(bi), M), wf(ni));
  }

  return cscale(amp, diagram.sign);
}

/* TeX source for one external leg's wavefunction. Emitting TeX rather than
   pre-composed Unicode is what lets the subscripts, bars and Dirac slashes be
   typeset properly instead of approximated with combining characters. */
function legSymbolTex(leg, slashed = false) {
  const P = PARTICLES[leg.particle];
  const n = leg.idx + 1;
  if (P.kind === 'boson') {
    const base = slashed ? '\\slashed{\\epsilon}' : '\\epsilon';
    return leg.role === 'in' ? `${base}(k_${n})` : `${base}^*(k_${n})`;
  }
  if (P.kind === 'fermion') {
    return leg.role === 'in' ? `u(p_${n})` : `\\bar{u}(p_${n})`;
  }
  return leg.role === 'in' ? `\\bar{v}(p_${n})` : `v(p_${n})`;
}

/* The amplitude of one diagram, as TeX. This is a faithful transcription of
   what the code actually contracts, not a simplified closed form. */
function diagramExpression(diagram) {
  const { legs, internal } = diagram;
  const sgn = diagram.sign < 0 ? '−' : '+';
  const denom = diagram.channel;

  if (PARTICLES[internal].kind === 'boson') {
    const part = (pair) => ({
      bi: pair.find((i) => legType(legs[i]) === 'bar'),
      ni: pair.find((i) => legType(legs[i]) === 'nonbar'),
    });
    const A = part(diagram.legsA), B = part(diagram.legsB);
    return {
      sign: sgn,
      tex:
        `(ie)^2 \\left[ ${legSymbolTex(legs[A.bi])} \\gamma^\\mu ${legSymbolTex(legs[A.ni])} \\right]` +
        ` \\frac{-i g_{\\mu\\nu}}{${denom}} ` +
        `\\left[ ${legSymbolTex(legs[B.bi])} \\gamma^\\nu ${legSymbolTex(legs[B.ni])} \\right]`,
      propagatorTex: `\\frac{-i g_{\\mu\\nu}}{${denom}}`,
      internalLabel: PARTICLES[internal].label,
      internalTex: PARTICLES[internal].tex,
    };
  }

  const all = [...diagram.legsA, ...diagram.legsB];
  const bi = all.find((i) => legType(legs[i]) === 'bar');
  const ni = all.find((i) => legType(legs[i]) === 'nonbar');
  const inA = diagram.legsA.includes(ni);
  const pNon = (inA ? diagram.legsA : diagram.legsB).find((i) => i !== ni);
  const pBar = (inA ? diagram.legsB : diagram.legsA).find((i) => i !== bi);

  return {
    sign: sgn,
    tex:
      `(ie)^2 \\, ${legSymbolTex(legs[bi])} \\, ${legSymbolTex(legs[pBar], true)} ` +
      `\\frac{i(\\slashed{q} + m)}{q^2 - m^2} ` +
      `${legSymbolTex(legs[pNon], true)} \\, ${legSymbolTex(legs[ni])}`,
    propagatorTex: `\\frac{i(\\slashed{q} + m)}{q^2 - m^2}`,
    internalLabel: PARTICLES[internal].label,
    internalTex: PARTICLES[internal].tex,
  };
}

/* --- spin sums --- */

function helicityStates(leg) {
  return [+1, -1]; // both fermions and physical photons have two states
}

function initialDof(reaction) {
  return reaction.in.reduce((acc, p) => acc * 2, 1);
}

/* Full evaluation at one phase-space point. */
function evaluate(reaction, diagrams, kin) {
  const momenta = kin.p;
  const legs = diagrams[0].legs;
  const nd = diagrams.length;

  let total = 0;
  const perDiagram = new Array(nd).fill(0);
  const rows = [];

  const combos = [];
  const rec = (i, acc) => {
    if (i === 4) { combos.push([...acc]); return; }
    for (const h of helicityStates(legs[i])) { acc.push(h); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);

  for (const hel of combos) {
    const amps = diagrams.map((d) => diagramAmplitude(d, momenta, hel));
    let sum = C();
    amps.forEach((a, k) => {
      sum = cadd(sum, a);
      perDiagram[k] += cabs2(a);
    });
    const w = cabs2(sum);
    total += w;
    rows.push({ hel: [...hel], amp: sum, weight: w });
  }

  const dof = initialDof(reaction);
  const interference = total - perDiagram.reduce((a, b) => a + b, 0);

  return {
    m2sum: total,
    m2avg: total / dof,
    perDiagram: perDiagram.map((x) => x / dof),
    interference: interference / dof,
    dof,
    rows,
  };
}
