/* TRACE — the physics model: particle content and interaction vertices.
   Kept deliberately data-driven, so adding a fermion (or a whole new theory)
   means editing this file and nothing else. */

const ALPHA_EM = 1 / 137.035999084;
const E_CHARGE = Math.sqrt(4 * Math.PI * ALPHA_EM); // e = sqrt(4 pi alpha)

const PARTICLES = {
  'e-':  { name: 'e-',  tex: 'e^-',    label: 'e⁻', mass: 0.000510999, spin: 0.5, charge: -1, anti: 'e+',  kind: 'fermion' },
  'e+':  { name: 'e+',  tex: 'e^+',    label: 'e⁺', mass: 0.000510999, spin: 0.5, charge: +1, anti: 'e-',  kind: 'antifermion' },
  'mu-': { name: 'mu-', tex: '\\mu^-', label: 'μ⁻', mass: 0.1056583755, spin: 0.5, charge: -1, anti: 'mu+', kind: 'fermion' },
  'mu+': { name: 'mu+', tex: '\\mu^+', label: 'μ⁺', mass: 0.1056583755, spin: 0.5, charge: +1, anti: 'mu-', kind: 'antifermion' },
  'tau-':{ name: 'tau-',tex: '\\tau^-',label: 'τ⁻', mass: 1.77686, spin: 0.5, charge: -1, anti: 'tau+', kind: 'fermion' },
  'tau+':{ name: 'tau+',tex: '\\tau^+',label: 'τ⁺', mass: 1.77686, spin: 0.5, charge: +1, anti: 'tau-', kind: 'antifermion' },
  'A':   { name: 'A',   tex: '\\gamma',label: 'γ',  mass: 0, spin: 1, charge: 0, anti: 'A', kind: 'boson' },
};

const anti = (p) => PARTICLES[p].anti;
const isFermionic = (p) => PARTICLES[p].kind === 'fermion' || PARTICLES[p].kind === 'antifermion';

/* Vertices are listed in the all-incoming convention: a vertex exists if the
   multiset of incoming species matches one of these. QED has exactly one
   vertex per charged fermion flavour. */
const VERTICES = [];
for (const f of ['e-', 'mu-', 'tau-']) {
  VERTICES.push({
    legs: [f, anti(f), 'A'],
    flavour: f,
    coupling: PARTICLES[f].charge, // in units of e
    factor: 'i Q e γ^μ',
  });
}

/* Does an all-incoming multiset of three species form a vertex? */
function findVertex(species) {
  const key = [...species].sort().join('|');
  return VERTICES.find((v) => [...v.legs].sort().join('|') === key) || null;
}

/* Reactions offered in the menu. These are shortcuts, not a whitelist: any
   2 -> 2 combination of the particles above can be typed in and will run
   through exactly the same pipeline. Descriptions live in i18n.js. */
const REACTIONS = [
  { id: 'ee_mumu',  name: 'e⁻e⁺ → μ⁻μ⁺',  in: ['e-', 'e+'],  out: ['mu-', 'mu+'] },
  { id: 'ee_tautau',name: 'e⁻e⁺ → τ⁻τ⁺',  in: ['e-', 'e+'],  out: ['tau-', 'tau+'] },
  { id: 'emu',      name: 'e⁻μ⁻ → e⁻μ⁻',  in: ['e-', 'mu-'], out: ['e-', 'mu-'] },
  { id: 'bhabha',   name: 'e⁻e⁺ → e⁻e⁺',  in: ['e-', 'e+'],  out: ['e-', 'e+'] },
  { id: 'moller',   name: 'e⁻e⁻ → e⁻e⁻',  in: ['e-', 'e-'],  out: ['e-', 'e-'] },
  { id: 'compton',  name: 'e⁻γ → e⁻γ',    in: ['e-', 'A'],   out: ['e-', 'A'] },
  { id: 'gg_ee',    name: 'γγ → e⁻e⁺',    in: ['A', 'A'],    out: ['e-', 'e+'] },
];
