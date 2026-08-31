# CLAUDE.md — humanaverage.com

Werkinstructie voor Claude Code. Kort en operationeel. Bij twijfel: vraag het, bouw niet door.

## Doel & propositie

1. Mensen zoeken massaal op "average X". Google beantwoordt dat zelf met een gemiddelde in een snippet.
2. Wij beantwoorden een andere vraag: **waar sta jíj?** De bezoeker vult zijn eigen waarde in en krijgt een percentiel.
3. Dat percentiel wordt berekend uit **microdata**, niet overgenomen uit een gepubliceerd gemiddelde. Dat is het enige bestaansrecht van deze site.
4. Einddoel is organisch zoekverkeer, daarna advertentie-inkomsten. Dat is het einddoel, niet de eerste stap.
5. Markt en taal: **en-US**. Domeinnaam, zoekvolume en brondata (NHANES, VS) wijzen alle drie dezelfde kant op.

**De categoriemix is de hefboom, niet het bezoekersaantal** (onderzoek augustus 2026). AdSense-RPM verschilt 10 tot 20× per onderwerp. Lichaamsmaten zijn het slechtst betaalde vak dat er is — informatieve intentie, geen adverteerder. Geld is 5 tot 10× beter. Dezelfde percentielmotor bedient beide:

| Categorie | Volume | RPM | Rol |
|---|---|---|---|
| Lichaam (lengte, gewicht) | zeer hoog | ~$5 | **verkeer en backlinks** |
| Tijd & gedrag (slaap, schermtijd) | hoog | ~$8-12 | brug |
| Geld (salaris, spaargeld, vermogen) | hoog | **$25-50** | **de omzet** |

Lengte en gewicht zijn dus niet het product, ze zijn de etalage. Bouw ze goed, maar verwar volume niet met opbrengst. Zelfde verkeer, andere mix: $1.200/maand versus $3.600/maand.

## De opbouw en het ijkpunt

**De MVP-meting is vervallen.** Simeon heeft in augustus 2026 bewust gekozen: eerst een echt product bouwen, dan live, en pas analyseren als er verkeer is. Dat is zijn beslissing en die staat — niet opnieuw ter discussie stellen.

De consequentie moet je wel kennen, en die mag je één keer benoemen als het relevant wordt: **er is nu geen moment waarop dit project zichzelf kan falsificeren.** De git-historie toont drie eerdere herstarts, waarvan de vorige juist wél veel pagina's had (vier generators over negen categorieën) maar op verzonnen data draaide. Bouwen zonder ijkpunt is hoe dat ging.

### Fasering

| | Fase | Omvang | Status |
|---|---|---|---|
| 1 | Percentielmotor, lengte + gewicht, methode, ondersteunende pagina's | 7 pagina's | ✅ |
| 2 | Lengte-cluster: drempelpagina's, vraagpagina's, leeftijdsscrubber | ~25 pagina's | |
| 3 | Gewicht-cluster, zelfde structuur | ~25 pagina's | |
| 4 | Live, Search Console-dekking controleren | — | |
| 5 | **Geld-categorie** op SCF- en CPS-microdata | ~30 pagina's | |
| 6 | AdSense aanvragen, daarna richten op Mediavine | — | |

Fase 5 is waar het geld zit. Behandel hem niet als "later ooit": lengte en gewicht bouwen de autoriteit waarmee het geldvak kan ranken, maar ze verdienen zelf bijna niets.

### Het ijkpunt

Search Console staat al aan en kost niets. Dat is het enige meetinstrument tot er verkeer is.

**Spreek bij go-live met Simeon een concreet ijkpunt af**: hoeveel vertoningen bij hoeveel geïndexeerde pagina's, tegen welke datum. Zonder die afspraak is er geen beslismoment en wordt dit fase vier van hetzelfde patroon. Vraag erom, verzin het niet zelf.

### Wat de architectuur van het verdienmodel moet erven

Advertentie-omzet is *paginaweergaven* × RPM, en tools scoren notoir slecht op paginaweergaven per sessie: binnenkomen, antwoord, weg. Daarom is dit geen feature maar een eis:

- **Eén profiel dat de bezoeker één keer invult** (leeftijd, geslacht) en dat lokaal meereist, zodat elke volgende metriek één klik is in plaats van een nieuw formulier.
- Elke resultaatweergave eindigt in een volgende vraag.
- **Deelbare en embedbare beelden.** OmniCalculator kwam aan ~29.000 verwijzende domeinen doordat anderen hun tools citeerden, niet door content. Dat is het backlinkmechanisme voor een jong domein.

## Stack, commando's, lokaal draaien, deployen

- **Site**: Astro, statische output. Geen client-side framework.
- **Datapipeline**: Node, zonder dependencies. Output is JSON dat in de repo staat. (Oorspronkelijk stond hier Python/pandas; er staat op deze machine geen Python, alleen een Windows Store-stub. De XPT-lezer in `scripts/lib/xpt.mjs` is daarom zelfgeschreven en gevalideerd tegen de NCHS-publicatie — zie `data/sources.md`.)
- **Hosting**: Vercel, al gekoppeld. `vercel.json` (redirects + security headers) blijft zoals het is.
- **Analytics**: nu alleen Search Console. Plausible is bewust uitgesteld tot er verkeer is — $9/maand betalen om nullen te bekijken is weggegooid geld. De eventnamen staan al in `src/lib/analytics.js`; die wrapper doet niets zolang het script niet geladen is, dus later hoeft er alleen een scripttag bij.

Datapipeline — werkt vandaag:

```
node scripts/fetch-nhanes.mjs         # NHANES ophalen naar data/raw/, checksums controleren
node scripts/build-percentiles.mjs    # -> data/percentiles/height.json, weight.json
node scripts/validate-percentiles.mjs # poort: moet slagen voordat er iets gepubliceerd wordt
```

> ⚠️ De Astro-setup bestaat nog niet. Onderstaande commando's gelden zodra die is opgezet; werk ze bij in dezelfde commit als de setup. Verzin hier geen commando's die niet echt werken.

```
npm install                           # dependencies
npm run dev                           # lokaal op http://localhost:4321
npm run build                         # statische build naar dist/
npm run preview                       # build lokaal serveren
```

Deployen: push naar `main` → Vercel bouwt automatisch. Feature-werk via branch + PR.

**URL-structuur**: de root is het Engelse product. Het Nederlandse cluster staat op `/nl/` (homepage) plus de onveranderde paden `/tools/*`, `/articles/*` en de losse `.html`-pagina's. Die verhuizing is gedaan; er zijn geen 404's ontstaan. Het NL-cluster is bevroren — niet uitbreiden, niet vertalen, alleen aanraken als iets structureel breekt.

Astro's dev-server serveert geen directory-index voor mappen in `public/`, dus `/nl/`, `/tools/` en `/articles/` geven daar 404. Op Vercel werken ze wel. Ga daar niet op debuggen.

Eventnamen (vast, niet stilletjes wijzigen — de latere meting hangt eraan):
`value_submitted` · `result_shared` · `second_metric_opened` · `methodology_opened`

## Dataregels — de belangrijkste sectie

Deze regels gelden zonder uitzondering. Ze zijn er omdat de vorige poging in deze repo een map `data/raw/` had waarvan de eigen README zei: *"plausible demo figures"*. Dat is verzonnen data die als echt op een website stond.

1. **Verzin nooit een statistiek.** Niet uit je hoofd, niet uit een zoekresultaat, niet "ongeveer", niet als plaatshouder om even door te kunnen. Elk getal op de site komt uit een dataset die in de repo staat of die we reproduceerbaar ophalen.
2. **Percentielen komen uit microdata**, nooit uit gepubliceerde gemiddelden of samenvattingstabellen.
3. **Een percentiel mag alleen bestaan waar microdata het draagt.** Dit is de aangescherpte versie van de oude siteregel "wij tonen geen percentielen". Gevolg: de lengtetool krijgt een percentiel, de bestaande reactietijd-/typ-/geheugentests krijgen er nóóit een — daar bestaat geen representatieve dataset van. De bestaande Nederlandse teksten daarover blijven kloppen en blijven staan.
4. **`data/sources.md`** bevat per dataset: bron, jaar/cyclus, steekproefgrootte, licentie, en de datum waarop we hem ophaalden. Geen dataset in de repo zonder regel in dit bestand.
5. **Elke metriekpagina heeft een zichtbare methodologie-sectie**: wat is de bron, welke steekproef, hoe is gerekend, wat zijn de beperkingen.
6. **Kun je iets niet uit data onderbouwen, dan schrijf je het niet op.** Zeg tegen Simeon dat de data ontbreekt. Een lege plek is beter dan een plausibel getal.

