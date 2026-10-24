# Databronnen

Elke dataset die de site gebruikt staat hier, met bron, periode, omvang, licentie en
ophaaldatum. Staat een dataset hier niet, dan mag er geen cijfer van op de site.

De ruwe bestanden staan niet in git (`.gitignore`). Reproduceerbaarheid komt van de
URL's en SHA-256-checksums in `scripts/lib/nhanes.mjs`: `node scripts/fetch-nhanes.mjs`
weigert te draaien als CDC een bestand heeft gewijzigd.

---

## NHANES — National Health and Nutrition Examination Survey

> **Niet meer in gebruik sinds 24 oktober 2026.** De percentielpagina's op Amerikaanse
> microdata (`/height/`, `/weight/`, `/play/`) zijn die dag van de site gehaald en de
> pipeline, de data en de libs zijn verwijderd; de site richt zich op Europese
> landenvergelijkingen. Deze sectie blijft staan omdat de validatie hieronder de
> NCHS-publicatie tot op de decimaal reproduceert, en dat is het bewaren waard als
> maatstaf voor wat een poort moet kunnen. Alles hieronder beschrijft dus wat er wás,
> niet wat er is: `data/percentiles/` bestaat niet meer. Terug te halen via git
> (`git show 0f41e4e:data/percentiles/height.json`).

**Uitgever** CDC / National Center for Health Statistics (NCHS), Verenigde Staten
**Licentie** Publiek domein. Werk van de Amerikaanse federale overheid, vrij te
gebruiken en te herverdelen. NCHS vraagt om bronvermelding, geen toestemming.
**Opgehaald** 30 augustus 2026, van `https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/`
**Gebruikt voor** lengte- en gewichtspercentielen naar leeftijd en geslacht

### Bestanden

| Cyclus | Periode | Bestand | Records | Variabelen | Gewichtsvariabele |
|---|---|---|---|---|---|
| P | 2017 – maart 2020 (pre-pandemie) | `P_DEMO.xpt` | 15.560 | 29 | `WTMECPRP` |
| P | 2017 – maart 2020 (pre-pandemie) | `P_BMX.xpt` | 14.300 | 22 | — |
| L | augustus 2021 – augustus 2023 | `DEMO_L.xpt` | 11.933 | 27 | `WTMEC2YR` |
| L | augustus 2021 – augustus 2023 | `BMX_L.xpt` | 8.860 | 22 | — |

Na koppeling op respondentnummer, filtering op een geldig MEC-onderzoeksgewicht en
beperking tot leeftijd 18 t/m 79: **14.384 respondenten**, waarvan 14.198 met een
gemeten lengte en 14.191 met een gemeten gewicht.

### Waarom deze twee cycli

Verder terug poolen levert geen precisie meer op. Gewogen percentielen voor de lengte
van mannen van 20 jaar en ouder:

| Pool | n | p5 | p50 | p95 |
|---|---|---|---|---|
| alleen 2021–2023 | 2.690 | 162,2 | 175,2 | 187,3 |
| **2017–2023 (P+L, gekozen)** | **6.751** | **162,7** | **175,1** | **187,3** |
| 2013–2023 (+ H en I) | 11.985 | 162,8 | 175,4 | 187,5 |

Van 2.690 naar 6.751 respondenten verschuift de mediaan 0,1 cm; de schatting is dus al
stabiel. Nog eens verdubbelen voegt alleen tien jaar oudere data toe en verschuift de
percentielen ~0,25 cm omhoog. Recentheid weegt hier zwaarder dan steekproefomvang.

De cycli P en J (2017–2018) overlappen elkaar — P bevat J — en mogen daarom nooit samen
worden gebruikt.

### Bewerkingen

- **Weging.** Elke respondent telt mee met zijn MEC-onderzoeksgewicht. NHANES
  oversamplet bepaalde groepen; ongewogen rekenen is niet "iets minder precies" maar
  fout. Ter illustratie: het ongewogen gemiddelde voor mannen 20+ in 2017–2018 is
  173,4 cm, het gewogen gemiddelde 175,2 cm.
