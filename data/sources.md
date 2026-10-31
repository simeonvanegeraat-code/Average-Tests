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
**Licentie** Vrij hergebruik, uitdrukkelijk ook commercieel. **Gelezen bij de bron op
24 oktober 2026**: https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.en.html

> "The ESCB is committed to providing its statistics free of charge as a public good of
> high quality irrespective of any subsequent commercial or non-commercial use."

Twee voorwaarden: de bron moet genoemd worden, en de statistieken inclusief metadata
mogen niet gewijzigd worden. Beide gehaald — de pagina citeert "European Central Bank,
Distributional Wealth Accounts" met de periode, en toont de gepubliceerde cijfers
ongewijzigd. Wat de site eromheen rekent (waar je bedrag tussen twee groepsgemiddelden
valt) is eigen tekst naast die cijfers, geen aanpassing ervan.
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

## ECB — vermogen naar leeftijd (HFCS)

**Uitgever** European Central Bank
**Bron** Household Finance and Consumption Survey, golf 2023, statistische tabellen
(bijgewerkt 15 oktober 2026)
**Opgehaald** 31 oktober 2026
**Licentie** zie de ECB-sectie hierboven
**Gebruikt voor** `/wealth/by-age/`, de leeftijdssectie op de 21 landpagina's en het
tweede paneel in het formulier op `/wealth/`

Dezelfde uitgever als de sectie hierboven, en toch een aparte bron — dat is het
belangrijkste wat hier staat.

### De reden dat deze bron erbij moest

De vraag was: iemand van 30 vergelijken met de landmediaan is onzinnig, want die
mediaan bevat mensen die veertig jaar langer hebben opgebouwd. Vier bronnen nagelopen
op 31 oktober 2026:

| Bron | Leeftijd? | |
|---|---|---|
| ECB DWA | **nee** | 29 groepen in `CL_DWA_GRP`: decielen, kwintielen, top 5/10%, woonsituatie, werkstatus. Geen leeftijd |
| Eurostat ICW | **nee** | 59 tabellen; leeftijd zit in spaarquote, consumptie, btw en dissparen — nooit bij netto vermogen. Alles 2020 |
| OECD Wealth Distribution Database | **nee** | Dimensies: land, maat, eenheid, statistiek, drempel. Geen leeftijd |
| ECB HFCS | **ja** | Zes groepen, mediaan én gemiddelde, met standaardfouten, 22 landen |

De HFCS staat niet op de ECB-data-API (van de 106 stromen is er geen HFCS). De tabellen
komen als zip met één xlsx erin; `scripts/lib/xlsx.mjs` leest die met alleen
`node:zlib`, zonder dependency.

### De twee ECB-bronnen meten niet hetzelfde

**Publieke en bedrijfspensioenen tellen in de HFCS niet mee, in DWA wel.** Dat is geen
voetnoot maar het hele verschil:

| | DWA (2026-Q1) | HFCS (golf 2023) | |
|---|---|---|---|
| Ierland | €437k | €258k | 1,69x |
| Nederland | €232k | €144k | 1,62x |
| Hongarije | €105k | €76k | 1,39x |
| *midden van de 21* | | | *1,09x* |
| Portugal | €106k | €143k | 0,74x |
| Litouwen | €43k | €72k | 0,59x |
| Kroatië | €59k | €117k | 0,51x |

Niet alleen de hoogte verschilt maar ook de richting, en dat sluit elke correctiefactor
uit. De site zet daarom nooit een cijfer uit de ene bron naast een cijfer uit de andere:
de leeftijdslaag draagt haar eigen totaalmediaan uit de enquête zelf. Op `/wealth/` staan
het daarom twee panelen met een eigen bronregel, niet één paneel met een extra regel.

### Elk land draagt zijn eigen veldwerkperiode

"Golf 2023" is een etiket, geen jaartal. Het veldwerk loopt van **oktober 2022**
(Spanje) tot **juli 2025** (Griekenland); Nederland is mei–juni 2023, Litouwen september
2024 tot maart 2025. Dezelfde regel als bij de Eurostat-metrieken: één jaartal boven alle
landen zou onwaar zijn, dus elk land toont het zijne en `/wealth/by-age/` zet ze alle 21
onder elkaar.

