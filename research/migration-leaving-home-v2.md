# Migratieblad stap 4: de pagina `leaving-home` naar de nieuwe vormtaal

Hoort bij `research/build-plan-v2.md` (stap 4). **Dit blad is voorbereiding.** Er is niets gewijzigd aan `src/pages/leaving-home/index.astro`, `src/components/CountryMap.astro` en `src/components/CountryTable.astro`; die zijn van de sessie die de pagina bouwt. Alles hieronder is nieuw en staat ernaast.

Stand 22 oktober 2026. De nieuwe bestanden zijn gecommit (`f93a218`, `976cb11`, `70086a3`); de pagina is niet omgezet.

## 1. Wat er klaarstaat

| Bestand | Wat het doet |
|---|---|
| `src/components/StageMap.astro` | De hele kaartsectie op het donkere podium: koptekst, lenzen (Everyone, Men, Women), SVG-kaart met het getal op het land, legenda uit `BANDS`, knoppen voor de kleinste landen, detailpaneel met trendlijntje en landkiezer. Vervangt `CountryMap.astro`. Props: `geo`, `index`, optioneel `eyebrow`, `title`, `lede` |
| `src/components/RankTable.astro` | De sorteerbare tabel met het trendlijntje per rij dat bij een reeksbreuk afbreekt, de jaarlabels voor achterlopende landen en een voetnoot. Vervangt `CountryTable.astro`. Props: `index` |
| `src/lib/leaving-home-map.js` | Rekenwerk en zinnen voor de kaart: `valueFor`, `rankFor`, `deltaVsEu`, `legendTicks`, `tierOf` (welk land past op welke breedte een label), `mapSummary`, `inspectFacts` (alles wat het paneel zegt), `ordinal`. Importeert `BANDS` uit `leaving-home.js`: de klassegrenzen staan niet meer op twee plekken |
| `src/lib/sparkline.js` | De meetkunde van een trendlijntje met reeksbreuken (`sparkline`), de tekenelementen (`sparkElements`) en de twee maten (`SPARK_SIZES`) |
| `src/lib/profile.js` | De ene sleutel `humanaverage:profile`: `readProfile`, `mergeProfile` (voegt samen, vervangt nooit), `clearProfile`. Gooit nooit, ook niet zonder localStorage |
| `public/css/ha.css` | Een blok onderaan (`@layer sections`) met de klassekleuren van de kaart, de labelrijen per kaartbreedte (container query), de knoppen, het paneel, de tabelkop en de modus voor geforceerde kleuren. Verder niets gewijzigd |

Controle: `step4check.mjs` (66 controles, allemaal geslaagd), `unit.mjs` (39 controles), `nojs4.mjs`, `cardheight.mjs` en `forced4.mjs`, allemaal in de sessienotities onder `tools/design-v2/step4/`. Wat ze dekken staat in §6.

## 2. Doelopbouw van `index.astro`

Eén `BaseV2`, dezelfde `title`, `description` en `canonical` als nu, plus `hue={STAGES.leave}` (uit `src/lib/hue.js`).

| Nu | Straks | Opmerking |
|---|---|---|
| `.page-hero` met eyebrow, h1, lead, vier `.stat-block`s, hero-noot | `<StatHero index={index} />` | Staat sinds stap 2. De vier blokken zijn het stippendiagram en de chips geworden; de zin "not with the United States" staat in de lead |
| Sectie "Where in Europe young people leave earliest" met `<CountryMap …/>` | `<StageMap geo={geo} index={index} />` | Bevat zijn eigen `<section class="stage-sec">` en koptekst. Een andere koptekst kan via `title` en `lede` |
| Sectie `#compare` met formulier, `<output>` en de callout | `<section class="block" id="compare">` met `<CompareForm index={index} />`, `<ResultPanel index={index} />` en de callout als `<div class="limits"><b>Why there is no percentile here</b>…</div>` | De tekst van de callout blijft zoals hij is. `ResultPanel` zegt zelf al kort dat dit geen percentiel is |
| Sectie "Every country" met `<CountryTable …/>` | `<section class="block">` met `sec-head` en `<RankTable index={index} />` | De bijschriftzin van `CountryTable` zit in `RankTable` (visueel verborgen), de uitleg van de kloofkolom in de voetnoot eronder |
| Sectie "What the numbers say" | Zie besluit A hieronder | |
| Sectie `#method` | `<MethodBlock index={index} />` | Staat sinds stap 2 |