- **Cycli combineren.** P beslaat ~3,2 jaar, L beslaat 2 jaar. Elk gewicht wordt
  geschaald naar het aandeel van de totale periode. Bij even lange cycli is dat exact
  de gangbare NCHS-regel "deel door het aantal cycli".
- **Leeftijd 80 verwijderd.** NHANES top-codeert leeftijd: iedereen van 80 jaar en
  ouder krijgt de waarde 80. Die groep is dus geen leeftijdsjaar (bij mannen 427
  personen tegenover 66 op leeftijd 79) en zou de curve aan de bovenkant vervormen.
- **Gepubliceerd bereik 20 t/m 79.** Leeftijden 18 en 19 doen wel mee als
  ondersteuning voor de kernel aan de onderrand, maar krijgen geen eigen uitkomst.
  Percentielen voor tieners horen bij groeicurves, niet bij dit product.
- **Gladstrijken.** Per leeftijd tellen omliggende leeftijden mee via een
  tricube-kernel met bandbreedte 6 jaar; daarna gewogen kwantielen. Achter elke
  leeftijdscel zitten minimaal 254 effectieve respondenten.

### Validatie

`node scripts/validate-percentiles.mjs` moet slagen voordat er iets wordt gepubliceerd.
De externe controle vergelijkt met CDC/NCHS FastStats "Body Measurements"
(pagina gelezen op 30 augustus 2026), dat citeert uit *Anthropometric Reference Data
for Children and Adults: United States, August 2021–August 2023*, tabellen 4, 8 en 12.

| Grootheid | Berekend | Gepubliceerd |
|---|---|---|
| Lengte mannen 20+ | 68,92 → 68,9 inch | 68,9 |
| Gewicht mannen 20+ | 199,04 → 199,0 lb | 199,0 |
| Lengte vrouwen 20+ | 63,48 → 63,5 inch | 63,5 |
| Gewicht vrouwen 20+ | 171,77 → 171,8 lb | 171,8 |

Alle vier reproduceren de publicatie exact. Ter controle is ook de buikomtrek nagerekend
(mannen 40,55 → 40,6 tegen gepubliceerd 40,6; vrouwen 38,55 tegen gepubliceerd 38,5 — die
laatste valt precies op de afrondingsgrens). Buikomtrek gebruiken we verder niet.

Daarnaast draaien er twee interne controles die geen externe bron nodig hebben: de
gedecodeerde BMI komt overeen met gewicht gedeeld door lengte in het kwadraat (maximale
afwijking 0,0500, precies de afrondingsmarge), en de som van de steekproefgewichten komt
uit op de werkelijke Amerikaanse volwassenenpopulatie.

### Bronvermelding op de site

> Centers for Disease Control and Prevention (CDC), National Center for Health
> Statistics (NCHS). National Health and Nutrition Examination Survey, 2017–March 2020
> and August 2021–August 2023. U.S. Department of Health and Human Services.

---

## ECB — vermogen van Europese huishoudens

**Uitgever** Europese Centrale Bank (ECB), Distributional Wealth Accounts (DWA)
**Licentie** **Niet vastgesteld.** De voorwaarden van de ECB zijn niet gelezen; er staat
nergens in de code of op de pagina een licentieregel. Nalopen voordat er advertenties
bij komen, want dan wordt het gebruik commercieel.
**Opgehaald** 5 september 2026
**Gebruikt voor** `/wealth/` en `/wealth/<land>/`: mediaan en verdeling van het
huishoudvermogen per land

### Opvraag

