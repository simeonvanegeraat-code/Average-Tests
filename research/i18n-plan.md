# Plan: meertalige site, Nederlands eerst

Geschreven 1 november 2026, na de vraag of humanaverage hetzelfde kan doen als
EUDebtMap: `/nl`, `/de`, `/fr` naast de Engelse site, elk apart geïndexeerd.

Het antwoord is ja, en het bewijs staat op de andere site: daar komt verkeer binnen op
alle vier de taalversies. Dit plan beschrijft wat er hier voor nodig is.

**Nederlands eerst**, omdat Simeon die kwaliteit zelf kan beoordelen. Duits daarna, als
het werkt. De machinerie wordt in één keer voor meerdere talen gebouwd — het verschil in
werk tussen "één extra taal" en "n extra talen" zit bijna helemaal in de architectuur,
niet in de tekst.

## Hoe EUDebtMap het doet (nagekeken op 1 november)

| | |
|---|---|
| URL's | Engels op `/`, de rest op `/nl`, `/de`, `/fr` |
| `hreflang` | Alle vier wijzen naar elkaar, plus een `x-default` naar de Engelse |
| Redirect op IP | Geen. De 301 op de root is alleen non-www → www |
| Landnamen | Vertaald: `Niederlande`, `Tschechien`, `Zypern` |
| Getallen | Per taal: `63,4%`, en `16.486.846.305.072 €` |
| Lopende tekst | Echt vertaald, geen machinevertaling-gevoel |

Eén bug daar, hier genoteerd omdat hij hier niet gemaakt moet worden: op `/de`, `/nl`
én `/fr` staat `<html lang="en">`. De `hreflang` zegt Duits, het `lang`-attribuut zegt
Engels. Gevolg: schermlezers spreken Duitse tekst met Engelse klanken uit, en Google
krijgt twee tegenstrijdige taalsignalen op dezelfde pagina.

## Wat hier al goed staat

Meer dan verwacht, en dat verkort het plan aanzienlijk.

- **De woorden staan al los van de logica.** Elk bestand in `src/lib/metrics/` bevat
  `label`, `unit`, `unitOne`, `bands[].label`, `lenses[].label`, `lenses[].who`,
  `words.*` en `input.*` — zo'n 20 tekstfragmenten per metriek, apart van elke
  berekening. Dat is per ongeluk al een taalbestand. `mapSubject` is zelfs al een
  sjabloon met een plaatshouder: `'the age by which half of {who} have left…'`.
- **De sitemap loopt over `dist/`**, niet over een lijst. Nieuwe taalpagina's komen er
  dus automatisch in. Zie `scripts/build-sitemap.mjs`.
- **Astro 5.14** heeft ingebouwde i18n-routing, stabiel sinds 4.0.
- **Er is één `<head>`**, in `src/layouts/BaseV2.astro`. De `hreflang`-blok hoort op
  precies één plek.
- **Eén dynamische route** (`src/pages/wealth/[country].astro`). De andere 20 pagina's
  zijn vast.
- **Rangtelwoorden worden eenvoudiger.** `ordinal()` doet nu `1st, 2nd, 3rd, 11th` —
  Engels is hier de moeilijke taal. Nederlands is `1e, 2e, 3e`, Duits `1., 2., 3.`.
- **Duits en Frans krijgen labels gratis van Eurostat** (zie hieronder).

## De vier lagen die verbouwd moeten worden

### 1. Routing, `lang` en `hreflang`

In `astro.config.mjs`:

```js
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'nl'],
  routing: { prefixDefaultLocale: false },
}
```

`prefixDefaultLocale: false` is het hele punt: **Engels blijft op `/`, Nederlands komt
op `/nl/`.** Geen enkele bestaande URL verschuift, dus geen redirects en geen verloren
posities. Dit is dezelfde opzet als EUDebtMap.

De 21 pagina's moeten dan per taal gebouwd worden zonder 21 bestanden te dupliceren. De
route wordt `src/pages/[...lang]/leaving-home/index.astro`, met een `getStaticPaths` die
`{ lang: undefined }` en `{ lang: 'nl' }` teruggeeft. Eén bestand, twee URL's.

> Dit is de enige echt riskante stap in het plan: elk paginabestand verhuist. Fase 1
> hieronder doet precies dit en niets anders, nog zonder een tweede taal, zodat
> aantoonbaar is dat er geen URL is veranderd.

In `BaseV2.astro`: `<html lang="en">` wordt `lang={lang}`, en er komt een
`hreflang`-blok bij met een `x-default` op de Engelse versie. `lang` en `hreflang`
moeten het altijd met elkaar eens zijn — dat is de bug van de andere site.

### 2. De woordenlaag

Een map `src/locales/<taal>/` met drie soorten tekst:

- **Metriekwoorden** — de ~20 fragmenten per metriek uit `src/lib/metrics/*.js`, maal 9
  metrieken. Die bestanden houden de cijfers, grenzen en lenzen; de woorden verhuizen.
- **Vaste tekst** — koppen, menu, voetteksten, knoppen. Ruwweg 160 fragmenten in
  `src/pages`, `src/components` en `src/layouts`.
- **Landnamen** — per landcode, niet per naam.

Die laatste vraagt een keuze. De landnaam staat nu **in de data**: elk record in
`data/*/index.json` heeft `"name": "Finland"`, en `.name` wordt 250 keer gelezen in 34
bestanden. Die 250 plekken verbouwen is geen optie.

