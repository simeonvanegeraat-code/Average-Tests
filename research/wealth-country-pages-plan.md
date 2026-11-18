# Plan: de 21 landpagina's onder /wealth/

*15 november 2026. Er is niets gebouwd. Elk getal hieronder is die dag gemeten op de live
site of nageteld uit `data/wealth/*.json` en `data/raw/dwa/dwa.csv`.*

## In het kort

1. **De pagina's zijn te gelijk, en de zin die ze moest onderscheiden is op alle 21
   dezelfde.** Per paar delen ze 64% van hun tekst. De lib zegt dat ze "werkelijk
   verschillen" in waar het vermogen zit; de data zegt dat het grootste bezit van het
   middelste huishouden in alle 21 landen vastgoed is en het tweede in alle 21 spaargeld.
2. **Er staan drie beweringen op die de data niet draagt.** Eén is in 12 van de 19 landen
   aantoonbaar onwaar. Die horen eraf vóór er iets bij komt (stap 0).
3. **De data draagt wél echte verschillen**, alleen op andere punten dan waar de pagina nu
   naar kijkt: de verhouding gemiddelde/mediaan loopt van 1,4 tot 3,7, de schuld van het
   middelste huishouden van 7% tot 43% van zijn bezit, de groei sinds begin 2023 van −3%
   tot +45%.
4. **Het voorstel:** elke pagina kiest uit negen maten de drie waarop dát land het meest
   afwijkt, noemt de landen ernaast, en toont zijn eigen lijn over twaalf kwartalen. Een
   poort meet vooraf of de pagina's daarna ver genoeg uit elkaar liggen.

## 1. Wat er nu staat

| | |
|---|---|
| Aandeel van de Engelse site | 21 van de 40 URL's |
| Gedeelde tekst per paar | mediaan 64%, laagste 54%, hoogste 70% |
| Eigen tekst per pagina | ongeveer 30% |
| Ter vergelijking: twee metriekpagina's | mediaan 7% gedeeld |
| Inkomende links vanuit de inhoud | 1 per pagina, alleen vanaf `/wealth/` |
| Andere landen bij naam genoemd | geen enkele, op geen enkele pagina |
| Grafieken | één, onderaan (vermogen naar leeftijd) |

*Gedeeld* is gemeten in reeksen van vijf woorden binnen `<main>`: het aandeel van de
reeksen van pagina A dat ook op pagina B staat. Een zin waarin alleen het bedrag verschilt
telt dus als gedeeld, en dat is de bedoeling: zo leest Google hem ook.

De titel belooft "Where You Stand", maar het formulier staat op `/wealth/`.

## 2. Stap 0: drie beweringen die eraf moeten

Dit zijn fouten op de live site, geen verbeteringen. Ze staan los van de rest van het plan
en kunnen in een eigen PR.

### 2a. "Wider than any difference between age groups or professions"

Staat op elke landpagina met een koop/huur-uitsplitsing, als feit over dát land. Nageteld
tegen de werkstatus in hetzelfde databestand (hoogste groep gedeeld door laagste):

- **Onwaar in 12 van de 19 landen** die beide uitsplitsingen hebben: Oostenrijk, België,
  Duitsland, Estland, Griekenland, Kroatië, Hongarije, Italië, Luxemburg, Letland,
  Slovenië en Slowakije. In Duitsland is koop/huur 7,9× en werkstatus 62×.
- **Niet na te gaan voor Nederland**: het bestand heeft daar geen werkstatus.
- **Leeftijd zit niet in deze bron.** De vergelijking met leeftijdsgroepen zou een cijfer
  uit de kwartaalrekening naast een cijfer uit de enquête zetten: les 5 uit CLAUDE.md.

De zin gaat weg. Wat ervoor terugkomt staat in §4: de rang van dit land op koop/huur
tussen de andere, die wél uit de data komt.

### 2b. De kwartaalrekening bevat géén pensioenaanspraken

`/wealth/` zegt: "they do include pension entitlements — which the survey above does not".
`/wealth/by-age/` zegt hetzelfde. CLAUDE.md (les 5) en `data/sources.md` noemen het "het
hele verschil" tussen de twee ECB-bronnen.

Wat de bron zelf zegt:

- De post die de site "Pensions and insurance" noemt (`F62`) heet bij de ECB **"Life
  insurance and annuity entitlements"**. Dat staat in de kolom `TITLE` van het opgehaalde
  bestand.
- Het bestand bevat geen reeks voor pensioenaanspraken (`F63`). De pijplijn haalt álle
  instrumenten op; de lijst voor Nederland is `F2M, F3, F5, F51, F511, F51M, F52, F62,
  NUB, NUN, F4B, F4X` plus de totalen.
- De ECB schrijft in zijn methodologische toelichting en in het Economic Bulletin dat
  pensioenaanspraken op dit moment níet in de DWA zitten, wegens ontbrekende data. Dat
  heb ik gelezen in de samenvatting van een zoekresultaat, niet in de pdf zelf.