| | |
|---|---|
| API | `https://data-api.ecb.europa.eu/service/data/DWA` |
| Reekssleutel | `Q..S14..LE.....` vanaf `2023-Q1`, formaat `csvdata` |
| Waarnemingen | 250.680, waarvan 19.704 netto-vermogensreeksen |
| Periodes | 13 kwartalen, 2023-Q1 t/m 2026-Q1 |
| Gebieden | 23: 21 landen plus de aggregaten `I9` en `I10` (eurozone), die niet in de landenlijst horen |

Geen checksum op het ruwe antwoord: de ECB publiceert elk kwartaal bij, dus een
veranderend antwoord is correct gedrag. Wat we vastleggen is de opvraagdatum en de
gevonden periodes in `data/raw/dwa/fetch-log.json`.

### Waarom DWA en niet HFCS

De HFCS-microdata zou percentielen toelaten, maar vereist een formele aanvraag bij de
ECB (paspoort, cv, aanvraagformulier) en ververst eens per drie à vier jaar. DWA is vrij
opvraagbaar en komt elk kwartaal uit. Wat we inleveren is de leeftijdsindeling; wat we
terugkrijgen is actualiteit plus een indeling naar woonsituatie en werkstatus, die voor
vermogen meer zegt dan leeftijd.

### Waarom hier geen percentiel staat

**DWA publiceert per groep het gemiddelde, niet de grens van die groep.** We kennen dus
het gemiddelde vermogen van het zevende deciel, maar niet waar dat deciel begint. "Je zit
op het 63e percentiel" is daarmee niet te onderbouwen. Wat wel mag, en wat de pagina doet:
de mediaan (die publiceert DWA exact) en "jouw bedrag ligt tussen het gemiddelde van
deciel X en dat van deciel Y".

### Drie valkuilen, alle drie in de code vastgelegd

1. Netto vermogen staat onder `ACCOUNT_ENTRY` = `N` (Net), niet `A` (Assets). Een
   sleutel met alleen `A` levert stilzwijgend alles op behalve het belangrijkste cijfer.
2. Schulden komen als negatieve bedragen binnen.
3. `F5`, `F51` en `F_NNA` zijn optelposten die dubbeltellen als je ze meeneemt.

### Validatie

`node scripts/validate-wealth.mjs` moet slagen voordat er iets wordt gepubliceerd. Zes
controles; gedraaid op 24 oktober 2026, allemaal geslaagd:

| Controle | Uitkomst |
|---|---|
| Bedragen in euro's, niet in duizenden | alle groepen plausibel |
| Gemiddelde boven de mediaan (vermogen is scheef) | 21 landen, hoogste verhouding 3,7× |
| Groepen lopen op: B50 < Q3 < D8 < D9 < D10 | 21 landen |
| Huiseigenaren bezitten meer dan huurders | 20 landen |
| **Som van alle posten = gepubliceerd netto vermogen** | grootste afwijking **0,11%** bij LT/B50 |
| Dekking: ≥18 landen met mediaan, ≥8 kwartalen historie | 21 landen, alle kwartalen |

De vijfde is de scherpste die deze dataset toelaat: ontbreekt er een post, telt een
optelpost dubbel of zit er een schaalfout in, dan sluit de balans niet. Alle drie zijn
onzichtbaar op de pagina zelf.

### Bronvermelding op de site

> European Central Bank, Distributional Wealth Accounts, 2026-Q1.

---

## Eurostat — jongeren die het ouderlijk huis verlaten

**Uitgever** Eurostat (Statistical Office of the European Union)
**Licentie** Hergebruik toegestaan, ook commercieel, met bronvermelding. De
copyright-pagina van Eurostat is op de URL die we probeerden niet rechtstreeks gelezen
(404); de voorwaarde hierboven komt uit samenvattingen van die pagina. **Nog te
verifiëren bij de bron zelf.**
**Opgehaald** 20 oktober 2026, via de dissemination-API (geen sleutel nodig)
**Gebruikt voor** `/leaving-home/`: de leeftijd waarop de helft van de jongeren niet meer
bij de ouders woont, per land

