/* TRACE — parser for user-entered reactions.

   Because topology generation is driven by the model rather than hardcoded per
   process, any 2 -> 2 combination of the known particles can be fed straight
   into the same pipeline. This file only has to turn a string into two lists
   and reject what is obviously impossible before the generator runs. */

const PARTICLE_ALIASES = {
  'e-': 'e-', 'e+': 'e+', 'electron': 'e-', 'positron': 'e+', 'elettrone': 'e-', 'positrone': 'e+',
  'mu-': 'mu-', 'mu+': 'mu+', 'μ-': 'mu-', 'μ+': 'mu+', 'muon': 'mu-', 'muone': 'mu-',
  'tau-': 'tau-', 'tau+': 'tau+', 'τ-': 'tau-', 'τ+': 'tau+',
  'a': 'A', 'g': 'A', 'gamma': 'A', 'γ': 'A', 'photon': 'A', 'fotone': 'A',
};

class ReactionError extends Error {
  constructor(key, ...args) {
    super(key);
    this.key = key;
    this.args = args;
  }
  localized() { return t(this.key, ...this.args); }
}

function normalizeToken(tok) {
  const k = tok.trim().toLowerCase();
  if (!k) return null;
  const p = PARTICLE_ALIASES[k];
  if (!p) throw new ReactionError('err.unknown', tok.trim());
  return p;
}

/* Split on whitespace and commas only — never on "+", which is part of "e+".
   A lone "+" used as a separator ("e- + e+") is dropped. */
function splitSide(side) {
  return side
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s && s !== '+');
}

/* "e- e+ > mu- mu+"  ->  { id:'custom', in:[...], out:[...], name:'...' } */
function parseReaction(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new ReactionError('err.parse');

  const parts = raw.split(/->|→|>/);
  if (parts.length !== 2) throw new ReactionError('err.format');

  const inTok = splitSide(parts[0]);
  const outTok = splitSide(parts[1]);

  if (inTok.length !== 2 || outTok.length !== 2) {
    throw new ReactionError('err.count', inTok.length, outTok.length);
  }

  const inP = inTok.map(normalizeToken);
  const outP = outTok.map(normalizeToken);

  const qIn = inP.reduce((a, p) => a + PARTICLES[p].charge, 0);
  const qOut = outP.reduce((a, p) => a + PARTICLES[p].charge, 0);
  if (qIn !== qOut) throw new ReactionError('err.charge', qIn, qOut);

  const label = (l) => l.map((p) => PARTICLES[p].label).join('');
  return {
    id: 'custom',
    name: `${label(inP)} → ${label(outP)}`,
    in: inP,
    out: outP,
    custom: true,
  };
}

/* Canonical text form, for round-tripping a preset into the input box. */
function reactionToString(r) {
  return `${r.in.join(' ')} > ${r.out.join(' ')}`;
}