- Het rekent ook niet rond: het middelste Nederlandse huishouden heeft €9.064 in deze
  post, terwijl de twee bronnen €88.000 uit elkaar liggen (€232k tegen €144k).

Wat blijft staan: de regel uit les 5. De twee bronnen meten niet hetzelfde en verschillen
in beide richtingen, dus geen zin met een cijfer uit beide. Wat niet klopt is de reden die
erbij staat.

Wat er moet veranderen:

| Waar | Nu | Wordt |
|---|---|---|
| `src/locales/*/wealth.json`, `scripts/lib/dwa.mjs` | "Pensions and insurance" | "Life insurance and annuities" |
| `/wealth/` regel 221, `/wealth/by-age/` regel 248 | "they do include pension entitlements" | weg; wat wél waar is: een andere meetmethode en een ander peilmoment |
| `/wealth/` regel 93, de vraag aan de bezoeker | "home, savings, investments and pension pot" | zonder "pension pot": de mediaan waarmee vergeleken wordt bevat die niet |
| CLAUDE.md les 5, `data/sources.md` | "mét pensioenaanspraken" | Simeons bestand; de correctie staat hier |

Het derde punt weegt het zwaarst. Een Nederlander die zijn pensioenpot meetelt, vergelijkt
zich nu met een mediaan waar geen pensioen in zit.

Open vraag, niet uitgezocht: wat verklaart het verschil dan wel. Kandidaten zijn de
ophoging naar de nationale rekeningen en het peilmoment (2026-Q1 tegen veldwerk in
2022–2025). Tot dat is nagelezen zegt de site alleen dát ze verschillen.

### 2c. "This is not unusual across Europe"

Staat bij een negatief onderste vijfde. Het is waar, maar het is met de hand getypt: 7 van
de 21 landen (Nederland, Cyprus, Frankrijk, Oostenrijk, Duitsland, Portugal, Finland). De
zin wordt "in 7 of the 21 countries", uit de data.

### 2d. Klein, in dezelfde ronde

- Elke waarneming in de bron draagt `OBS_STATUS = E` (schatting), alle 250.680. De ECB
  noemt de reeks experimenteel. De description van `/wealth/` zegt "Official ECB figures".
  Voorstel: de methodesectie zegt dat het schattingen zijn.
- `NUN` heet bij de ECB "Housing wealth"; de site zegt "Property and other non-financial
  assets". Nalezen wat erin zit voor het label verandert.
- De kop van `src/lib/pages/wealth-country.js` zegt "in Nederland [zit het vermogen] in
  pensioen". Zie 2b.

## 3. Wat per land werkelijk verschilt

Nageteld over de 21 landen, laatste kwartaal per land.

| Maat | Laagste | Hoogste | Bron in het bestand |
|---|---|---|---|
| Gemiddelde ÷ mediaan | 1,4 (Malta) | 3,7 (Duitsland) | `mean`, `median` |
| Koop ÷ huur | 3,3 (Luxemburg) | 15,5 (Finland) | `status` HSO, HST; Portugal ontbreekt |
| Aandeel van de rijkste 10% | 35,5% (Malta) | 63,0% (Letland) | `groups` D10 × 0,1 ÷ `mean` |
| Aandeel van de onderste helft | 2,2% (Duitsland) | 15,5% (Slowakije) | `groups` B50 × 0,5 ÷ `mean` |
| Vastgoed in het bezit van het midden | 54,8% (Duitsland) | 86,6% (Hongarije) | `composition.Q3` |
| Spaargeld in het bezit van het midden | 6,7% (Hongarije) | 28,5% (Oostenrijk) | `composition.Q3` |
| Schuld ÷ bezit van het midden | 7,0% (Hongarije) | 43,0% (Nederland) | `composition.Q3` |
| Groei mediaan sinds 2023-Q1 | −3,1% (Finland) | +45,4% (Hongarije) | `medianHistory`; eurozone +13,8% |
| Onderste vijfde negatief | 7 landen wel | 14 niet | `groups` Q1 |

**De aandelen zijn een afgeleide som, geen schatting.** Het gemiddelde van een groep maal
haar omvang, gedeeld door het gemiddelde van iedereen, is haar aandeel in het totaal. De
controle: de vijf vijfden tellen per land op tot 0,999–1,003 van het gemiddelde. Het is
geen percentiel en heet ook niet zo.

Twee dingen die de data níet draagt:

- **Koopkracht.** De groei is in euro's van het moment zelf. Er staat geen prijsreeks in
  de repo, dus de pagina zegt "in nominal euros" en rekent niets om.
- **Waarom.** De data zegt dat Hongarije 45% steeg, niet waardoor. Geen verklaring op de
  pagina die niet uit het bestand komt.

## 4. De nieuwe pagina

Van boven naar beneden. Wat blijft, blijft; wat gedeeld is, wordt korter.

1. **Kop**, zoals nu, met rechts in het lege vlak een stippenrij van de 21 landen waarin
   dit land gemarkeerd is. `DotPlot.astro` bestaat al.
