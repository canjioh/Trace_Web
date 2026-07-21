# TRACE

**Tree-level Reaction Amplitude Computation Engine**

*[English version](README.md)*

Un calcolatore di diagrammi di Feynman che gira interamente nel browser. Scrivi
una reazione QED e TRACE enumera i diagrammi, applica le regole di Feynman,
contrae l'ampiezza e restituisce `⟨|ℳ|²⟩` e la sezione d'urto — mostrando il
contributo di ciascun diagramma separatamente, termine di interferenza compreso.

Nessun server, nessuna compilazione. Apri `index.html` e funziona.

---

## Perché

Di strumenti per *disegnare* diagrammi di Feynman è pieno il web, ma non fanno
fisica. Gli strumenti di calcolo seri (FeynArts, FeynCalc, FORM, MadGraph) sono
eccellenti ma vivono in Mathematica o in Fortran, e dove esiste un frontend web
questo sottomette un job e restituisce numeri, non una scomposizione leggibile
diagramma per diagramma.

Lo spazio vuoto a cui punta TRACE è quello in mezzo: qualcosa che *mostri il
conto* invece del solo risultato. È uno strumento didattico, non un concorrente
della filiera di ricerca.

## Che cosa calcola

Qualsiasi processo 2 → 2 costruito con le particelle che conosce (`e∓`, `μ∓`,
`τ∓`, `γ`) può essere scritto direttamente — `e- e+ > mu- mu+`. Il menu è un
insieme di scorciatoie, non una lista chiusa. Processi preimpostati:

| Processo | Diagrammi | Struttura |
|---|---|---|
| e⁻e⁺ → μ⁻μ⁺ | 1 | canale s |
| e⁻e⁺ → τ⁻τ⁺ | 1 | canale s, effetti di massa visibili vicino alla soglia |
| e⁻μ⁻ → e⁻μ⁻ | 1 | canale t |
| e⁻e⁺ → e⁻e⁺ (Bhabha) | 2 | s + t, segno relativo meno |
| e⁻e⁻ → e⁻e⁻ (Møller) | 2 | t + u, stato finale identico |
| e⁻γ → e⁻γ (Compton) | 2 | s + u, propagatore fermionico |
| γγ → e⁻e⁺ | 2 | t + u, produzione di coppie |

Per ciascuno: i diagrammi disegnati, l'espressione dell'ampiezza, gli invarianti
di Mandelstam, l'ampiezza al quadrato mediata sugli spin, i contributi per
diagramma e l'interferenza, `dσ/dΩ`, la sezione d'urto integrata e la
distribuzione angolare.

## Come funziona

**Le topologie non sono precompilate.** Per un processo 2 → 2 costruito con
vertici cubici, ogni diagramma ad albero ha esattamente due vertici e una linea
interna: l'enumerazione si riduce quindi a partizionare le quattro gambe esterne
in due coppie e chiedere al modello quali specie interne possano unirle. Le gambe
vengono confrontate nella convenzione all-incoming. Quali delle partizioni s, t,
u sopravvivano esce dalla lista dei vertici in `model.js` — aggiungere un sapore,
o cambiare teoria, significa modificare quel file e nient'altro.

Che la cosa sia sostanziale e non cosmetica si vede meglio con γγ → e⁻e⁺: il
processo non è mai stato programmato, eppure il generatore ne produce i due
diagrammi, e il risultato coincide con la formula da manuale `2e⁴(u/t + t/u)` a
una parte su 10¹².

**Le ampiezze sono numeriche, non simboliche.** TRACE costruisce davvero gli
spinori a quattro componenti e le matrici gamma 4×4 nella rappresentazione di
Weyl, li moltiplica, e somma sulle eliche. Così `⟨|ℳ|²⟩` esce esatto in massa e
non serve un motore di calcolo simbolico nel browser. Il prezzo è che si
ottengono numeri, non una forma chiusa semplificata.