### Wat de poort controleert

`npm run hfcs:validate` leest de ruwe zip opnieuw en rekent **572 cijfers** terug naar
het tabblad. Daarnaast:

- de SHA-256 van de zip klopt met het ophaallog, en het gebouwde bestand draagt dezelfde
- A3 (medianen) en A4 (gemiddelden) hebben dezelfde kolomvolgorde — anders horen de
  gemiddelden bij de verkeerde landen
- geen enkele leeftijdsgroep zonder mediaan én gemiddelde (132 groepen)
- het gemiddelde ligt overal boven de mediaan, want vermogen is scheef naar boven
- de totaalmediaan ligt tussen de laagste en hoogste groepsmediaan; dat is rekenkundig
  verplicht en daarom een goede test op een kolomverschuiving
- elk land heeft een veldwerkperiode die ook zo in het tabblad staat

Die derde en vijfde controle staan er niet voor niets: de fout die tijdens het bouwen
werkelijk optrad was een verschuiving van één kolom, doordat zelfsluitende cellen
(`<c r="A5" s="8"/>`) een regex braken die altijd een sluittag verwachtte. Dat geeft geen
foutmelding, alleen de cijfers van België bij Tsjechië.

### Niet gebouwd

**Tsjechië** staat wel in de tabellen maar niet op de site: DWA dekt alleen de eurozone,
dus er is geen actueel cijfer om de leeftijdsgroepen naast te zetten. De code weigert het
land expliciet (`NOT_BUILT` in `scripts/lib/hfcs.mjs`) in plaats van het stil weg te laten.

**Een schatting naar vandaag** is er niet. Je zou elke leeftijdsgroep kunnen schalen met
hoeveel de landmediaan in DWA sinds het veldwerk bewoog, maar dat rust op de aanname dat
alle leeftijden meebewogen met het land, en zo'n opgehoogd getal wordt geciteerd zonder
de voetnoot. Wat er staat is wat de ECB publiceert.

### Bronvermelding op de site

> European Central Bank, Household Finance and Consumption Survey, wave 2023.

---

## Eurostat — jongeren die het ouderlijk huis verlaten

**Uitgever** Eurostat (Statistical Office of the European Union)
**Licentie** Hergebruik toegestaan, ook commercieel, met bronvermelding en zonder
schriftelijke licentie. **Gelezen bij de bron op 24 oktober 2026**:
https://ec.europa.eu/eurostat/en/help/copyright-notice (de oudere URL
`/about-us/policies/copyright` geeft 404 en was de reden dat dit zo lang openstond).

> "Reuse of statistical data, metadata, publications, and other dissemination tools
> published on this website for commercial or non-commercial purposes is authorised
> provided the source is acknowledged."

**Eén uitzondering raakt deze site.** Hetzelfde bericht sluit van commercieel hergebruik
uit: *"Data for countries other than: Member States of the European Union (EU), Member
States of the European Free Trade Association (EFTA), official EU acceding and candidate
countries"*, met daarbij *"the user will need to eliminate these data from the tables
before reusing them commercially"*. Zie "Uitgesloten landen" hieronder.
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

## Eurostat — de acht metrieken naast leaving-home

**Uitgever** Eurostat
**Licentie** zie de Eurostat-sectie hierboven; dezelfde voorwaarden, inclusief de
uitsluiting van landen buiten EU, EFTA en de kandidaat-landen
**Opgehaald** 2026-10-25 (alle acht datasets opnieuw, bij het toevoegen van de laatste twee);
`une_rt_m` op 2026-10-27
**Gebruikt voor** de metriekpagina's buiten `/leaving-home/`

Alle acht komen door dezelfde pipeline: `npm run metrics` haalt op, bouwt en
valideert ze met `scripts/lib/metric-build.mjs`. De regels die bij leaving-home geld
hebben gekost staan daar één keer en gelden dus overal: aggregaten buiten de
landenlijst, elk land draagt zijn eigen jaar, en nooit rekenen over een reeksbreuk heen.