2. **"Wat opvalt aan <land>"**: het eigenlijke werk. Een functie `standsOut(country,
   all)` in `src/lib/pages/wealth-country.js` rekent voor de negen maten uit §3 de rang
   van dit land tussen de andere, en kiest de drie waarop het het dichtst bij een uiterste
   staat. Elke gekozen maat levert één alinea die het getal noemt, de rang, en **de landen
   ernaast bij naam, met een link**: "Only Germany's average sits further above its
   median." Voor Nederland komt de schuld bovenaan (hoogste van de 21) en het kleine
   aandeel van de onderste helft (op Duitsland na het laagste); voor Malta de
   gelijkmatigste verdeling van allemaal. Twee landen krijgen zo
   zelden dezelfde drie, en nooit dezelfde buren.
3. **De lijn**: de mediaan over de kwartalen sinds 2023-Q1, met de eurozone ernaast als
   index. `sparkline.js` bestaat. De lijn wordt niet getekend over een breuk: het bestand
   heeft een kolom `PRE_BREAK_VALUE`, en de bouwstap moet weigeren als die gevuld is.
4. **Verdeling**: de bestaande tabel, met het aandeel van elke groep erbij.
5. **Balans van het midden**: de bestaande tabel. De zin "the largest holding is
   property" verdwijnt, want die is overal gelijk. Ervoor in de plaats: de post waarop dit
   land het meest afwijkt van het middelste huishouden in de eurozone.
6. **Leeftijd**: blijft zoals het is. Dit is nu al de sectie die het meest verschilt.
7. **De buren**: het land direct boven en direct onder op de mediaan, als kaartjes met een
   link. Dat geeft elke landpagina twee inkomende links vanuit de inhoud, plus die uit 2.
8. **Methode**: ingekort tot wat over dít land gaat (peilkwartaal, veldwerk), met een link
   naar `/method/` voor de rest.

Wat van alle 21 pagina's verdwijnt omdat het op alle 21 hetzelfde is: de uitleg waarom
gemiddelde en mediaan verschillen, de uitleg bij een negatief vijfde, de algemene
methodetekst. Die staan één keer op `/wealth/`.

**De knop.** "Compare your own household" zet het land in het profiel en gaat naar
`/wealth/#compare`, waar het formulier dan al op dat land staat. Het formulier 21 keer
inbouwen kan ook, maar kost twee keer het werk (twee talen) voor hetzelfde resultaat. De
titel wordt eerlijk over wat de pagina doet.

## 5. De lat, vooraf en meetbaar

Een poort `scripts/check-country-pages.mjs` op de gebouwde site. Zonder slagen geen PR.

| | Nu | Moet worden |
|---|---|---|
| Gedeelde tekst per paar, mediaan | 64% | hoogstens 40% |
| Gedeelde tekst per paar, hoogste | 70% | hoogstens 50% |
| Andere landen bij naam, per pagina | 0 | minstens 3 |
| Inkomende inhoudslinks, per pagina | 1 | minstens 3 |
| Zinnen met een getal dat niet uit een lib komt | niet gemeten | 0 |

De getallen zijn een voorstel. De metriekpagina's zitten op 7%; dat halen 21 pagina's uit
één sjabloon niet, en dat hoeft ook niet. Onder de 40% is de helft van elke pagina van
dat land alleen.

Haalt de bouw de lat niet, dan is het antwoord minder pagina's (samenvoegen of noindex
voor de landen waar de data dun is, zoals Portugal zonder koop/huur), niet een lagere lat.

## 6. Volgorde, en welk model

| Stap | Wat | Model |
|---|---|---|
| 0 | De beweringen uit §2 eraf, in een eigen PR | Opus, met §2 als opdracht |
| 1 | `standsOut()`, de aandelen, de lijn, en de poort uit §5 | het zwaarste model: hier wordt bepaald wat een land "opvallend" maakt |
| 2 | De Engelse pagina op die lib, drie landen nalezen: Nederland, Duitsland, Litouwen | het zwaarste model voor de zinnen, Simeon leest |
| 3 | De Nederlandse pagina en `src/locales/nl/copy/wealth.js` | Opus |
| 4 | Poort draaien over alle 42, voor/na-vergelijking, PR | Opus |

Stap 3 begint pas als Simeon de drie landen van stap 2 heeft gezien.

## 7. Wat Simeon moet beslissen

1. **De getallen van de lat** in §5.
2. **Knop of formulier** op de landpagina (§4). Voorstel: knop.
3. **Stap 0 nu**, los van de rest? Voorstel: ja, het zijn fouten op de live site.
4. **CLAUDE.md les 5 en `data/sources.md`** aanpassen aan §2b.

## Buiten dit plan

- Een pagina per land over alle tien metrieken. Ander paginatype, eigen plan.
- Omrekenen naar koopkracht. Vraagt een prijsreeks en dus een nieuwe bron.
- Uitzoeken wat het verschil tussen de twee ECB-bronnen verklaart (§2b).

## Opnieuw meten

De scripts waarmee dit is gemeten staan niet in de repo. De gedeelde tekst hoort als poort
in de repo te komen (stap 1); de rest is na te rekenen uit `data/wealth/*.json` met de
formules in §3.
