# Ontwerpvoorstel v2: doorklikken, onthouden, doorsturen, in een nieuwe vormtaal

*22 oktober 2026, herzien (v1 was van 19 oktober; de nieuwe vormtaal is van 20 oktober). Vervolg op [metric-shortlist.md](metric-shortlist.md). Er is niets in de live site, in `public/css/style.css` of in een Astro-bestand veranderd. Er zijn twee zelfstandige bestanden, te openen met een dubbelklik, zonder server: de pagina-mock [mockups/leaving-home.html](mockups/leaving-home.html) (pagina 1, echte Eurostat-data) en de stijlgids [mockups/styleguide.html](mockups/styleguide.html) (tinten, tokens, typografie, componenten).*

**Wat er is veranderd.** Simeon vond de eerste mock te veel op de oude site lijken (inkt, papier, teal, koraal, Georgia, ruitjesachtergrond, afgeronde kaarten) en vroeg om een compleet nieuwe stijl die er echt uitziet als een site uit 2026/2027. De visuele laag is daarom van de grond af nieuw. De ideeën uit v1 die niet over stijl gaan staan nog: antwoord eerst, de levenslijn, jouw beurt onder de kaart, het deelbeeld is het product, de vier vaste events. **Gezien** = zelf bekeken of gemeten. **Aanname** = ontwerpkeuze waarvan het effect pas na livegang te meten valt.

## In het kort

1. **De richting in één zin:** een neutrale zwart-witte schil, één tint per metriek, een donker podium voor kaart en grafiek, en getallen op posterformaat in Bricolage Grotesque. Kleur is er alleen voor data. Elke stop op de levenslijn heeft een eigen tint (uit huis blauwviolet, trouwen roze, eerste kind oranje, pensioen groen, gezonde jaren cyaan) en alles wat bij die metriek hoort (kaart, groot getal, kaartjes, deelbeeld) leest die tint uit één variabele, `--h`. De vijf tinten samen zijn het merkbeeld: logo, levenslijn in de navigatie, streep onder elk deelbeeld.
2. **Het onderscheidende beeld is de stippengrafiek:** elk land een stip op een leeftijdsas, jouw land licht op, het EU-gemiddelde als stippellijn. Het eerste scherm geeft zo het antwoord (26,3), de spreiding (Finland 21,3 tot Kroatië 31,5, 2025) en jouw plek, zonder iets in te vullen.
3. **Waarom deze richting** (aanname, afgewogen tegen drie alternatieven):

| Richting | Waarom wel/niet |
|---|---|
| Donker-eerst SaaS met aurora (Linear, Raycast) | Actueel, maar overal; slecht voor lange tekst en voor advertenties later. Alleen overgenomen als podium |
| Warm papier + serif (Cursor, Felt) | Gezien dat dit in 2026 ook actueel is. Niet gekozen: het is in wezen de oude HumanAverage-stijl |
| Neo-brutalistische kleurvlakken | Onderscheidend, maar vermoeiend en tegen het "betrouwbare data"-signaal |
| **Gekozen: monochrome schil + tint per metriek** | Kleur betekent iets (welke metriek), schaalt naar nieuwe pagina's met één variabele, dezelfde beelden werken als deelkaart |

4. **Gemeten** (headless Chrome, gescript): 0 van 497 tekstelementen (desktop, licht en donker) en 0 van 510 (mobiel) onder WCAG-contrast na één correctie; CLS 0,0002 desktop en 0,0000 mobiel (meting over laden, scrollen en interacties); geen horizontale scroll bij 320, 360, 390, 1280 en 1920 px; 20 geautomatiseerde interactiecontroles slagen, waaronder PNG-export op 1080×1920, 1080×1350 en 1200×630; toetsenbordvolgorde logisch met focusring in de tint; `prefers-reduced-motion` laat alles direct zien; een gesimuleerde browser zonder `light-dark()` valt netjes terug op licht.
5. **Niet gemeten:** Safari en Firefox, een echte telefoon, schermlezer, Web Share met bestand, geforceerde-kleurenmodus (CSS staat erin, niet bekeken). Lettertypen in SVG naar PNG zijn alleen in Chrome getest; Safari is hier historisch het risico. De hele testreeks (interactie, contrast, CLS, overflow, schermafbeeldingen) is gedraaid op de definitieve bouw van 22 oktober.
6. **Beslissing van Simeon (20 okt., via de andere sessie): de nieuwe vormtaal komt alleen op het Engelse cluster; het Nederlandse blijft onaangeroerd.** Mijn voorstel voor de techniek staat in §5.