**I segni relativi sono dedotti, non forniti.** Il segno fra un diagramma e
l'altro viene dalla parità della permutazione dei label fermionici esterni letti
lungo ciascuna catena, confrontata con un diagramma di riferimento. È la regola
di Wick standard, e riproduce da sola i segni meno noti di Bhabha e Møller — e il
più di Compton — senza che glieli si dica.

Convenzioni: metrica `(+,−,−,−)`, base di Weyl, normalizzazione degli spinori
come in Peskin & Schroeder, gauge di Feynman.

## Oltre l'ordine più basso

L'ordine più basso è una scelta, non un muro. La sezione **Ordini** del
calcolatore calcola l'unico effetto di ordine superiore che qui si possa fare
onestamente: la **polarizzazione del vuoto a un loop**, integrata numericamente
senza approssimazione di logaritmo dominante e risommata in un coupling running,

```
alpha(q^2) = alpha / (1 - Delta_alpha(q^2))
```

applicato a ciascun propagatore fotonico con il proprio momento trasferito.
Attivandolo, la sezione d'urto si sposta di qualche punto percentuale.

È verificabile, e torna:

| quantità | valore |
|---|---|
| Δα_lep(M_Z²) calcolato | 0.031419 |
| limite analitico di log dominante (controllo indipendente) | 0.031421 |
| letteratura, tutti gli ordini | 0.031498 |
| 1/α(M_Z), soli leptoni | 132.73 |
| **1/α(M_Z), + adronico da dati** | **128.94** |
| PDG | 128.95 |

Lo scarto residuo dello 0.25% rispetto al valore leptonico di letteratura non è
un errore: quel valore include le correzioni a due e tre loop, mentre qui se ne
calcola una sola. Il pezzo adronico **non** è calcolato e non è simulato — i loop
di quark a basso q² non sono calcolabili in teoria perturbativa e si estraggono
dai dati di e⁺e⁻ → adroni — quindi è mostrato separatamente ed etichettato come
tale.

### Vedere la serie convergere

La sezione **Ordini** tabula anche la serie perturbativa per il momento
magnetico anomalo dell'elettrone `a = (g−2)/2`, ordine per ordine, contro il
valore misurato — il posto più pulito della fisica per vedere uno sviluppo
convergere:

| ordine | totale progressivo | scarto dalla misura |
|---|---|---|
| 1 | 0.00116140973289 | 1.76×10⁻⁶ |
| 2 | 0.00115963742782 | 1.48×10⁻⁸ |
| 3 | 0.00115965223203 | 5.14×10⁻¹¹ |
| 4 | 0.00115965217636 | 4.23×10⁻¹² |
| 5 | 0.00115965217681 | 3.78×10⁻¹² |

Solo il primo coefficiente è calcolato qui — l'`α/2π` di Schwinger, da un solo
diagramma di correzione di vertice. Gli altri sono citati dalla letteratura ed
etichettati come tali nella tabella stessa; il solo quarto ordine richiede 891
diagrammi. Il residuo di ~2×10⁻¹² non è rumore numerico: dipende da *quale*
misura di α si usa in ingresso, e le determinazioni con cesio e rubidio non
concordano esattamente a quel livello. È una tensione aperta nel campo, e la
tabella lo dice invece di arrotondarla via.

### Topologie a un loop: disegnate, non valutate

Il calcolatore enumera e disegna anche le correzioni a un loop del processo
selezionato. Il conteggio segue Griffiths, *Introduction to Elementary
Particles*, §6.6: l'ordine successivo si ottiene aggiungendo una linea interna
che collega due qualsiasi delle linee del grafo ad albero, compresa una linea
con sé stessa. Un grafo 2 → 2 ad albero ha cinque linee, quindi ci sono
`C(5,2) + 5 = 15` modi per diagramma; in QED sopravvivono solo quelli i cui
estremi ammettono un vertice fermione-antifermione-fotone, il che per
`e⁻e⁺ → μ⁻μ⁺` ne lascia 11, ordinati nelle famiglie auto-energia,
polarizzazione del vuoto, vertice e box.