Specifiek voor de percentielmotor:

- Bron: NHANES (CDC/NCHS), publiek domein. Demografie- en body-measures-bestanden per cyclus, gejoind op respondent-ID. **Verifieer exacte cyclusnamen, bestandsnamen en aantallen bij het ophalen — schrijf ze niet uit je hoofd op.**
- Tweede bron, voor de geld-categorie in fase 5: **Survey of Consumer Finances** (Federal Reserve, vermogen) en **CPS ASEC** (Census, inkomen). Beide publieke microdata, dus dezelfde belofte houdt stand. Let op twee dingen die anders zijn dan bij NHANES: de SCF publiceert **vijf implicates** per huishouden voor ontbrekende antwoorden — bereken percentielen per implicate en middel daarna, zoals de Fed zelf voorschrijft — en de SCF oversamplet rijke huishoudens, wat schattingen tot ongeveer de top 0,5% betrouwbaar maakt en daarboven niet. Verifieer dit alles bij het ophalen; dit staat hier als aanwijzing, niet als feit om over te schrijven.
- **Aantallen mensen boven een drempel** mogen alleen uit de steekproefgewichten komen, en alleen waar genoeg respondenten achter zitten. De grens staat op 30 in `src/lib/threshold-explorer.js`; daaronder zeggen we dat we het niet weten. Een miljoenental op vijf waarnemingen is een verzonnen getal met een echt uitziende komma.
- **Weeg met de officiële sample weights.** NHANES oversamplet bepaalde groepen; ongewogen percentielen zijn simpelweg fout. Bij het poolen van meerdere cycli gelden de standaard NCHS-regels voor gecombineerde gewichten.
- **Pool meerdere cycli en strijk glad over leeftijd.** Per los leeftijdsjaar zijn er te weinig respondenten voor een stabiel uiterste percentiel. De methode (bijv. gewogen kwantielregressie of LMS) leg je vóór het bouwen voor aan Simeon.
- Output: compacte JSON per geslacht, leeftijd × percentiel, in de repo gecommit. De client interpoleert; de client rekent niets opnieuw uit ruwe data.
- **Elke percentielpagina zegt expliciet dat er wordt vergeleken met volwassenen in de VS.** Een Britse bezoeker moet weten waartegen hij wordt afgezet.

## SEO- en AdSense-regels

- **Geen honderden pagina's uit één template waarin alleen een cijfer verandert.** Google's maart 2026-update heeft dat afgestraft als scaled content abuse, met "data-aggregatie zonder synthese" letterlijk als categorie.
- Een pagina bestaat alleen als hij een vraag beantwoordt die **aantoonbaar verschilt** van elke andere pagina, met een berekening die nergens anders staat. Liever 400 sterke pagina's dan 8.000 dunne.
- Stel je een generator voor, laat dan per uitkomst zien waarom die uniek waardevol is. Kun je dat niet, dan komt de generator er niet.
- **Resultaat- en deelpagina's krijgen `noindex`.** Duizenden geparametriseerde URL's laten indexeren ís het scaled-content-patroon.
- Search Console is actief; controleer daar het effect van elke publicatie.
- **De hoofdzoekwoorden zijn niet te winnen.** De SERP voor "average height" is Cleveland Clinic, Wikipedia, Healthline en World Population Review. Een domein van acht maanden pakt die posities niet. Richt op de staart waar wij als enige het antwoord hebben uitgerekend: *"how many men are 6 feet tall"*, *"how rare is 6'4"*, *"what percentage of men are over 6 feet"*. Veel minder concurrentie, en geen van de grote sites beantwoordt ze.
- **Backlinks komen van tools, niet van teksten.** Zorg dat elk resultaat en elke grafiek te delen en in te sluiten is.