## 1. Onderzoek: hoe ziet 2026 eruit

**Gezien (20 okt.):** Raycast (bijna zwart, zwevende nav-pil van glas met haarlijnrand, pil-knop met gloed); Cursor (warm crème, pil-knoppen, serif-accent, schilderachtige hero); Our World in Data (marineblauw, serif-koppen: data-opzet goed, vormtaal klassiek); Awwwards en recent.design (vooral agency-showcases en illustratieposters, geen bruikbare look voor een datatool, dus niets uit overgenomen).
**Uit mijn aantekeningen van de eerste ronde (19-20 okt.):** Linear (pil-knoppen 9999px, kop 56px/510/-0,022em, inblurrende tekst), Vercel (pillen, kop 48px/400/-0,06em, mono-tagline), Stripe (gewicht rond 300), Felt (serif-kop, mono-coördinatenticker), The Pudding (mono-datums). Gemeenschappelijk: strak gespatieerde variabele grotesk met groot schaalcontrast, mono voor micro-labels, pil of heel scherpe radii, donker als gelijkwaardig thema, haarlijnen in plaats van schaduwen.
**Uit artikelen, niet zelf gemeten (aanname):** bento-rasters zijn volwassen; kinetische typografie en glassmorphism worden overbeloofd (spaarzaam); Spotify Wrapped 2025 als voorbeeld van een deelkaartensysteem; OKLCH-ramps met constante chroma; fluïde `clamp()`-typografie.

| Wat de mock gebruikt | Baseline-status (web-features, okt. 2026) | Terugval in de mock |
|---|---|---|
| `@layer`, `oklch()`, `color-mix()`, `<dialog>`, `:focus-visible` | widely available | niet nodig |
| `light-dark()` | newly sinds 13 mei 2024 (Chrome 123, Firefox 120, Safari 17.5); widely rond 13 nov. 2026 | lichte waarden als standaard, donker alleen via expliciete vlakken |
| `popover`, `backdrop-filter`, `text-wrap: balance`, View Transitions (zelfde document) | newly | levenslijnknop verborgen zonder popover; nav zonder blur; geen cirkelanimatie |
| `text-wrap: pretty`, `background-clip: text` ongeprefixt | limited (Firefox mist de ongeprefixte vorm) | gewone afbreking; geprefixt én ongeprefixt; effen kleur in geforceerde-kleurenmodus |

## 2. De vormtaal

**Kleur.** Alles in OKLCH, als paren per thema (`--bg-l`/`--bg-d`) gekoppeld met `light-dark()`. Schil licht/donker: achtergrond `#f9fafd` / `#050815`, oppervlak `#ffffff` / `#0e1322`, tekst `#121723` / `#f1f3f8` (contrast 17,2 / 18,0), tekst-2 `#4e5564` / `#a9b1c2` (7,2 / 9,3), meta 5,1 / 6,2. Podium `#0a1020`, in beide thema's gelijk, met binnenin automatisch donkere tokens. Knoppen zijn zwart op licht en wit op donker; tint zit nooit op knoppen, alleen op data.

| Stop | Tint (hue) | Datakleur licht / donker |
|---|---|---|
| Uit huis | 262 | `#1957d2` / `#9bbeff` |
| Trouwen | 350 | `#ae1173` / `#ff98ca` |
| Eerste kind | 50 | `#9c4700` / `#ffa571` |
| Pensioen | 145 | `#03791f` / `#81d584` |
| Gezonde jaren | 205 | `#06717a` / `#07d6e7` |

Alle datakleuren halen 4,5:1 als tekst op licht, donker en podium. Gradiëntcijfers (groot, dus 3:1 nodig) halen 3,8 tot 5,1 op licht en 10 tot 13 op donker. **Kaartschaal:** zes klassen, helderheid 0,34 tot 0,89, hue -6 tot +36 rond de tint, de labelkleur (wit of inkt) per klasse gekozen op contrast. Bij het controleren bleek klasse 3 voor groen en cyaan onder 4,5:1 uit te komen; de helderheid is daarom van 0,56 naar 0,54 gezet (berekend: wit-label 4,7 tot 5,6:1 voor alle vijf). De klassengrenzen zijn die van de echte pagina, `BANDS` in `src/lib/leaving-home.js`: 22, 24, 26, 28, 30 (mijn eerste mock gebruikte 21, 24, 27, 30, 33; die stonden niet in de repo en zijn op 22 okt. gelijkgetrokken).