**Doe het op de grens.** Eén functie die de index inleest en de namen per taal
invult voordat enig onderdeel hem ziet:

```js
localise(index, lang)   // vult record.name uit src/locales/<lang>/countries.json
```

De 250 leesplekken blijven dan ongewijzigd. Dit is het verschil tussen een middag en
een week.

**Bron voor de Nederlandse landnamen**: de Interinstitutionele schrijfwijzer van de EU
(Publicatiebureau, bijlage A5) geeft de officiële landnamen in alle 24 EU-talen. Dat is
een citeerbare bron en hoort als regel in `data/sources.md`, net als elke dataset.

### 3. De grammaticalaag — dit is het echte werk

Vier helpers zijn nu Engels, en twee ervan staan dubbel:

| Nu | Waar | Wat er moet gebeuren |
|---|---|---|
| `withArticle()` | `metric.js:29` **en** `wealth.js:90` | Eerst samenvoegen, dan per taal |
| `possessive()` | `wealth.js:96` | Engelse genitief (`the Netherlands's`); Nederlands doet dit anders |
| `count()` | `metric.js:34` | Meervoud per taal |
| `ordinal()` | `metric.js:70` | Wordt eenvoudiger in nl/de |

`NEEDS_ARTICLE` bevat nu twee landen: `{'Netherlands', 'United Kingdom'}`. Nederlands
heeft er een paar meer (*de* Verenigde Staten, *het* Verenigd Koninkrijk), Duits veel
meer — en dáár komt ook naamval bij: *in Deutschland*, maar *in den Niederlanden*, *in
der Schweiz*.

**Daarom nu alvast bouwen voor meer talen:** geef de lidwoordhelper meteen een argument
voor voorzetsel of naamval, ook al negeert Nederlands dat. Anders moet elke aanroep
opnieuw langs zodra Duits erbij komt. Dit is het ene punt waar "meteen alle talen
meenemen" echt werk scheelt.

**Getalopmaak** is nu hardgecodeerd Engels:

- `formatValue()` in `metric.js:50` doet `value.toFixed(decimals)` → `24.6`
- `formatAmount()`, `signed()` doen hetzelfde
- `wealth.js:67` doet `toLocaleString('en-US')`

Die moeten alle vier naar `Intl.NumberFormat(locale)`, zodat Nederlands `24,6` krijgt.
Let op: deze functies draaien **op de server én in de browser** — de metriekconfiguratie
gaat als JSON-blok de pagina in. De taal moet die grens dus mee over.

**Zinsopbouw** is het moeilijkste. Uit `leaving-home-copy.js:59`:

```js
const lead = [`In ${withArticle(home.name)} half had left by `, strong(age(home.total))];
```

Die array ís Engelse woordorde, met de nadruk op een vaste positie. Per taal moet er een
zinsbouwer komen in plaats van een lijst Engelse fragmenten. De bestanden die dit doen:
`leaving-home-copy.js`, `leaving-home-map.js`, `metric-map.js`, `related.js`,
`break-story.js`, `exit-age.js`, `unemployment-age.js`, `wealth-age.js`, `methodology.js`.

### 4. De redactielaag

Het vertalen zelf: ~280 fragmenten. Dat is werk, maar geen architectuur.

Het artikel op `/notes/eurostat-2021-series-break/` is lange lopende tekst en valt
buiten de eerste Nederlandse versie. Dat mag: je laat de `hreflang`-alternatief voor die
pagina simpelweg weg. Een taalversie hoeft niet compleet te zijn.

## Drie beslissingen voor Simeon (de eerste is genomen)

### 1. De definitie van de uitgever — besloten op 1 november 2026

**Besloten: optie (a). Het citaat blijft het citaat.** Op een Nederlandse pagina staat
de definitie van de uitgever in de taal waarin die is uitgegeven, zichtbaar gemarkeerd,
met daarnaast onze eigen Nederlandse uitleg. Er wordt geen definitie vertaald en daarna
als die van de uitgever gepresenteerd.

Wat daar concreet uit volgt, en wat de bouw dus moet kunnen:

1. **Een definitie draagt zijn eigen taal**, los van de taal van de pagina. Voor
   Nederlands is dat Engels; voor Duits geeft Eurostat met `lang=de` een echte Duitse
   definitie, dus daar staat hij in de taal van de pagina. Het blok moet dat verschil
   kennen in plaats van aannemen.
2. **Het element krijgt een `lang`-attribuut** dat zegt in welke taal het citaat staat.
   Zonder dat leest een schermlezer Engelse tekst met Nederlandse klanken voor — exact
   de fout van eudebtmap.com, dan niet op de pagina maar in één element.
3. **De markering is tekst, geen aanname.** Er staat bij dát het de uitgever is en in
   welke taal, want een Engelse alinea tussen Nederlandse zonder uitleg leest als een
   vergeten stuk vertaling.
4. **De belofte op `/method/` blijft ongewijzigd.** Dat was de reden voor deze keuze.

De afweging die eraan voorafging staat hieronder, voor wie later vraagt waarom.

Eurostat publiceert labels en definities in **Engels, Frans en Duits**. Nagekeken op
1 november: `lang=nl` geeft HTTP 400, *"Invalid value for 'wsLanguage' parameter."* Er
is dus geen Nederlandse definitie van Eurostat.

