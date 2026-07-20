/* TRACE — a small TeX-subset typesetter.

   Why not MathJax or KaTeX: both are excellent, but both are a megabyte-plus
   dependency, and the whole page currently ships as a handful of files with
   nothing fetched. What TRACE actually needs is the notation of the Feynman
   rules — superscripts, subscripts, bars, Dirac slashes, fractions, Greek, a
   few delimiters — which is a small enough grammar to typeset properly by hand
   with HTML and CSS.

   Supported:
     ^{..} _{..}            super/subscript (braces optional for one token)
     \frac{..}{..}          built fraction with a real rule
     \bar{..} \overline{..} overline
     \slashed{..} \sl{..}   Dirac slash (combining solidus)
     \sqrt{..}              radical
     \hat{..} \vec{..}      accents
     \left( \right) etc.    stretchy-ish delimiters
     \mathcal{M}            script capitals
     \text{..} \mathrm{..}  upright text
     Greek, \sum \int \partial \pm \mp \cdot \times \to \approx \neq \leq \geq
     \langle \rangle \infty \alpha(..) etc.

   Everything else passes through as an ordinary symbol. Unknown commands are
   rendered literally rather than silently dropped, so mistakes are visible. */

const TEX_SYMBOLS = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ',
  nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ',
  phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  sum: '∑', prod: '∏', int: '∫', partial: '∂', nabla: '∇', infty: '∞',
  pm: '±', mp: '∓', cdot: '·', times: '×', div: '÷', ast: '∗',
  to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', mapsto: '↦',
  approx: '≈', simeq: '≃', sim: '∼', neq: '≠', equiv: '≡',
  leq: '≤', geq: '≥', ll: '≪', gg: '≫', propto: '∝',
  langle: '⟨', rangle: '⟩', dagger: '†', star: '⋆', prime: '′',
  in: '∈', subset: '⊂', forall: '∀', exists: '∃',
  quad: ' ', qquad: '  ', ',': ' ', ';': ' ', '!': '',
};

/* Explicit spacing. These cannot be ordinary space characters: HTML collapses
   runs of whitespace, so \quad and \, would come out as the same thin gap.
   They become inline-blocks of a set width instead. */
const TEX_SPACING = {
  ',': '0.17em',
  ':': '0.22em',
  ';': '0.28em',
  quad: '1em',
  qquad: '2em',
  '!': '-0.17em',
};
delete TEX_SYMBOLS.quad;
delete TEX_SYMBOLS.qquad;
delete TEX_SYMBOLS[','];
delete TEX_SYMBOLS[';'];
delete TEX_SYMBOLS['!'];

/* Ellipses and the like. Kept separate only for readability. */
TEX_SYMBOLS.ldots = '…';
TEX_SYMBOLS.cdots = '⋯';
TEX_SYMBOLS.dots = '…';

/* Function names are set upright, not italic: "cos", not a product c·o·s. */
const TEX_FUNCTIONS = new Set([
  'cos', 'sin', 'tan', 'cot', 'sec', 'csc', 'arccos', 'arcsin', 'arctan',
  'cosh', 'sinh', 'tanh', 'log', 'ln', 'exp', 'lim', 'det', 'max', 'min',
  'Re', 'Im', 'tr', 'Tr', 'arg',
]);

const TEX_ACCENTS = { bar: 'overline', overline: 'overline', hat: 'hat', vec: 'vec', tilde: 'tilde' };

function texEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* --- tokenizer --- */

function texTokenize(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+|.)/.exec(src.slice(i));
      out.push({ type: 'cmd', value: m[1] });
      i += m[0].length;
    } else if (c === '{' || c === '}' || c === '^' || c === '_') {
      out.push({ type: c });
      i += 1;
    } else if (c === ' ') {
      out.push({ type: 'space' });
      i += 1;
    } else {
      out.push({ type: 'char', value: c });
      i += 1;
    }
  }
  return out;
}

/* --- parser: returns a list of rendered HTML fragments --- */

function texParse(tokens, state) {
  const parts = [];
  while (state.i < tokens.length) {
    const tk = tokens[state.i];
    if (tk.type === '}') break;

    if (tk.type === '^' || tk.type === '_') {
      state.i += 1;
      const inner = texGroup(tokens, state);
      const tag = tk.type === '^' ? 'sup' : 'sub';
      parts.push(`<${tag}>${inner}</${tag}>`);
      continue;
    }
    parts.push(texAtom(tokens, state));
  }
  return parts.join('');
}

/* Consume one group: {...} or a single atom. */
function texGroup(tokens, state) {
  while (tokens[state.i] && tokens[state.i].type === 'space') state.i += 1;
  const tk = tokens[state.i];
  if (!tk) return '';
  if (tk.type === '{') {
    state.i += 1;
    const inner = texParse(tokens, state);
    if (tokens[state.i] && tokens[state.i].type === '}') state.i += 1;
    return inner;
  }
  return texAtom(tokens, state);
}