Sono **disegnati ma mai valutati**, e l'interfaccia lo dichiara su ogni
famiglia. Preso singolarmente un diagramma a un loop è divergente — l'integrale
sul loop va come `∫d⁴q/q⁴`, logaritmicamente — e dipende dalla gauge, quindi un
numero accanto sarebbe privo di significato. Solo la polarizzazione del vuoto è
separatamente finita e gauge-invariante, ed è per questo l'unica famiglia che la
pagina sappia davvero calcolare.

Le altre correzioni a un loop sono deliberatamente assenti. La polarizzazione del
vuoto è trattabile perché una catena di bolle si risomma in un fattore
moltiplicativo sul propagatore. Le correzioni di vertice e i box no: richiedono
riduzione tensoriale e regolarizzazione dimensionale, e da sole sono divergenti
nell'infrarosso. Una sezione d'urto a un loop finita e confrontabile con
l'esperimento richiede anche l'emissione reale di fotoni molli, cioè il calcolo
di un processo diverso con una particella in più nello stato finale. È un
progetto a sé, non una funzione in più.

## Validazione

I controlli sono parte dello strumento e girano nella pagina, sullo stesso
codice che produce i numeri mostrati.

- **Formule di riferimento.** `⟨|ℳ|²⟩` viene confrontato con le espressioni da
  manuale nel limite di massa nulla a √s = 500 GeV. Poiché quelle formule valgono
  solo a meno di correzioni di ordine `m²/s`, la tolleranza è quel budget di
  errore anziché un numero fisso — ed è per questo che il canale τ è tenuto a un
  limite più largo degli altri e passa onestamente.
- **Identità di Ward.** Per i processi con un fotone esterno, sostituire la
  polarizzazione di quel fotone con il suo stesso quadrimpulso deve annullare
  l'ampiezza *sommata*. I singoli diagrammi non si annullano, quindi il test
  verifica in un colpo solo l'invarianza di gauge, il segno relativo e il
  numeratore del propagatore — senza usare alcun valore di riferimento.
  Attualmente vale a ~3×10⁻¹⁴.

Una nota numerica: `sqrt(E − |p|)` non va mai calcolato come sottrazione
letterale. Per un elettrone ultrarelativistico `E` e `|p|` coincidono a ~13 cifre
e la differenza perde quasi tutta la precisione. Usare l'identità esatta
`E − |p| = m²/(E + |p|)` porta l'identità di Ward da ~10⁻⁸ a ~10⁻¹⁴.

## Limiti

Solo QED, solo 2 → 2. Le ampiezze sono ad albero; l'unica correzione di ordine
superiore inclusa è la polarizzazione del vuoto a un loop, che entra come
coupling running e non come diagramma generato. Niente correzioni di vertice,
niente box, niente bremsstrahlung, niente algebra di colore, niente correnti
deboli. L'espressione mostrata sotto ogni diagramma è la trascrizione fedele di
ciò che il codice contrae, non un risultato semplificato simbolicamente.

## Grafica

Rigorosamente monocromatica, in due modi: **carta** (inchiostro su bianco) e
**lavagna** (gesso su nero). Nessuna tinta da nessuna parte. Le curve del grafico
e le quantità nelle barre si distinguono per tratteggio e retinatura invece che
per colore, come si fa in una figura stampata — il che rende anche l'intera
interfaccia leggibile a chi ha deficit di visione dei colori, per costruzione.
Interfaccia disponibile in italiano e in inglese.

## Struttura

Tre pagine: una copertina, la teoria in chiave didattica, e il calcolatore.