En `src/pages/method/index.astro:161` belooft op de pagina:

> *"Where a publisher writes its own definition, that definition is quoted rather than
> summarised, because the gap between a dataset's title and its definition is where this
> site has been wrong before."*

Dat is precies les 1 uit CLAUDE.md, en het is de reden dat `/leaving-home/` een
middelpunt toont en geen gemiddelde. Zelf een Nederlandse "definitie van Eurostat"
schrijven maakt die belofte onwaar.

Drie opties:

- **(a)** De Engelse definitie blijft staan, gemarkeerd als citaat in de taal van de
  uitgever, met daarnaast onze eigen Nederlandse uitleg. **Gekozen.** Het citaat blijft
  een citaat, en de bezoeker krijgt alsnog Nederlands.
- **(b)** Geen definitieblok op de Nederlandse pagina's. Dit botst met regel 4 uit
  CLAUDE.md: elke metriekpagina heeft een zichtbare methodesectie.
- **(c)** Wel vertalen, en de belofte op `/method/` aanpassen. Daarmee verdwijnt de
  bescherming die dit project al een keer gered heeft.

Voor Duits speelt dit niet: `lang=de` geeft Eurostats eigen Duitse definitie. Het
Nederlands is hier dus de moeilijke taal, niet het Duits.

### 2. Engels op `/` — ter bevestiging

Engels blijft op `/` en Nederlands komt op `/nl/`. Het alternatief (Engels naar `/en/`
met een redirect) zou elke bestaande positie weggooien. Dit lijkt me geen echte vraag,
maar het is wel een beslissing die vastgelegd moet worden voordat er een URL verschuift.

### 3. Hoeveel talen gaan er nú in de machinerie?

Jouw instructie was om het meteen voor alle talen te bouwen. Mijn uitwerking daarvan:
de machinerie voor n talen, maar een taal staat alleen in `locales` zodra zijn
woordenbestand compleet is — afgedwongen door de poort hieronder. Anders publiceert de
site halfvertaalde pagina's, en dat is precies het "content van weinig waarde" waarop
AdSense op 25 oktober afwees.

## De poort

CLAUDE.md: elke bron heeft een `validate-*.mjs` die moet slagen voordat er iets
gepubliceerd wordt. Een taal is hier net zo'n bron. Dus `scripts/validate-i18n.mjs`,
en die faalt als:

1. Een sleutel in één taal bestaat en in een andere actieve taal niet (beide kanten op).
2. Een gebouwde `/nl/`-pagina nog Engelse tekst bevat — te controleren door de gebouwde
   HTML te vergelijken met de Engelse woordenbestanden. **Met één uitzondering, en die
   moet de poort kennen:** de geciteerde definitie van de uitgever is op een Nederlandse
   pagina met opzet Engels (besluit 1). Zonder die uitzondering faalt de poort op precies
   de tekst die er hoort te staan — en een poort die onterecht afgaat wordt uitgezet.
3. Het `lang`-attribuut niet overeenkomt met het URL-voorvoegsel. Dit is letterlijk de
   bug van EUDebtMap, en een poort is de enige reden dat hij hier niet ook een jaar
   blijft staan.
4. De `hreflang`-verzameling op een pagina incompleet of niet wederkerig is, of
   `x-default` ontbreekt of dubbel staat.
5. Een getal op een Nederlandse pagina een punt als decimaalteken heeft.
6. Een geciteerde definitie géén `lang`-attribuut draagt, of een `lang` die niet zegt in
   welke taal het citaat werkelijk staat. Dit is de bug van eudebtmap.com op
   elementniveau, en hij volgt rechtstreeks uit besluit 1.

Punt 2, 5 en 6 houden een half afgemaakte vertaling tegen. Dat is het hele doel van de
poort. Punt 2 laat ook zien dat besluit 1 niet alleen een redactionele keuze is: een
poort die niet weet welke tekst met opzet anderstalig is, blokkeert het werk in plaats
van het te beschermen.

## Bouwvolgorde

Elke fase is een eigen PR, en fase 1 tot 3 veranderen niets wat een bezoeker ziet.

| Fase | Wat | Zichtbaar? |
|---|---|---|
| 0 | `withArticle`/`possessive` samenvoegen uit `metric.js` en `wealth.js` | Nee |
| 1 | Routing naar `[...lang]`, `lang`-attribuut dynamisch, `hreflang`-blok — **alleen Engels** | Nee: bewijst dat geen URL verschoof |
| 2 | Taalgrens: `localise()` voor landnamen, `Intl.NumberFormat` voor getallen — nog Engels | Nee |
| 3 | Nederlandse woordenbestanden en zinsbouwers; `/nl/` op `noindex` | Alleen op `/nl/` |
| 4 | De poort, dan Simeons review van het Nederlands, dan `noindex` eraf en Search Console | Ja, live |
| 5 | Duits: woorden en `lang=de` bij Eurostat. Geen architectuur meer | Ja |

Het zwaartepunt zit in fase 2 en 3. Fase 5 hoort een fractie te kosten van fase 3 — en
als dat niet zo blijkt, is de machinerie uit fase 1 en 2 niet goed genoeg gebouwd.

## Wat fase 2 heeft opgeleverd (1 november 2026)