function texAtom(tokens, state) {
  const tk = tokens[state.i];

  if (tk.type === 'space') { state.i += 1; return ' '; }

  if (tk.type === '{') {
    state.i += 1;
    const inner = texParse(tokens, state);
    if (tokens[state.i] && tokens[state.i].type === '}') state.i += 1;
    return inner;
  }

  if (tk.type === 'char') {
    state.i += 1;
    const c = tk.value;
    if (/[0-9]/.test(c)) return `<span class="tx-num">${c}</span>`;
    if (/[a-zA-Z]/.test(c)) return `<span class="tx-var">${c}</span>`;
    /* <wbr> offers a break opportunity after a binary operator, so a long
       display formula wraps the way a typesetter would break it rather than
       overflowing its box. It has no effect when the line fits. */
    if (/[+\-=<>]/.test(c)) return `<span class="tx-op">${texEscape(c === '-' ? '−' : c)}</span><wbr>`;
    return texEscape(c);
  }

  // command
  state.i += 1;
  const name = tk.value;

  if (name === 'frac' || name === 'tfrac') {
    const num = texGroup(tokens, state);
    const den = texGroup(tokens, state);
    return `<span class="tx-frac"><span class="tx-num-part">${num}</span><span class="tx-den">${den}</span></span>`;
  }

  if (TEX_ACCENTS[name]) {
    const inner = texGroup(tokens, state);
    return `<span class="tx-acc tx-${TEX_ACCENTS[name]}">${inner}</span>`;
  }

  if (name === 'slashed' || name === 'sl') {
    const inner = texGroup(tokens, state);
    return `<span class="tx-slashed">${inner}</span>`;
  }

  if (name === 'sqrt') {
    const inner = texGroup(tokens, state);
    return `<span class="tx-sqrt"><span class="tx-radic">√</span><span class="tx-rad">${inner}</span></span>`;
  }

  if (name === 'mathcal') {
    const inner = texGroup(tokens, state);
    const map = { M: 'ℳ', L: 'ℒ', H: 'ℋ', O: '𝒪', A: '𝒜' };
    const plain = inner.replace(/<[^>]*>/g, '');
    return `<span class="tx-cal">${map[plain] || inner}</span>`;
  }

  if (name === 'text' || name === 'mathrm' || name === 'operatorname') {
    const inner = texGroup(tokens, state);
    return `<span class="tx-text">${inner.replace(/<span class="tx-var">([a-zA-Z])<\/span>/g, '$1')}</span>`;
  }

  if (name === 'left' || name === 'right') {
    const next = tokens[state.i];
    if (next) {
      state.i += 1;
      const ch = next.type === 'cmd' ? TEX_SYMBOLS[next.value] || next.value : next.value;
      return `<span class="tx-delim">${texEscape(ch === '.' ? '' : ch)}</span>`;
    }
    return '';
  }

  if (Object.prototype.hasOwnProperty.call(TEX_SPACING, name)) {
    return `<span class="tx-space" style="width:${TEX_SPACING[name]}"></span>`;
  }

  if (TEX_FUNCTIONS.has(name)) {
    return `<span class="tx-text">${name}</span>`;
  }

  if (Object.prototype.hasOwnProperty.call(TEX_SYMBOLS, name)) {
    const sym = TEX_SYMBOLS[name];
    const isOp = /[±∓·×÷→←⇒↦≈≃∼≠≡≤≥≪≫∝∗]/.test(sym);
    return isOp ? `<span class="tx-op">${sym}</span><wbr>` : `<span class="tx-sym">${sym}</span>`;
  }

  // Unknown command: show it rather than swallow it.
  return `<span class="tx-unknown">\\${texEscape(name)}</span>`;
}

/* Public: render a TeX-subset string to HTML. */
function tex(src) {
  const tokens = texTokenize(String(src));
  const state = { i: 0 };
  return `<span class="tx">${texParse(tokens, state)}</span>`;
}

/* Display (block, centred) form. */
function texBlock(src) {
  return `<span class="tx tx-display">${texParse(texTokenize(String(src)), { i: 0 })}</span>`;
}

/* Walk the DOM and typeset anything marked up for it:
     <span data-tex="\gamma^\mu"></span>
     <div data-tex-block="..."></div>
   plus $...$ inside elements carrying class "tex-scan". */
function typesetAll(root = document) {
  root.querySelectorAll('[data-tex]').forEach((el) => { el.innerHTML = tex(el.dataset.tex); });
  root.querySelectorAll('[data-tex-block]').forEach((el) => { el.innerHTML = texBlock(el.dataset.texBlock); });
  root.querySelectorAll('.tex-scan').forEach((el) => {
    if (el.dataset.texDone) return;
    el.innerHTML = el.innerHTML.replace(/\$([^$]+)\$/g, (_, m) => tex(m));
    el.dataset.texDone = '1';
  });
}
