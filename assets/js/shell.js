/* TRACE — shared page shell: masthead, navigation, language and theme toggles.

   Each page registers what it needs re-run when the language or theme changes:
     PAGE.onLang  — called after strings are swapped
     PAGE.onTheme — called after the palette flips (canvases must redraw)
   Anything not registered simply does not happen, so the landing page does not
   drag in the calculator's machinery. */

const PAGE = { onLang: null, onTheme: null };

function currentTheme() {
  return document.documentElement.dataset.theme === 'board' ? 'board' : 'paper';
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('trace-theme', theme);
  if (typeof invalidateInk === 'function') invalidateInk();
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t(theme === 'board' ? 'theme.board' : 'theme.paper');
}

/* Split the wordmark into letters and set one of them in negative. Which letter
   is chosen comes from data-mark on the <h1>, so each page is identifiable at a
   glance. Done in script rather than markup so the word stays a single readable
   string in the HTML source and in the accessibility tree. */
function markWordmark() {
  const h1 = document.querySelector('.wordmark');
  if (!h1 || h1.dataset.built) return;
  const target = h1.querySelector('a') || h1;
  const word = target.textContent.trim();
  const which = parseInt(h1.dataset.mark || '0', 10);
  target.innerHTML = [...word]
    .map((c, i) => `<span class="ltr${i === which ? ' neg' : ''}">${c}</span>`)
    .join('');
  h1.dataset.built = '1';
}

/* Mark the current page in the navigation. */
function markActiveNav() {
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav a').forEach((a) => {
    const target = a.getAttribute('href').toLowerCase();
    const isHome = here === '' || here === 'index.html';
    a.classList.toggle('active', target === here || (isHome && target === 'index.html'));
  });
}

function refreshShellLanguage() {
  applyI18n();
  const lb = document.getElementById('langBtn');
  if (lb) lb.textContent = t('lang.other');
  const tb = document.getElementById('themeBtn');
  if (tb) tb.textContent = t(currentTheme() === 'board' ? 'theme.board' : 'theme.paper');
  if (typeof typesetAll === 'function') typesetAll();
  if (typeof PAGE.onLang === 'function') PAGE.onLang();
}

function bootShell() {
  setTheme(localStorage.getItem('trace-theme') || 'paper');
  markWordmark();
  markActiveNav();

  const lb = document.getElementById('langBtn');
  if (lb) {
    lb.addEventListener('click', () => {
      setLang(LANG === 'it' ? 'en' : 'it');
      refreshShellLanguage();
    });
  }

  const tb = document.getElementById('themeBtn');
  if (tb) {
    tb.addEventListener('click', () => {
      setTheme(currentTheme() === 'paper' ? 'board' : 'paper');
      if (typeof PAGE.onTheme === 'function') PAGE.onTheme();
    });
  }

  refreshShellLanguage();
}