```
index.html        copertina: diagrammi animati, che cos'è, due porte
theory.html       che cos'è un diagramma, che cosa calcola, e come
compute.html      il calcolatore
assets/css/trace.css
assets/js/
  i18n.js         tutte le stringhe visibili, IT + EN
  tex.js          il compositore del sottoinsieme TeX
  shell.js        testata, navigazione, lingua e tema, condivisi fra le pagine
  complex.js      aritmetica complessa, matrici complesse 4x4
  dirac.js        matrici gamma, spinori, vettori di polarizzazione
  model.js        particelle e vertici        <- da modificare per estendere la teoria
  parse.js        parsing delle reazioni scritte dall'utente
  kinematics.js   cinematica 2->2 nel CM, sezioni d'urto, quadratura
  topology.js     enumerazione dei diagrammi
  loops.js        enumerazione delle topologie a un loop (Griffiths §6.6)
  alpha.js        polarizzazione del vuoto a un loop, coupling running
  amplitude.js    regole di Feynman, segni fermionici, somma sulle eliche
  render.js       disegno dei diagrammi
  plot.js         distribuzione angolare
  hero.js         diagrammi animati di copertina
  theory.js       i contenuti teorici, IT + EN
  validate.js     autotest
  app.js          interfaccia del calcolatore
```

## Comporre le formule

Invece di tirare dentro MathJax o KaTeX — ciascuno una dipendenza da oltre un
megabyte, contro una pagina che oggi sta in una manciata di file e non scarica
nulla — TRACE include un piccolo compositore per il sottoinsieme di TeX che la
fisica qui richiede davvero: apici e pedici, frazioni costruite con una vera
linea di frazione, soprallineature, slash di Dirac, radicali, greco e gli
operatori usuali. Sono circa 200 righe e produce solo HTML e CSS.

I comandi non riconosciuti vengono mostrati invece di essere ingoiati in
silenzio, così un errore di battitura si vede. Se la notazione dovesse crescere
oltre questo — matrici, allineamenti, operatori grandi con estremi — la mossa
onesta è incorporare la build SVG a file singolo di MathJax, che non richiede
file di font e lascerebbe la pagina autosufficiente.

## Come farlo girare

Un qualsiasi server statico:

```
python -m http.server 8777
```

poi apri `http://localhost:8777`.

## Pubblicazione

Non c'è niente da compilare. Si spinge la cartella su un repository GitHub e si
attiva Pages servendo dalla radice del branch:

```
git init -b main
git add .
git commit -m "TRACE: calcolatore di diagrammi di Feynman ad albero in QED"
git remote add origin https://github.com/<utente>/Trace_Web.git
git push -u origin main
```

Poi **Settings → Pages → Source: Deploy from a branch → main / (root)**. Il sito
compare su `https://<utente>.github.io/Trace_Web/` nel giro di un paio di minuti.

Due cose da cui dipende che funzioni:

- **`.nojekyll` deve restare.** Senza, GitHub passa i file attraverso Jekyll, che
  ignora i percorsi che iniziano con underscore e può rovinare il risultato. Il
  file è già nel repository ed è vuoto di proposito.
- **Tutti i percorsi sono relativi.** Nessun collegamento punta a
  `/assets/...`, solo ad `assets/...`: è questo che permette al sito di stare
  sotto il sottopercorso `/Trace_Web/` invece che alla radice di un dominio.
  Conviene mantenere la regola aggiungendo pagine nuove.

GitHub Pages tiene gli asset in cache per una decina di minuti, quindi un
aggiornamento può non comparire subito in un browser che ha già il JavaScript
vecchio. Un ricaricamento forzato, o semplicemente aspettare, risolve.

## Direzioni possibili

Enumerazione delle topologie a un loop (fattibile: è combinatoria su grafi) anche
solo per mostrarle senza valutarle; algebra di colore e vertice QCD; topologie
2 → 3, che richiedono un vero enumeratore di grafi al posto della scorciatoia a
tre partizioni; fasci polarizzati; uno strato simbolico per il passaggio della
traccia, così da poter mostrare il risultato analitico accanto al numero.

## Licenza

MIT.
