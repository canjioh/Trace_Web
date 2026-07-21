/* TRACE — the calculator page.

   Theme, language and navigation live in shell.js; this file owns the reaction,
   the numbers and the plots. It registers PAGE.onLang / PAGE.onTheme so the
   shell can ask it to redraw. */

const state = {
  reaction: REACTIONS[0],
  diagrams: [],
  sqrtS: 20,
  cosTheta: 0.3,
};

const $ = (id) => document.getElementById(id);
const fmt = (x, d = 6) =>
  Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(d - 1) : x.toFixed(d);

const masses = (r) => [...r.in, ...r.out].map((p) => PARTICLES[p].mass);
const identicalFinal = (r) => r.out[0] === r.out[1];

/* --- reaction selection --- */

function initReactionMenu() {
  const sel = $('reaction');
  sel.innerHTML = '';
  REACTIONS.forEach((r) => {
    const o = document.createElement('option');
    o.value = r.id;
    o.textContent = r.name;
    sel.appendChild(o);
  });
  if (!state.reaction.custom) sel.value = state.reaction.id;
}

function useReaction(r) {
  state.reaction = r;
  const thr = threshold(masses(r));
  if (state.sqrtS <= thr * 1.02) setSqrtS(Math.max(thr * 1.5, 1));
  $('customInput').value = reactionToString(r);
  $('customError').innerHTML = '';
  rebuild();
}

function submitCustom() {
  const box = $('customError');
  try {
    const r = parseReaction($('customInput').value);
    box.innerHTML = '';
    $('reaction').value = '';
    useReaction(r);
  } catch (e) {
    if (e instanceof ReactionError) box.innerHTML = e.localized();
    else throw e;
  }
}

function setSqrtS(v) {
  state.sqrtS = v;
  $('sqrtS').value = Number(v.toPrecision(6));
  $('sqrtSslider').value = Math.log10(v);
  $('sqrtSecho').textContent = `${v.toPrecision(4)} GeV`;
}

function setCos(v) {
  state.cosTheta = v;
  $('cosSlider').value = v;
  $('cosEcho').textContent = v.toFixed(3);
}

function rebuild() {
  state.diagrams = generateDiagrams(state.reaction);
  assignSigns(state.diagrams);
  $('reactionName').textContent = state.reaction.name;
  $('note').textContent = reactionNote(state.reaction.custom ? 'custom' : state.reaction.id);
  renderDiagrams();
  renderLoops();
  recompute();
}

/* --- diagrams --- */

function renderDiagrams() {
  const host = $('diagrams');
  host.innerHTML = '';
  $('ndiag').textContent = state.diagrams.length;

  if (!state.diagrams.length) {
    host.innerHTML = `<p class="empty">${t('diag.none')}</p>`;
    return;
  }

  state.diagrams.forEach((d, i) => {
    const expr = diagramExpression(d);
    const card = document.createElement('figure');
    card.className = 'diagram';
    const lhs = `\\mathcal{M}_${d.channel} = ${expr.sign === '−' ? '-' : ''}`;
    card.innerHTML = `
      <figcaption class="diagram-head">
        <span class="chan"><span class="pat pat-${i}"></span>${t('diag.channel')} ${d.channel}</span>
        <span class="sign ${d.sign < 0 ? 'neg' : ''}">${t('diag.sign')} ${d.sign < 0 ? '−' : '+'}</span>
      </figcaption>
      <div class="canvas-slot"></div>
      <div class="expr">${texBlock(lhs + expr.tex)}</div>
      <dl class="meta">
        <dt>${t('diag.propagator')}</dt><dd>${tex(expr.propagatorTex)}</dd>
        <dt>${t('diag.internal')}</dt><dd>${tex(expr.internalTex)}</dd>
      </dl>
      <div class="contrib" id="contrib-${i}"></div>`;
    host.appendChild(card);

    const cv = document.createElement('canvas');
    card.querySelector('.canvas-slot').appendChild(cv);
    const w = Math.min(340, card.clientWidth - 32);
    renderDiagram(cv, d, { width: w, height: Math.round(w * 0.62) });
  });
}

/* --- one-loop topologies: enumerated and drawn, never evaluated --- */

