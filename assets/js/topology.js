/* TRACE — tree-level topology generation.

   For a 2 -> 2 process built from cubic vertices only, every tree diagram has
   exactly two vertices and one internal line. So the whole enumeration is:
   partition the four external legs into two pairs, and ask the model whether
   some internal species can join them. The three partitions are the familiar
   s, t and u channels — but nothing here is hardcoded to QED: which of the
   three survive, and what runs in the propagator, comes out of VERTICES.

   Legs are matched in the ALL-INCOMING convention (an outgoing particle is an
   incoming antiparticle), which is what makes the vertex lookup uniform. */

const PARTITIONS = [
  { pairA: [0, 1], pairB: [2, 3], channel: 's' },
  { pairA: [0, 2], pairB: [1, 3], channel: 't' },
  { pairA: [0, 3], pairB: [1, 2], channel: 'u' },
];

/* Build the external-leg descriptors for a reaction. */
function externalLegs(reaction) {
  const legs = [];
  reaction.in.forEach((p, k) => {
    legs.push({ idx: legs.length, particle: p, role: 'in', slot: `in${k + 1}`, inSpecies: p });
  });
  reaction.out.forEach((p, k) => {
    legs.push({ idx: legs.length, particle: p, role: 'out', slot: `out${k + 1}`, inSpecies: anti(p) });
  });
  return legs;
}

/* Enumerate the diagrams. Returns [] if the process does not exist at this order. */
function generateDiagrams(reaction) {
  const legs = externalLegs(reaction);
  const diagrams = [];

  for (const part of PARTITIONS) {
    const [a, b] = part.pairA;
    const [c, d] = part.pairB;

    // Try every species the model knows as the internal line.
    for (const X of Object.keys(PARTICLES)) {
      // Vertex A sees legs a, b incoming and the internal line flowing OUT of it
      // towards B, i.e. incoming as its antiparticle.
      const vA = findVertex([legs[a].inSpecies, legs[b].inSpecies, anti(X)]);
      if (!vA) continue;
      const vB = findVertex([legs[c].inSpecies, legs[d].inSpecies, X]);
      if (!vB) continue;

      diagrams.push({
        channel: part.channel,
        legsA: [a, b],
        legsB: [c, d],
        internal: X,
        vertexA: vA,
        vertexB: vB,
        legs,
      });
      break; // one internal species per partition is enough in QED
    }
  }
  return diagrams;
}

/* Momentum flowing through the internal line: sum of the physical momenta
   entering vertex A (incoming legs count +p, outgoing legs count -p). */
function internalMomentum(diagram, momenta) {
  let q = [0, 0, 0, 0];
  for (const i of diagram.legsA) {
    const sign = diagram.legs[i].role === 'in' ? 1 : -1;
    q = addReal(q, momenta[i].map((x) => sign * x));
  }
  return q;
}