| Code | Pagina | Reeks | Laatste | Landen | Breukjaren | Vergelijkbaar venster | Naar geslacht |
|---|---|---|---|---|---|---|---|
| `lfsi_dwl_a` | /working-life/ | 2000–2025 | 2025 | 32 | 0 | 2000–2025 | ja |
| `ilc_lvph01` | /household-size/ | 2003–2025 | 2025 | 31 | 9 | **geen** | nee |
| `ilc_lvho32` | /dwelling-size/ | 2023 | 2023 | 33 | 0 | **één jaar** | nee |
| `hlth_hlye` | /healthy-years/ | 2004–2024 | 2024 | 28 | 16 | **geen** | ja |
| `lfsa_ewhuis` | /working-hours/ | 1983–2025 | 2025 | 34 | 27 | **geen** | ja |
| `lfso_23pens03` | /pension-age/ | 2023 | 2023 | 30 | 0 | **één jaar** | ja |
| `demo_find` | /first-child/ | 1960–2024 | 2024 | 37 | 13 | **geen** | nee |
| `une_rt_m` | /unemployment/ | 2021-10–2026-09 | 2026-08 | 30 | 2 | 2025-02–2026-08 | ja |

### `une_rt_m` is de eerste maandreeks, en dat verandert vier dingen

**Opgehaald** 2026-10-27 · **Doorsnede** `s_adj=SA`, `age=TOTAL`, `unit=PC_ACT` ·
**Venster** `lastTimePeriod=60`

De andere acht zijn jaarenquêtes. Werkloosheid komt per maand, en Eurostat publiceert een
maand volgens zijn eigen toelichting ongeveer 31 dagen na het einde ervan. Daarmee is dit
de enige bron op de site die binnen het jaar actueel blijft — en de enige die vier dingen
raakte die eerder nooit aan de orde waren.

1. **De nieuwste periode is bijna leeg.** Op het moment van ophalen had 2026-09 vier van
   de 38 gebieden en 2026-08 dertig. De bouwer koos tot nu toe het hoogste jaar dat enig
   land draagt; hier zou dat een kaart met vier landen geven. De spec heeft daarom
   `minCoverage: 25`, en de bouwer kiest de nieuwste periode die eraan voldoet. Landen die
   verder achterlopen (Zwitserland 2026-06, Turkije en Bosnië 2026-07) dragen hun eigen
   maand, gearceerd op de kaart.
2. **Een tijdas kon niet meer op jaartallen rekenen.** `Number('2026-08')` is `NaN`, en dat
   gaf geen fout maar een leeg trendlijntje en een breukvlag die stil door de filter viel.
   Het omrekenen van periode naar plek staat nu in `src/lib/period.js`.
3. **Twee landen dragen een breuk, en niet dezelfde.** Malta in 2025-01, Denemarken in
   2023-10. Bij de jaarreeksen brak Eurostat alles tegelijk (de herziening van 2021), dus
   tellen op "de laatste breuk" was goed genoeg; hier was dat "1 van de 30" onder een tabel
   met twee kerfjes. Het gevolg voor de pagina is groter: omdat een vergelijking tussen
   landen voor élk land moet gelden, is het gezamenlijke venster maar 2025-02 tot 2026-08.
   De vijf jaar worden daarom alleen per land gebruikt, voor de 28 landen met een
   ononderbroken reeks (`unbrokenRun()` in `src/lib/metric.js`).
4. **Procent en procentpunt zijn niet hetzelfde.** Een niveau is een percentage van de
   beroepsbevolking, een verschil is in procentpunten. De beschrijving heeft daarom twee
   eenheden: `unit` voor verschillen, `unitShort` voor de twee plekken die een niveau
   tonen.

**Wat het cijfer is**, in de woorden van de uitgever samengevat: het aandeel van de
beroepsbevolking van 15 tot 74 jaar dat in de referentieweek geen werk had, in de vier
weken ervoor actief gezocht heeft en binnen twee weken kan beginnen. De noemer is de
beroepsbevolking (werkenden plus werklozen), niet de bevolking.

**Wat het níet is**: geregistreerde werkloosheid. Eurostat zegt daar zelf over dat de twee
indicatoren niet vergelijkbaar zijn, omdat registratieregels per land verschillen en niet
de ILO-definitie volgen. Een nationaal cijfer dat afwijkt is dus geen fout in een van de
twee.

