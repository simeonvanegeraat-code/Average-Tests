# SEO-audit, 26 oktober 2026

Gemeten, niet geschat. Elk getal hieronder komt uit een meting op de gebouwde site, uit
een echte Google-SERP of uit Search Console, op 26 oktober 2026.

## De kortste samenvatting

**De inhoud wint als Google hem ziet. Het probleem is dat hij hem nog bijna nergens
ziet.**

Van de negen metriekpagina's staan er drie in de top 3 van Google — boven Wikipedia,
Statista, de Europese Commissie en de OECD. Alle drie zijn pagina's waarvoor op 26
oktober handmatig indexering is aangevraagd. De zes andere staan nergens, en dat zijn
precies de zes waarvoor dat niet is gelukt (het dagquotum van Google is tien).

Dat is geen inhoudsprobleem. Dat is een vindbaarheidsprobleem met een bekende oorzaak.

## 1. Waar de site nu staat in Google

Gemeten op `google.com/search?hl=en&gl=us`, organische posities (dus zonder de AI
Overview en zonder de nieuwsblokken mee te tellen).

| Zoekopdracht | Positie | Wie staat erboven |
|---|---|---|
| `average retirement age by country europe` | **1** | — |
| `healthy life years by country europe` | **2** | ec.europa.eu |
| `average household size by country europe` | **3** | Statista, ec.europa.eu |
| `average age leaving home europe` | niet in de top 10 | ec.europa.eu, Reddit, Statista |
| `average age leaving parental home by country` | niet in de top 10 | Reddit, ec.europa.eu, Medium |
| `average working hours per week by country europe` | niet in de top 10 | ec.europa.eu ×2, Reddit, remote.com |
| `average home size in europe square meters` | niet in de top 10 | Reddit, World Population Review, Demographia |
| `average house size by country europe` | niet in de top 10 | Reddit, World Population Review, Eurostat |

**Let op bij deze cijfers.** Dit is één meting, op één moment, in een browser waarin een
Google-account is ingelogd — de uitslag kan gepersonaliseerd zijn. Het patroon is
desondanks eenduidig genoeg om op te sturen: de pagina's die geïndexeerd zijn, ranken
hoog; de rest bestaat niet voor Google.

### Wat dat over de inhoud zegt

`/pension-age/` staat **eerste** op een vraag waarop de OECD, de Europese Commissie,
Wikipedia en Statista allemaal een pagina hebben. Die pagina is één dag oud. De lat uit
CLAUDE.md — een berekening die nergens anders staat — blijkt dus te werken als
rankingsignaal, niet alleen als principe.

## 2. Het echte knelpunt: wat Google van de site kent

Search Console, 26 oktober: **21 geïndexeerd, 15 niet.** Van die 21 bestaat er nog één:
de voordeur. De andere twintig zijn verwijderde Nederlandse pagina's — `/tools/...`,
`/articles/...html`, `/methodology.html`. De index ís nog de oude site.

De sitemap is op 25 oktober met succes gelezen en bevat 37 URL's. Google wéét ervan en
heeft ze niet opgehaald. De reden staat er zelf bij: **"Gevonden — momenteel niet
geïndexeerd."** Dat is Google die zegt dat hij de URL kent en er geen crawlbudget aan
besteedt. Voor een jong domein zonder externe links is dat normaal en het lost zichzelf
langzaam op.

> Search Console loopt een paar dagen achter. Op 26 oktober stond de teller nog op 21
> terwijl drie nieuwe pagina's al in de SERP stonden. De SERP is de waarheid, het rapport
> is de vertraagde weergave daarvan.

**Wat helpt, in volgorde van effect:**

1. **Indexering aanvragen per URL** — tien per dag, via de URL-inspectie. Bewezen: de
   drie pagina's die ranken zijn precies drie van de zeven die zo zijn ingediend.
2. **Externe links.** Het domein heeft er vrijwel geen. Dat is de rem onder het
   crawlbudget, en het is het enige punt in deze audit dat niet met code op te lossen is.
3. **Interne links** — zie punt 4 hieronder.

