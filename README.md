# TRACE

**Tree-level Reaction Amplitude Computation Engine**

*[Versione italiana](README.it.md)*

A Feynman-diagram calculator that runs entirely in the browser. Type a QED
reaction and TRACE enumerates the diagrams, applies the Feynman rules, contracts
the amplitude, and gives you `⟨|ℳ|²⟩` and the cross section — showing the
contribution of each diagram separately, interference term included.

No server, no build step, no dependencies. Open `index.html` and it works.

---

## Why

Drawing tools for Feynman diagrams are everywhere; they do no physics. Serious
amplitude machinery (FeynArts, FeynCalc, FORM, MadGraph) is excellent but lives
in Mathematica or Fortran, and where a web frontend exists it submits a job and
returns numbers rather than a readable per-diagram breakdown.

The gap TRACE aims at is the one in between: something that shows you the
calculation rather than just its answer. It is a teaching instrument, not a
competitor to the research toolchain.

## What it computes

Any 2 → 2 process built from the particles it knows (`e∓`, `μ∓`, `τ∓`, `γ`) can
be typed in directly — `e- e+ > mu- mu+`. The menu is a set of shortcuts, not a
whitelist. Shipped presets:

| Process | Diagrams | Structure |
|---|---|---|
| e⁻e⁺ → μ⁻μ⁺ | 1 | s-channel |
| e⁻e⁺ → τ⁻τ⁺ | 1 | s-channel, mass effects visible near threshold |
| e⁻μ⁻ → e⁻μ⁻ | 1 | t-channel |
| e⁻e⁺ → e⁻e⁺ (Bhabha) | 2 | s + t, relative minus sign |
| e⁻e⁻ → e⁻e⁻ (Møller) | 2 | t + u, identical final state |
| e⁻γ → e⁻γ (Compton) | 2 | s + u, fermion propagator |
| γγ → e⁻e⁺ | 2 | t + u, pair production |

For each: the diagrams as drawn graphs, the amplitude expression, Mandelstam
invariants, the spin-averaged squared amplitude, per-diagram contributions and
interference, `dσ/dΩ`, the integrated cross section, and the angular
distribution.

## How it works

**Topology generation is not hardcoded.** For a 2 → 2 process built from cubic
vertices, every tree diagram has exactly two vertices and one internal line, so
the enumeration reduces to partitioning the four external legs into two pairs and
asking the model which internal species can join them. Legs are matched in the
all-incoming convention. Which of the s, t, u partitions survive falls out of the
vertex list in `model.js` — adding a flavour, or a different theory, means
editing that file and nothing else.

That this is real rather than cosmetic is easiest to see with γγ → e⁻e⁺: the
process was never coded for, yet the generator produces its two diagrams, and
the result agrees with the textbook `2e⁴(u/t + t/u)` to one part in 10¹².

**Amplitudes are numeric, not symbolic.** TRACE builds actual four-component
spinors and 4×4 gamma matrices in the Weyl representation and multiplies them
out, then sums over helicities. This makes `⟨|ℳ|²⟩` exact including all masses,
and avoids needing a computer-algebra engine in the browser. The cost is that you
get numbers rather than a simplified closed form.

**Relative signs are derived, not supplied.** The sign between diagrams comes
from the parity of the permutation of the external fermion labels read off each
fermion chain, compared against a reference diagram. This is the standard Wick
rule, and it reproduces the known minus signs in Bhabha and Møller — and the plus
sign in Compton — without being told about them.

Conventions: metric `(+,−,−,−)`, Weyl basis, Peskin & Schroeder spinor
normalization, Feynman gauge.

## Validation

The checks ship with the tool and run in the page (**Validation → run the
tests**), against the same code that produces the displayed numbers.

- **Reference formulas.** `⟨|ℳ|²⟩` is compared with the textbook massless-limit
  expressions at √s = 500 GeV. Because those formulas hold only up to corrections
  of order `m²/s`, the tolerance is that error budget rather than a fixed number
  — which is why the τ channel is held to a looser bound than the others and
  still passes honestly.
- **Ward identity.** For processes with an external photon, replacing that
  photon's polarization vector by its own momentum must make the *summed*
  amplitude vanish. Individual diagrams do not vanish, so this tests gauge
  invariance, the relative sign, and the propagator numerator at once — with no
  reference value involved. It currently holds to ~3×10⁻¹⁴.

One note on numerics: `sqrt(E − |p|)` must never be evaluated as a literal
subtraction. For an ultrarelativistic electron, `E` and `|p|` agree to ~13 digits
and the difference loses nearly all precision. Using the exact identity
`E − |p| = m²/(E + |p|)` improves the Ward identity from ~10⁻⁸ to ~10⁻¹⁴.

## Beyond lowest order

Lowest order is a choice, not a wall. The **Orders** section of the calculator
computes the one higher-order effect that can be done honestly here: the
**one-loop vacuum polarization**, integrated numerically with no leading-log
approximation and resummed into a running coupling,

```
alpha(q^2) = alpha / (1 - Delta_alpha(q^2))
```

applied to each photon propagator with its own momentum transfer. Switch it on
and the cross section moves by a few percent.

It is checkable, and it checks out:

| quantity | value |
|---|---|
| Δα_lep(M_Z²) computed | 0.031419 |
| analytic leading-log limit (independent cross-check) | 0.031421 |
| literature, all orders | 0.031498 |
| 1/α(M_Z), leptons only | 132.73 |
| **1/α(M_Z), + hadronic from data** | **128.94** |
| PDG | 128.95 |