const LOOP_FAMILIES = [
  { key: 'vacuum-pol', name: 'loops.famVac', desc: 'loops.famVacD', computable: true },
  { key: 'vertex', name: 'loops.famVertex', desc: 'loops.famVertexD', computable: false },
  { key: 'box', name: 'loops.famBox', desc: 'loops.famBoxD', computable: false },
  { key: 'self-energy', name: 'loops.famSelf', desc: 'loops.famSelfD', computable: false },
];

function renderLoops() {
  const host = $('loops');
  if (!state.diagrams.length) {
    host.innerHTML = '';
    $('loopCount').textContent = '';
    return;
  }

  const sum = oneLoopSummary(state.diagrams);
  const pairsPerDiagram = (sum.lineCount * (sum.lineCount + 1)) / 2;
  $('loopCount').textContent = `${sum.total}`;

  let html = `<div class="callout">
      <h4>${t('loops.counting')}</h4>
      <p>${t('loops.countingBody', sum.lineCount, pairsPerDiagram, sum.total, sum.treeCount)}</p>
    </div>
    <div class="callout">
      <h4>${t('loops.drawnNotEvaluated')}</h4>
      <p>${t('loops.drawnBody')}</p>
    </div>`;

  for (const fam of LOOP_FAMILIES) {
    const items = sum.families[fam.key];
    if (!items.length) continue;
    html += `<h3 class="fam-head">
        ${t(fam.name)}
        <span class="fam-tag ${fam.computable ? 'yes' : ''}">${t(fam.computable ? 'loops.computable' : 'loops.shownOnly')}</span>
        <span class="fam-n">${items.length}</span>
      </h3>
      <p class="fam-desc">${t(fam.desc)}</p>
      <div class="loop-grid" data-family="${fam.key}"></div>`;
  }
  html += `<p class="aside">${t('loops.ref')}</p>`;
  host.innerHTML = html;

  // Draw after the grids exist so each canvas can be sized from its container.
  for (const fam of LOOP_FAMILIES) {
    const items = sum.families[fam.key];
    const grid = host.querySelector(`.loop-grid[data-family="${fam.key}"]`);
    if (!grid || !items.length) continue;
    for (const topo of items) {
      const fig = document.createElement('figure');
      fig.className = 'loop-cell';
      fig.innerHTML = `<figcaption>${topo.channel} · ${topo.label}</figcaption>`;
      grid.appendChild(fig);
      const cv = document.createElement('canvas');
      fig.insertBefore(cv, fig.firstChild);
      // Size from the cell the grid actually produced, so the drawing fills it.
      const w = Math.max(130, fig.clientWidth - 14);
      renderLoopDiagram(cv, topo, { width: w, height: Math.round(w * 0.72) });
    }
  }
}

/* --- numbers --- */

/* Total cross section at the current energy, honouring the running-alpha flag. */
function sigmaTotal(R, ms) {
  return (
    (identicalFinal(R) ? 0.5 : 1) *
    GEV2_TO_PB *
    integrateCosTheta((c) => {
      const k = cmKinematics(ms, state.sqrtS, c);
      return dSigmaDOmega(evaluate(R, state.diagrams, k).m2avg, k);
    })
  );
}