### Wat dit betekent voor de pagina's

**Twee datasets dragen een verhaal over verandering.** `lfsi_dwl_a` met vierentwintig jaar
over 32 landen ononderbroken, en sinds 27 oktober 2026 `une_rt_m`, dat achttien maanden
over dertig landen haalt — minder lang, maar met een maandpunt in plaats van een jaarpunt.
De andere zes tonen bewust geen trendsectie, om twee verschillende redenen die niet door
elkaar mogen lopen:

- **Vier hebben een breuk in of vlak vóór het laatste jaar** (`ilc_lvph01`, `hlth_hlye`,
  `lfsa_ewhuis`, `demo_find`). Er is dan geen venster om iets in te vergelijken, en een
  grafiek met een voetnoot zou erger zijn dan geen grafiek.
- **Twee hebben één jaargang** (`ilc_lvho32`, `lfso_23pens03`). Die hebben nul breuken —
  in één jaar kan niets breken — maar ook niets om tegen te vergelijken. Op `/method/`
  staat dat als een eigen geval (`single-year`), omdat "geen breuk" daar anders klinkt
  als "de hele reeks is vergelijkbaar".

**Drie datasets hebben geen uitsplitsing naar geslacht** — huishoudgrootte en
woninggrootte hebben er geen (een huishouden en een woning hebben geen geslacht) en
`demo_find` publiceert alleen de leeftijd van de moeder. Hun kolommen voor mannen en
vrouwen zijn leeg in plaats van een kopie van het totaal; de kaart heeft daar één lens in
plaats van drie.

**`lfso_23pens03` is geen gewone jaarreeks.** Het komt uit de ad-hocmodule van de
arbeidskrachtenenquête van 2023 en komt dus niet volgend jaar opnieuw. De pagina zegt
bovendien wat er het makkelijkst mis te lezen is: dit is de leeftijd waarop mensen
feitelijk een ouderdomspensioen zijn gaan ontvangen, **niet de wettelijke
pensioenleeftijd**. De 24 leeftijdsbanden in de dataset bleken geen keuze: `Y_GE15`,
`Y50-74` en `Y_GE50` geven per land identieke waarden, dus de breedste.

### Twee fouten die de poort ving

1. **Aggregaten als land.** `ilc_lvph01` gebruikt de codes `EU` en `EA18`, en
   `demo_find` leverde daarnaast `EFTA` en `DE_TOT` ("Germany including former GDR")
   aan. Die stonden in de landenlijst. De regel is nu dat een land bij Eurostat een code
   van twee letters heeft; al het andere valt eruit.
2. **Mannen en vrouwen gelijk aan het totaal** bij datasets zonder splitsing. Dat gaf een
   kolom die er was maar niets zei, en een "verschil tussen mannen en vrouwen" van precies
   nul dat als bevinding kon worden gelezen.

### Uitgesloten landen

Negen landcodes komen niet op de site. De reden staat per stuk in `EXCLUDED` in
`scripts/lib/metric-build.mjs`.

| Code | Land | Reden |
|---|---|---|
| `UK` | Verenigd Koninkrijk | Sinds de brexit geen EU, geen EFTA, geen kandidaat-land |
| `US` | Verenigde Staten | Idem — staat in `une_rt_m`, viel daarmee voor het eerst op |
| `JP` | Japan | Idem |
| `AM` | Armenië | Buiten EU, EFTA en de kandidaat-landen |
| `AZ` | Azerbeidzjan | Idem |
| `BY` | Belarus | Idem |
| `SM` | San Marino | Idem |
| `XK` | Kosovo | Potentieel kandidaat-land, geen officieel kandidaat-land — plus de reden hieronder |
| `FX` | Metropolitan France | Geen land maar Frankrijk zonder de overzeese departementen; dubbelt met `FR` |

De site draait vandaag zonder advertenties en is dus niet commercieel; strikt genomen
mochten deze landen er nu nog op staan. Ze zijn er toch nu al uit gehaald, omdat een regel
die je moet onthouden op het moment dat AdSense aangaat een regel is die vergeten wordt.
Het kostte bovendien niets: alle zeven waren achterlopende rijen die al buiten elke
vergelijking vielen, en het aantal landen op het laatste jaar bleef op elke pagina gelijk.