Eén PR, vier commits, en geen zichtbare wijziging: 41 pagina's bit voor bit gelijk aan
`main`, 40 URL's ongewijzigd.

**De opmaakgrens staat en is dicht.** `src/lib/format.js` bepaalt hoe een getal eruitziet,
en élke formatteerfunctie in de repo gaat erdoorheen — `formatValue`, `formatAmount`,
`signed`, `euro`, `multiple`, `age`, `years`, `ownAge`, plus dertien plekken in pagina's
die hun eigen `toFixed` deden. `scripts/validate-i18n.mjs` faalt op een nieuwe bypass.

**De landnamengrens staat, maar wordt nog niet aangeroepen.** `localise(index, lang)` in
`src/lib/country-names.js` werkt en is getest; `src/locales/en/countries.json` is
gegenereerd uit de data (103 codes, nul naamconflicten) en de poort let op drift.

### Drie dingen die de proefrit heeft uitgewezen

Nederlands een half uur aangezet met `[nl] Finland` als namen, gebouwd, en weer uit. Dat
leverde meer op dan de code zelf:

1. **Routing, `lang`, `hreflang`, `x-default` en `canonical` kloppen met twee talen.**
   80 URL's, 41 Nederlandse pagina's, wederkerige alternates. De bug van eudebtmap.com
   staat hier niet open.
2. **De server geeft de taalgrens zijn taal nog niet mee.** Op een Nederlandse pagina
   stonden 240 getallen met een punt en nul met een komma. De grens kiest de notatie,
   maar iets moet hem zeggen wélke — en in de browser doet `<html lang>` dat, op de
   server nog niets. Dit is de eerste stap van fase 3, en de poort houdt hem nu tegen:
   een Nederlandse pagina met een punt als decimaalteken laat `validate-i18n.mjs` niet
   door.
3. **Een woordenbestand erbij zetten is niet genoeg.** `NAMES` in `country-names.js` is
   een expliciete lijst, dus een taal met een compleet woordenbestand kreeg alsnog de
   Engelse namen. Dat was precies een stille fout, en is nu een harde: de poort vergelijkt
   `LOCALES` met `NAMES`.

Punt 2 en 3 zijn gevonden doordat de proefrit bestond. Zonder die rit waren ze pas
opgevallen als er Nederlandse tekst op de site had gestaan, en dan als "de cijfers zien
er raar uit".

### Fase 3 begint hier

De taal moet op 21 plekken de pagina binnenkomen — elk bestand dat een dataset
importeert. Twee regels per bestand: `localeOf(Astro.url.pathname)`, en die taal in de
metriekconfiguratie (`{ ...metric, locale }`) plus in `localise(index, lang)`.

| Bestand | Importnamen |
|---|---|
| `[...lang]/index.astro` | `leaving` |
| `[...lang]/leaving-home/index.astro` | `index` |
| `[...lang]/household-size/index.astro` | `index` |
| `[...lang]/dwelling-size/index.astro` | `index`, `householdData` |
| `[...lang]/working-life/index.astro` | `index` |
| `[...lang]/working-hours/index.astro` | `index` |
| `[...lang]/unemployment/index.astro` | `index` |
| `[...lang]/unemployment/by-age/index.astro` | `totalIndex` |
| `[...lang]/pension-age/index.astro` | `index`, `exitIndex` |
| `[...lang]/healthy-years/index.astro` | `index` |
| `[...lang]/first-child/index.astro` | `index` |
| `[...lang]/wealth/index.astro` | `index`, `ageIndex` |
| `[...lang]/wealth/by-age/index.astro` | `ageIndex` |
| `[...lang]/wealth/[country].astro` | `index`, `ageIndex` |
| `[...lang]/method/index.astro` | `leaving`, `wealth`, `exitAge` |

Daarnaast, en dit zijn geen pagina's:

- **`src/lib/catalogue.js` en `src/lib/home-countries.js` rekenen op moduleniveau.**
  `export const CATALOGUE = [...]` wordt één keer bij import berekend en kan dus per
  definitie geen taal kennen. Die twee moeten functies worden (`catalogue(lang)`), en
  `BaseV2.astro` roept ze dan per pagina aan. Zonder dat blijft het megamenu Engels op
  een Nederlandse pagina.
- **De eenheidswoorden zitten in de metriekbeschrijvingen** (`unit: 'years'`,
  `unitOne: 'year'`, `unitShort`) en de kwintiellabels in de data zelf
  (`"label": "Bottom 20%"` in `data/wealth/index.json`). Dat is de woordenlaag, niet de
  opmaaklaag.
- **`data/wealth/index.json` heeft `euroArea.name: "I9"`** — de ECB-gebiedscode in een
  naamveld. Nu onzichtbaar, want geen pagina toont dat veld uit dít bestand;
  `/wealth/by-age/` toont wél `euroArea.name` maar uit `data/wealth-age/`, waar "Euro
  area" staat. Dat is een fout in `build-wealth.mjs` en hij hoort daar gerepareerd te
  worden, niet verstopt achter een woordenbestand. Voor een Nederlandse vermogenspagina
  moet dit eerst recht.
- **`src/pages/[...lang]/wealth/[country].astro:150`** doet nog zijn eigen opmaak in
  tekst (`{Math.abs(yearChange).toFixed(1)}% over the year`). Dat bestand was op
  1 november in gebruik bij een andere sessie; de poort noemt die regel bij naam zodat
  hij niet blijft liggen.