The remaining 0.25% against the literature leptonic value is not an error: that
value includes two- and three-loop corrections, while one loop is computed here.
The hadronic piece is **not** computed and not faked — quark loops at low q² are
not calculable in perturbation theory and are extracted from e⁺e⁻ → hadrons data
— so it is shown separately and labelled as such.

### Watching the series converge

The **Orders** section also tabulates the perturbative series for the electron
anomalous magnetic moment `a = (g−2)/2`, order by order, against the measured
value — the cleanest place in physics to see an expansion converge:

| order | running total | gap to measurement |
|---|---|---|
| 1 | 0.00116140973289 | 1.76×10⁻⁶ |
| 2 | 0.00115963742782 | 1.48×10⁻⁸ |
| 3 | 0.00115965223203 | 5.14×10⁻¹¹ |
| 4 | 0.00115965217636 | 4.23×10⁻¹² |
| 5 | 0.00115965217681 | 3.78×10⁻¹² |

Only the first coefficient is computed here — Schwinger's `α/2π`, from a single
vertex-correction diagram. The rest are quoted from the literature and labelled
as quoted in the table itself; fourth order alone needs 891 diagrams. The
residual ~2×10⁻¹² is not numerical noise: it tracks *which* measurement of α is
used as input, and the caesium and rubidium determinations disagree at exactly
that level. That is a live tension in the field, and the table says so rather
than rounding it away.

The other one-loop corrections are deliberately absent. Vacuum polarization is
tractable because a chain of bubbles resums into a multiplicative factor on the
propagator. Vertex corrections and boxes do not: they need tensor reduction and
dimensional regularization, and on their own they are infrared divergent. A
finite, comparable-to-experiment one-loop cross section also requires real
soft-photon emission, i.e. computing a different process with an extra particle
in the final state. That is a project of its own, not one more function.

## Limitations

QED only, 2 → 2 only. Amplitudes are tree level; the only higher-order effect
included is the running coupling above, which enters as a dressed propagator
rather than a generated diagram. No vertex corrections, no boxes, no
bremsstrahlung, no QCD colour algebra, no weak currents. The amplitude
expression shown under each diagram is a faithful transcription of what the code
contracts — it is not symbolically simplified.

## Design

Strictly monochrome, in two modes: **paper** (ink on white) and **blackboard**
(chalk on black). No hue anywhere. Curves in the plot and quantities in the bars
are told apart by dash pattern and hatching rather than colour, the way a printed
physics figure does it — which also makes the whole interface colourblind-proof
by construction. Interface available in Italian and English.

## Running it

Any static file server:

```
python -m http.server 8777
```

then open `http://localhost:8777`. Or just open `index.html` directly.

## Deploying

There is nothing to build. Push the folder to a GitHub repository and turn on
Pages, serving from the branch root:

```
git init -b main
git add .
git commit -m "TRACE: tree-level QED Feynman diagram calculator"
git remote add origin https://github.com/<user>/Trace_Web.git
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → main / (root)**. The
site appears at `https://<user>.github.io/Trace_Web/` within a minute or two.

Two things that matter for this to work:

- **`.nojekyll` must stay.** Without it GitHub runs the files through Jekyll,
  which ignores paths beginning with an underscore and can mangle the build.
  The file is already in the repository; it is empty on purpose.
- **All paths are relative.** Nothing links to `/assets/...`, only to
  `assets/...`, which is what lets the site live under the `/Trace_Web/` subpath
  rather than at a domain root. Keep it that way when adding pages.

GitHub Pages caches assets for about ten minutes, so an update may not appear
immediately in a browser that already has the old JavaScript. A hard reload, or
simply waiting, resolves it.

## Layout

Three pages: a cover, a didactic theory section, and the calculator.

```
index.html        cover: animated diagrams, what it is, two doors
theory.html       what a diagram is, what it computes, and how
compute.html      the calculator
assets/css/trace.css
assets/js/
  i18n.js         all user-visible strings, IT + EN
  tex.js          the TeX-subset typesetter
  shell.js        masthead, nav, language and theme, shared by all pages
  complex.js      complex arithmetic, 4x4 complex matrices
  dirac.js        gamma matrices, spinors, polarization vectors
  model.js        particle content and vertices   <- edit to extend the theory
  parse.js        user-entered reaction parsing
  kinematics.js   2->2 CM kinematics, cross sections, quadrature
  topology.js     diagram enumeration
  alpha.js        one-loop vacuum polarization, running coupling
  amplitude.js    Feynman rules, fermion signs, helicity sum
  render.js       diagram drawing
  plot.js         angular distribution
  hero.js         animated cover diagrams
  theory.js       the theory content, IT + EN
  validate.js     self-tests
  app.js          calculator UI
```

## Typesetting the formulas

Rather than pull in MathJax or KaTeX — each a megabyte-plus dependency, against
a page that currently ships as a handful of files and fetches nothing — TRACE
includes a small typesetter for the TeX subset the physics actually needs:
super- and subscripts, built fractions with a real rule, overlines, Dirac
slashes, radicals, Greek and the usual operators. It is about 200 lines and
renders to plain HTML and CSS.

Unknown commands are rendered visibly rather than silently dropped, so a typo
shows up as a typo. If the notation ever outgrows this — matrices, alignment,
big operators with limits — the honest move is to vendor MathJax's single-file
SVG build, which needs no font files and would keep the page self-contained.

## Possible directions

Colour algebra and a QCD vertex; 2 → 3 topologies, which need a genuine graph
enumerator rather than the three-partition shortcut; polarized beams; a symbolic
layer for the trace step so the analytic result can be displayed alongside the
number.

## License

MIT.