function recompute() {
  const R = state.reaction;
  const ms = masses(R);
  const out = $('results');

  if (!state.diagrams.length) {
    out.innerHTML = '';
    $('plotwrap').hidden = true;
    $('orders').innerHTML = '';
    return;
  }

  const thr = threshold(ms);
  if (state.sqrtS <= thr) {
    out.innerHTML = `<p class="warn">${t('res.belowThreshold', thr.toPrecision(5))}</p>`;
    $('plotwrap').hidden = true;
    $('orders').innerHTML = '';
    return;
  }
  $('plotwrap').hidden = false;

  const kin = cmKinematics(ms, state.sqrtS, state.cosTheta);
  const res = evaluate(R, state.diagrams, kin);
  const dsig = dSigmaDOmega(res.m2avg, kin) * GEV2_TO_PB;
  const sigTot = sigmaTotal(R, ms);
  const sumM2 = ms.reduce((a, m) => a + m * m, 0);

  let html = `<h3>${t('res.mandelstam')}</h3><table class="kv">
    <tr><th>s</th><td>${fmt(kin.s)} GeV²</td></tr>
    <tr><th>t</th><td>${fmt(kin.t)} GeV²</td></tr>
    <tr><th>u</th><td>${fmt(kin.u)} GeV²</td></tr>
    <tr><th>${t('res.checkSum')}</th><td>${fmt(kin.s + kin.t + kin.u)} = ${fmt(sumM2)}</td></tr>
    <tr><th>${t('res.pin')}</th><td>${fmt(kin.pi)} GeV</td></tr>
    <tr><th>${t('res.pout')}</th><td>${fmt(kin.pf)} GeV</td></tr>
  </table>`;

  html += `<h3>${t('res.amp')}</h3><table class="kv">
    <tr><th>⟨|ℳ|²⟩</th><td class="hi">${fmt(res.m2avg, 8)}</td></tr>
    <tr><th>${t('res.spinavg')}</th><td>1/${res.dof} · Σ</td></tr>
  </table>`;

  html += `<h3>${t('res.contrib')}</h3><div class="bars">`;
  state.diagrams.forEach((d, i) => {
    html += bar(tex(`|\\mathcal{M}_${d.channel}|^2`), res.perDiagram[i], res.m2avg, `pat-${i}`);
  });
  if (state.diagrams.length > 1) {
    html += bar(t('res.interference'), res.interference, res.m2avg, 'pat-neg');
  }
  html += '</div>';

  html += `<h3>${t('res.xsec')}</h3><table class="kv">
    <tr><th>dσ/dΩ</th><td class="hi">${fmt(dsig, 6)} pb/sr</td></tr>
    <tr><th>σ (|cos θ| &lt; 0.999)</th><td class="hi">${fmt(sigTot, 6)} pb</td></tr>
    ${identicalFinal(R) ? `<tr><th></th><td class="dim">${t('res.identical')}</td></tr>` : ''}
  </table>`;

  out.innerHTML = html;

  state.diagrams.forEach((d, i) => {
    const el = $(`contrib-${i}`);
    if (!el) return;
    const frac = (100 * res.perDiagram[i]) / res.m2avg;
    el.innerHTML = `${tex(`|\\mathcal{M}_${d.channel}|^2`)} = <b>${fmt(res.perDiagram[i], 5)}</b>
      <span class="dim">(${frac.toFixed(1)}% ${t('diag.contribShare')})</span>`;
  });

  drawAngular(R, ms);
  renderOrders(R, ms);
}

function bar(label, value, total, patClass) {
  const frac = Math.min(1, Math.abs(value) / Math.abs(total));
  const pct = (100 * value) / total;
  return `<div class="barrow">
    <div class="barlabel">${label}</div>
    <div class="bartrack"><div class="barfill ${patClass}" style="width:${(frac * 100).toFixed(2)}%"></div></div>
    <div class="barval">${fmt(value, 4)} <span class="dim">${pct.toFixed(1)}%</span></div>
  </div>`;
}

function drawAngular(R, ms) {
  const N = 200;
  const totalPts = [];
  const perPts = state.diagrams.map(() => []);
  for (let i = 0; i <= N; i++) {
    const c = -0.985 + (1.97 * i) / N;
    const k = cmKinematics(ms, state.sqrtS, c);
    if (!k) continue;
    const r = evaluate(R, state.diagrams, k);
    totalPts.push([c, dSigmaDOmega(r.m2avg, k) * GEV2_TO_PB]);
    state.diagrams.forEach((d, j) => perPts[j].push([c, dSigmaDOmega(r.perDiagram[j], k) * GEV2_TO_PB]));
  }

  const series = [];
  if (state.diagrams.length > 1) {
    state.diagrams.forEach((d, j) => {
      series.push({ pts: perPts[j], dash: DASH_PATTERNS[j % DASH_PATTERNS.length], width: 1.1, alpha: 0.75 });
    });
  }
  series.push({ pts: totalPts, width: 2 });

  renderPlot($('plot'), series, { width: $('plot').parentElement.clientWidth, height: 340 });

  $('legend').innerHTML =
    (state.diagrams.length > 1
      ? state.diagrams.map((d, j) => `<span><i class="pat pat-${j}"></i>${t('plot.only')} ${d.channel}</span>`).join('')
      : '') + `<span><i class="pat pat-total"></i>${t('plot.total')}</span>`;
}

