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
