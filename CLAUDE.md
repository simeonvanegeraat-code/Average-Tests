# CLAUDE.md — humanaverage.com

Werkinstructie voor Claude Code. Kort en operationeel. Bij twijfel: vraag het Simeon,
bouw niet door op een aanname.

Geschreven op 24 oktober 2026, de dag dat de site live ging, uit een interview met
Simeon. De vorige versie was van 31 augustus en beschreef een plan dat niet is
uitgevoerd; hij staat in git (`git show 4be9c43:CLAUDE.md`) als het je ooit interesseert
hoe het toen bedoeld was.

## Wat deze site is

**Eén metriek per pagina: een kaart van Europa, een landentabel, en jouw eigen plek
daarin.** De cijfers komen van Eurostat, de OECD en de ECB — kant-en-klare landencijfers,
geen eigen schattingen.

Live sinds 24 oktober 2026 op `https://www.humanaverage.com`:

| | |
|---|---|
| `/` | De voordeur: wat de site doet en waarom een gemiddelde bijna niemand beschrijft |
| `/leaving-home/` | Op welke leeftijd de helft van de jongeren het huis uit is, 31 landen |
| `/household-size/` · `/working-life/` · `/working-hours/` · `/healthy-years/` · `/first-child/` | De andere vijf Eurostat-metrieken, zelfde opbouw |
| `/wealth/` + `/wealth/<land>/` | Huishoudvermogen uit de ECB, met 21 landpagina's |
| `/wealth/by-age/` | Vermogen per leeftijdsgroep, uit de ECB-enquête — **een andere bron dan de rest van /wealth/**, zie hieronder |
| `/method/` | Een blok per dataset: code, definitie van de uitgever, dekking, verversing |
| `/notes/<slug>/` | Artikelen. Er is er één; een index komt bij de derde |
| `/about/` · `/contact/` · `/privacy/` · 404 | De rest |

De vorm is overgenomen van EUDebtMap, Simeons andere site: landen-aggregaat uit een
publieke bron, kaart, pagina per land, verkeer uit organische search. Dat werkt daar, en
dat is de reden dat het hier zo gebouwd wordt.

## Het doel, en wat er niet is

Passief inkomen uit advertenties. **Er is bewust geen doelbedrag en geen ijkpunt
afgesproken** (24 oktober 2026, gevraagd en beantwoord).

Dat is Simeons keuze en die staat. Het gevolg dat je moet kennen: er is geen moment
waarop dit project zichzelf kan tegenspreken. De git-historie toont drie eerdere
herstarts. Noem dit niet opnieuw — het is gevraagd, beantwoord en genoteerd.

Search Console staat aan en is het enige meetinstrument. Plausible is uitgesteld tot er
verkeer is; de wrapper in `src/lib/analytics.js` doet niets zolang het script niet
geladen is.

## Stack en commando's

- **Site**: Astro, statische output, geen client-side framework.
- **Datapipeline**: Node, zonder dependencies. Output is JSON dat in de repo staat.
- **Hosting**: Vercel, gekoppeld aan `main`. **Push naar `main` is publiceren**, meteen.
- **Geen nieuwe dependency zonder het te vragen.** De repo heeft er precies één: Astro.

```
npm run dev                  # http://localhost:4321
npm run build                # statische build + sitemap
npm run preview              # build lokaal serveren

npm run leaving              # fetch + build + validate voor leaving-home
npm run wealth               # idem voor de ECB-vermogensdata
npm run hfcs                 # idem voor vermogen naar leeftijd (ECB-enquête)
npm run geo:build            # Europakaart uit Natural Earth
```

Elke bron heeft drie losse stappen (`:fetch`, `:build`, `:validate`) als je er één apart
wilt draaien. `npm run build` draait de validatie **niet** mee; dat doe je zelf.

`public/` bevat nu alleen nog statische bestanden: `css/ha.css`, de lettertypen, het
favicon, `robots.txt` en `ads.txt`. Elke pagina komt uit `src/pages/`.

## Dataregels

Deze staan er omdat het eerder misging. Een vorige poging in deze repo had een map
`data/raw/` waarvan de eigen README zei: *"plausible demo figures"* — verzonnen data die
als echt op een website stond.

1. **Verzin nooit een statistiek.** Niet uit je hoofd, niet uit een zoekresultaat, niet
   "ongeveer", niet als plaatshouder. Elk getal komt uit een dataset die in de repo staat
   of die we reproduceerbaar ophalen.
2. **Kun je iets niet onderbouwen, schrijf het dan niet op.** Zeg dat de data ontbreekt.
   Een lege plek is beter dan een plausibel getal.
3. **`data/sources.md`** bevat per dataset: bron, code, periode, dekking, licentie en
   ophaaldatum. Geen dataset in de repo zonder regel daar.
4. **Elke metriekpagina heeft een zichtbare methodesectie**: bron, wat het cijfer is, wat
   het niet is, en de beperkingen.
5. **Geen enkel getal staat met de hand in een pagina.** Alles komt uit een lib die uit de
   data rekent. Bronnen publiceren bij, en een achtergebleven getal in een zin is precies
   de fout die niemand ziet.

### Twee soorten pagina's, en ze heten anders

- **Aggregaatpagina's** (alles wat er nu staat): gebouwd op gepubliceerde landencijfers.
  Die mogen vergelijken, rangschikken en afgeleide zinnen rekenen, maar **noemen zichzelf
  nooit een percentiel** en zeggen op de pagina wat het cijfer wél is. `/leaving-home/`
  is het model: Eurostat publiceert een middelpunt, dus de pagina zegt aan welke kant van
  het middelpunt je zit, en legt in een eigen blok uit waarom er geen percentiel staat.
- **Percentielpagina's** mogen alleen bestaan op **microdata** — records per respondent,
  met gewichten. Op dit moment heeft de site er geen (zie "Besloten op 24 oktober"). De
  regel staat hier klaar voor als er ooit weer een microdata-bron komt, niet omdat er nu
  iets onder valt.

### Vijf lessen die geld hebben gekost

De eerste vier uit de Eurostat-pagina, de vijfde uit de vermogenspagina. Allemaal
breder geldig dan de bron waar ze vandaan komen:

1. **Lees de definitie van een dataset, niet de titel.** `yth_demo_030` heet "estimated
   average age" en is volgens zijn eigen beschrijving de leeftijd waarop 50% niet meer
   thuis woont. Dat is een middelpunt, geen gemiddelde. De titel loog, de metadata niet.
2. **Vergelijk nooit over een reeksbreuk heen, en laat de code weigeren.** Eurostat vlagt
   breuken met `b`; in 2021 is de Labour Force Survey herzien en vrijwel elk land heeft
   die vlag. Het breukjaar is zelf een overgangsjaar (Portugal: 28,9 in 2019, 33,3 in
   2021, 30,1 in 2022). Over 2005 gerekend groeit de kloof tussen landen; binnen het
   vergelijkbare venster krimpt hij. `trend()` in `src/lib/leaving-home.js` weigert te
   rekenen als er een breuk in het venster valt. Een voetnoot was niet genoeg geweest.
3. **Houd aggregaten buiten landenlijsten.** EU27 en de eurozone staan in dezelfde
   dimensie als landen en zijn geen land.
4. **Laat elk land zijn eigen jaar dragen.** Het VK stopt in 2019, Montenegro in 2020,
   Türkiye in 2024. Eén ranglijst over verschillende jaren is geen ranglijst.
5. **Dezelfde uitgever is niet dezelfde meting.** De ECB publiceert huishoudvermogen
   twee keer: in de kwartaalrekeningen (DWA, wat op `/wealth/` staat) mét
   pensioenaanspraken, en in de enquête (HFCS, waar de leeftijdscijfers vandaan komen)
   **zonder** publieke en bedrijfspensioenen. De medianen verschillen daardoor 1,62x
   voor Nederland en 0,51x voor Kroatië — niet alleen in hoogte maar ook in richting,
   dus er is geen correctiefactor. De site zet ze daarom in gescheiden panelen, elk met
   zijn eigen bronregel, en geen enkele zin bevat een cijfer uit beide.

### De poort

Elke dataset heeft een `validate-*.mjs` die **moet slagen voordat er iets gepubliceerd
wordt**. De poort rekent terug naar het ruwe antwoord in plaats van het gebouwde bestand
te geloven: elk cijfer, en bij Eurostat ook elke breukvlag. Bouw je een nieuwe bron, bouw
dan ook een poort — dat is geen extra, dat is het werk.

## Wanneer een pagina mag bestaan

Een pagina bestaat alleen als hij een vraag beantwoordt die **aantoonbaar verschilt** van
elke andere pagina, met een berekening die nergens anders staat.

**Landpagina's per metriek mogen** (besloten 24 oktober). De lat waar ze overheen moeten:
elke landpagina leest uit de data wat er aan dát land opvalt en schrijft dat op. Het model
staat in `src/pages/wealth/[country].astro` — die leest per land waar het vermogen in zit
en benoemt het verschil, in plaats van hetzelfde sjabloon met een ander cijfer.

Kun je per uitkomst niet uitleggen waarom die uniek waardevol is, dan komt de generator er
niet. Google's maart 2026-update strafte "data-aggregatie zonder synthese" letterlijk af.

**Resultaat- en deelpagina's krijgen `noindex`.** Duizenden geparametriseerde URL's laten
indexeren ís het patroon dat afgestraft wordt.

De hoofdzoekwoorden zijn bezet door World Population Review, Wikipedia en Our World in
Data, vaak met een AI Overview erboven. Richt op de Europa-variant en de staart, waar die
sites niet staan. Het onderzoek daarachter staat in `research/metric-shortlist.md`.

## Vormgeving

**Er is nog maar één vormtaal.** `public/css/ha.css` plus `src/layouts/BaseV2.astro`,
en elke pagina gebruikt die. De oude `style.css`, `Base.astro` en het Nederlandse
cluster zijn op 25 oktober 2026 verwijderd; de selector `html[lang="en"]` die beide
uit elkaar hield staat er nog en mag blijven, maar scheidt niets meer.

Semantische HTML, toetsenbord werkt, skip-link en `aria-*` blijven. Vanilla JS, klein en
leesbaar. Onderdelen praten via gebeurtenissen op `document` (`ha:country`, `ha:age`,
`ha:submit`) en kennen elkaar verder niet.

Eventnamen voor de meting liggen vast, wijzig ze niet stilletjes:
`value_submitted` · `result_shared` · `second_metric_opened` · `methodology_opened`.

## Advertenties

**Nog geen advertentiecode.** `ads.txt` blijft zoals hij is. Komen er advertenties, dan is
dat één gecoördineerde stap: gecertificeerde CMP-banner, bijgewerkt privacybeleid, dán pas
de code. Niet andersom.

Plekken hoor je in het ontwerp mee te nemen: **nooit tussen invoer en antwoord**, wel
eronder, en let op layout shift.

## Werkwijze

- **Plan vooraf bij grote dingen**: een nieuwe pagina, een nieuwe databron, een
  verbouwing. Een fix, een tekstwijziging of een bug: gewoon doen en achteraf melden.
- **Eén sessie is eigenaar van een bestand.** Werkt er een andere sessie in `src/pages/x`,
  blijf eraf en stuur een bericht. Dit ging deze week twee keer mis: twee sessies in
  dezelfde bestanden, en een sessie die verdween mét de controlescripts in haar notities.
  **Wat je oplevert hoort in de repo, niet in je sessienotities.**
- **Kleine commits, één onderwerp per commit.** Engelse onderwerpsregel, Nederlandse
  toelichting met het waarom en de valkuil erin — zoals de bestaande historie.
- **Alles wat de site verandert gaat via een branch en een PR.** Vercel bouwt daar een
  voorbeeldversie van, en die link is hoe Simeon kijkt voordat er iets live gaat; zo is
  het op 24 oktober ook gegaan. Documentatie en onderzoeksnotities mogen rechtstreeks
  naar `main`. Mergen doet Simeon of doe je op zijn verzoek, nooit uit jezelf.
- **Geen ongevraagde refactors.** Kom je slechte code tegen buiten de opdracht, meld het,
  verander het niet.
- **Klopt een aanname van Simeon niet, corrigeer hem.** Direct, met bewijs, niet met een
  mening. De sterkste correcties in dit project kwamen uit de git-historie en uit de data
  zelf.
- **Herhaalt Simeon een beslissing nadat je bezwaar hebt gemaakt, dan is het besloten.**
  Noteer het en bouw door; maak niet twee keer hetzelfde punt.
- **Rapporteer eerlijk.** Werkt iets niet of is iets overgeslagen, zeg dat met het bewijs
  erbij.

## Buiten scope

- Accounts, login, backend, database. Het profiel leeft in `localStorage` onder één
  sleutel (`humanaverage:profile`: land, leeftijd, thema), verlaat de browser niet, en de
  grens ligt daar hard.
- Een CMS, een nieuwsbrief, e-mailverzameling.
- Een percentiel op de bestaande reactietijd-, typ- en geheugentests: daar bestaat geen
  representatieve dataset van.
- Advertentiecode en cookiebanner, tot de stap hierboven.

Op de later-lijst, dus niet "buiten scope" maar ook niet nu: **de geld-categorie**
(inkomen en vermogen), en het dagelijkse raadspel herbouwen op Europese data.

## Besloten op 24 oktober 2026

Uit het interview. Wat hier staat is beslist; wat nog niet gedaan is, staat erbij.

| Besluit | Status |
|---|---|
| De site is Europese landenvergelijkingen | Gedaan, live |
| Geen doelbedrag, geen ijkpunt | Genoteerd |
| **De Amerikaanse pagina's gaan eraf**: `/height/`, `/weight/`, `/play/`, plus de NHANES-pipeline, data en libs | Gedaan. De site ging van 48 naar 28 pagina's, de sitemap van 76 naar 56 URL's |
| Alle pagina's gaan naar de v2-vormtaal | Gedaan op 25 oktober. `Base.astro` en `style.css` bestaan niet meer |
| Landpagina's per metriek mogen, mits elke pagina eigen inhoud uit de data draagt | Gedaan voor vermogen: 21 pagina's die per land uit `composition` en `status` lezen |
| Plan vooraf alleen bij grote dingen | Vanaf nu |
| Eén sessie is eigenaar van een bestand | Vanaf nu |
| Geld-categorie naar de later-lijst | Genoteerd |

De shortlist in `research/metric-shortlist.md` houdt nog 25 kandidaten over; de zes
bovenste zijn gebouwd.

## Besloten op 25 oktober 2026

| Besluit | Status |
|---|---|
| Het mega menu vervangt de rij links in de balk | Gedaan. Eén ingang, een kaart per metriek met het kopcijfer |
| Het Nederlandse cluster gaat eraf, niet op noindex | Gedaan. 29 pagina's weg, 28 URL's geven nu 404 |
| Artikelen komen op `/notes/`, want `/articles/` was bezet | De eerste staat er; een index pas bij de derde |
| Geen advertentiecode of cookiepagina vóór de CMP | Blijft staan. AdSense wees af op "content van weinig waarde" |