## 3. Gegevens en script

- `clientIndex` in de frontmatter wordt `clientData(index)` uit `src/lib/leaving-home-copy.js` (voegt `eu` toe). Het JSON-element blijft `<script type="application/json" id="leaving-home-data">`. Let op de ontsnapping: `.replace(/</g, '\\u003c')` met dubbele backslash (met één backslash doet het niets).
- `comparison()`, `render()`, `readProfile()` en `writeProfile()` verdwijnen uit het script van de pagina: `ResultPanel` rekent, `profile.js` bewaart.
- Wat het script van de pagina overhoudt is de bedrading. Het staat bewezen in de wegwerppagina (`tools/design-v2/step1/v2-check-step2.astro.txt` voor stap 2; de stap-4-versie in `tools/design-v2/step4/v2-check-step4.astro.txt`). De regels:
  1. **Samenvoegen, nooit vervangen.** `mergeProfile({ country, age })`. De themakeuze van `BaseV2` staat in dezelfde sleutel; `writeProfile({ country, age })` zoals nu zou hem wissen.
  2. **Terugzetten is geen invoer.** Bij het laden stuurt de pagina `ha:country` en `ha:submit` met `source: 'restore'`. Alleen de onderdelen reageren; het bewaren en `track(EVENTS.valueSubmitted, …)` negeren die bron. Zonder die vlag telt elk bezoek van een terugkerende bezoeker als een ingevulde waarde.
  3. **`value_submitted`** hangt aan `ha:submit` zonder `source`, met `{ metric: 'leaving-home', country }` zoals nu. `methodology_opened` aan `[data-method-link]`, ongewijzigd.
  4. Het land bewaren zodra het gekozen wordt (kop of formulier), niet pas bij versturen: zie besluit C.

## 4. Wat verdwijnt

De `<style>`-blokken van de pagina (`.stat-row`, `.stat-block`, `.compare*`, `.callout`, `.hero-note`, de uitkomstregels) en van de twee oude onderdelen, en daarna `CountryMap.astro` en `CountryTable.astro` zelf: ze hebben één gebruiker. Verwijder ze in dezelfde commit als de overstap, niet eerder.

## 5. Besluiten die niet van mij zijn

| | Vraag | Mijn voorstel |
|---|---|---|
| **A** | De sectie "What the numbers say" heeft proza dat uit de gegevens komt (vrouwen eerder, de EU-lijn is vlak maar de landen komen naar elkaar toe, wie er opschoof, waarom 2021 een breuk is). `FactsBento` toont dezelfde feiten als vijf tegels, korter | Tegels bovenaan, het proza eronder houden: het bevat details die de tegels niet hebben. Dat vraagt een `.prose`-blok in `ha.css` (nog niet gemaakt) |
| **B** | De zinnen in `leaving-home-copy.js` (kopzin en "In the Netherlands, half had left by 23.4: you were 1.4 years before that point.") en in `leaving-home-map.js` ("7th earliest of 31 countries", "2.9 years earlier than the EU figure", "No 2025 figure. This is the latest, from 2019, and it is not ranked.") zijn door mij geformuleerd | De eigenaar van de paginatekst keurt ze goed of past ze aan. Het zijn enkele plekken, in één bestand |
| **C** | De landkiezer in de kop kan het land direct bewaren. Nu bewaart de pagina pas bij versturen | Direct bewaren: "één keer invullen, reist mee" is een eis uit CLAUDE.md. De privacytekst noemt het dan al ("kept in this browser") |
| **D** | De privacytekst zegt nu waarschijnlijk dat er één profiel met land en leeftijd staat. Er komt een themakeuze bij (nu al, via `BaseV2`) en later welke stops je zag | Tekst bijwerken in dezelfde commit als de overstap. Ik heb de privacypagina niet gewijzigd |
| **E** | `BaseV2.astro` heeft zijn eigen kopie van `readProfile` en `saveTheme`. `profile.js` is dezelfde logica | Laten importeren (één definitie). Klein, maar het raakt een bestand uit stap 1, dus apart gecommit |