### Twee dode bestanden, gemeld en niet aangeraakt

`src/lib/threshold-explorer.js` en `src/lib/leaving-home-map.js` hebben nul importeurs.
De tabel in "De grammaticalaag" hierboven noemt `leaving-home-map.js` als bestand dat
een zinsbouwer nodig heeft — dat klopt dus niet: er is niets dat die zinnen nog leest.

## Wat dit plan niet doet

- **Geen redirect op IP.** Google waarschuwt daar expliciet tegen, en EUDebtMap doet het
  ook niet. Een bezoeker kiest zelf, net als in de balk daar.
- **Geen automatische taaldetectie** in de eerste versie. Eventueel later een
  suggestiebalkje op basis van de tijdzone — geen doorsturing, en nooit over de keuze
  heen die al in `humanaverage:profile` staat.
- **Geen vertaald `/notes/`.**
- **Geen Frans.** Staat in de machinerie, niet in de uitlevering.

## Twee dingen die ik tegenkwam en niet heb aangeraakt

Buiten de opdracht, dus alleen gemeld:

- `astro.config.mjs` en `BaseV2.astro` beschrijven in hun commentaar nog `/height/` en
  "het bevroren Nederlandse cluster in `public/`". Beide zijn op 24 en 25 oktober
  verwijderd. `build-sitemap.mjs` noemt dat cluster ook als reden om `@astrojs/sitemap`
  niet te gebruiken — die reden bestaat niet meer, de aanpak is nog wel prima.
- Het einde van `build-sitemap.mjs` leest het bestand terug dat het er net zelf heeft
  geschreven, en meldt dan `'geschreven'` of `'fout'`. Die controle kan niet falen.

## Wat fase 3 tot nu toe heeft opgeleverd (1 november 2026)

De machinerie staat en is gemeten. De tekstlaag niet; die is hieronder uitgesplitst.

**De taal bereikt nu de server.** Dat was het blokkerende punt uit de proefrit van fase
2 — "de grens kiest de notatie, maar iets moet hem zeggen wélke". Twintig
paginabestanden doen nu `localeOf(Astro.url.pathname)` en halen daarna 26 datasets door
`localise()` en 10 metriekbeschrijvingen met `locale` erin.

**Twee modules die op moduleniveau rekenden zijn functies geworden.** `CATALOGUE` en de
drie exports van `home-countries.js` werden berekend bij het importeren, en een waarde
die bij import ontstaat kan per definitie geen taal kennen. Nu `catalogue(lang)` en
`homeCountries(lang)`, met een cache per taal. De landenlijst sorteert ook met
`localeCompare(..., lang)`, want IJsland en Oostenrijk staan in het Nederlands elders
dan Iceland en Austria.

**De Nederlandse landnamen worden afgeleid, niet getypt.** Het plan hierboven schreef
dat ze uit de Interinstitutionele schrijfwijzer zouden komen. Dat bleek niet nodig: Node
draagt de volledige CLDR-tabel mee, en `Intl.DisplayNames(['nl'], { type: 'region' })`
geeft Nederland, Tsjechië, Noord-Macedonië, IJsland. 103 namen, nul die hun Engelse naam
moest houden. Twee soorten codes kent CLDR niet en die staan uitgeschreven: de
drieletterige OESO-codes plus Eurostats `EL` (tabel `ALIAS`, getoetst — voor 49 van de 52
geeft CLDR in het Engels exact de naam die al in de data staat), en de aggregaten
(`AGGREGATES`, per taal). `npm run locales:validate` draait de generator met `--check`,
dus een naam met de hand aanpassen houdt geen stand.

### De proefrit, nu met echte Nederlandse namen

Nederlands aangezet, 81 pagina's gebouwd, gemeten, weer uit:

| | |
|---|---|
| Landnamen | Nederlands. "Nederland" staat er, "Netherlands" komt niet voor |
| Getallen in zichtbare tekst | **3583 met een komma, 405 nog met een punt** (40 pagina's) |
| `lang`, `hreflang`, `x-default`, `canonical` | Kloppen met twee talen |
| De poort | Vindt 36 pagina's met een punt-decimaal en noemt de getallen |

Bij de proefrit van fase 2 stond dat op 240 met een punt en nul met een komma. De 405 die
overblijven zijn geen tweede soort fout — het is één soort, op 166 aanroepen.

### Wat er nog moet, en waarom het niet nu is gedaan

Er zijn **166 aanroepen van een formatteerfunctie die geen taal meekrijgen**, in 19
bestanden. De verdeling is het punt:

| Bestand | Aanroepen |
|---|---|
| `wealth/index.astro` | 50 |
| `wealth/[country].astro` | 31 |
| `wealth/by-age/index.astro` | 14 |
| `FactsBento.astro` | 13 |
| `StatHero.astro` | 12 |
| `leaving-home/index.astro` | 11 |
| `notes/eurostat-2021-series-break.astro` | 7 |
| `leaving-home-map.js` (dode code) | 5 |
| zes andere pagina's | 11 |
| `related.js`, `DotPlot` (clienthelft) | 4 |

**Vrijwel al die aanroepen staan ín een Engelse zin.** Ze patchen met `{ locale }` erbij
is dubbel werk: zodra er een Nederlandse zinsbouwer komt, krijgt de aanroep zijn taal via
die bouwer en moet de pleister er weer af. Dat is precies de verspilling waar
"De grammaticalaag" hierboven voor waarschuwt bij de lidwoordhelper. Dus: de tekstlaag
en deze aanroepen horen in één stap, per bestand.

Eén uitzondering is wel gedaan: `DotPlot.astro` maakt labels en geen zinnen ("FI 21,3"),
dus die heeft zijn taal gekregen. De clienthelft had hem niet nodig — `format.js` leest
daar `<html lang>`, nagemeten op de live site.

### Twee bevindingen die blijven staan

1. **`localise()` raakt losse gebieden opzettelijk niet aan.** Ik heb dat eerst wél
   gedaan en het was fout: `/wealth/by-age/` ging van "Euro area" naar "Euro area
   (EA11-1999, …, EA21-2026)". Code `EA` draagt twee gepubliceerde namen — Eurostat
   schrijft dat lange label in `data/household-size/`, de ECB schrijft "Euro area" in
   `data/wealth-age/`. Voor landen is één naam per code waar; voor aggregaten hangt de
   naam van de uitgever af, en een woordenbestand op code kan dat niet uitdrukken. Zo'n
   gebiedsnaam is dan ook geen landnaam maar een woord van de pagina, en daar hoort hij.
2. **`euroArea.name: "I9"` in `data/wealth/index.json` staat er nog**, en is een fout in
   `build-wealth.mjs`. Repareren betekent `npm run wealth` draaien en dus data in de repo
   veranderen; dat ligt bij Simeon en is op 1 november aan hem voorgelegd.

## De linklaag en de taalkiezer (2 november 2026)

Dit stond niet als eigen stap in de bouwvolgorde hierboven, en dat was een gat in het
plan. De vraag die het opende: *hoe wisselt een bezoeker eigenlijk van taal?*

**Het antwoord was: dat kon niet.** En er zat iets ernstigers onder. Gemeten vóór deze
ronde: **nul van de 86 interne links droeg een taalvoorvoegsel.** `prefixOf()` werd
alleen gebruikt voor de canonical en om het voorvoegsel er juist *af* te halen. De
Nederlandse versie zou dus veertig doodlopende pagina's zijn geweest — gebouwd, mooi,
en bij de eerste klik terug op het Engels.

Dat corrigeert ook de commitboodschap van `fe3e6d9`, waar staat dat BaseV2 het
voorvoegsel "bij een href zelf weer voor zet". Het eerste deel van die zin klopt; het
tweede beschreef iets wat niet bestond.

### Wat er nu staat

| | |
|---|---|
| `linkTo(path, lang)` | Eén functie op de grens. De paden blijven overal zonder voorvoegsel; één plek zet het ervoor |
| 86 links | Alle interne links erdoorheen, ankers incluis (`/method/#datasets-title`) |
| De taalkiezer | In de balk, gewone links, uit dezelfde `alternatesOf()` als de hreflang |
| Poortregel 6 | Een pagina met voorvoegsel mag geen interne link zonder voorvoegsel bevatten |

De kiezer is met opzet zo simpel: gewone links, geen JavaScript, geen opgeslagen keuze.
Het plan wil geen doorsturing op IP en geen taaldetectie, dus er is niets om te
onthouden — de bezoeker kiest en de URL ís de keuze. Hij verdwijnt niet op een smal
scherm zoals Notes en Method dat doen; daar wordt de volledige naam de taalcode.

De namen komen uit CLDR, elk in zijn eigen taal. Een Nederlandse bezoeker die op het
Engels belandt zoekt "Nederlands", niet "Dutch".

### Drie dingen die de proefrit uitwees

1. **De poort vindt nog precies één link zonder voorvoegsel**: de `/method/` in
   `about/index.astro`. Dat bestand is van een andere sessie zolang PR #37 open staat,
   dus met rust gelaten. Zodra Nederlands aangaat eist de poort hem op, en dat is het
   juiste moment.
2. **De dubbele `nl` werkt.** `/nl/wealth/nl/` bestaat en wordt door de clientcode goed
   gezet — de voordeur zet die link met `setAttribute('href', cell.p)`, dus dat pad
   krijgt zijn voorvoegsel in `home-countries.js` en niet in de pagina. Nagemeten:
   België geeft `/nl/wealth/be/` met €288k, Nederland `/nl/wealth/nl/` met €232k.
3. **De landenlijst sorteert nu echt Nederlands.** De eerste opties zijn Albanië,
   België, Bosnië en Herzegovina — dat is `localeCompare(..., lang)` aan het werk, en in
   het Engels zou die rij anders zijn.

### Twee fouten van mijzelf, met de les erbij

- **Een lijst in plaats van een regel.** Ik had de uitzonderingen (wat géén paginapad
  is) met de hand overgetypt uit een gefilterd overzicht, en gaf daarmee het favicon,
  twee iconen en beide lettertypen een taalvoorvoegsel: vijf 404-en op `/nl/`.
  Vervangen door een regel — een paginapad eindigt op een schuine streep, alles in
  `public/` heeft een extensie — en het script meldt nu wat het overslaat.
- **Twee expressieblokken kostten twee bytes op 41 pagina's.** Astro bewaart
  bronwitruimte en de compressie maakt er één spatie van, nooit nul (nagemeten in
  `894e21d`). Twee losse blokken met een regel ertussen gaven dus twee spaties waar er
  eerst één stond. Eén blok, vastgeplakt aan de `</a>` ervoor, en de HTML is weer bit
  voor bit gelijk aan `main`.

## De tekstlaag: besloten op 3 november 2026

Simeon koos "de tekstlaag" als volgende stap en antwoordde op drie vragen die de vorm
bepalen. Dit zijn beslissingen, geen voorstellen meer.

| Vraag | Antwoord |
|---|---|
| Hoe wordt het Nederlands beoordeeld? | **Pas als alles klaar is.** Eén preview met alle 21 pagina's Nederlands, niet per metriek |
| Wie schrijft het Nederlands? | **Ik schrijf, Simeon corrigeert** |
| Gaat het artikel op `/notes/` mee? | **Ja**, 30 alinea's lopende tekst, geen uitzondering in de taalkiezer |

Het eerste antwoord heeft een gevolg voor de bouw: een toonwijziging komt pas aan het
eind, dus mag hij niet langs ~500 fragmenten hoeven. Daarom staat terugkerende
formulering in de zinsbouwers en niet uitgeschreven per pagina — "later dan het
EU-cijfer" hoort één keer te bestaan.

Het derde antwoord maakt een bevinding uit de review van PR #37 scherp: zodra
`/nl/notes/eurostat-2021-series-break/` bestaat, wijst het `mainEntityOfPage.@id` van
die pagina naar de **Engelse** pagina. Dat is nu een echt defect en niet langer
theoretisch, dus de kleine JSON-LD-PR moet vóór de Nederlandse tekst landen.

### Waar taalmateriaal woont

Eén map per taal, zoals `countries.json` dat al doet:

```
src/locales/<taal>/
  countries.json     staat er — 103 namen, uit CLDR
  ui.json            vaste tekst uit pagina's, componenten, layout
  metrics.json       de woorden uit src/lib/metrics/*.js
  notes.json         titels en samenvattingen uit src/lib/notes.js
  grammar.js         lidwoord, meervoud, rangtelwoord          ← staat er sinds stap 1
  copy/*.js          de zinsbouwers per taal
```

De eerste drie zijn gegevens, de laatste twee code — een Nederlandse zin is niet een
Engelse zin met andere woorden erin.

**De grens is de hele truc, en hij kopieert wat twee keer eerder werkte** (`localise()`
voor landnamen, `format.js` voor getallen): vul de woorden in vóórdat een component het
object ziet, zodat geen enkele leesplek verandert. Dus `localiseMetric(metric, lang)`
naast `localise(index, lang)`, aangeroepen waar `catalogue.js` nu al
`{ ...metric, locale: lang }` doet — en elke `metric.words.low` in een component blijft
staan. Hetzelfde voor vaste tekst via `ui(lang)`, naast de `const lang` die sinds #39 in
elk paginabestand staat.

### De browserhelft, nagemeten

Twee zinsbouwers draaien óók in de browser, en dat is niet aangenomen:

- `leaving-home-copy.js` → `ResultPanel.astro:46` en `StatHero.astro:101`
- `metric-map.js` → `StageMap.astro:296`

Plus losse strings in de scripts van `DotPlot`, `StageMap`, `RankTable` en `Globe`. Die
krijgen hun taal uit `<html lang>`, zoals `format.js` dat al doet. De copy-modules staan
in een register `{ en, nl }` dat op `document.documentElement.lang` kiest, en dat
betekent dat het Nederlands meereist naar Engelse pagina's. Met twee talen is dat te
verdedigen; loopt het uit de hand bij een derde, dan is de uitweg een dynamische import
per taal.

### Bouwvolgorde

| # | Wat | Zichtbaar | Staat |
|---|---|---|---|
| 1 | `grammar.js` krijgt `lang` + het naamval-argument; Nederlandse tabel ernaast | Nee | **Gedaan** |
| 2a | `metrics.json` + `localiseMetric()`: de 244 metriekwoorden | Nee | **Gedaan** |
| 2b | `ui.json` + `ui()`: de vaste tekst in de schil en de prozapagina's | Nee | **Gedaan** |
| 3a | `leaving-home-copy.js` en `metric-map.js` gesplitst (de twee die de browser haalt) | Nee | |
| 3b | De zeven server-only libs gesplitst | Nee | |
| 4 | Het Nederlands: alle woordenbestanden, alle `copy/nl/`, het artikel; `nl` in `LOCALES`, `/nl/` op `noindex` | Ja, op `/nl/` | |

### Wat stap 1 heeft opgeleverd

Alle 56 pagina's en vaste bestanden byte voor byte gelijk aan `main`. Twee chunks
verschillen van inhoud: `grammar` omdat hij herschreven is, en `format` omdat `grammar`
nu `DEFAULT_LOCALE` importeert en Rollup die constante in de gedeelde chunk zet. Bundel
54.301 → 54.773 bytes.

De ~90 aanroepen van `withArticle()` zijn met opzet niet aangeraakt: ze staan in Engelse
zinnen die in stap 2 en 3 tóch naar een taalmodule verhuizen, en daar staat de aanroep
in Nederlandse code. Nu patchen betekent twee keer langs.

### Twee bevindingen uit de proefrit van stap 1

1. **`related.js` geeft Engelse landnamen op een Nederlandse pagina.** Op
   `/nl/leaving-home/` staat "Croatia at 31.5 has 2.6 people per household". De oorzaak
   is niet de taalgrens maar dat dit bestand hem overslaat: `related.js` importeert zijn
   negen JSON-bestanden zélf en `related(metric)` krijgt geen taal, dus er komt nooit
   een `localise()` aan te pas. In stap 3b wordt dat `related(metric, lang)`.
2. **`euroArea.name: "I9"` is geen blokkade.** Correctie op wat hierboven staat:
   nagekeken op 3 november, en geen enkele pagina toont dat veld uit
   `data/wealth/index.json`. `/wealth/by-age/` toont `euroArea.name` wél, maar uit
   `data/wealth-age/`, waar "Euro area" staat. Het blijft een latent pipelinedefect dat
   `npm run wealth` vraagt, en dus Simeons beslissing — maar de Nederlandse
   vermogenspagina hangt er niet op.

Wat `/wealth/by-age/` wél nodig heeft, is dat zijn aggregaatrij zijn label uit `ui.json`
haalt in plaats van uit `euroArea.name`. Dat is precies wat `country-names.js` voorspelde:
een gebiedsnaam is een woord van de pagina, niet een landnaam.

### Wat stap 2a heeft opgeleverd

244 metriekwoorden staan in `src/locales/en/metrics.json`, gegenereerd uit
`src/lib/metrics/*.js` door `scripts/build-locale-metrics.mjs` en met `--check`
afgedwongen in `npm run locales:validate`. De grens is `localiseMetric(metric, lang)` in
`src/lib/metric-names.js`, aangeroepen op elf plekken plus `entry()` in `catalogue.js`.
Alle 40 pagina's byte voor byte gelijk aan de live site.

Stap 2 is in twee gesplitst, zoals stap 3 al was. De metriekwoorden zijn gestructureerd
en mechanisch na te meten; de vaste tekst in de pagina's is dat niet, en dat zijn twee
verschillende soorten werk.

**De klasselabels blijven tekst, en dat is een afweging die het opschrijven waard is.**
"under 22" bevat de 22 die er als `until` al staat, en CLAUDE.md regel 5 zegt dat geen
getal met de hand ergens staat. Maar de opmaak van dat getal is per metriek met de hand
gekozen en volgt geen regel die alle zestig labels reproduceert:

| Metriek | Labels | Wat de opmaak doet |
|---|---|---|
| `household-size` | `2.0 to 2.2` | houdt de nul |
| `pension-age` | `60 to 61` … `63 to 64.5` | heeft die nul niet |

Een generator die beide geeft bestaat niet, en een die één van de twee verandert
verandert de Engelse site. Daarom blijven ze gegevens, en meet de poort in plaats daarvan
na dat de getallen in een label de grenzen zijn die het label beschrijft. De dubbeling
blijft, maar hij kan niet meer wegdrijven — en bij het vertalen vangt dezelfde regel een
"22 tot 25" waar "22 tot 24" hoort.

**Twee woorden blijven liggen voor 2b**: `wealthEntry()` in `catalogue.js` heeft
`'Wealth'` en `'median'` met de hand, en vermogen heeft geen bestand in
`src/lib/metrics/`. Dat zijn paginawoorden en ze horen in `ui.json`.

### Wat stap 2b heeft opgeleverd, en een maatstaf die moest wijken

132 fragmenten vaste tekst staan in `src/locales/en/ui.json`, met `ui(lang)` in
`src/lib/ui.js` als grens. Dat is de schil (layout, 404, zeven componenten) plus de
lopende tekst van `/method/`, `/about/`, `/privacy/`, `/contact/` en `/notes/`.

**De knip is anders uitgevallen dan het plan hierboven zei.** Gemeten op 3 november: 560
fragmenten vaste tekst in de .astro-bestanden, en 488 zinnen met data erin. De ~390 vaste
fragmenten op de negen metriekpagina's staan tussen hun eigen datazinnen, en die zinnen
gaan in stap 3 tóch om — dus ze gaan daar mee, per bestand, in plaats van nu apart. Elk
bestand twee keer open is precies de verspilling waar dit plan al een keer in liep.

`ui.json` is **niet** gegenereerd, anders dan `metrics.json`. De Engelse tekst stond in de
.astro-bestanden en staat nu hier, dus dit bestand ís de bron en er is niets om hem tegen
te vergelijken. De pariteitscontrole in de poort is daarom het enige wat een gat kan
vinden.

**Byte-identiek is hier niet haalbaar, en dat is hoe Astro werkt.** Tekst die een
expressie wordt, krijgt zijn omringende witruimte genormaliseerd: waar de compressie eerst
een regeleinde plus indentatie tot `\n` terugbracht, staat er nu een spatie. En een
apostrof uit een expressie wordt `&#39;` in plaats van letterlijk — twee keer op de hele
site, in "this browser's local storage" op `/privacy/`.

De maatstaf voor stap 2b en 3 is daarom **identiek ná normalisatie van witruimte en
entiteiten**. Dat is wat "niets verandert voor een bezoeker" echt betekent; byte voor byte
was daar alleen een proxy voor, en die gaat hier niet op. Uitkomst: 40 van de 40 pagina's
identiek, en de site werd 1556 bytes kleiner.