### Dataset

| | |
|---|---|
| Code | `yth_demo_030` |
| Titel | Estimated average age of young persons leaving the parental household |
| DOI | [10.2908/YTH_DEMO_030](https://doi.org/10.2908/YTH_DEMO_030) |
| Metadata | https://ec.europa.eu/eurostat/cache/metadata/en/lfst_hh_esms.htm |
| Bijgewerkt door Eurostat | 16 april 2026 |
| Dimensies | freq (A) × unit (AVG) × sex (T/M/F) × geo (36) × time (2000–2025) |
| Waarnemingen | 2.331 |

### Wat het cijfer is, en wat het níet is

De titel van de dataset zegt "estimated average age", maar de definitie die Eurostat zelf
bij de dataset meelevert zegt iets anders: de leeftijd waarop 50% van de bevolking niet
meer in een huishouden met de ouder(s) woont, op basis van de EU Labour Force Survey. Dat
is een middelpunt, geen gemiddelde. De site volgt de definitie en benoemt het verschil op
de pagina zelf.

Omdat er per land één getal is en geen verdeling, kan hier **geen percentiel** uit. De
pagina zegt dat expliciet. Dat is het verschil met de NHANES-pagina's, die wel op
microdata draaien.

### Dekking

Na scheiding van de twee aggregaten (`EU27_2020`, `EA21`) blijven er 34 landen over.
**31 daarvan hebben een cijfer voor 2025.** Drie lopen achter en worden op de site met
hun eigen jaar getoond: VK (2019), Montenegro (2020), Türkiye (2024). De VS, Canada en
Australië zitten niet in deze dataset.

### Reeksbreuken — belangrijk

Eurostat vlagt waarnemingen met `b` ("break in time series"). In 2021 is de European
Labour Force Survey herzien en **vrijwel elk land heeft daar een breuk**; daarnaast staan
er oudere breuken in losse landen. Het breukjaar zelf is bovendien een overgangsjaar:

| Land | 2019 | 2021 (breuk) | 2022 | 2025 |
|---|---|---|---|---|
| Portugal | 28,9 | 33,3 | 30,1 | 28,8 |
| Zweden | 17,8 | 22,0 | 21,6 | 23,1 |

Een vergelijking met bijvoorbeeld 2005 levert daardoor een getal op dat echt lijkt en
niets betekent. De build legt per land de breukjaren vast en berekent `comparableSince`
= het eerste jaar ná de laatste breuk (nu 2022). `trend()` in `src/lib/leaving-home.js`
weigert te rekenen als er alsnog een breuk in het venster valt, en
`validate-leaving-home.mjs` controleert dat.

### Bewerkingen

`node scripts/fetch-eurostat.mjs` haalt het JSON-stat-antwoord naar `data/raw/eurostat/`
(gitignored) met een fetch-log; `build-leaving-home.mjs` schrijft
`data/leaving-home/index.json`. Geen checksum op het ruwe bestand: Eurostat publiceert
bij, dus een veranderend antwoord is correct gedrag en geen fout. In plaats daarvan
controleert het fetch-script het dataset-label, zodat een stille codewissel niet
ongemerkt doorkomt.

### Validatie

`node scripts/validate-leaving-home.mjs` moet slagen voordat er iets wordt gepubliceerd.
De controle rekent elk gepubliceerd cijfer én elke breukvlag terug naar het ruwe
antwoord, controleert dat aggregaten niet als land zijn geteld, dat elk land zijn eigen
jaar meedraagt, en dat het vergelijkbare venster werkelijk breukvrij is.

### Bronvermelding op de site

> Eurostat, *Estimated average age of young persons leaving the parental household*
> (`yth_demo_030`), bijgewerkt 16 april 2026. Afgeleid van de EU Labour Force Survey.

---

## Natural Earth — landgrenzen voor de Europakaart

**Uitgever** Natural Earth
**Licentie** Publiek domein. Commercieel gebruik toegestaan, bronvermelding niet
verplicht (https://www.naturalearthdata.com/about/terms-of-use/)
**Opgehaald** 20 oktober 2026
**Gebruikt voor** de SVG-kaart op `/leaving-home/`

### Bron

| | |
|---|---|
| Dataset | Natural Earth, "Admin 0 – Countries", schaal 1:50m, versie 4.1.0 |
| Verspreid als | TopoJSON via npm-pakket `world-atlas` 2.0.2 (Mike Bostock, ISC) |
| URL | `https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json` |
| Bestand | `countries-50m.json`, 756.420 bytes |
| SHA-256 | `04342cdc1e3016bcd7db1630de95684d67b79fe3c8c460321e87aef469502394` |

Anders dan bij Eurostat staat hier **wel** een checksum op: een vastgepinde
pakketversie hoort niet te veranderen, dus als hij dat toch doet is dat een fout en
geen bijwerking. `scripts/build-geo.mjs` weigert te draaien als de checksum afwijkt.

### Bewerking

`node scripts/build-geo.mjs` schrijft `data/geo/europe.json` (55.907 bytes, 54
landvormen: 34 met Eurostat-data, 20 als achtergrond).

| | |
|---|---|
| Projectie | Lambert azimutale equal-area, middelpunt 10°O 52°N, y gespiegeld |
| Kader | viewBox 1000 × 855, omhullende van veertien randlanden plus 1,5% marge |
| Vereenvoudiging | Ramer–Douglas–Peucker per TopoJSON-arc, ε = 0,55 viewBox-eenheden voor datalanden en 1,1 voor achtergrondlanden |
| Eilandjes | vallen weg onder 0,25 eenheden² (datalanden) of 1,5 (achtergrond); het grootste polygoon van een land blijft altijd staan |
| Labelpunt | middelpunt van de grootste ingeschreven cirkel (polylabel, precisie 0,6) in het grootste polygoon; `lr` is de straal daarvan |
| Afronding | coördinaten op 0,1 eenheid |

De site gebruikt `lr` om te bepalen of een land zijn waarde als label op de kaart
krijgt of als chip eronder: onder de 13 eenheden is er geen ruimte voor leesbare tekst.

Equal-area omdat oppervlakten op een kaart met waarden per land eerlijk horen te
zijn, en azimutaal omdat Europa in Mercator of in een platte lengte/breedtekaart
scheef staat. Landen delen hun arcs, dus gedeelde grenzen blijven op elkaar
aansluiten.

### Twee punten die geverifieerd zijn

- **Reproduceerbaar, binnen één engine.** Het script is op 20 oktober 2026 meermaals
  gedraaid op Node v24.19.0 en levert elke keer een bestand dat byte-voor-byte gelijk is
  aan de versie die in de repo staat. Op een andere Node- of V8-versie kan een enkel
  coördinaat in de laatste decimaal afwijken, omdat `sin`/`cos` per engine mogen
  verschillen. Een diff van een paar tienden van een eenheid is daarom geen fout; een
  afwijkende SHA-256 op de download wél, en daar stopt het script op.
- **Cyprus.** Natural Earth splitst het eiland in "Cyprus" en "N. Cyprus". Het script
  geeft beide dezelfde code `CY`, omdat Eurostat het hele eiland onder CY rekent; het
  pad heeft dan ook twee subpaden. Zonder die samenvoeging zou er een grijs gat in
  Cyprus staan dat als ontbrekende data leest.

### Namen

Het bestand draagt per land de Natural Earth-naam mee, en die wijkt op drie plekken af
van Eurostat: `CY` staat er als "N. Cyprus", `MK` als "Macedonia", `TR` als "Turkey".
**De site gebruikt die namen niet.** Elke naam op de pagina komt uit de Eurostat-data;
de geometrie levert alleen vormen.