## 3. Techniek: wat goed staat

Hier valt weinig te winnen, en dat is goed nieuws.

| | |
|---|---|
| Titels | 37 van 37 uniek, allemaal onder de 60 tekens |
| Descriptions | 37 van 37 uniek en aanwezig |
| Canonicals | overal zelfverwijzend en absoluut |
| Eén `h1` per pagina | ja |
| Statische HTML | alles staat in de bron, geen client-side rendering |
| Sitemap | 37 URL's, met succes gelezen |
| robots.txt | staat alles toe, wijst naar de sitemap |

**Core Web Vitals**, lab-meting op een telefoon (390px, 4× tragere CPU, 1,6 Mbit):

| | LCP | CLS | Gewicht |
|---|---|---|---|
| Voordeur | 2.392 ms | **0** | 195 kB |
| `/pension-age/` | 1.872 ms | **0** | 37 kB |
| `/wealth/nl/` | 1.328 ms | **0** | 7 kB |

Alles binnen de groene zone (LCP onder 2,5 s), en CLS is overal exact nul. De voordeur is
de zwaarste door de bolgeometrie en de lettertypen; die 90 kB komt na de tekst binnen en
duwt de LCP niet omhoog.

**Twee descriptions zijn te lang** en worden in de SERP afgekapt: `/notes/eurostat-2021-
series-break/` (252 tekens) en `/` (205). Elf pagina's vallen buiten 70–160 tekens.

## 4. Het grootste op te lossen gat: de pagina's kennen elkaar niet

Gemeten over alle 37 pagina's, waarbij links in de kop en de voet apart zijn geteld van
links in de inhoud — want die eerste staan op élke pagina en wegen bij Google licht.

| | links in de inhoud |
|---|---|
| `/method/` | 13 |
| `/household-size/` | 4 |
| `/leaving-home/`, `/healthy-years/`, `/working-hours/`, `/first-child/` | 3 |
| `/dwelling-size/`, `/pension-age/`, `/wealth/`, `/working-life/` | 2 |
| 21 landpagina's onder `/wealth/` | 1 |
| `/notes/`, `/contact/`, `/privacy/` | **0** |

En dan het echte getal: **van de negen metriekpagina's linkt er precies één naar een
andere metriek** (`/dwelling-size/` naar `/household-size/`, omdat de berekening daar
over gaat). De andere acht hebben één link in hun inhoud, en die gaat naar `/method/`.

Negen pagina's over hetzelfde onderwerp, die elkaar niet noemen. Voor Google is dat geen
onderwerpcluster maar negen losse pagina's, en de autoriteit van `/pension-age/` komt
nergens terecht. Het megamenu verbindt ze wel, maar dat staat op alle 37 pagina's en
telt daarom als navigatie, niet als aanbeveling.

**`/notes/` heeft nul inhoudelijke links** terwijl het de plek is waar de artikelen
staan — het middel bij uitstek om links te verdienen.

## 5. Gestructureerde data: 35 van de 37 pagina's hebben niets

Alleen de voordeur (`WebSite`) en het artikel (`Article`) dragen schema. Voor een site
die volledig uit gepubliceerde statistiek bestaat, is dat de duidelijkste gemiste kans
van deze audit:

- **`Dataset`** op elke metriekpagina — met `creator` (Eurostat / OECD / ECB),
  `temporalCoverage`, `spatialCoverage`, `license` en `distribution`. Google heeft een
  aparte dataset-zoekmachine en toont er rich results voor. Alle velden die het schema
  vraagt staan al in `index.source`.
- **`BreadcrumbList`** op de landpagina's onder `/wealth/`, die nu twee klikken diep
  liggen zonder kruimelpad.
- **`Organization`** eenmalig, zodat de site een entiteit wordt in plaats van een
  verzameling pagina's.

## 6. De landpagina's onder `/wealth/` zijn te dun

| | |
|---|---|
| Woorden per pagina | 439 – 505 |
| Gedeelde tekst met een andere landpagina | **70%** (alleen `<main>` geteld) |
| Eigen tekst | ongeveer 140 woorden |
| Inhoudelijke links ernaartoe | 1 |

