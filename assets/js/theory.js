/* TRACE — the theory section, in both languages.

   Written to be read in order: what a diagram actually is, what quantity it
   contributes to, then the machinery. Formulas are marked up with
   data-tex-block / data-tex and typeset by tex.js after insertion.

   Note the doubled backslashes: these are JavaScript string literals, and a
   single backslash before a letter is silently dropped by JS. */

const THEORY = {
  it: [
    {
      id: 'what',
      title: 'Che cos\'è un diagramma di Feynman',
      body: `
<p>La prima cosa da togliersi dalla testa è che un diagramma sia il disegno di
quello che succede. Non è la traiettoria di una particella, e le linee interne
non descrivono oggetti che qualcuno potrebbe osservare. Un diagramma è
<b>una scrittura tachigrafica per un termine di una serie perturbativa</b>.</p>
<p>Il punto di partenza è che l'ampiezza di transizione fra uno stato iniziale e
uno finale non si sa calcolare esattamente, ma l'interazione elettromagnetica è
debole: la costante di struttura fine vale circa 1/137. Si può quindi sviluppare
l'ampiezza in potenze della carica <span data-tex="e"></span>, e ogni termine
dello sviluppo corrisponde a uno e un solo diagramma.</p>
<p>Le regole di Feynman sono il dizionario che traduce il disegno nella formula:
ogni vertice porta un fattore di accoppiamento, ogni linea interna un
propagatore, ogni gamba esterna una funzione d'onda. Il disegno è un modo per non
perdere pezzi mentre si scrive un'espressione lunga — e, dato che è
combinatorio, è anche un modo per <b>enumerare</b> i termini senza dimenticarne
nessuno. È esattamente quello che fa la parte di TRACE che genera le
topologie.</p>
<p>Il numero di vertici è l'ordine perturbativo. Un processo con due vertici
contribuisce all'ampiezza con <span data-tex="e^2"></span>, quindi alla
probabilità con <span data-tex="e^4 \\sim \\alpha^2"></span>. Aggiungere due
vertici significa aggiungere un fattore <span data-tex="\\alpha \\approx 1/137"></span>:
è per questo che l'ordine più basso è già una buona approssimazione, e per questo
che l'ordine successivo è una correzione percentuale e non un ribaltamento.</p>`,
    },
    {
      id: 'observable',
      title: 'Che cosa si calcola davvero',
      body: `
<p>La catena che porta dal diagramma al numero misurabile ha tre anelli, ed è
utile tenerli distinti perché è dove si annidano gli equivoci.</p>
<p><b>Primo anello: l'ampiezza.</b> Ogni diagramma dà un numero complesso
<span data-tex="\\mathcal{M}"></span>. Se un processo ha più diagrammi, le loro
ampiezze <b>si sommano</b> prima di essere elevate al quadrato — non si sommano
le probabilità. Questa è meccanica quantistica, non contabilità:</p>
<div class="formula-block"><span data-tex-align="\\mathcal{M} = \\mathcal{M}_1 + \\mathcal{M}_2 + \\ldots"></span></div>
<p><b>Secondo anello: la probabilità.</b> Si prende il modulo quadro. E qui
compare il termine che rende la faccenda interessante:</p>
<div class="formula-block">
  <span data-tex-align="|\\mathcal{M}_1 + \\mathcal{M}_2|^2 = |\\mathcal{M}_1|^2 + |\\mathcal{M}_2|^2 + 2\\,\\text{Re}(\\mathcal{M}_1 \\mathcal{M}_2^*)"></span>
  <span class="formula-note">l'ultimo termine è l'interferenza</span>
</div>
<p>L'interferenza può essere positiva o negativa, e non è un dettaglio: nello
scattering Bhabha a energie tipiche vale diverse decine di punti percentuali. È
il motivo per cui TRACE mostra il contributo di ogni diagramma
<i>separatamente</i> e poi l'interferenza a parte: sono informazioni fisicamente
diverse, e sommare i quadrati darebbe la risposta sbagliata.</p>
<p><b>Terzo anello: l'osservabile.</b> Il modulo quadro va mediato sugli stati di
spin iniziali che non si controllano, sommato su quelli finali che non si
misurano, e infine moltiplicato per il fattore di spazio delle fasi che tiene
conto di quanti stati finali sono cinematicamente accessibili. Il risultato è la
sezione d'urto, che ha le dimensioni di un'area ed è ciò che un esperimento
conta davvero.</p>`,
    },
    {
      id: 'rules',
      title: 'Le regole di Feynman della QED',
      body: `
<p>L'elettrodinamica quantistica ha <b>un solo</b> vertice di interazione: un
fermione carico che emette o assorbe un fotone. Tutto il resto del calcolo è
contabilità attorno a quel vertice — e il fatto che il vertice sia uno solo è
ciò che rende l'enumerazione dei diagrammi un problema finito e trattabile.</p>
<table class="rules">
  <tr><th>vertice</th><td><span data-tex="i Q e \\gamma^\\mu"></span></td>
      <td>Q è la carica del fermione in unità di e: −1 per elettrone, muone e tau.</td></tr>
  <tr><th>propagatore del fotone</th><td><span data-tex="\\frac{-i g_{\\mu\\nu}}{q^2}"></span></td>
      <td>in gauge di Feynman. Il fotone ha massa nulla, quindi il denominatore è solo q².</td></tr>
  <tr><th>propagatore del fermione</th><td><span data-tex="\\frac{i(\\slashed{q} + m)}{q^2 - m^2}"></span></td>
      <td>q è il quadrimpulso che scorre lungo la linea, nel verso della freccia fermionica.</td></tr>
  <tr><th>fermione entrante</th><td><span data-tex="u(p,\\lambda)"></span></td><td rowspan="4">
      Le gambe esterne portano una funzione d'onda invece di un propagatore: sono
      particelle reali, sul guscio di massa. λ è l'elicità, cioè la proiezione
      dello spin sulla direzione del moto.</td></tr>
  <tr><th>fermione uscente</th><td><span data-tex="\\bar{u}(p,\\lambda)"></span></td></tr>
  <tr><th>antifermione entrante</th><td><span data-tex="\\bar{v}(p,\\lambda)"></span></td></tr>
  <tr><th>antifermione uscente</th><td><span data-tex="v(p,\\lambda)"></span></td></tr>
  <tr><th>fotone entrante</th><td><span data-tex="\\epsilon^\\mu(k,\\lambda)"></span></td>
      <td rowspan="2">due sole polarizzazioni fisiche, trasverse.</td></tr>
  <tr><th>fotone uscente</th><td><span data-tex="\\epsilon^{\\mu*}(k,\\lambda)"></span></td></tr>
</table>
<p class="aside">Convenzioni usate qui: metrica <span data-tex="(+,-,-,-)"></span>,
base di Weyl per le matrici gamma, normalizzazione degli spinori come in
Peskin &amp; Schroeder, gauge di Feynman.</p>`,
    },
    {
      id: 'build',
      title: 'Come si costruisce l\'ampiezza',
      body: `
<p>L'ampiezza di un diagramma si legge <b>seguendo la linea fermionica al
contrario</b>: si parte dalla punta della freccia e si risale. Ogni oggetto
incontrato si moltiplica a sinistra del precedente. Non è una convenzione
arbitraria: è l'ordine che rende componibili le matrici gamma, perché ognuna
agisce sullo spinore alla sua destra.</p>
<p>Per l'annichilazione <span data-tex="e^- e^+ \\to \\mu^- \\mu^+"></span> ci sono
due linee fermioniche separate, unite dal propagatore del fotone che ne contrae
gli indici di Lorentz:</p>
<div class="formula-block">
  <span data-tex-align="\\mathcal{M} = [\\bar{v}(p_2)\\, iQ_e e \\gamma^\\mu\\, u(p_1)] \\; \\frac{-i g_{\\mu\\nu}}{s} \\; [\\bar{u}(p_3)\\, iQ_\\mu e \\gamma^\\nu\\, v(p_4)]"></span>
</div>
<p>Nel Compton, invece, la linea fermionica è una sola e attraversa entrambi i
vertici, con il propagatore del fermione in mezzo:</p>
<div class="formula-block">
  <span data-tex-align="\\mathcal{M} = \\bar{u}(p_3)\\, iQe\\slashed{\\epsilon}^*\\; \\frac{i(\\slashed{q}+m)}{q^2-m^2} \\; iQe\\slashed{\\epsilon}\\, u(p_1)"></span>
</div>
<p>La differenza fra i due casi non è una convenzione di scrittura: dipende da
che cosa corre nella linea interna, e viene determinata dal modello nel momento
in cui si enumerano le topologie.</p>`,
    },
    {
      id: 'sign',
      title: 'Il segno relativo fra i diagrammi',
      body: `
<p>Questo è il punto in cui si annidano quasi tutti gli errori. Quando un
processo ha più di un diagramma, il segno con cui si sommano <b>non è
libero</b>: discende dall'anticommutazione dei campi fermionici, cioè in ultima
analisi dal principio di esclusione.</p>
<p>La regola operativa: si scrivono i label dei fermioni esterni nell'ordine in
cui compaiono leggendo ciascuna catena fermionica, si concatenano, e si
confronta la sequenza con quella di un diagramma di riferimento. Il segno è la
parità della permutazione che porta l'una nell'altra.</p>
<p>In Bhabha il canale s dà la sequenza <span data-tex="[2,1,3,4]"></span> e il
canale t dà <span data-tex="[3,1,2,4]"></span>: una sola trasposizione, quindi
segno meno. In Compton entrambi i diagrammi danno
<span data-tex="[3,1]"></span>: nessuna trasposizione, quindi segno più.</p>
<p>TRACE applica questa regola e non contiene nessun segno scritto a mano. Che
funzioni non è dato per buono: è proprio quello che verifica l'identità di
Ward.</p>
<p class="aside">Scambiare due catene intere sposta due fermioni oltre altri due,
che è una permutazione pari: l'ordine in cui si elencano le catene quindi non
conta, come dev'essere.</p>`,
    },
    {
      id: 'spin',
      title: 'Somma sugli spin e modulo quadro',
      body: `
<p>Fasci non polarizzati significa che non si conosce lo spin iniziale e non si
misura quello finale. Si somma quindi su tutte le eliche finali e si <i>media</i>
su quelle iniziali:</p>
<div class="formula-block">
  <span data-tex-align="\\langle|\\mathcal{M}|^2\\rangle = \\frac{1}{N}\\sum_{\\text{eliche}} |\\mathcal{M}|^2"></span>
  <span class="formula-note">N = 4 per due particelle iniziali con due stati ciascuna</span>
</div>
<p>Il metodo tradizionale usa a questo punto le relazioni di completezza
<span data-tex="\\sum_\\lambda u\\bar{u} = \\slashed{p} + m"></span> e trasforma
tutto in tracce di matrici gamma, che si valutano con i teoremi delle tracce. È
elegante, dà una formula chiusa, ed è da lì che viene il nome di questo
programma — ma richiede algebra simbolica.</p>
<p>TRACE fa la cosa più diretta: costruisce esplicitamente i vettori a quattro
componenti per tutte le combinazioni di elicità e li contrae numericamente. Il
risultato è lo stesso, esatto in massa, e si ottiene senza motore simbolico. In
cambio non produce una formula, solo un numero.</p>
<p class="aside">Un dettaglio numerico che conta davvero:
<span data-tex="\\sqrt{E - |p|}"></span> non va mai calcolato come sottrazione
letterale. Per un elettrone a 500 GeV, E e |p| coincidono a tredici cifre e la
differenza perde quasi tutta la precisione. Va usata l'identità esatta
<span data-tex="E - |p| = \\frac{m^2}{E + |p|}"></span>. Senza, l'identità di
Ward si ferma a 10⁻⁸ invece di 10⁻¹⁴.</p>`,
    },
    {
      id: 'xsec',
      title: 'Dall\'ampiezza alla sezione d\'urto',
      body: `
<p>Gli invarianti di Mandelstam per un processo
<span data-tex="1 + 2 \\to 3 + 4"></span> sono tre combinazioni degli impulsi che
non dipendono dal sistema di riferimento:</p>
<div class="formula-block">
  <span data-tex-align="s = (p_1+p_2)^2, \\quad t = (p_1-p_3)^2, \\quad u = (p_1-p_4)^2 \\\\ s + t + u = \\sum_i m_i^2"></span>
</div>
<p>Quella somma è un controllo gratuito sulla cinematica, ed è mostrata nei
risultati proprio per questo. Nel centro di massa
<span data-tex="\\sqrt{s}"></span> è l'energia totale disponibile, e il nome dei
canali viene da quale dei tre invarianti compare nel denominatore del
propagatore.</p>
<div class="formula-block">
  <span data-tex-align="\\frac{d\\sigma}{d\\Omega} = \\frac{\\langle|\\mathcal{M}|^2\\rangle}{64\\pi^2 s} \\cdot \\frac{|p_f|}{|p_i|}"></span>
</div>
<p>Il risultato è in <span data-tex="\\text{GeV}^{-2}"></span>; la conversione in
picobarn usa <span data-tex="1\\,\\text{GeV}^{-2} = 3.894 \\times 10^8\\,\\text{pb}"></span>.
La sezione d'urto totale si ottiene integrando su
<span data-tex="\\cos\\theta"></span> con una quadratura di Gauss-Legendre. Se lo
stato finale è fatto di due particelle identiche, come in Møller, si aggiunge un
fattore <span data-tex="1/2"></span> per non contare due volte la stessa
configurazione.</p>
<p>Nei processi con canale t o u l'integrale diverge in avanti, perché il fotone
scambiato ha massa nulla e il propagatore esplode a piccolo angolo. Il taglio a
<span data-tex="|\\cos\\theta| < 0.999"></span> rende il numero finito, e va letto
come una sezione d'urto entro quell'accettanza, non come un totale fisico. Anche
un rivelatore vero ha un buco attorno alla linea di fascio, per la stessa
ragione.</p>`,
    },
    {
      id: 'orders',
      title: 'Gli ordini superiori, e perché fermarsi',
      body: `
<p>L'ordine più basso non è la risposta: è il primo termine. L'ordine successivo
aggiunge due vertici, quindi un fattore
<span data-tex="\\alpha \\approx 1/137"></span> nella probabilità — una
correzione dell'ordine dell'uno per cento. In QED la serie converge abbastanza
bene da rendere l'elettrodinamica la teoria meglio verificata della fisica.</p>
<p>A un loop compaiono tre famiglie di correzioni, e non sono affatto equivalenti
dal punto di vista pratico:</p>
<p><b>La polarizzazione del vuoto.</b> Il fotone interno si trasforma
temporaneamente in una coppia particella-antiparticella. Questa correzione è
speciale perché è una catena di bolle che si risomma geometricamente in un
fattore moltiplicativo sul propagatore:</p>
<div class="formula-block">
  <span data-tex-align="\\alpha(q^2) = \\frac{\\alpha}{1 - \\Delta\\alpha(q^2)}"></span>
  <span class="formula-note">un loop, risommato a tutti gli ordini</span>
</div>
<p>Il risultato è che la carica elettrica <i>dipende dall'energia</i>: sonda più
da vicino e vedi meno schermatura dalle coppie virtuali, quindi carica maggiore.
Al polo della Z si passa da 1/137 a circa 1/129. È l'unica correzione di ordine
superiore che TRACE calcola davvero, ed è nella sezione <b>Ordini</b> del
calcolatore.</p>
<p><b>Le correzioni di vertice.</b> Un fotone virtuale scambiato fra le due gambe
fermioniche di un vertice. Sono la sorgente del momento magnetico anomalo
dell'elettrone, <span data-tex="a = (g-2)/2"></span>, che è la quantità in cui
teoria ed esperimento concordano meglio in tutta la fisica.</p>
<p><b>I box.</b> Due fotoni scambiati fra le due linee fermioniche. Non si
risommano e non hanno una scorciatoia.</p>
<p>Le ultime due richiedono riduzione tensoriale e regolarizzazione dimensionale,
e — questo è il punto meno intuitivo — <b>da sole danno un risultato
infinito</b>. Le divergenze infrarosse si cancellano solo sommando l'emissione
reale di fotoni molli, cioè un processo con una particella in più nello stato
finale. Una correzione a un loop, per essere un numero finito e confrontabile con
un esperimento, richiede quindi di calcolare anche un processo diverso.</p>

<h4>Che cosa si può attribuire a un singolo diagramma</h4>
<p>Questa è la distinzione che governa tutto ciò che TRACE mostra e ciò che si
rifiuta di mostrare, e conviene esplicitarla perché è fisica, non una
limitazione del programma.</p>
<p><b>All'ordine albero ogni diagramma vale per sé.</b>
<span data-tex="\\mathcal{M}_s"></span> e <span data-tex="\\mathcal{M}_t"></span>
sono numeri complessi finiti, indipendenti dalla gauge, calcolabili
separatamente. Ha senso chiedersi quanto pesa il canale t rispetto al canale s, e
ha senso isolare l'interferenza: sono quantità ben definite. È esattamente quello
che il calcolatore mette in tabella.</p>
<p><b>A un loop questo smette di essere vero.</b> Il singolo diagramma di box è
divergente nell'infrarosso e la singola correzione di vertice è divergente
nell'ultravioletto; entrambe dipendono dalla gauge. Chiedere «quanto contribuisce
il box» è chiedere un numero che non esiste: esiste solo dopo aver sommato tutti
i diagrammi di quell'ordine, aver rinormalizzato, e aver aggiunto l'emissione
reale. Un programma che ti stampasse quel numero ti starebbe mentendo, o starebbe
tacendo una convenzione arbitraria.</p>
<p><b>Ci sono eccezioni, ed è lì che si può lavorare.</b> Alcuni sottoinsiemi di
diagrammi sono separatamente finiti e gauge-invarianti. La polarizzazione del
vuoto è il caso principale: la catena di bolle sul propagatore fotonico si
rinormalizza da sola, non dipende dalla gauge, e per di più si risomma in un
fattore moltiplicativo. Per questo si può promuovere a
<span data-tex="\\alpha(q^2)"></span> e applicare al calcolo senza raccontare
frottole.</p>
<p>Da qui la scelta di fondo: <b>contributi separati per diagramma solo dove sono
ben definiti</b>, cioè all'ordine albero; e <b>raffinamento del calcolo globale</b>
dove l'ordine superiore è trattabile in modo onesto, cioè attraverso il coupling
running. Non è un ripiego: è la forma che ha la teoria.</p>`,
    },
    {
      id: 'ward',
      title: 'Perché l\'identità di Ward è il test migliore',
      body: `
<p>Confrontare con una formula da manuale verifica il risultato, ma richiede di
avere già la risposta. L'identità di Ward no: è una conseguenza dell'invarianza
di gauge e si verifica da sola.</p>
<p>Sostituendo la polarizzazione di un fotone esterno con il suo stesso
quadrimpulso, l'ampiezza <b>sommata</b> deve annullarsi:</p>
<div class="formula-block">
  <span data-tex-align="\\epsilon^\\mu \\to k^\\mu \\;\\Rightarrow\\; \\sum_i \\mathcal{M}_i = 0"></span>
</div>
<p>I singoli diagrammi non si annullano affatto: si cancellano fra loro. È
esattamente per questo che il test è severo — fallisce se il segno relativo è
sbagliato, se il numeratore del propagatore è sbagliato, o se gli spinori non
sono normalizzati bene. Fisicamente sta dicendo che il fotone ha solo due
polarizzazioni fisiche e che la terza, longitudinale, non deve accoppiarsi a
nulla di osservabile.</p>
<p>In TRACE il rapporto fra ampiezza violata e scala fisica tipica è dell'ordine
di 10⁻¹⁴, cioè al livello del rumore in doppia precisione.</p>`,
    },
  ],

  en: [
    {
      id: 'what',
      title: 'What a Feynman diagram is',
      body: `
<p>The first thing to unlearn is that a diagram pictures what happens. It is not
a particle trajectory, and the internal lines do not describe objects anyone
could observe. A diagram is <b>shorthand for one term in a perturbative
series</b>.</p>
<p>The starting point is that the transition amplitude between an initial and a
final state cannot be computed exactly, but the electromagnetic interaction is
weak: the fine-structure constant is about 1/137. One can therefore expand the
amplitude in powers of the charge <span data-tex="e"></span>, and each term of
the expansion corresponds to one and only one diagram.</p>
<p>The Feynman rules are the dictionary translating picture into formula: each
vertex carries a coupling factor, each internal line a propagator, each external
leg a wavefunction. The picture is a way of not losing pieces while writing a
long expression — and, being combinatorial, it is also a way to
<b>enumerate</b> the terms without forgetting any. That is precisely what the
topology-generating part of TRACE does.</p>
<p>The number of vertices is the perturbative order. A process with two vertices
contributes to the amplitude at <span data-tex="e^2"></span>, hence to the
probability at <span data-tex="e^4 \\sim \\alpha^2"></span>. Adding two vertices
means adding a factor <span data-tex="\\alpha \\approx 1/137"></span>: this is why
lowest order is already a good approximation, and why the next order is a
percent-level correction rather than an upheaval.</p>`,
    },
    {
      id: 'observable',
      title: 'What is actually being computed',
      body: `
<p>The chain from diagram to measurable number has three links, and it is worth
keeping them distinct because that is where the confusions live.</p>
<p><b>First link: the amplitude.</b> Each diagram yields a complex number
<span data-tex="\\mathcal{M}"></span>. If a process has several diagrams, their
amplitudes <b>add</b> before being squared — probabilities do not add. This is
quantum mechanics, not bookkeeping:</p>
<div class="formula-block"><span data-tex-align="\\mathcal{M} = \\mathcal{M}_1 + \\mathcal{M}_2 + \\ldots"></span></div>
<p><b>Second link: the probability.</b> Take the modulus squared. And here is the
term that makes the whole business interesting:</p>
<div class="formula-block">
  <span data-tex-align="|\\mathcal{M}_1 + \\mathcal{M}_2|^2 = |\\mathcal{M}_1|^2 + |\\mathcal{M}_2|^2 + 2\\,\\text{Re}(\\mathcal{M}_1 \\mathcal{M}_2^*)"></span>
  <span class="formula-note">the last term is interference</span>
</div>
<p>Interference can be positive or negative, and it is no detail: in Bhabha
scattering at typical energies it amounts to several tens of percent. That is why
TRACE shows each diagram's contribution <i>separately</i> and then interference
on its own: they are physically different pieces of information, and adding the
squares would give the wrong answer.</p>
<p><b>Third link: the observable.</b> The squared modulus must be averaged over
the initial spin states one does not control, summed over the final ones one does
not measure, and finally multiplied by the phase-space factor accounting for how
many final states are kinematically accessible. The result is the cross section,
which has dimensions of area and is what an experiment actually counts.</p>`,
    },
    {
      id: 'rules',
      title: 'The Feynman rules of QED',
      body: `
<p>Quantum electrodynamics has <b>a single</b> interaction vertex: a charged
fermion emitting or absorbing a photon. Everything else is bookkeeping around
that vertex — and the fact that there is only one is what makes enumerating
diagrams a finite, tractable problem.</p>
<table class="rules">
  <tr><th>vertex</th><td><span data-tex="i Q e \\gamma^\\mu"></span></td>
      <td>Q is the fermion charge in units of e: −1 for electron, muon and tau.</td></tr>
  <tr><th>photon propagator</th><td><span data-tex="\\frac{-i g_{\\mu\\nu}}{q^2}"></span></td>
      <td>in Feynman gauge. The photon is massless, so the denominator is just q².</td></tr>
  <tr><th>fermion propagator</th><td><span data-tex="\\frac{i(\\slashed{q} + m)}{q^2 - m^2}"></span></td>
      <td>q is the four-momentum flowing along the line, in the direction of the fermion arrow.</td></tr>
  <tr><th>incoming fermion</th><td><span data-tex="u(p,\\lambda)"></span></td><td rowspan="4">
      External legs carry a wavefunction instead of a propagator: they are real,
      on-shell particles. λ is the helicity, the projection of spin onto the
      direction of motion.</td></tr>
  <tr><th>outgoing fermion</th><td><span data-tex="\\bar{u}(p,\\lambda)"></span></td></tr>
  <tr><th>incoming antifermion</th><td><span data-tex="\\bar{v}(p,\\lambda)"></span></td></tr>
  <tr><th>outgoing antifermion</th><td><span data-tex="v(p,\\lambda)"></span></td></tr>
  <tr><th>incoming photon</th><td><span data-tex="\\epsilon^\\mu(k,\\lambda)"></span></td>
      <td rowspan="2">only two physical, transverse polarizations.</td></tr>
  <tr><th>outgoing photon</th><td><span data-tex="\\epsilon^{\\mu*}(k,\\lambda)"></span></td></tr>
</table>
<p class="aside">Conventions used here: metric <span data-tex="(+,-,-,-)"></span>,
Weyl basis for the gamma matrices, Peskin &amp; Schroeder spinor normalization,
Feynman gauge.</p>`,
    },
    {
      id: 'build',
      title: 'How the amplitude is built',
      body: `
<p>A diagram's amplitude is read <b>backwards along the fermion line</b>: start
at the arrowhead and work upstream. Each object encountered multiplies onto the
left of the previous one. This is not an arbitrary convention: it is the ordering
that makes the gamma matrices composable, since each acts on the spinor to its
right.</p>
<p>For the annihilation <span data-tex="e^- e^+ \\to \\mu^- \\mu^+"></span> there
are two separate fermion lines, joined by the photon propagator which contracts
their Lorentz indices:</p>
<div class="formula-block">
  <span data-tex-align="\\mathcal{M} = [\\bar{v}(p_2)\\, iQ_e e \\gamma^\\mu\\, u(p_1)] \\; \\frac{-i g_{\\mu\\nu}}{s} \\; [\\bar{u}(p_3)\\, iQ_\\mu e \\gamma^\\nu\\, v(p_4)]"></span>
</div>
<p>In Compton scattering, by contrast, there is a single fermion line running
through both vertices, with the fermion propagator in between:</p>
<div class="formula-block">
  <span data-tex-align="\\mathcal{M} = \\bar{u}(p_3)\\, iQe\\slashed{\\epsilon}^*\\; \\frac{i(\\slashed{q}+m)}{q^2-m^2} \\; iQe\\slashed{\\epsilon}\\, u(p_1)"></span>
</div>
<p>The difference between the two cases is not a notational convention: it
depends on what runs in the internal line, and is determined by the model when
the topologies are enumerated.</p>`,
    },
    {
      id: 'sign',
      title: 'The relative sign between diagrams',
      body: `
<p>This is where nearly all the errors hide. When a process has more than one
diagram, the sign with which they add is <b>not free</b>: it follows from the
anticommutation of the fermion fields, that is, ultimately from the exclusion
principle.</p>
<p>The working rule: write down the external fermion labels in the order they
appear reading along each fermion chain, concatenate them, and compare the
sequence with that of a reference diagram. The sign is the parity of the
permutation taking one into the other.</p>
<p>In Bhabha the s-channel gives <span data-tex="[2,1,3,4]"></span> and the
t-channel gives <span data-tex="[3,1,2,4]"></span>: a single transposition, hence
a minus sign. In Compton both diagrams give <span data-tex="[3,1]"></span>: no
transposition, hence a plus sign.</p>
<p>TRACE applies this rule and contains no hand-written signs. That it works is
not taken on faith: it is exactly what the Ward identity checks.</p>
<p class="aside">Swapping two whole chains moves two fermions past two others,
which is an even permutation: the order in which chains are listed therefore does
not matter, as it should not.</p>`,
    },
    {
      id: 'spin',
      title: 'Spin sums and the squared modulus',
      body: `
<p>Unpolarized beams mean the initial spin is unknown and the final spin is not
measured. One therefore sums over all final helicities and <i>averages</i> over
the initial ones:</p>
<div class="formula-block">
  <span data-tex-align="\\langle|\\mathcal{M}|^2\\rangle = \\frac{1}{N}\\sum_{\\text{helicities}} |\\mathcal{M}|^2"></span>
  <span class="formula-note">N = 4 for two initial particles with two states each</span>
</div>
<p>The traditional method now uses the completeness relations
<span data-tex="\\sum_\\lambda u\\bar{u} = \\slashed{p} + m"></span> and turns
everything into traces of gamma matrices, evaluated with the trace theorems. It
is elegant, yields a closed formula, and is where this program's name comes from
— but it requires symbolic algebra.</p>
<p>TRACE does the most direct thing: it explicitly builds the four-component
vectors for all helicity combinations and contracts them numerically. The result
is the same, exact in the masses, and obtained without a symbolic engine. In
exchange it produces no formula, only a number.</p>
<p class="aside">A numerical detail that genuinely matters:
<span data-tex="\\sqrt{E - |p|}"></span> must never be computed as a literal
subtraction. For an electron at 500 GeV, E and |p| agree to thirteen digits and
the difference loses almost all its precision. Use the exact identity
<span data-tex="E - |p| = \\frac{m^2}{E + |p|}"></span>. Without it the Ward
identity stalls at 10⁻⁸ instead of 10⁻¹⁴.</p>`,
    },
    {
      id: 'xsec',
      title: 'From amplitude to cross section',
      body: `
<p>The Mandelstam invariants for a process
<span data-tex="1 + 2 \\to 3 + 4"></span> are three combinations of the momenta
that do not depend on the frame:</p>
<div class="formula-block">
  <span data-tex-align="s = (p_1+p_2)^2, \\quad t = (p_1-p_3)^2, \\quad u = (p_1-p_4)^2 \\\\ s + t + u = \\sum_i m_i^2"></span>
</div>
<p>That sum is a free check on the kinematics, which is exactly why it is shown
in the results. In the centre-of-mass frame <span data-tex="\\sqrt{s}"></span> is
the total available energy, and the channel names come from which of the three
invariants appears in the propagator denominator.</p>
<div class="formula-block">
  <span data-tex-align="\\frac{d\\sigma}{d\\Omega} = \\frac{\\langle|\\mathcal{M}|^2\\rangle}{64\\pi^2 s} \\cdot \\frac{|p_f|}{|p_i|}"></span>
</div>
<p>The result is in <span data-tex="\\text{GeV}^{-2}"></span>; conversion to
picobarn uses <span data-tex="1\\,\\text{GeV}^{-2} = 3.894 \\times 10^8\\,\\text{pb}"></span>.
The total cross section follows by integrating over
<span data-tex="\\cos\\theta"></span> with Gauss-Legendre quadrature. If the final
state consists of two identical particles, as in Møller scattering, a factor
<span data-tex="1/2"></span> is included so the same configuration is not counted
twice.</p>
<p>In processes with a t or u channel the integral diverges in the forward
direction, because the exchanged photon is massless and the propagator blows up
at small angle. The cut at <span data-tex="|\\cos\\theta| < 0.999"></span> makes
the number finite, and it should be read as a cross section within that
acceptance, not as a physical total. A real detector also has a hole around the
beam line, for the same reason.</p>`,
    },
    {
      id: 'orders',
      title: 'Higher orders, and why one stops',
      body: `
<p>Lowest order is not the answer: it is the first term. The next order adds two
vertices, hence a factor <span data-tex="\\alpha \\approx 1/137"></span> in the
probability — a correction of order one percent. In QED the series converges well
enough to make electrodynamics the best-tested theory in physics.</p>
<p>At one loop three families of corrections appear, and they are by no means
equivalent in practice:</p>
<p><b>Vacuum polarization.</b> The internal photon turns briefly into a
particle-antiparticle pair. This correction is special because it is a chain of
bubbles that resums geometrically into a multiplicative factor on the
propagator:</p>
<div class="formula-block">
  <span data-tex-align="\\alpha(q^2) = \\frac{\\alpha}{1 - \\Delta\\alpha(q^2)}"></span>
  <span class="formula-note">one loop, resummed to all orders</span>
</div>
<p>The upshot is that the electric charge <i>depends on energy</i>: probe closer
and you see less screening from virtual pairs, hence a larger charge. At the Z
pole it goes from 1/137 to about 1/129. This is the one higher-order correction
TRACE genuinely computes, in the <b>Orders</b> section of the calculator.</p>
<p><b>Vertex corrections.</b> A virtual photon exchanged between the two fermion
legs of a vertex. These are the source of the electron's anomalous magnetic
moment, <span data-tex="a = (g-2)/2"></span>, the quantity on which theory and
experiment agree most closely in all of physics.</p>
<p><b>Boxes.</b> Two photons exchanged between the two fermion lines. They do not
resum and there is no shortcut.</p>
<p>The latter two need tensor reduction and dimensional regularization, and —
this is the least intuitive part — <b>on their own they give an infinite
answer</b>. The infrared divergences cancel only when real soft-photon emission
is added, that is, a process with one more particle in the final state. A
one-loop correction, to be a finite number comparable with experiment, therefore
requires computing a different process as well.</p>

<h4>What can be attributed to a single diagram</h4>
<p>This is the distinction governing everything TRACE shows and everything it
refuses to show, and it is worth stating plainly, because it is physics rather
than a limitation of the program.</p>
<p><b>At tree level each diagram stands on its own.</b>
<span data-tex="\\mathcal{M}_s"></span> and <span data-tex="\\mathcal{M}_t"></span>
are finite, gauge-independent complex numbers that can be computed separately. It
is meaningful to ask how much the t-channel weighs against the s-channel, and
meaningful to isolate the interference: these are well-defined quantities. That
is exactly what the calculator tabulates.</p>
<p><b>At one loop this stops being true.</b> An individual box diagram is
infrared divergent and an individual vertex correction is ultraviolet divergent;
both are gauge-dependent. Asking "how much does the box contribute" is asking for
a number that does not exist: it exists only after summing every diagram at that
order, renormalizing, and adding real emission. A program that printed that
number for you would either be lying, or quietly hiding an arbitrary
convention.</p>
<p><b>There are exceptions, and that is where one can work.</b> Certain subsets
of diagrams are separately finite and gauge-invariant. Vacuum polarization is the
main case: the chain of bubbles on the photon propagator renormalizes on its own,
does not depend on the gauge, and on top of that resums into a multiplicative
factor. That is why it can be promoted to <span data-tex="\\alpha(q^2)"></span>
and applied to the calculation without telling stories.</p>
<p>Hence the underlying choice: <b>per-diagram contributions only where they are
well defined</b>, that is, at tree level; and <b>refinement of the global
calculation</b> where higher order is honestly tractable, that is, through the
running coupling. This is not a fallback: it is the shape the theory has.</p>`,
    },
    {
      id: 'ward',
      title: 'Why the Ward identity is the better test',
      body: `
<p>Comparing against a textbook formula checks the result, but requires already
having the answer. The Ward identity does not: it is a consequence of gauge
invariance and checks itself.</p>
<p>Replacing an external photon's polarization by its own four-momentum, the
<b>summed</b> amplitude must vanish:</p>
<div class="formula-block">
  <span data-tex-align="\\epsilon^\\mu \\to k^\\mu \\;\\Rightarrow\\; \\sum_i \\mathcal{M}_i = 0"></span>
</div>
<p>The individual diagrams do not vanish at all: they cancel against each other.
That is precisely what makes the test severe — it fails if the relative sign is
wrong, if the propagator numerator is wrong, or if the spinors are not correctly
normalized. Physically it says the photon has only two physical polarizations,
and that the third, longitudinal one must not couple to anything observable.</p>
<p>In TRACE the ratio of the violated amplitude to the typical physical scale is
of order 10⁻¹⁴, that is, at the level of double-precision noise.</p>`,
    },
  ],
};

function renderTheory(host) {
  const items = THEORY[LANG] || THEORY.it;
  host.innerHTML = items
    .map(
      (it, i) => `
    <details class="theory-item"${i === 0 ? ' open' : ''}>
      <summary><span class="tnum">${String(i + 1).padStart(2, '0')}</span>${it.title}</summary>
      <div class="theory-body">${it.body}</div>
    </details>`
    )
    .join('');
  if (typeof typesetAll === 'function') typesetAll(host);
}
