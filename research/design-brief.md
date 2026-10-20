# Ontwerpvoorstel: doorklikken, onthouden, doorsturen

*19 oktober 2026. Vervolg op [metric-shortlist.md](metric-shortlist.md). Er is niets in de live site veranderd. Wel is er een werkende mock-up van één pagina (de nummer 1 uit de shortlist, leeftijd uit huis), op echte Eurostat-data: [mockups/leaving-home.html](mockups/leaving-home.html). Dubbelklik het bestand om het in een gewone browser te openen; het heeft geen server nodig.*

Wat ik zag en mat is gemarkeerd als **gezien**. Wat een ontwerpkeuze is waarvan het effect pas na livegang meetbaar wordt, is gemarkeerd als **aanname**. De mock-up kan geen gedrag bewijzen, alleen laten zien wat ik voorstel.

## In het kort

1. **De hoofdgedachte: elke pagina geeft eerst het antwoord, dan een kaart, dan jouw eigen plek, dan de volgende vraag. Alle pagina's samen vertellen één verhaal: de levenslijn.** Uit huis (23,4) → trouwen (34,1) → eerste kind (30,5) → pensioen (64,7) → gezonde jaren (59,5), steeds met de cijfers van jouw land (hier Nederland, uit Eurostat). Daarmee wordt "de volgende pagina" geen link onderaan maar de volgende stap in een verhaal dat de bezoeker al begonnen is.
2. **Doorklikken** komt van drie dingen: de levenslijn bovenaan elke pagina (navigatie én voortgang in één), kaarten met de volgende vraag waarin het jouw-land-getal al staat (je ziet de helft van het antwoord, dus je klikt voor de rest), en een verzamelkaart ("My European life line") die na drie stops vrijkomt.
3. **Onthouden** komt van één groot getal per pagina, één zin over de kloof ("Finland 21,3, Kroatië 31,5: tien jaar verschil voor dezelfde stap"), en jouw eigen cijfer ernaast. Een eigen getal blijft beter hangen dan een gemiddelde; dat is een aanname, geen meting.
4. **Doorsturen**: bij de Eurostat-kaarten die ik op Google tegenkwam was de afbeelding het ding dat gedeeld werd (Reddit-kaartdraden, een Instagram-kaartaccount met 20K likes, Facebook-posts van Eurostat met 610 tot 1.400 reacties en van het Europees Parlement met 2,2K), geen link. De afbeeldingen zelf kon ik niet bekijken (Reddit is geblokkeerd in de ingebouwde browser); dat het beeld het bericht is, volgt uit de titels en bijschriften. Daarom is in het ontwerp het deelbeeld het product: een poster (4:5) en een linkkaart (1,91:1), persoonlijk of van de kaart zoals je hem net hebt ingesteld, met merk, URL en bron erop, gemaakt in de browser. Plus een embed-code, voor de backlinks.
5. **Een persoonlijk linkvoorbeeld (OG-afbeelding per bezoeker) kan niet zonder server.** Dat is een harde grens van "statisch, geen backend". Dus de afbeelding zelf reist, niet de link. Een algemene OG-afbeelding per pagina kan wel, maar dat vraagt een PNG-renderer als dev-dependency en dus jouw akkoord.
6. **Er is nog geen enkele metingsbasis.** Search Console meet vertoningen en klikken, geen pagina's per sessie. Mijn vraag: hoeveel pagina's per sessie en welk percentage terugkerende bezoekers haalt EUDebtMap nu? Dat is de enige echte maatstaf die er is om te zeggen wat "beter" betekent.

## 1. Wat vergelijkbare sites doen (gezien, 19 oktober 2026)

| Site | Wat ze goed doen | Wat ontbreekt |
|---|---|---|
| **Eurostat**, persbericht uit huis (23-09-2025, geopend) | Het officiële cijfer, met datasetcode | Tekst plus één statische grafiek (over huisvestingskosten, niet over de metriek). Geen kaart, tabel of tool. De aparte tool "Young Europeans" opent met een laadscherm en daarna "Create your avatar" (met een Skip-knop); verder ben ik niet doorgeklikt |
| **Our World in Data** (grafiek schooljaren, geopend) | Eén object met Tabel/Kaart/Lijn/Staaf, een tijdlijn met afspeelknop, een zoekbare lijst naast de kaart, knoppen Download/Delen/Volledig scherm, het logo als watermerk in elk beeld, bron en licentie onder de grafiek | Geen persoonlijke vergelijking, geen "wat nu?" |
| **Visual Capitalist** (uit huis, geopend) | Een poster met één beeldmetafoor (een deur), landen gegroepeerd per afgerond jaar, een callout met het EU-gemiddelde, gemaakt om te delen | De pagina *is* het plaatje: niet interactief, niet doorzoekbaar, geen eigen cijfer |
| **mappr.co** (huishoudgrootte, tekst gelezen) | "Key takeaways" bovenaan, top-10-tabellen met het jaar van de data | Een artikel zonder tool, voor zover uit de tekst te zien (de pagina zelf kon ik door de cookiebanner niet goed bekijken) |
| **EUDebtMap** (jouw site, geopend) | Een live teller als hero ("geeft de pagina energie"), drie lenzen op de kaart, zijpaneel, chips voor kleine landen, kaartjes per land, analyses als verse content, FAQ, methode | Geen persoonlijke laag; de volgende klik is een landkaartje of een artikel |
| **HumanAverage nu** | Een herkenbaar redactioneel merk (donkergroen, papier, serif, koraal), een landpagina met antwoord-eerst-kop ("The median household in the Netherlands is worth €231,763"), een dagelijks raadspel met emoji-deelregel en reeks | Toolpagina's beginnen met een formulier in plaats van het antwoord; geen kaart; delen = tekst kopiëren; geen pad van de ene metriek naar de volgende |