/* --- higher orders: the running coupling --- */

function renderOrders(R, ms) {
  const host = $('orders');
  const s = state.sqrtS * state.sqrtS;
  const dLep = deltaAlphaLeptonic(s);
  const alphaS = ALPHA_EM / (1 - dLep);

  /* Measure the effect by computing sigma both ways, rather than quoting a
     scaling rule: for t/u-channel processes each propagator runs with its own
     momentum transfer, so the shift is not simply (alpha(s)/alpha)^2. */
  const wasOn = USE_RUNNING_ALPHA;
  setRunningAlpha(false);
  const sigTree = sigmaTotal(R, ms);
  setRunningAlpha(true);
  const sigRun = sigmaTotal(R, ms);
  setRunningAlpha(wasOn);

  const shift = (100 * (sigRun - sigTree)) / sigTree;
  const zCheck = checkRunningAlpha();

  host.innerHTML = `
    <h3>${t('orders.table')}</h3>
    <table class="kv">
      <tr><th>${t('orders.alpha0')}</th><td>${(1 / ALPHA_EM).toFixed(5)}</td></tr>
      <tr><th>${t('orders.deltaLep')}</th><td>${dLep.toExponential(5)}</td></tr>
      <tr><th>${t('orders.alphaS')}</th><td class="hi">${(1 / alphaS).toFixed(5)}</td></tr>
      <tr><th>${t('orders.effect')}</th><td class="hi">${shift >= 0 ? '+' : ''}${shift.toFixed(3)} %</td></tr>
    </table>

    <h3>${t('orders.zcheck')}</h3>
    <table class="kv">
      <tr><th>${t('orders.zcomputed')}</th><td class="hi">${zCheck.computed.toFixed(6)}</td></tr>
      <tr><th>${t('orders.zref')}</th><td>${zCheck.reference.toFixed(6)}
        <span class="dim">(${(100 * zCheck.worst).toFixed(2)} %)</span></td></tr>
      <tr><th>${t('orders.zhad')}</th><td class="dim">${DELTA_ALPHA_HAD_MZ_REF.toFixed(5)}</td></tr>
      <tr><th>${t('orders.zsum')}</th><td class="hi">${(
        1 / (ALPHA_EM / (1 - zCheck.computed - DELTA_ALPHA_HAD_MZ_REF))
      ).toFixed(3)}</td></tr>
      <tr><th>${t('orders.zpdg')}</th><td>128.95</td></tr>
    </table>
    <p class="aside">${t('orders.higherOrder')}</p>
    <p class="aside">${t('orders.note')}</p>

    <h3>${t('orders.g2title')}</h3>
    <p class="lead">${t('orders.g2lead')}</p>
    ${renderGMinus2()}`;

  typesetAll(host);
}

/* The perturbative series for a_e, order by order, against the measurement. */
function renderGMinus2() {
  const p = gMinus2Prediction();
  const label = { computed: t('orders.g2computed'), analytic: t('orders.g2analytic'), numerical: t('orders.g2numerical') };

  let html = `<div class="scroll-x"><table class="checks series">
    <thead><tr>
      <th>${t('orders.g2order')}</th>
      <th>${t('orders.g2coef')}</th>
      <th>${t('orders.g2term')}</th>
      <th>${t('orders.g2running')}</th>
      <th>${t('orders.g2diff')}</th>
      <th>${t('orders.g2origin')}</th>
    </tr></thead><tbody>`;

  for (const r of p.series) {
    html += `<tr>
      <td class="num">${r.n}</td>
      <td class="num">${r.C.toFixed(9)}</td>
      <td class="num">${r.term.toExponential(4)}</td>
      <td class="num">${r.running.toFixed(14)}</td>
      <td class="num">${r.absDiff.toExponential(2)}</td>
      <td class="${r.source === 'computed' ? 'own' : 'dim'}">${label[r.source]}
        <span class="dim">· ${r.note}</span></td>
    </tr>`;
  }
  html += '</tbody></table></div>';

  html += `<table class="kv">
    <tr><th>${t('orders.g2qed')}</th><td>${p.qed.toFixed(14)}</td></tr>
    <tr><th>${t('orders.g2had')}</th><td class="dim">${p.hadronic.toExponential(3)}</td></tr>
    <tr><th>${t('orders.g2ew')}</th><td class="dim">${p.electroweak.toExponential(3)}</td></tr>
    <tr><th>${t('orders.g2total')}</th><td class="hi">${p.total.toFixed(14)}</td></tr>
    <tr><th>${t('orders.g2exp')}</th><td class="hi">${p.experiment.toFixed(14)}
      <span class="dim">± ${p.experimentUnc.toExponential(1)}</span></td></tr>
  </table>
  <p class="aside">${t('orders.g2note')}</p>
  <div class="callout"><p>${t('orders.g2residual')}</p></div>`;

  return html;
}