### Advertenties — de volgorde

- **Nog geen advertentiecode.** `ads.txt` blijft staan zoals het is.
- AdSense-goedkeuring vraagt in de praktijk **15 tot 25 substantiële pagina's** plus About, Privacy en Contact, een professioneel ogende site en geen automatisch gegenereerde inhoud. Vraag pas aan als fase 2 en 3 staan.
- **AdSense is niet het eindpunt maar de toegangsproef.** Mediavine hanteert sinds 2026 geen sessiedrempel meer maar **$5.000 advertentieomzet per jaar** voor het hoofdnetwerk; Journey by Mediavine begint bij 1.000 sessies per maand. Dat is 2 tot 4× de RPM van AdSense. Het pad is dus AdSense → Journey → Mediavine/Raptive.
- Komen er advertenties, dan is dat één gecoördineerde stap: gecertificeerde CMP-banner (Google eist die voor EER/VK), bijgewerkt privacybeleid, dán pas de code. Niet andersom.
- Advertentieplekken hoor je in het ontwerp mee te nemen, niet later erbij te proppen. **Nooit tussen invoer en antwoord** — wel eronder. En let op layout shift: advertenties straffen CLS af, en CLS straft je ranking af.

## Codeconventies

- Hergebruik `css/style.css` en de bestaande designtokens. **Geen Tailwind, geen tweede designsysteem.**
- Semantische HTML. Houd het toegankelijkheidsniveau van de huidige site vast: skip-link, `aria-*`, `visually-hidden`, werkend met toetsenbord.
- Nieuwe pagina's zijn `lang="en"`, Amerikaans-Engelse spelling. Bestaande NL-pagina's blijven `lang="nl"`.
- Vanilla JS voor de rekenmodule, klein en leesbaar. Geen framework voor iets dat een formulier en een berekening is.
- **Geen nieuwe dependency zonder het te vragen.**
- Nederlandse bestanden niet aanraken tenzij expliciet gevraagd.

## Expliciet buiten scope

Niet bouwen, ook niet "vast even":

- **Andere landen dan de VS.** Eén markt, één set brondata per metriek.
- **Accounts, login, backend, database.** Het profiel uit de architectuureis leeft in `localStorage` en verlaat de browser niet — dat is iets anders dan een account, en de grens ligt daar hard.
- Het opslaan van ingevoerde waarden op een server
- Een CMS
- Nieuwsbrief of e-mailverzameling
- **Dunne gegenereerde pagina's.** Let op de nuance: ~50 tot 100 pagina's is het plan en is prima, mits élke pagina een eigen berekening draagt. Verboden is de variant waarin alleen een cijfer verandert. Kun je per uitkomst niet uitleggen waarom die uniek waardevol is, dan komt de generator er niet.
- Advertentiecode en cookiebanner (tot fase 6, zie de volgorde hierboven)
- Het Nederlandse cluster vertalen of uitbreiden
- Een percentiel op de bestaande reactietijd-/typ-/geheugentests

Wél gepland, dus géén scope-oprekking: de geld-categorie op SCF- en CPS-microdata in fase 5.

Alles wat hier tegenaan schuurt gaat op de later-lijst. Zeg dat, en bouw het niet.

## Werkwijze

- **Leg het plan voor voordat je bouwt.** Ook bij kleine dingen: eerst wat en waarom, dan pas code.
- Kleine commits met een duidelijke boodschap. Eén onderwerp per commit.
- **Geen ongevraagde refactors.** Kom je slechte code tegen die buiten de opdracht valt, meld het, verander het niet.
- Komt er werk bij dat buiten de fasering valt, zeg dat en stel voor het op de later-lijst te zetten.
- Klopt een aanname van Simeon niet, corrigeer hem. Direct, zonder omweg — en met bewijs, niet met een mening. De sterkste correcties in dit project kwamen uit de eigen git-historie en uit de data zelf.
- **Herhaalt Simeon een beslissing nadat je bezwaar hebt gemaakt, dan is het besloten.** Noteer het en bouw door; ga niet twee keer hetzelfde punt maken.
- Rapporteer eerlijk: werkt iets niet of is iets overgeslagen, zeg dat met het bewijs erbij.