Samengevat: wie de data goed toont (OWID) heeft geen persoonlijke laag; wie wil dat het gedeeld wordt (Visual Capitalist) heeft geen tool; en niemand verbindt de metrieken tot één verhaal. Dat is het gat.

## 2. Paginaopbouw (zie de mock-up)

```
[ levenslijn: ● Leave home 23,4 ─ ○ Marry 34,1 ─ ○ First child 30,5 ─ ○ Retire 64,7 ─ ○ Healthy years 59,5 ]
[ HERO   H1 met het getal   |   groot getal "26,3"   chips: vroegst · laatst · kloof · vrouwen · mannen   [Where do you fit? ↓] ]
[ KAART  lens: Everyone/Men/Women · tijdlijn 2000–2025 ▶ · [Share this map]
         kaart met waarden op de landen | detailpaneel + zoekbare ranglijst met mini-trendlijn ]
[ JOUW BEURT  land + leeftijd → "Earlier than the average in 29 of 31 countries" + stippenstrook + deelbeeld + Save/Share/Copy link/Embed ]
[ advertentieplek, gereserveerde hoogte ]
[ VOLGENDE VRAAG  4 kaarten met jouw-land-cijfers · voortgang · verzamelkaart na 3 stops ]
[ TABEL  elk land, alle getallen, sorteerbaar, mini-trendlijn ]  [ advertentieplek ]
[ WAT DE CIJFERS ZEGGEN (berekend) · wat dit niet is · bron + datasetcode + download CSV ]
```

| # | Onderdeel | Waarom | Gezien / aanname |
|---|---|---|---|
| 1 | **Antwoord eerst**: kop met het getal en de kloof, groot getal rechts, zonder formulier ervoor | De zoeker wil het getal; het eerste scherm is ook de screenshot die mensen delen | Gezien: veel snippets in de zoekresultaten noemen het getal zelf. Aanname: een groot getal blijft beter hangen |
| 2 | **Kaart met de waarde op elk land**, kleine landen als aantikbare chips | Een kaart zonder getallen moet je overhoveren; een kaart met getallen is op zichzelf een bericht. EUDebtMap gebruikt alleen een legenda | Aanname. De Instagram-bijschriften in de zoekresultaten lijsten landgetallen op; of de kaart zelf ze draagt kon ik niet zien |
| 3 | **Eén object, drie lenzen** (iedereen/mannen/vrouwen) en een **tijdlijn met afspeelknop** | Geeft een reden om te blijven spelen en geeft elke landpagina een eigen verhaal (reeks sinds 2000) | Gezien: OWID doet dit |
| 4 | **Ranglijst naast de kaart** met zoekveld en mini-trendlijn; daaronder de volledige HTML-tabel | Mensen zoeken eerst hun eigen land; de tabel is wat Google en toetsenbordgebruikers lezen | Gezien: OWID (lijst), mappr (tabel) |
| 5 | **Jouw beurt onder de kaart**, niet erboven | Regel uit CLAUDE.md: nooit advertenties tussen invoer en antwoord; en de bezoeker ziet het antwoord zonder iets in te vullen | Gezien: de wealth-pagina begint nu met een formulier |
| 6 | **Het deelbeeld is het product**: poster 4:5 en linkkaart 1,91:1, met koraal de kern, merk, URL, bron; "Save image" eerst, daarna Share (op telefoon met bestand), Copy link | Platforms tonen afbeeldingen, links worden minder bekeken | Gezien: de kaartposts hierboven. Aanname: een merkplaatje op elke kaart levert bekendheid |
| 7 | **Embed + CSV-download** met bronlink | Het backlinkmechanisme uit CLAUDE.md (OmniCalculator) | Gezien: OWID doet dit onder elke grafiek |
| 8 | **Levenslijn bovenaan**: vijf stops, huidige in koraal, bezochte gevuld, met het cijfer van jouw land | Navigatie en voortgang in één; elke pagina is zichtbaar deel van een geheel | Aanname |
| 9 | **Volgende-vraag-kaarten met jouw-land-getal** (op mobiel een veegrij waarvan de tweede kaart half zichtbaar is) | Je ziet de helft van het antwoord, de rest zit achter de klik | Aanname |
| 10 | **Verzamelkaart "My European life line"** na drie stops | Een reden om de volgende pagina's te openen én iets om door te sturen | Aanname |
| 11 | **Profiel (land, leeftijd) blijft lokaal** (`localStorage`), elke volgende pagina is al ingevuld | CLAUDE.md eist dit; ieder formulier minder is een klik minder | Aanname; in de mock werkt het al |
| 12 | **Berekende zinnen onderaan de pagina** ("30 van 31 landen: vrouwen eerder weg dan mannen, gemiddeld 2,0 jaar") | Geen handgetypte getallen; elk cijfer volgt uit de data | In de mock berekend, zie hieronder |
| 13 | **Bronblok**: datasetcode, laatste update, "dit zijn landgemiddelden, geen mensen" | Zelfde eerlijkheid als de wealth-pagina; vertrouwen is wat EUDebtMap ook benadrukt | Gezien |
| 14 | **Advertentieplekken** onder het resultaat en na de tabel, met gereserveerde hoogte | CLAUDE.md: niet tussen invoer en antwoord, let op CLS | In de mock als grijze vlakken |