**Typografie.** Bricolage Grotesque (koppen en getallen, weight 700-800, tracking -0,04 tot -0,07em), Geist (tekst en interface), Geist Mono (labels, codes, hoofdletters met +0,07em). Fluïde `clamp()`: h1 36 tot 70px, het grote getal 112 tot 232px. Alle drie SIL OFL 1.1, variabel, Latin-subset, samen 129 KB woff2: Bricolage (opsz+wght) 76.888 B, Geist 29.400 B, Geist Mono 23.128 B. Bron: fontsource-variable 5.3.x via jsDelivr (oorspronkelijk ateliertriay/bricolage en vercel/geist-font); de bestanden en licentieteksten staan in [mockups/fonts/](mockups/fonts/). SHA-256: Bricolage `a79fdb52…a99cd`, Geist `19f9c925…d54e1`, Geist Mono `684ad5b5…33c8cc`. Pijlen en vinkjes zijn inline SVG, niet uit het lettertype (de Latin-subset mist →).

**Vorm en beweging.** Grote radii (28 tot 36px) voor vlakken, pillen voor besturing, haarlijnen in plaats van schaduwen. Zwevende nav-pil met blur; popover voor de levenslijn; View Transition (cirkel uit de knop) voor het themawisselen. Beweging alleen waar die iets betekent: tellen van het hoofdgetal, vallende stippen, onthullen van secties, hoverlift. Alles uit onder `prefers-reduced-motion`.

**Deelbeelden.** Eén generator, drie formaten (verhaal 9:16, post 4:5, link 1,91:1), persoonlijk, van de kaart of de levenslijnkaart. Zelfde tokens als de pagina, lettertypen als data-URI ingesloten (anders valt SVG naar PNG terug op een systeemfont), spectrumstreep onderaan, URL en bron erop.

## 3. Paginaopbouw (herzien) en onderdelen

```
[ zwevende nav-pil: logo · levenslijn (5 segmenten, popover) · Metrics Play Method · thema ]
[ HERO       kop + reusachtig getal + zin | donker paneel: landkeuze + stippengrafiek + chips ]
[ PODIUM     lens + tijdlijn ▶ + Share this map | kaart (waarden op landen) | detail + ranglijst ]
[ JOUW BEURT invultekst "I live in __ and left home at __" → resultaat + stippengrafiek | deelbeeld + Share/Save/Copy link/Embed ]
[ advertentieplek, vaste hoogte, onder het resultaat ]
[ LEVENSLIJN vier kaarten in eigen tint met jouw-land-getal · voortgang · verzamelkaart na 3 stops ]
[ BENTO       vijf berekende feiten ]  [ TABEL ]  [ advertentieplek ]  [ METHODE: bron, maat, dekking, grenzen ]
[ voet met spectrum-woordmerk ]   plakkende "Next:"-pil na het invullen
```

| Onderdeel in de mock | Verwacht Astro-onderdeel (de andere sessie bouwt nu pagina 1) |
|---|---|
| hero met reusachtig getal | `.stat-row` / `.stat-block` in `leaving-home/index.astro` |
| paneel met stippengrafiek, landkeuze | nieuw: `DotPlot` (SVG), clientscript voor de keuze |
| podium, kaart, lens, ranglijst | `CountryMap.astro` met `.lens`, `.map-frame`, `.legend`, `.country-table` |
| invultekst + resultaat + deelbeeld | `.compare` / `.field` en `.result`, plus nieuw `ShareCard` |
| levenslijnkaarten, bento, methode | nieuw: `NextStops`, `Facts`; `.source-list` |

De kaartbanden `.band-0` t/m `.band-5` staan hardgecodeerd in `CountryMap.astro`; in de nieuwe taal volgen ze de tint van de pagina (zes CSS-variabelen per pagina, vooraf berekend), met dezelfde grenzen als `BANDS`.

**Het verhaal zit in de data (berekend in de mock, geen mening).**

