/* TRACE — one-loop topology enumeration.

   These diagrams are ENUMERATED AND DRAWN, NOT EVALUATED. The distinction is
   the point, and the interface says so plainly: an individual one-loop diagram
   is divergent and gauge-dependent, so a number attached to it would be
   meaningless. The combinatorics, on the other hand, is exact and instructive.

   The counting follows Griffiths, "Introduction to Elementary Particles",
   §6.6: starting from a tree diagram, the next order is reached by adding one
   internal line joining any two of the existing lines — including a line to
   itself. A 2 -> 2 tree graph has five lines (four external, one internal), so
   the number of ways is

       C(5,2) + 5 = 10 + 5 = 15

   which is Griffiths' 5 + 4 + 3 + 2 + 1. In QED not all fifteen survive,
   because every vertex must be fermion-antifermion-photon: a photon line can
   only be joined to another photon line by way of a fermion loop, and a
   connection is allowed only if both endpoints admit the required vertex. The
   filtering is done by asking the model, exactly as at tree level.

   Diagrams are then classified into the families a textbook names:
     self-energy   loop on an external leg (removed by LSZ, kept here only to
                   be shown and explained)
     vacuum-pol    loop inserted in the internal photon line
     vertex        photon spanning two lines meeting at a vertex
     box           photon spanning two lines not meeting at a vertex */

/* The five lines of a tree diagram, in a fixed order. */
function treeLines(diagram) {
  const lines = diagram.legs.map((leg) => ({
    kind: 'external',
    idx: leg.idx,
    particle: leg.particle,
    species: PARTICLES[leg.particle].kind,
    vertex: diagram.legsA.includes(leg.idx) ? 'A' : 'B',
    label: `${PARTICLES[leg.particle].label}${SUBS[leg.idx]}`,
    /* TeX form, so the caption can be typeset rather than approximated with
       Unicode sub- and superscripts whose metrics do not line up. */
    tex: `${PARTICLES[leg.particle].tex}_{${leg.idx + 1}}`,
  }));
  lines.push({
    kind: 'internal',
    idx: 4,
    particle: diagram.internal,
    species: PARTICLES[diagram.internal].kind,
    vertex: 'AB',
    label: PARTICLES[diagram.internal].label,
    /* Marked as internal: beside a numbered external leg, a bare symbol reads
       as a leg whose number went missing. */
    tex: `${PARTICLES[diagram.internal].tex}_{\\mathrm{int}}`,
  });
  return lines;
}

const isPhotonLine = (l) => l.species === 'boson';
const isFermionLine = (l) => !isPhotonLine(l);

/* Can a photon be attached to this line? Only to a charged fermion line. */
const canEmitPhoton = (l) => isFermionLine(l);

/* Do two lines meet at a common vertex? */
function shareVertex(a, b) {
  if (a.vertex === 'AB' || b.vertex === 'AB') return true;
  return a.vertex === b.vertex;
}

/* Classify the correction produced by joining lines a and b. */
function classifyCorrection(a, b) {
  if (a.idx === b.idx) {
    return a.kind === 'internal' ? 'vacuum-pol' : 'self-energy';
  }
  if (isPhotonLine(a) || isPhotonLine(b)) {
    /* A photon line joined to a fermion line by a further photon is not a
       correction of this shape; in QED the internal photon dresses itself only
       through a fermion loop, which is the vacuum polarization above. */
    return null;
  }
  return shareVertex(a, b) ? 'vertex' : 'box';
}

/* Enumerate the one-loop corrections to a given tree diagram. */
function oneLoopTopologies(diagram) {
  const lines = treeLines(diagram);
  const out = [];
  let considered = 0;

  for (let i = 0; i < lines.length; i++) {
    for (let j = i; j < lines.length; j++) {
      considered++;
      const a = lines[i], b = lines[j];

      /* A photon can only be emitted and absorbed by charged lines. The one
         exception is a line joined to itself: a photon line closing on itself
         is the vacuum polarization, a fermion loop. */
      let family;
      if (i === j) {
        family = isPhotonLine(a) ? (a.kind === 'internal' ? 'vacuum-pol' : null) : 'self-energy';
      } else {
        if (!canEmitPhoton(a) || !canEmitPhoton(b)) family = null;
        else family = classifyCorrection(a, b);
      }

      if (!family) continue;
      out.push({
        family,
        lines: [a, b],
        self: i === j,
        label: i === j ? a.label : `${a.label} · ${b.label}`,
        tex: i === j ? a.tex : `${a.tex} \\cdot ${b.tex}`,
      });
    }
  }
  return { topologies: out, considered, lineCount: lines.length };
}

/* Group by family, for display. */
function oneLoopSummary(diagrams) {
  const families = { 'self-energy': [], 'vacuum-pol': [], vertex: [], box: [] };
  let considered = 0;
  let lineCount = 0;

  for (const d of diagrams) {
    const r = oneLoopTopologies(d);
    considered += r.considered;
    lineCount = r.lineCount;
    for (const topo of r.topologies) {
      families[topo.family].push({ ...topo, channel: d.channel, tree: d });
    }
  }

  const total = Object.values(families).reduce((a, l) => a + l.length, 0);
  return { families, total, considered, lineCount, treeCount: diagrams.length };
}
