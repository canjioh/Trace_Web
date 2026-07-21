/* TRACE — mathematics typesetting.

   This used to be a hand-written typesetter. It produced correct markup but
   never looked like TeX, because looking like TeX means TeX's metrics: the
   italic corrections, the script sizes and shifts, the spacing classes between
   atom types, the Computer Modern glyph shapes. Reimplementing those well is a
   project in itself, so the honest move is to use the real thing.

   MathJax's SVG build is used rather than its HTML-CSS build, or KaTeX, for one
   specific reason: it draws glyphs as SVG paths and therefore needs NO font
   files. That keeps the site a set of static files that work from disk with
   nothing fetched at runtime — the property the whole project is built around.
   The price is a 2.1 MB script, which is stated plainly in the colophon rather
   than hidden.

   Everything is rendered through here; the rest of the code only ever hands
   over LaTeX source. */

window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: false,
    macros: {
      /* Feynman slash. The `slashed` package is not part of MathJax, so define
         it: a zero-width solidus laid over the following symbol. */
      slashed: ['{\\rlap{\\hspace{0.08em}/}#1}', 1],
      /* Shorthands used throughout the theory text. */
      Msq: '{\\langle|\\mathcal{M}|^2\\rangle}',
      dd: '{\\mathrm{d}}',
    },
  },
  svg: {
    fontCache: 'global',
    displayAlign: 'center',
    scale: 1.02,
  },
  options: {
    /* Nothing is typeset until we ask: content is inserted dynamically and we
       want a single pass per update rather than a document-wide scan. */
    enableMenu: false,
    renderActions: { addMenu: [] },
  },
  startup: {
    typeset: false,
    ready() {
      MathJax.startup.defaultReady();
      MATH_READY = true;
      // Anything queued before MathJax finished loading gets typeset now.
      if (pendingRoots.length) {
        const roots = pendingRoots.splice(0);
        MathJax.typesetPromise(roots).catch(() => {});
      }
    },
  },
};

let MATH_READY = false;
const pendingRoots = [];

/* Inline maths, as a string to embed in HTML being built. */
function tex(src) {
  return `<span class="math-inline">\\(${src}\\)</span>`;
}

/* Display maths, centred on its own line. */
function texBlock(src) {
  return `<div class="math-display">\\[${src}\\]</div>`;
}

/* Several equations with their relation symbols aligned in a column.
   Lines are separated by "\\"; the alignment marker is inserted automatically
   before the first top-level relation of each line, so callers write ordinary
   LaTeX and do not have to think about "&". */
function texAlign(src) {
  const lines = String(src)
    .split(/\\\\/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map(markAlignment);
  return `<div class="math-display">\\[\\begin{aligned}${lines.join(' \\\\ ')}\\end{aligned}\\]</div>`;
}

/* Insert "&" before the first relation symbol that is not nested in braces. */
function markAlignment(line) {
  if (line.includes('&')) return line;
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '\\') {
      const m = /^\\(to|approx|simeq|equiv|neq|leq|geq|Rightarrow|rightarrow|Leftrightarrow)\b/.exec(
        line.slice(i)
      );
      if (m && depth === 0) return `${line.slice(0, i)}&${line.slice(i)}`;
      i++; // skip the escaped character
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '=' && depth === 0) return `${line.slice(0, i)}&${line.slice(i)}`;
  }
  return `&${line}`;
}

/* Turn the declarative attributes into maths, then typeset the subtree.
   Safe to call repeatedly and before MathJax has finished loading. */
function typesetAll(root = document) {
  root.querySelectorAll('[data-tex]').forEach((el) => {
    el.innerHTML = tex(el.dataset.tex);
  });
  root.querySelectorAll('[data-tex-block]').forEach((el) => {
    el.innerHTML = texBlock(el.dataset.texBlock);
  });
  root.querySelectorAll('[data-tex-align]').forEach((el) => {
    el.innerHTML = texAlign(el.dataset.texAlign);
  });
  typesetMath(root);
}

/* Typeset a subtree that already contains \( \) or \[ \] delimiters. */
function typesetMath(root = document) {
  const node = root === document ? document.body : root;
  if (!MATH_READY) {
    pendingRoots.push(node);
    return;
  }
  MathJax.typesetClear([node]);
  MathJax.typesetPromise([node]).catch(() => {});
}