- In **30 van de 31 landen** gaan vrouwen eerder het huis uit dan mannen, gemiddeld **2,0 jaar** (2025, één jaar, dus geen reeksbreuk).
- Sinds 16 april 2026 staat 2025 in de data: EU 26,3; Kroatië 31,5; Finland 21,3. Eurostat's eigen persbericht zit nog op 2024.
- **Terugtrekking uit v1 en de eerste mock-versie.** Ik rekende een trend van 2005 naar 2025 (EU 26,7 naar 26,3, kloof 8,1 naar 10,2 jaar, Griekenland +2,6). Die vergelijking stapt over een reeksbreuk heen: Eurostat vlagt 2021 met `b` bij vrijwel elk land (herziene Labour Force Survey), en het breukjaar is zelf een overgangsjaar. Volgens de berekening van de andere sessie (zie `data/sources.md`, sectie reeksbreuken) is binnen 2022-2025 de conclusie omgekeerd: de EU staat vlak (26,4 naar 26,3) en de kloof krimpt van 12,1 naar 10,2 jaar; `trend()` in `src/lib/leaving-home.js` weigert te rekenen over een venster met een breuk. De bento-feiten in de mock rekenen daarom nu vanaf 2022 (`comparableSince` uit `data/leaving-home/index.json`) en komen op dezelfde cijfers uit als de andere sessie: EU 26,4 naar 26,3; kloof 12,1 naar 10,2 jaar (31 landen met een waarde in beide jaren); grootste verschuiving Zweden +1,5 (21,6 naar 23,1). Controle: alle 777 waarnemingen in de mock (36 reeksen, 2000-2025) zijn gelijk aan `index.json`, 0 afwijkingen.
- **Gedaan in de mock (22 okt.):** de reeksbreuk is zichtbaar in plaats van weggemoffeld. Op de jaarschuif staat een amberkleurig streepje bij 2021, en voor elk jaar tot en met 2021 verschijnt een korte toelichting ("Compare countries within one year, not one year with another"). De trendlijntjes (zijpaneel en tabel) breken af bij elk breukjaar van het betreffende land, met een kerfje op de plek en een bijschrift; het breukjaar zelf telt in het zijpaneel als "series break year". Het methodeblok heeft een rij "Series breaks" (32 van 34 landen hebben in 2021 een breukvlag), en onder het bento- en tabelblok staat een korte voetnoot. Vergelijken van landen binnen één jaar blijft ongemoeid.

Zulke zinnen zijn de synthese die CLAUDE.md vraagt ("een berekening die nergens anders staat") en de reden dat een landpagina geen dun sjabloon is, mits ze de reeksbreuk respecteren.

**Meten: dezelfde vier eventnamen.** Ongewijzigd uit `src/lib/analytics.js`, met `props`: "Compare me" is `value_submitted` (`metric`, `country`); Save image, Share, Copy link en Embed zijn `result_shared` (`via`, `kind`); een levenslijnstop of volgende-vraag-kaart is `second_metric_opened` (`from`, `to`); de bronlink is `methodology_opened`. De knop "events" rechtsonder in de mock toont wat per klik zou gaan. Plausible staat bewust uit.

## 4. Wat de mock wel en niet is

**Echt:** Eurostat-reeksen (`yth_demo_030`, `tps00014`, `tps00017`, `lfso_23pens03`, `hlth_hlye`), kaartgeometrie uit `data/geo/europe.json`, kaart, lenzen, tijdlijn, ranglijst, resultaat, deelbeelden en export, profiel in `localStorage`, voortgang, licht en donker. **Nep of leeg:** andere pagina's (een toast), embed-URL, advertentievlakken, landpagina's.
**Terminologie (gecorrigeerd 22 okt.):** de echte pagina zegt terecht dat dit geen gemiddelde is maar een middelpunt (de leeftijd waarop de helft niet meer thuis woont, zie `src/lib/leaving-home.js`). Mijn eerste mock sprak van "average"; de mock, de stijlgids en deze brief volgen nu de pagina ("Half of young Europeans have left home by age 26.3", "before the midpoint in 29 of 31 countries"). In de bouw komt elke tekst met een getal uit die bibliotheek, niet uit de mock. **Toegankelijkheid:** de mock maakt elk land focusbaar (34 tabstops); de pagina kiest bewust anders (paden niet focusbaar, chips als knoppen, tabel als alternatief). Die keuze blijft staan.
**Bekende zwakke plekken:** de kaart is op een telefoon klein omdat de viewBox heel Europa plus context toont (een bijgesneden uitsnede voor mobiel is niet gedaan); bij botsende labels gaan de kleinste naar de chips (automatisch); UK stopt in 2019 en is gearceerd; de breukjaren komen uit `data/leaving-home/index.json` en horen bij de totaalreeks, de lenzen Men en Women gebruiken dezelfde jaren (niet apart gecontroleerd); de plakkende "Next:"-pil botst met anker-advertenties; lettertypen in de PNG zijn alleen in Chrome getest; fallback-metrics tegen layoutverschuiving bij het laden van de lettertypen zijn niet gemeten; het getal in de h1 telt in de mock op vanaf 0 (in productie moet de HTML de eindwaarde bevatten, de teller is alleen een versiering). **Gewicht:** CSS 46,7 KB (10,6 KB gzip), JS 63,5 KB (20,6 KB gzip, inclusief mock-code), geometrie 55,9 KB (18,4 gzip), data 36,7 KB (8,1 gzip), lettertypen 129 KB.

