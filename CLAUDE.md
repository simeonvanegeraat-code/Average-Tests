# CLAUDE.md — humanaverage.com

Werkinstructie voor Claude Code. Kort en operationeel. Bij twijfel: vraag het, bouw niet door.

## Doel & propositie

1. Mensen zoeken massaal op "average X". Google beantwoordt dat zelf met een gemiddelde in een snippet.
2. Wij beantwoorden een andere vraag: **waar sta jíj?** De bezoeker vult zijn eigen waarde in en krijgt een percentiel.
3. Dat percentiel wordt berekend uit **microdata**, niet overgenomen uit een gepubliceerd gemiddelde. Dat is het enige bestaansrecht van deze site.
4. Einddoel is organisch zoekverkeer, daarna advertentie-inkomsten. Dat is het einddoel, niet de eerste stap.
5. Markt en taal: **en-US**. Domeinnaam, zoekvolume en brondata (NHANES, VS) wijzen alle drie dezelfde kant op.

## De MVP en zijn stopcriterium

De MVP toetst één aanname: **wie op "average height" zoekt, blijft hangen zodra hij zichzelf in een percentiel ziet staan.**

Wat we bouwen, en niets anders:

- **Twee metrieken**: lengte (primair) en gewicht/BMI (bestaat alleen om de doorklik meetbaar te maken; komt uit hetzelfde NHANES-bestand, dus bijna nul extra datawerk).
- Een **percentielmotor** die echt rekent uit microdata. Geen vaste tabel.
- Een **deelbare resultaatpagina** (deelbaar ≠ indexeerbaar, zie SEO).
- **3–5 landingspagina's** op de lengte-metriek.
- **Analytics** die de doorklik meet.

Stopcriterium — meten over **≥300 bezoekers**, daarna beslissen:

- **≥30%** van de bezoekers *die een waarde invullen* klikt door naar de tweede metriek óf deelt.
- **Mediane sessieduur > 60 s.**
- Guardrail (geen slaag/zak-criterium, wel diagnose): % van álle bezoekers dat überhaupt iets invult. Is dat heel laag, dan zegt die 30% weinig en kijken we eerst daarnaar.

Haalt het dit niet, dan stoppen we of draaien we bij. **Zeg dat hardop tegen Simeon, verzacht het niet.**

Verkeersbron voor de toets: Google Ads op de doelzoekwoorden, VS-targeting (~€200–300). Dat is dezelfde query met dezelfde intentie, alleen betaald — het best haalbare proxy voor organisch verkeer. Reddit is bewust géén optie: dat publiek klikt en deelt gretiger dan een zoeker en geeft een geflatteerd cijfer. **De go/spend-beslissing valt pas als de MVP er staat**, maar de meetopzet gaat er nú al van uit (UTM-afhandeling, eventnamen).

SEO geeft pas na 3–6 maanden een eerlijk signaal. De SEO-kant staat dus te rijpen terwijl we met betaald verkeer leren. Wacht niet op organisch voor het eerste leerpunt.

## Stack, commando's, lokaal draaien, deployen

- **Site**: Astro, statische output. Geen client-side framework.
- **Datapipeline**: Node, zonder dependencies. Output is JSON dat in de repo staat. (Oorspronkelijk stond hier Python/pandas; er staat op deze machine geen Python, alleen een Windows Store-stub. De XPT-lezer in `scripts/lib/xpt.mjs` is daarom zelfgeschreven en gevalideerd tegen de NCHS-publicatie — zie `data/sources.md`.)
- **Hosting**: Vercel, al gekoppeld. `vercel.json` (redirects + security headers) blijft zoals het is.
- **Analytics**: Plausible, cookieloos, EU-gehost. Geen consent-banner nodig zolang er geen advertenties zijn.

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

**URL-structuur (MVP)**: het bestaande Nederlandse cluster blijft exact staan waar het staat, inclusief `/`. Nieuwe Engelse pagina's krijgen eigen paden (`/height/`, `/weight/`). Open beslissing bij MVP-oplevering: verhuist de root naar het Engelse product en het NL-cluster naar `/nl/`? Niet nu doen.

Plausible-events (vaste namen, niet stilletjes wijzigen):
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
- **Geen advertentiecode in de MVP.** AdSense keurt een site van vijf pagina's toch niet goed, en ads op een site zonder verkeer meten niets. `ads.txt` blijft staan zoals het is.
- Komen er wél advertenties, dan is dat één gecoördineerde stap: gecertificeerde CMP-banner (Google eist die voor EER/VK), bijgewerkt privacybeleid, dán pas de code. Niet andersom.

## Codeconventies

- Hergebruik `css/style.css` en de bestaande designtokens. **Geen Tailwind, geen tweede designsysteem.**
- Semantische HTML. Houd het toegankelijkheidsniveau van de huidige site vast: skip-link, `aria-*`, `visually-hidden`, werkend met toetsenbord.
- Nieuwe pagina's zijn `lang="en"`, Amerikaans-Engelse spelling. Bestaande NL-pagina's blijven `lang="nl"`.
- Vanilla JS voor de rekenmodule, klein en leesbaar. Geen framework voor iets dat een formulier en een berekening is.
- **Geen nieuwe dependency zonder het te vragen.**
- Nederlandse bestanden niet aanraken tenzij expliciet gevraagd.

## Expliciet buiten scope

Niet bouwen, ook niet "vast even":

- Meerdere landen of datasets naast NHANES
- Accounts, login, opgeslagen profielen
- Een CMS
- Nieuwsbrief of e-mailverzameling
- Honderden gegenereerde pagina's
- Advertentiecode en cookiebanner
- Het Nederlandse cluster vertalen of uitbreiden
- Backend, database, of het opslaan van ingevoerde waarden
- Een percentiel op de bestaande reactietijd-/typ-/geheugentests

Alles wat hier tegenaan schuurt gaat op de later-lijst. Zeg dat, en bouw het niet.

## Werkwijze

- **Leg het plan voor voordat je bouwt.** Ook bij kleine dingen: eerst wat en waarom, dan pas code.
- Kleine commits met een duidelijke boodschap. Eén onderwerp per commit.
- **Geen ongevraagde refactors.** Kom je slechte code tegen die buiten de opdracht valt, meld het, verander het niet.
- Rekt Simeon de MVP op, zeg dat en stel voor het op de later-lijst te zetten.
- Klopt een aanname van Simeon niet, corrigeer hem. Direct, zonder omweg.
- Rapporteer eerlijk: werkt iets niet of is iets overgeslagen, zeg dat met het bewijs erbij.