## 6. Wat is gecontroleerd en wat niet

Gecontroleerd in headless Chrome (de versie die op deze machine staat), op een wegwerppagina met de echte gegevens en de bedrading uit §3. De pagina is inmiddels verwijderd; een kopie staat in de sessienotities.

- **Server-HTML zonder JavaScript:** 34 landen met klasse volgens `BANDS`, 28 labels, 12 knoppen, EU-paneel, 34 tabelrijen, 35 trendlijntjes, alle cijfers gelijk aan `index.json`. Niets onzichtbaar zonder JS.
- **Indeling bij 1280, 768, 390, 360 en 320 px:** 28, 22, 7, 7 en 7 labels; 6, 12, 12, 12 en 12 knoppen; getalgrootte 10,1 tot 17 px; contrast van elk label tegen zijn eigen kleur minstens 5,27:1; geen horizontale scroll; knoppen minstens 38 px hoog. Hoogte van het paneel is voor alle 35 keuzes en 3 lenzen gelijk (105 toestanden), dus er verspringt niets bij wisselen.
- **Interactie:** lens, muis (toelichting), klik, tik op een telefoon (toelichting blijft ruim 3 seconden), knoppen, landkiezer, toetsenbord (Enter, pijl), sorteren in de tabel, kop en formulier sturen de kaart aan en niet andersom.
- **Profiel en meting:** land bewaard bij kiezen, `value_submitted` precies één keer per versturen, thema wisselen laat land en leeftijd staan, terugkeer zet kop, formulier, resultaat, kaartpaneel en thema terug zonder te meten, `methodology_opened` bij de bronlink.
- **Toegankelijkheid:** 0 tekstelementen onder AA op 1280 en 390 px in licht en donker en op 320 px in licht (308 tot 315 gecontroleerd per run); geen bedieningselement zonder naam; geen dubbele id; geen kaartpad is een tabstop; CLS 0,0000. Geforceerde kleuren nagebootst: kaart, legenda en geselecteerde knoppen blijven zichtbaar. Wat onder de 36 px blijft zijn alleen links midden in een tekst.
- **Niets anders gewijzigd:** met de wegwerppagina verwijderd en opnieuw gebouwd (48 pagina's, 76 sitemap-URL's) toont `diff -rq dist dist-voor` alleen `css/ha.css`, `favicon-ha.svg` en `fonts/`, de uitvoer van stap 1. Zolang de wegwerppagina er stond veranderde de hashnaam van het scriptbestand van de huidige pagina, doordat ze een bibliotheek delen; de HTML was gelijk.

**Niet gecontroleerd:** Safari, Firefox, een echte telefoon, een schermlezer, container queries in een browser die ze niet kent (dan zijn alle labels zichtbaar en staan alleen de zes kleinste landen als knop; niet bekeken), en de pagina zelf: die is nog niet omgezet.

## 7. Poort voor stap 4 zelf

1. `npm run build`, 48 pagina's, `npm run leaving:validate` slaagt.
2. `step4check.mjs` en de audit uit stap 3 tegen `npm run preview` (poort 4321) in plaats van de wegwerppagina.
3. `view-source` van `/leaving-home/` bevat 26,3, de 28 labels en de 34 rijen.
4. De zichtbare methodologiesectie en de uitleg waarom er geen percentiel is staan er nog.
5. De privacytekst klopt met wat er in de sleutel staat (besluit D).

Commits zoals in het plan: `Move the leaving-home page to the v2 layout` · `Restyle the country map and table for the new design language` · `Show series breaks in the trend lines`. De hulpbestanden van dit blad (`profile.js`, `sparkline.js`, `leaving-home-map.js`, `StageMap`, `RankTable`, het blok in `ha.css`) staan al in eigen commits, zodat de overstap zelf klein blijft.