**Visuele taal.** Dezelfde tokens als `public/css/style.css` (inkt `#15231f`, papier, teal voor data, koraal voor "jij", Georgia voor koppen), geen tweede systeem. De kaart gebruikt één kleur in zes stappen, zonder rood-groen en met de getallen erbij (niet getoetst met een kleurenblindheidssimulatie). Een donker thema is in de mock als proef meegenomen; de live site heeft dat nu niet. Beweging alleen waar die iets betekent (de tijdlijn, de hover); `prefers-reduced-motion` wordt gerespecteerd. Een kleine set lijn-pictogrammen (deur, ringen, kind, zonsondergang, hart) als herkenbaar merkbeeld per levensfase, op kaarten en deelbeelden.

## 3. Het verhaal zit in de data (berekend in de mock, geen mening)

Dit zijn zinnen die de mock zelf uit de Eurostat-reeks rekent. Ze laten zien dat een pagina meer kan zijn dan een tabel met één jaar:

- In **30 van de 31 landen** gaan vrouwen eerder het huis uit dan mannen, gemiddeld **2,0 jaar**.
- ~~De EU-gemiddelde leeftijd is nauwelijks bewogen (**26,7 in 2005, 26,3 in 2025**), maar de afstand tussen het vroegste en het laatste land is gegroeid van **8,1 naar 10,2 jaar** (de 24 landen met data in beide jaren). Spanje, Griekenland, Kroatië en Slowakije schoven één jaar of meer op; zes landen gingen een jaar of meer eerder.~~

  > **Achterhaald, 20 oktober 2026.** Deze vergelijking stapt over een reeksbreuk
  > heen. Eurostat vlagt 2021 met `b` bij vrijwel elk land — de Labour Force Survey
  > is toen herzien — en het breukjaar is zelf een overgangsjaar (Portugal: 28,9 in
  > 2019, 33,3 in 2021, 30,1 in 2022). Binnen het eerste volledig vergelijkbare
  > venster, 2022–2025, is de conclusie omgekeerd: de EU staat vlak (26,4 naar 26,3)
  > maar de kloof **krimpt** van 12,1 naar 10,2 jaar, met elf landen die eerder gaan
  > en alleen Zweden en Noorwegen later. `trend()` in `src/lib/leaving-home.js`
  > weigert sindsdien te rekenen over een venster met een breuk erin. Zie de sectie
  > over reeksbreuken in `data/sources.md`.
- Sinds 16 april 2026 staat 2025 in de data: EU 26,3; Kroatië 31,5; Finland 21,3. Eurostat's eigen persbericht zit nog op 2024.

Zulke zinnen zijn de synthese die CLAUDE.md vraagt ("een berekening die nergens anders staat") en de reden dat een landpagina geen dun sjabloon is.

## 4. Meten: dezelfde vier eventnamen

Geen nieuwe namen nodig; de vaste namen uit `src/lib/analytics.js` dekken het ontwerp, met extra `props`:

| Actie in de mock | Event | Props |
|---|---|---|
| "Compare me" | `value_submitted` | `metric`, `country` |
| Save image / Share / Copy link / Embed | `result_shared` | `via`: `image`, `native`, `link`, `embed-opened`, `embed`; `kind`: persoonlijk, kaart, levenslijn |
| Klik op een levenslijnstop of volgende-vraag-kaart | `second_metric_opened` | `from`, `to` |
| Bronlink | `methodology_opened` | `from` |