## 5. Beslissingen voor jou, en hoe het in de repo past

1. **Richting goedkeuren?** Aanbeveling: ja (tabel in "In het kort"). Alternatief: kleurloze schil zonder tint per metriek.
2. **Hoe in de repo. Besloten 22 okt.: optie B.** De uitwerking staat in [build-plan-v2.md](build-plan-v2.md). Het ligt vast dat het alleen het Engelse cluster raakt. Feiten van de andere sessie: 29 NL-pagina's in `public/` zijn allemaal `lang="nl"`, 12 Astro-pagina's lopen via `Base.astro` met `lang="en"`; `style.css` heeft 121 `var(--…)`-gebruiken tegenover 67 hardgecodeerde kleuren buiten `:root`. **A:** tokens herdefiniëren onder `html[lang="en"]` en de 67 kleuren tokeniseren met identieke standaardwaarde. Goedkoop, NL blijft bewijsbaar gelijk (daarna wel een paar NL-pagina's bekijken via `npm run build` en `npm run preview`), maar het herkleurt alleen bestaande componenten; podium, paneel, bento, invultekst en typografie zijn nieuwe componenten, dus het wordt een mengvorm. **B (mijn aanbeveling):** één nieuw stylesheet dat `Base.astro` alleen laadt voor pagina's die erom vragen (een prop), nieuwe pagina's eerst, de andere Engelse pagina's blijven tot ze zijn omgezet op `style.css`, NL raakt het nooit. Geen tokenjongleren, omkeerbaar. Dan wijkt het bewust af van de CLAUDE.md-regel "geen tweede designsysteem"; die regel moet jij of de bouwsessie bijwerken, ik pas CLAUDE.md niet aan.
3. **Lettertypen:** drie OFL-bestanden zelf hosten (129 KB, `font-display: swap`, kop- en tekstfont preloaden), met licentietekst in de repo? Het zijn geen npm-dependency's, wel nieuwe bestanden van derden.
4. **Levenslijn als ordenend idee en vaste tint per stop:** aanbeveling ja. De geld-categorie van fase 5 heeft een eigen tintenreeks nodig; die kies ik pas als het zover is.
5. **Voorbeeldafbeelding (OG) per pagina:** kan niet zonder PNG-renderer (resvg of sharp als dev-dependency, of headless Chrome tijdens de build). Jouw akkoord nodig. Een persoonlijke OG per bezoeker kan niet zonder server.
6. **Plakkende "Next:"-pil versus advertenties:** bij AdSense moeten anker- en vignetformaten uit, of de pil vervalt op mobiel. Beslissen vóór fase 6.
7. **Reeksbreuk zichtbaar in tijdlijn en trendlijntjes** (gedaan in de mock, zie §3): aanbeveling is dit over te nemen vóór de echte pagina live gaat, met de breukjaren per land uit `index.json` ook voor de lijntjes.
8. **Profiel lokaal bewaren, echte kaart plus chips of tegelkaart voor mobiel, raadspel omzetten, OECD-scope, baseline van EUDebtMap:** ongewijzigd uit v1.

## 6. Bouwvolgorde als je akkoord gaat (nog niets gebouwd)

1. Besluit 1 tot 3. 2. Tokens en basiscomponenten als het nieuwe stylesheet (de `style.css` en `app.js` in de sessienotities, map `tools/design-v2/`, zijn het uitgangspunt), lettertypen naar `public/fonts/` met licentie. 3. Pagina 1 omzetten naar de nieuwe taal, inclusief de reeksbreuk in de tijdlijn; daarna de rest van de top 4 uit de shortlist. 4. Controleren zoals hier (contrast, CLS, toetsenbord, mobiel) plus Safari en Firefox. 5. Levenslijnkaart en raadspel zodra er drie metriekpagina's staan.

De bronnen (`style.css`, `app.js`, sjablonen, buildscript) en het testgereedschap (headless-Chrome-scripts voor schermafbeeldingen, interactie, contrast, CLS) staan in de sessienotities onder `tools/design-v2/`, buiten de repo.