Ter vergelijking: twee metriekpagina's delen 8 tot 15% van hun tekst. Dit is hetzelfde
oordeel dat AdSense gaf als "content van weinig waarde", en het is precies het profiel
waar Google er één van kiest en de rest laat liggen.

Dit raakt ook het plan voor landpagina's per metriek: **33 nieuwe pagina's bouwen met dit
profiel maakt het probleem drie keer zo groot.** De lat hoort vooraf meetbaar te zijn —
bijvoorbeeld: geen landpagina onder de 50% eigen tekst, gemeten zoals hier.

## 7. Wat de SERP's nog meer lieten zien

- **Een AI Overview op zes van de zes geteste zoekopdrachten.** De bovenkant van de
  pagina beantwoordt de vraag al, en citeert Euronews, Trading Economics en Statista.
  Positie 1 zit daaronder. Dat is geen reden om niet te ranken, wel een reden om te
  mikken op vragen waar één getal niet volstaat: vergelijkingen, "waarom", en de staart.
- **Reddit staat in bijna elke top 5.** Op `average house size by country europe` staan
  twee Reddit-draadjes boven alles. Dat is een vraagvorm (discussie, kaartjes) die een
  datasite niet beantwoordt en niet moet proberen te beantwoorden.
- **Vierkante voet ontbreekt.** Twee van de drie concurrenten op woninggrootte
  (`worldpopulationreview`, `squaremeterstosquarefeet.com`) geven ft² naast m². Een
  Amerikaanse of Britse zoeker krijgt bij ons alleen m². Dat is een kleine toevoeging met
  een duidelijke vraag erachter.
- **"People also ask" is vraagvormig**: *"What is the average size of a house in the
  Netherlands?"*, *"What percentage of 27 year olds still live at home?"* Dat zijn
  landvragen en afgeleide vragen — precies waar landpagina's en de artikelen op passen.

## 8. Wat ik zou doen, op volgorde

**Deze week, want het kost weinig en het blokkeert de rest:**

1. **Elke dag tien URL's indienen** tot alle 37 erin staan. Begin met de zes
   metriekpagina's die nog niet ranken, dan `/wealth/`, dan `/notes/`.
2. **De negen metriekpagina's aan elkaar knopen.** Elke pagina sluit af met twee of drie
   inhoudelijke verwijzingen naar de metriek waar hij het meest mee te maken heeft, met
   een zin die zegt waarom. De data om die verwantschap te kiezen staat er al.
3. **`/notes/` inhoudelijke links geven** vanaf de metriekpagina's waar het artikel over
   gaat.
4. **De elf descriptions binnen 70–160 tekens brengen.**

**Daarna, in deze volgorde:**

5. **`Dataset`-schema op de negen metriekpagina's.** Alle velden staan al in de data.
6. **Vierkante voet naast m²** op `/dwelling-size/`.
7. **De lat voor landpagina's vastleggen en meten** voordat er 33 bij komen.
8. **Artikelen.** Het enige dat externe links oplevert, en het enige antwoord op de AI
   Overview: een vraag waar één getal niet volstaat. Het reeksbreukartikel is het model.

**Wat ik niet zou doen:** mikken op `average X by country` zonder "europe" erbij. Daar
staan World Population Review en Wikipedia, en die zijn met deze data niet te verslaan.
De Europa-variant en de staart zijn wél open — daar staat de site nu al in de top 3.

## Hoe dit opnieuw te meten is

- Per pagina: titels, descriptions, woorden, links, schema — `npm run check` dekt de
  techniek, de rest zat in een eenmalig script (`research/` heeft het niet nodig; de
  metingen staan hierboven).
- SERP's: de methode staat in de memory-notitie `serp-and-data-research-method` —
  `google.com/search?q=...&hl=en&gl=us` in de ingebouwde browser, organische posities
  tellen via de `h3`-koppen in DOM-volgorde.
- Core Web Vitals: headless Chrome met CPU- en netwerkvertraging, `PerformanceObserver`
  op `largest-contentful-paint` en `layout-shift`.