### De Kosovo-waarde, uitgezocht

Kosovo stond in `ilc_lvph01` op **6,0 personen per huishouden** uit 2018, terwijl het
eerstvolgende land op 3,1 zit. Dat zag eruit als een fout en is het niet: de volkstelling
van Kosovo zelf geeft **5,9 in 2011** en **4,3 in 2024**, dus 6,0 in 2018 past precies in
die reeks.

Het probleem is niet juistheid maar actualiteit. Naast cijfers van 2025 overdrijft een
waarde van 2018 de huidige Kosovaarse huishoudgrootte met ongeveer veertig procent. Samen
met de licentiereden hierboven is dat genoeg om hem niet te tonen.

### Niet gebouwd, en waarom

- `tps00014`
- `ilc_lvho04`

De redenen staan in `scripts/metrics.mjs`. Kort: **trouwleeftijd** (`tps00014`) splitst
in mannen en vrouwen zonder een gepubliceerd totaal, en dat zelf middelen zou een verzonnen
statistiek zijn, dus de bouwer weigert een metriek zonder totaal. **Kamers per persoon**
(`ilc_lvho04`) heeft dimensies voor armoederisico en huishoudsamenstelling waarvan de
juiste doorsnede eerst een redactionele keuze vraagt.

Dat tweede geldt uitdrukkelijk **niet** voor `ilc_lvho32` (woninggrootte in m²), dat er
sinds 25 oktober 2026 wel op staat: die dataset splitst naar inkomenskwintiel en
eigendomsvorm, en die hebben allebei een `TOTAL`. Daarmee is er geen doorsnede te kiezen
— TOTAL × TOTAL ís het kopcijfer.

### Toelichtingen van Eurostat