In de mock staat rechtsonder een knopje "events" dat laat zien wat er per klik zou worden verstuurd. Plausible staat bewust uit tot er verkeer is; de wrapper doet niets zolang het script niet geladen is.

## 5. Wat de mock wel en niet is

**Echt:** de Eurostat-reeksen (`yth_demo_030`, `tps00014`, `tps00017`, `lfso_23pens03`, `hlth_hlye`), de kaartgeometrie (Natural Earth, publiek domein, 56 KB), kaart, lenzen, tijdlijn, ranglijst, zoeken, sorteren, het persoonlijke resultaat, de stippenstrook, het deelbeeld (SVG naar PNG in de browser, zonder dependencies), de gedeelde-linkparameters (`?c=IT&age=21`, `?sex=F&year=2010`), het lokale profiel, de voortgang, de verzamelkaart, licht en donker, mobiel (getest op 375 px).

**Nep of leeg:** de andere pagina's (een toast zegt "hier opent X"), de embed-URL, de advertentievlakken, de landpagina ("Open the Italy page").

**Niet getest:** Web Share met bestand op een echte telefoon, Safari, het kopiëren van een afbeelding naar het klembord, `<dialog>` in oude browsers, prestaties op een goedkope telefoon, hoe sociale platforms de poster uitsnijden.

**Bekende zwakke plekken:**
- *Lettertype in het deelbeeld.* Georgia staat op Windows en Mac maar naar mijn weten niet op Android; een Android-bezoeker krijgt een andere serif op de poster. Oplossing: een OFL-lettertype als base64 in de SVG, maar dat is een keuze voor jou (zie 6).
- *De kaart kent alleen Eurostat-landen.* UK stopt in 2019 en wordt gearceerd getoond met de laatste waarde; VS/Canada/Australië ontbreken. Een bezoeker daar kan zijn land niet kiezen.
- *Veel labels in het midden van Europa* zijn bij 1024 px krap; de chips voor kleine landen vangen een deel op. Een tegelkaart (elk land een even groot vierkant) is het alternatief voor mobiel.

## 6. Beslissingen voor jou

1. **Levenslijn als ordenend idee?** Mijn aanbeveling: ja. Het maakt van tien losse metrieken één verhaal en geeft de nav een functie. Alternatief: platte categorieën zoals nu.
2. **Echte kaart of tegelkaart voor mobiel?** Mijn aanbeveling: echte kaart plus chips (zoals de mock), tegelkaart alleen als blijkt dat mobiel te krap is.
3. **Deelbeeld alleen in de browser, of ook vooraf als PNG voor linkvoorbeelden?** Het eerste kost niets. Het tweede vraagt een dev-dependency (een renderer zoals resvg of sharp) en dat is jouw akkoord.
4. **Lettertype op de deelbeelden:** systeem-Georgia (verschilt per apparaat) of een ingesloten OFL-lettertype (maakt elk deelbeeld iets zwaarder)?
5. **Profiel lokaal bewaren** (land, leeftijd, welke stops je zag): akkoord? Het verlaat de browser nooit; de privacypagina moet het wel noemen.
6. **Raadspel nu al omzetten naar Europese metrieken** ("hoger of lager") als vierde lus? Aanbeveling: ja, maar pas na de eerste metriekpagina's; de code bestaat al.
7. **Scope:** alleen Eurostat/Europa, of OECD erbij voor UK/VS? Dat verandert welke pagina's in de eerste golf zitten (zie de shortlist).
8. **Baseline:** pagina's per sessie en terugkeerpercentage van EUDebtMap, voor het ijkpunt bij livegang.

## 7. Bouwvolgorde als je akkoord gaat (nog niets gebouwd)

1. **Gedeelde onderdelen** als Astro-componenten, zonder framework: kaart, lens + tijdlijn, ranglijst, jouw-beurt-strook, deelbeeld + embed, levenslijn, volgende-vraag. Eén Eurostat-lader die JSON-stat naar compacte JSON in de repo schrijft (zoals `scripts/` nu doet voor NHANES en de ECB). Kaartpaden eenmalig in de repo.
2. **Pagina 1** (uit huis), daarna de rest van de top 4 uit de shortlist: dezelfde onderdelen, andere data.
3. **Levenslijn-verzamelkaart en raadspel** zodra er drie metriekpagina's staan.
4. **OECD-pagina's** (pensioen, werkuren) als de scope-keuze dat vraagt.

De mock, het kaartscript, het databestand en de buildscripts staan in de sessienotities (`tools/mock/`), buiten de repo.
