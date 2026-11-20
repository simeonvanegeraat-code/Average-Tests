# Plan: de voordeur, een artikel per metriek, en de site leuker maken

*20 november 2026, uit Simeons beoordeling van de live site. Nog niets gebouwd; dit plan
wacht op zijn keuzes in §6. Wat al gedaan is (lege kolommen, de taalkiezer) staat in de PR
die dit bestand meebrengt.*

## Wat Simeon zei

1. De voordeur werkt niet: de indeling is niet logisch en niets nodigt uit om te klikken.
2. Tabellen die niets zeggen, zoals man/vrouw zonder data op `/household-size/`.
3. Per metriek minstens één artikel dat de nieuwste cijfers bespreekt, met een link naar
   de pagina.
4. De cijfers op een leuke manier laten zien, zodat het meteen duidelijk is.
5. Talen in een uitklapmenu in plaats van naast elkaar in de balk.
6. Eigen voorstellen om de site bruikbaar te maken.

Punt 2 en 5 zijn gedaan (zie de PR). De rest staat hieronder.

## 1. Waarom de voordeur niet werkt

Bekeken op 1280 en 390 pixels, en gelezen als iemand die er voor het eerst komt:

- **De kop is een stelling, geen belofte.** "A European average describes almost nobody"
  zegt wat de site vindt, niet wat de bezoeker er kan doen.
- **De bol is versiering.** Hij neemt de halve hero, toont vooral Afrika en oceaan, en je
  kunt er niets mee.
- **De keuzelijst staat op "Europe" met een knop "Show me"** die op de plek zelf niets
  verandert: het effect zit drie schermen lager, in de kaarten.
- **Tien kaarten in een plat raster**, zonder volgorde die de bezoeker herkent, met als
  enige inhoud een EU-cijfer zonder context.
- **Er is geen eerste stap.** Niets zegt "begin hier".

## 2. Voorstel voor de voordeur

Eén idee draagt de pagina: **het leven van een Europeaan, als lijn van leeftijden.** Vier
van de metrieken zijn een leeftijd, en voor 28 landen bestaan ze alle vier:

| Stop | EU | Nederland |
|---|---|---|
| Het huis uit (de helft is weg) | 26,3 | 23,4 |
| Eerste kind (moeder) | 29,9 | 30,5 |
| Begin van het pensioen | 61,3 | 64,7 |
| Gezonde levensjaren bij geboorte | 65,2 | 59,5 |

Werkzaam leven (37,5 jaar) is een duur en geen leeftijd, en komt als balk onder de lijn.

Deze levenslijn stond al in de ontwerpnotitie van oktober (`research/design-brief.md`) en
is nooit gebouwd. Hij doet wat de voordeur nu niet doet: in één beeld laten zien wat de
site meet, en waar je eigen land anders is.

**De nieuwe volgorde:**

1. **Kop en keuze in één.** "How does your country compare?" met de landkeuze er direct
   onder, groot. Geen bol. Kies je een land, dan verandert alles eronder meteen. Zonder
   keuze toont de pagina de EU.
2. **De levenslijn.** Een horizontale lijn van 0 tot 80 jaar met de vier stops als punten,
   EU in grijs en je eigen land in kleur, met het verschil erbij ("3 years earlier").
   Elke stop is een link naar zijn pagina.
3. **Je land in tien rangen.** Per metriek één regel: "Leaving home: 7th earliest of 31".
   Een rang leest sneller dan een getal met een eenheid. Gegroepeerd per levensfase (thuis,
   werk, gezondheid, geld) in plaats van tien losse kaarten.
4. **Wat opvalt.** Drie feiten, uitgerekend uit de data zoals op de vermogenspagina's: de
   grootste kloof, de snelste verandering, de grootste verrassing. Elk met een link.
5. **Nieuwste artikelen.** Zodra die er zijn (§3).
6. **Wat deze site niet doet.** Kort, onderaan.

Alles komt uit bestaande libs; er is geen nieuwe bron nodig. Getallen blijven uit de data
(regel 5 van CLAUDE.md). De tekst gaat in twee talen.

**Wat dit niet oplost:** de vier leeftijden zijn verschillende metingen (een middelpunt,
een gemiddelde, een verwachting). De lijn moet dat zeggen, net zoals `/leaving-home/` uitlegt
waarom er geen percentiel staat.

## 3. Een artikel per metriek

Het doel: per metriek één stuk dat de nieuwste cijfers bespreekt en naar de pagina linkt.
Dat zijn tien artikelen.

**De vorm,** naar het model van het bestaande stuk over de reeksbreuk:

- Een vraag als titel die mensen echt stellen ("Why do Croatians leave home ten years
  later than Finns?"), geen "De cijfers van 2025".
- 800–1.200 woorden, met één gedachte die niet op de metriekpagina staat. Een samenvatting
  van de pagina is precies de "content van weinig waarde" waar AdSense op afwees.
- **Elk getal uit de data, op bouwtijd uitgerekend.** Geen getal met de hand. Daardoor
  verouderen de artikelen niet stil als een bron bijwerkt.
- Een grafiek of tabel die op de metriekpagina niet staat.
- Bovenaan de bron en de datum van de cijfers, onderaan de link naar de metriekpagina. De
  metriekpagina linkt terug.

**Eerst nagaan per artikel** dat er echt iets te vertellen is. Voorbeelden die de data
draagt (nagekeken op 20 november):

| Metriek | Mogelijk verhaal |
|---|---|
| Het huis uit | De landen naderen elkaar sinds 2022, terwijl het EU-cijfer stilstaat |
| Werkloosheid | De ranglijst draait om zodra je alleen onder-25-jarigen telt |
| Vermogen | Nederland heeft de zwaarste schuld van de 21, en het kleinste aandeel voor de onderste helft na Duitsland |
| Pensioen | De leeftijd waarop het pensioen begint tegenover de leeftijd waarop het werk stopt (OECD), en waarom die twee niet van elkaar af te trekken zijn |
| Woninggrootte | De grootste woningen staan niet waar mensen de meeste ruimte hebben |

**Volgorde:** naar zoekvraag (`research/metric-shortlist.md`): het huis uit, huishoudgrootte,
pensioen, vermogen, werkuren, dan de rest. Eén per week is houdbaar.

**Bijwerken:** Eurostat publiceert op vaste momenten (uit huis rond september, werkzaam
leven juli, gezonde jaren augustus, werkuren mei). Omdat elk getal op bouwtijd wordt
uitgerekend, is bijwerken: data ophalen, poort draaien, de tekst nalezen. De nalezing is
het werk: een zin als "de kloof krimpt" kan na een nieuwe jaargang onwaar zijn. Daarom
krijgt elk artikel een poort die de beweringen controleert, zoals `trend()` dat nu al doet.

## 4. Leuker en duidelijker

Wat zonder nieuwe bron en zonder nieuwe dependency kan, op volgorde van effect:

1. **De levenslijn** (§2). Het sterkste beeld dat de site kan maken.
2. **Eerst raden, dan zien.** Op elke metriekpagina vóór de kaart: "Where do you think
   young people leave home latest?", drie landen om uit te kiezen, dan de kaart. Het
   dagelijkse raadspel staat al op de later-lijst van CLAUDE.md; dit is de kleine versie
   ervan, op de pagina zelf.
3. **Twee landen naast elkaar.** Kies een tweede land, en elke pagina toont beide. Kan
   in de browser, zonder nieuwe URL's (dus geen dunne pagina's voor Google).
4. **Gewone taal bovenaan, de vaktaal lager.** "Midpoint", "series break" en "reference
   person" staan nu in de eerste schermen. Eén zin in gewone taal bovenaan, de precisie
   in de methodesectie.
5. **Deelbare kaart als afbeelding.** De kaart en "je land in tien rangen" als plaatje om
   te delen. Dat vraagt een renderer en waarschijnlijk een dependency: jouw besluit.

## 5. Eigen voorstellen voor bruikbaarheid

- **Je land overal.** Wie één keer een land kiest, ziet het op elke pagina gemarkeerd in
  de kaart en de tabel. Het profiel bestaat al; de pagina's gebruiken het nog niet overal.
- **"Bijgewerkt op" bovenaan elke metriekpagina,** met de datum van de bron. Laat zien dat
  de cijfers vers zijn, en is meteen een signaal voor Google.
- **Download als CSV** onder elke tabel. Voor studenten en journalisten: de mensen die
  links maken.
- **Een zichtbare hint dat de tabel opzij schuift** op een telefoon.
- **Zoeken op land.** Een snelle sprong naar "alles over Nederland". Hangt samen met de
  landpagina's per metriek die nog openstaan (`research/wealth-country-pages-plan.md`
  laat zien hoe die eruit moeten zien om niet dun te zijn).

## 6. Wat Simeon moet kiezen

1. **De voordeur:** de levenslijn als kern, in de volgorde van §2? Of een andere richting?
2. **Artikelen:** ik schrijf, met elk getal uit de data, en jij leest elk stuk voor het live
   gaat? Eén per week, beginnend met "het huis uit"?
3. **Welke van §4 en §5** eerst. Mijn voorstel: levenslijn, dan raden, dan "bijgewerkt
   op", dan je land overal.
4. **Deelbare afbeeldingen:** mag daar een dependency voor bij?

## Volgorde als alles ja is

| Stap | Wat |
|---|---|
| 1 | Voordeur met levenslijn en tien rangen, in beide talen, met een eigen poort |
| 2 | Eerste artikel (het huis uit), met de beweringspoort |
| 3 | "Bijgewerkt op" en je land overal |
| 4 | Eerst raden, op alle metriekpagina's |
| 5 | Elke week een artikel |