- `lfsi_dwl_a` — [toelichting](https://ec.europa.eu/eurostat/cache/metadata/en/lfsi_dwl_a_esms.htm)
- `ilc_lvph01` — [toelichting](https://ec.europa.eu/eurostat/cache/metadata/en/ilc_sieusilc.htm)
- `hlth_hlye` — [toelichting](https://ec.europa.eu/eurostat/cache/metadata/en/hlth_hlye_esms.htm)
- `lfsa_ewhuis` — [toelichting](https://ec.europa.eu/eurostat/cache/metadata/en/lfsa_esms.htm)
- `demo_find` — [toelichting](https://ec.europa.eu/eurostat/cache/metadata/en/demo_fer_esms.htm)
- `ilc_lvho32` — [toelichting](https://ec.europa.eu/eurostat/cache/metadata/en/ilc_sieusilc.htm) (dezelfde EU-SILC-toelichting als `ilc_lvph01`)
- `lfso_23pens03` — [toelichting](https://ec.europa.eu/eurostat/cache/metadata/en/lfso_23_esms.htm)
- `une_rt_m` — [toelichting](https://ec.europa.eu/eurostat/cache/metadata/en/une_rt_m_esms.htm)

---

## OECD — feitelijke uittreedleeftijd

**Uitgever** OECD (Organisation for Economic Co-operation and Development)
**Licentie** Hergebruik toegestaan, ook commercieel, met een **voorgeschreven**
bronvermelding. **Gelezen bij de bron op 25 oktober 2026**:
https://www.oecd.org/en/about/terms-conditions.html, sectie 3 (Data), "Permitted Use".

> "Except where additional restrictions apply as stated above, you can extract from,
> download, copy, adapt, print, distribute, share and embed Data for any purpose, even
> for commercial use. You must give appropriate credit to the OECD by using the citation
> associated with the relevant Data, or, if no specific citation is available, you must
> cite the source information using the following format: OECD (year), (dataset name),
> (data source) DOI or URL (accessed on (date))."

Die vorm staat daarom **op de pagina zelf**, niet alleen hier: `citation()` in
`src/lib/exit-age.js` bouwt hem op uit het source-blok, zodat hij meeverandert met de
ophaaldatum in plaats van te verouderen. Dit is het verschil met Eurostat en de ECB, die
alleen "bronvermelding" vragen zonder vaste vorm.

**Eén voorbehoud dat de OECD zelf maakt**: dezelfde sectie zegt dat data gedeeltelijk van
derden kan zijn en dat het aan de gebruiker is om dat na te gaan. Voor deze maat is dat
niet te sluiten op de API alleen; wat wél vaststaat is dat de OECD de reeks zelf afleidt
uit arbeidsdeelname. Komt er advertentiecode op de site, dan hoort dit opnieuw bekeken te
worden — net als de uitgesloten landen bij Eurostat.

**Opgehaald** 2026-10-25, via de publieke SDMX-API van de OECD (geen sleutel nodig)
**Gebruikt voor** de tweede sectie van `/pension-age/`: de leeftijd waarop mensen de
arbeidsmarkt verlaten

### Dataset

| | |
|---|---|
| Dataflow | `OECD.ELS.SPD,DSD_PAG@DF_PAG,1.0` |
| Titel | Pensions at a glance |
| Maat | `ELMEA` — Effective labour market exit age |
| Data Explorer | https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PAG%40DF_PAG |
| Dimensies | REF_AREA (54) × FREQ (A) × MEASURE (ELMEA) × UNIT_MEASURE (Y) × SEX (M/F) × AGE × OPTIONALITY × TIME_PERIOD (1970–2024) |
| Waarnemingen | 5.143 |
| Vlaggen | alle 5.143 op `OBS_STATUS = A` ("normal value") |

### Twee vragen, en ze mogen niet van elkaar worden afgetrokken

`/pension-age/` draagt twee cijfers van twee uitgevers, en dat is de reden dat die pagina
een eigen blok heeft over wat ze niet zijn:

| | Eurostat `lfso_23pens03` | OECD `ELMEA` |
|---|---|---|
| De vraag | wanneer begon je ouderdomspensioen? | op welke leeftijd verlaten mensen de arbeidsmarkt? |
| Hoe gemeten | gevraagd aan wie nu een pensioen ontvangt | afgeleid uit arbeidsdeelname per leeftijdsgroep |
| Waar het over gaat | beslissingen van decennia terug | de arbeidsmarkt van dít jaar |
| Reeks | 2023 | 1970–2024 |
| Landen | 30 | 51 |

Het verschil tussen de twee is dus geen "mensen werken door naast hun pensioen". Het zijn
twee grootheden met een andere basis en een andere referentieperiode, en de site rekent er
geen verschil van uit.

### Geen totaal, en wat dat kost

De OECD publiceert `ELMEA` **alleen voor mannen en voor vrouwen**; in de dimensie `SEX`
bestaat geen `T` of `_T`. Zelf middelen zou een verzonnen statistiek zijn — hetzelfde
bezwaar waarop trouwleeftijd (`tps00014`) is afgevallen — dus de sectie zet de twee naast
elkaar en zegt op de pagina waarom er geen enkel getal staat. Het verschil is gemiddeld
1,4 jaar en loopt op tot 11,7 (Saoedi-Arabië), dus een gemiddelde zou geen detail zijn.

De poort weigert daarom een gebouwd bestand met een veld `total`, `avg`, `average`,
`both` of `mean`, én hij valt om als de OECD ooit wél een totaal gaat publiceren. Dan
moet de pagina herzien worden in plaats van stil hetzelfde te blijven zeggen.

### Bewerkingen

`npm run oecd` haalt op (`scripts/fetch-oecd.mjs`), bouwt (`scripts/build-oecd.mjs`) en
valideert (`scripts/validate-oecd.mjs`). Het ruwe antwoord gaat ongewijzigd naar
`data/raw/oecd/exit-age.json`, zodat de poort erop kan terugrekenen.

- **Aggregaten buiten de landenlijst.** `EU27`, `EU28` en `OECD_REP` staan in dezelfde
  dimensie als landen. `EU27` en `OECD_REP` komen apart in het bestand; `EU28` valt eruit
  omdat er geen jaargang is waarin beide geslachten staan.
- **Eén jaar per land, voor beide geslachten.** Elk land draagt zijn eigen laatste jaar,
  maar binnen een land komen mannen en vrouwen altijd uit **dezelfde** jaargang. Argentinië
  maakte dat concreet: vrouwen lopen door tot 2024, mannen stoppen in 2023. Een verschil
  over twee jaargangen is geen verschil, dus Argentinië staat op 2023.
- **De hele reeks gaat mee**, niet alleen het laatste jaar: 1970–2024 is wat deze bron
  toevoegt aan het Eurostat-cijfer erboven. Dat mag hier omdat geen enkele waarneming
  gevlagd is — bij Eurostat kan het niet en weigert `trend()` te rekenen.

### Validatie

`node scripts/validate-oecd.mjs` legt zelf een tabel aan van elke waarneming in het ruwe
antwoord en controleert daartegen. Op 25 oktober 2026: **5.112 cijfers teruggerekend**, 51
landen, 46 op 2024, nul problemen. Wat hij controleert:

| Controle | Waarom |
|---|---|
| Elk cijfer én elk jaar in de reeks tegen het ruwe antwoord | het gebouwde bestand bewijst niets over zichzelf |
| Geen latere jaargang met beide geslachten | anders is het gekozen jaar niet het laatste volledige |
| `OBS_STATUS` overal `A` | de pagina praat over 1970 en 2024 in één zin |
| `SEX` is precies `F/M` | komt er een totaal bij, dan moet de pagina herzien worden |
| Geen veld dat de twee samenvat | zie "Geen totaal" hierboven |
| Elke waarde tussen 45 en 80 | vangrail tegen schaalfouten |
| Geen aggregaat bij de landen, geen dubbele codes, minstens 25 landen | dezelfde regels als bij Eurostat |

### Eén onopgelost punt

Het antwoord draagt de annotatie `NonProductionDataflow = true`. Wat de OECD daarmee
bedoelt is niet uit de API of uit de voorwaarden op te maken, en de dataflow staat wél in
de publieke catalogus van `OECD.ELS.SPD`. **Het is dus niet uitgezocht**, en het staat
hier zodat het niet als opgelost telt. Wat er niet van afhangt: de cijfers zelf, want die
rekent de poort terug naar hetzelfde antwoord.

### Bronvermelding op de site

`/pension-age/` noemt de dataflow, de maat, de reeks, de ophaaldatum en de voorgeschreven
OECD-vermelding, met een link naar de Data Explorer en naar de voorwaarden. `/method/`
heeft een eigen blok voor deze dataset (`#ds-exit-age`), los van de Eurostat-regel erboven.

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

`node scripts/build-geo.mjs` schrijft **twee** bestanden uit dezelfde bron:

1. `data/geo/europe.json` (55.907 bytes, 54 landvormen: 34 met Eurostat-data, 20 als
   achtergrond) — de platte kaart op elke metriekpagina, voorgeprojecteerd.
2. `public/geo/globe.json` (90 kB, 31,5 kB gezipt; 172 landvormen, 34 met data) — dezelfde
   vormen in graden, voor de draaiende bol op de voordeur.

Waarom twee. De kaart is voorgeprojecteerd omdat hij plat is en nooit draait; de bol moet
wél draaien en projecteert dus in de browser, en heeft daarvoor lengte en breedte nodig.
En waarom het tweede bestand in `public/` staat en niet in `data/`: de browser haalt het
op nadat de pagina staat. Meesturen zou de HTML van de voordeur viermaal zo zwaar maken
(31,5 kB gezipt tegen 8,4 kB voor de hele pagina), en juist daar komen advertenties bij.

Twee keuzes in de bol die de platte kaart niet hoeft te maken:

- **Overzeese departementen vallen af.** Natural Earth geeft Frankrijk als één vorm
  inclusief Frans-Guyana. Op de platte kaart valt dat buiten het kader; op een bol zweeft
  er anders een gekleurde vlek bij Zuid-Amerika. Elke ring van een dataland die volledig
  buiten het Europa-venster valt, gaat eruit.
- **Een vorm kleiner dan de tolerantie wordt niet vereenvoudigd.** Malta is 0,22 graad en
  werd door het vereenvoudigen een lijn van twee punten; Luxemburg en Cyprus verdwenen
  bijna. Voor datalanden valt het script dan terug op de ruwe vorm, die bij zulke landen
  toch maar een handvol punten telt. Voor achtergrondland gebeurt dat niet: dat zijn
  duizenden eilandjes wereldwijd en die terugval verdubbelde het bestand.

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