/* --- validation --- */

function runValidation() {
  const host = $('validation');
  host.innerHTML = `<p class="dim">${t('val.running')}</p>`;
  setTimeout(() => {
    const checks = runAllChecks();
    const ok = checks.filter((c) => c.pass).length;
    let html = `<table class="checks"><thead><tr>
      <th>${t('val.process')}</th><th>${t('val.test')}</th><th>${t('val.dev')}</th><th>${t('val.result')}</th>
    </tr></thead><tbody>`;
    for (const c of checks) {
      let what, val;
      if (c.kind === 'reference') {
        what = `⟨|ℳ|²⟩ vs <code>${c.formula}</code> @ √s=${c.sqrtS} GeV`;
        val = `${c.worst.toExponential(2)} <span class="dim">(tol ${c.tol.toExponential(1)})</span>`;
      } else if (c.kind === 'ward') {
        what = `${t('val.ward')} (ε<sub>${c.photon}</sub> → k<sub>${c.photon}</sub>)`;
        val = c.ratio.toExponential(2);
      } else if (c.kind === 'g2') {
        what = `${t('orders.g2running')} = ${c.computed.toFixed(12)}
          <span class="dim">— ${t('orders.g2exp')} ${c.reference.toFixed(12)}</span>`;
        val = c.worst.toExponential(2);
      } else {
        what = `${t('orders.zcomputed')} = ${c.computed.toFixed(6)}
          <span class="dim">— ${t('orders.vsLL')} ${(100 * c.quadRel).toFixed(3)} %,
          ${t('orders.vsLit')} ${c.reference.toFixed(6)}</span>`;
        val = `${(100 * c.worst).toFixed(2)} %`;
      }
      html += `<tr><td>${c.reaction.name}</td><td>${what}</td><td class="num">${val}</td>
        <td class="${c.pass ? 'pass' : 'fail'}">${c.pass ? 'PASS' : 'FAIL'}</td></tr>`;
    }
    html += `</tbody></table>
      <p class="verdict ${ok === checks.length ? 'pass' : 'fail'}">${t('val.passed', ok, checks.length)}</p>
      <p class="aside">${t('val.note')}</p>`;
    host.innerHTML = html;
  }, 20);
}

/* --- boot --- */

PAGE.onLang = () => {
  initReactionMenu();
  $('validation').innerHTML = '';
  rebuild();
};
PAGE.onTheme = () => {
  renderDiagrams();
  renderLoops();
  recompute();
};

document.addEventListener('DOMContentLoaded', () => {
  initReactionMenu();

  $('reaction').addEventListener('change', (e) => {
    const r = REACTIONS.find((x) => x.id === e.target.value);
    if (r) useReaction(r);
  });
  $('customGo').addEventListener('click', submitCustom);
  $('customInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitCustom(); });

  $('sqrtS').addEventListener('change', (e) => {
    const v = parseFloat(e.target.value);
    if (v > 0) { setSqrtS(v); recompute(); }
  });
  $('sqrtSslider').addEventListener('input', (e) => { setSqrtS(Math.pow(10, parseFloat(e.target.value))); recompute(); });
  $('cosSlider').addEventListener('input', (e) => { setCos(parseFloat(e.target.value)); recompute(); });
  $('runval').addEventListener('click', runValidation);
  document.querySelectorAll('input[name="order"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (!e.target.checked) return;
      setRunningAlpha(e.target.value === 'vp');
      recompute();
    });
  });

  setSqrtS(state.sqrtS);
  setCos(state.cosTheta);

  bootShell(); // triggers PAGE.onLang, which builds everything

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { renderDiagrams(); renderLoops(); recompute(); }, 150);
  });
});
