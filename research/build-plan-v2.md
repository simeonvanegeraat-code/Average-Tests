# Bouwplan v2: de nieuwe vormtaal op het Engelse cluster (optie B)

*22 oktober 2026. Hoort bij [design-brief.md](design-brief.md) (het ontwerp en de redenen) en gaat over de bouw. **Er is niets gebouwd en er is niets in de repo veranderd behalve de twee markdownbestanden in `research/`.** Besloten door Simeon: de richting is goed, optie B (apart stylesheet, per pagina opt-in), alleen het Engelse cluster, het Nederlandse cluster en `:root` in `public/css/style.css` blijven onaangeroerd. Dit plan is gebaseerd op wat ik op 22 oktober in de repo las, niet op de mock.*

## 0. Drie dingen die ik van je bevestigd wil hebben, de rest kan doorlopen

1. **Opt-in via een eigen layout in plaats van een prop.** Optie B zegt "een prop op `Base.astro`". Beter is `src/layouts/BaseV2.astro`: een pagina kiest zijn layout in de eerste importregel. `Base.astro` blijft dan *byte-identiek*, en dat is mechanisch te bewijzen (stap 1). Kosten: de ±25 regels `<head>` (title, description, canonical, OG, robots) staan tijdelijk twee keer, tot de laatste pagina is omgezet en `Base.astro` verdwijnt. Een refactor van `Base.astro` zelf (gedeelde head) doe ik niet: dat is een ongevraagde wijziging aan een bestand dat elke Engelse pagina raakt.
2. **De CSS als statisch bestand: `public/css/ha.css`, niet via `src/`.** Astro bundelt CSS uit `src/` met Vite en esbuild. Die kunnen moderne CSS (`light-dark()`, `@layer`) herschrijven voor oudere browsers; of ze dat hier doen heb ik niet getest. Een statisch bestand komt precies zo in de browser als ik het getest heb, en is hetzelfde patroon als `/css/style.css`. Het raakt `public/` (de map van het bevroren cluster) alleen met *nieuwe* bestanden: `css/ha.css` en `fonts/`. Er verandert geen Nederlands bestand.
3. **Drie lettertypen zelf hosten**, 129 KB woff2, SIL OFL 1.1: Bricolage Grotesque, Geist, Geist Mono. Het zijn geen npm-dependency's maar wel nieuwe bestanden van derden, dus jouw akkoord (CLAUDE.md: geen nieuwe dependency zonder te vragen). De bestanden en licenties staan klaar in `research/mockups/fonts/`.

Later spelen nog vier beslissingen, geen daarvan blokkeert stap 1 tot 4: embed versus `X-Frame-Options: DENY` (stap 8), OG-afbeeldingen (stap 9), de plakkende "Next:"-pil versus anker-advertenties (stap 10) en of de datapijplijn man/vrouw-reeksen krijgt (stap 6).

## 1. Wat er in de repo staat, en wat dat betekent voor de bouw

| Gelezen | Gevolg |
|---|---|
| Astro 5.14, `output: 'static'`, alleen `astro` als dependency | Geen buildtools, geen Tailwind. Alles wat ik voorstel is CSS, vanilla JS en Astro-onderdelen |
| `Base.astro` linkt `/css/style.css`, laadt `/js/main.js` (menuknop, jaartal) en bevat header en footer | De v2-schil (zwevende nav-pil, footer met woordmerk) hoort in `BaseV2.astro`; `main.js` laadt v2 niet |
| `style.css` is 1.472 regels en levert `.page-hero`, `.container`, `.section`, `.callout`, `.content`, `.data-table` enz. | Pagina 1 en zijn onderdelen leunen daarop. Bij de overstap moet `ha.css` elk daarvan vervangen, en de scoped `<style>`-blokken in `index.astro`, `CountryMap.astro` en `CountryTable.astro` (oude tokens `--paper`, `--ink-soft`, `--canvas`) moeten weg |
| `vercel.json`: geen CSP; wel `X-Frame-Options: DENY` op alles | Data-URI's en eigen fonts mogen zonder aanpassing. Een embed (iframe) mag nu niet; daarvoor is een wijziging nodig in een bestand dat "blijft zoals het is" |
| `CountryMap.astro`: SVG op de server getekend, `data-*` per land, chips voor kleine landen, lens in een klein clientscript, klassen `.band-0` t/m `.band-5` | Blijft de bron. Alleen kleuren en vorm veranderen. De grenzen (22, 24, 26, 28, 30) staan in `BANDS` én in het clientscript en blijven gelijk |
| `src/lib/leaving-home.js` rekent elke zin en elk getal uit (`headline`, `comparison`, `genderGap`, `trend`, `age`, `years`, `withArticle`), en legt vast dat dit een middelpunt is, geen gemiddelde | Elke tekst met een getal in v2 komt uit deze bibliotheek. De mock is alleen een visuele referentie |
| `data/leaving-home/index.json`: per land de totaalreeks plus `breaks`, laatste jaar voor mannen en vrouwen; `comparableSince` is 2022 | Trendlijntjes kunnen met breuken (totaalreeks). Een tijdlijn of trendlijn *per sekse* kan niet zonder de pijplijn uit te breiden |
| Privacypagina: het profiel staat "under a single key" in localStorage | Thema en verkende stops komen in diezelfde key (`humanaverage:profile`), en de privacytekst moet daarbij worden bijgewerkt |
| `analytics.js`: vier vaste eventnamen, `track()` doet niets zonder Plausible | Ongewijzigd; de nieuwe acties gebruiken dezelfde namen met `props` |

## 2. Waar de mock afwijkt van de echte pagina (eerst rechtzetten, niet overnemen)

| # | Mock | Echte pagina | Besluit voor de bouw |
|---|---|---|---|
| 1 | Sprak van "average" | Middelpunt: de leeftijd waarop de helft niet meer thuis woont | Pagina wint. Mock en brief zijn op 22 okt. aangepast |
| 2 | Klassen 21/24/27/30/33 | `BANDS`: 22/24/26/28/30 | Pagina wint, mock aangepast |
| 3 | 34 focusbare landen | Paden niet focusbaar, chips als knoppen, tabel als alternatief (bewuste keuze, gedocumenteerd in `CountryMap.astro`) | Pagina wint |
| 4 | Labels op de kaart op px-grootte met botsingscontrole, ook op telefoon | Labels uit onder 560 px, chips en tabel dragen het | Voorstel: serverlabels blijven (zonder JS leesbaar); op een telefoon alleen de grootste landen labelen, de rest als chip. Beslissen bij stap 4 |
| 5 | Mock rekent alles zelf in de browser uit zijn eigen JSON | Alles op de server uit `index.json` via de bibliotheek, de client hergebruikt `comparison()` | Pagina wint: één definitie. De mock-JS (stippenlayout, kaartgenerator) wordt overgenomen als *tekenwerk*, nooit als rekenwerk |
| 6 | Jaarschuif en man/vrouw-trendlijnen | Alleen totaalreeks en lens voor het laatste jaar | Zie stap 6 |
| 7 | `ha-profile`, `ha-visited`, `ha-theme` als aparte keys | Eén key `humanaverage:profile` | Eén key; privacytekst bijwerken |
| 8 | `data-reveal` onzichtbaar zonder JS (bug, op 22 okt. in de mock gerepareerd met een `js`-klasse) | n.v.t. | Zo overnemen: alleen verbergen als JS draait |
| 9 | Grote getal telt op vanaf 0 en wordt door JS gevuld | Eindwaarde staat in de HTML | De HTML bevat altijd de eindwaarde; de teller is versiering |
| 10 | Embed via iframe | `X-Frame-Options: DENY` | Stap 8 |

## 3. De architectuur van optie B

**Nieuwe bestanden (stap 1), geen enkel bestaand bestand wijzigt:**

| Bestand | Inhoud |
|---|---|
| `public/css/ha.css` | De stijlgids-CSS: lagen `reset, tokens, base, components, sections, motion`, tokens als licht/donker-paren met `light-dark()` en terugval, `.hued` voor de tint per element. Zonder de mock-only onderdelen (mockbar, eventlog) |
| `public/fonts/*.woff2` + `OFL-*.txt` | Drie lettertypen met licenties. `font-display: swap`, de kop- en tekstfont geladen met `<link rel="preload">` (±106 KB), de monofont vanzelf |
| `public/favicon-ha.svg` | Het spectrumpilletje. `/favicon.svg` is gedeeld met het Nederlandse cluster en blijft staan |
| `src/layouts/BaseV2.astro` | Zelfde props als `Base` (`title`, `description`, `canonical`, `noindex`) plus `hue` (standaard 262) en optioneel `ogImage`. Schil: zwevende nav-pil (merk, links, thema, menu-popover voor telefoon), footer met woordmerk, `id="content"` op `<main>` en de skip-link zoals nu. Zet `lang="en"`, `theme-color` per schema, `og:image` alleen als die er is |
| `src/lib/hue.js` | `oklchHex` en `rampFor(h)` uit de mock: berekent de zes kaartkleuren per tint op de server, zodat `BaseV2` `--h` en `--r0` t/m `--r5` als `style` op `<html>` zet en de kaart geen clientcode nodig heeft voor kleur |
| Inline `<head>`-script | Zet `class="js"` en het thema uit localStorage vóór de eerste verf, zodat er geen flits is |

**Wat niet verandert, en hoe dat blijkt:** `src/layouts/Base.astro`, `public/css/style.css`, `public/js/main.js`, alles onder `public/nl`, `public/tools`, `public/articles` en alle andere Engelse pagina's (de elf andere paginabestanden, inclusief `height/[slug]` en `wealth/[country]`). Controle in stap 1: een `npm run build` vóór en na, daarna `diff -rq dist dist-voor`; het enige verschil mag `css/ha.css`, `fonts/` en `favicon-ha.svg` zijn.

**Tint per pagina.** `leaving-home` geeft `hue={262}`; de volgende stops 350, 50, 145 en 205. Alles wat de metriek draagt (kaartklassen, grote getal, kaartjes, deelbeeld) leest die ene waarde. Voor het deelbeeld, dat geen CSS-variabelen heeft, geeft `hue.js` dezelfde hexwaarden.

**Lettertypen in het deelbeeld.** De mock leest ze uit de `@font-face`-tekst van de pagina. In productie verwijst de CSS naar `/fonts/…`; bij een klik op "Save image" haalt de pagina de drie bestanden één keer op, zet ze om naar base64 en sluit ze in de SVG in. Dat is nog niet getest in Safari.

## 4. De bouwstappen

Grootte: **S** is een sessie of minder, **M** een paar, **L** meerdere. Commitberichten volgen de stijl van de repo (Engels, gebiedende wijs, één onderwerp per commit).

### Stap 1. Fundering, nieuwe bestanden (S)

- **Doen:** `ha.css`, de lettertypen met licenties, `favicon-ha.svg`, `hue.js`, `BaseV2.astro`. Nog geen pagina gebruikt het.
- **Klaar als:** `npm run build` slaagt; `diff -rq` toont alleen de nieuwe bestanden; `git diff --stat` toont geen enkel bestaand bestand; een wegwerppagina op `BaseV2` (niet gecommit) rendert op 1280 en 390 px zonder consolefouten.
- **Commits:** `Add self-hosted fonts for the new design language` · `Add the v2 stylesheet` · `Add the BaseV2 layout and the hue ramp`.
- **Status 22 okt.: gedaan en gecommit (`a0b1fc9`, `5ed33c5`, `bd2fda2`).** Nieuwe bestanden: `public/css/ha.css` (51 KB), `public/fonts/` (drie woff2 met hun OFL-teksten, 129 KB), `public/favicon-ha.svg`, `src/lib/hue.js`, `src/layouts/BaseV2.astro`. Bewijs dat er niets anders veranderde: `npm run build` geeft nog steeds 48 pagina's en 76 sitemap-URL's, `diff -rq` tegen de baseline toont alleen `css/ha.css`, `favicon-ha.svg` en `fonts/`, en `git diff` toont geen enkel gevolgd bestand buiten `research/`. Een wegwerppagina op `BaseV2` (inmiddels verwijderd) haalde alle controles: lettertypen laden, `ha.css` is actief, de eindwaarde staat in de HTML, de themaknop wisselt en bewaart de keus in de ene sleutel `humanaverage:profile` zonder land en leeftijd te overschrijven, alles onthult bij scrollen, de schil heeft vijf navigatielinks, skip-link en footer, op 390 px opent het menu als popover zonder horizontale scroll, geen consolefouten. Gesimuleerd zonder `light-dark()` en zonder popover valt het netjes terug (donker via `data-theme`, links lopen door in de nav). De terugvalfonts zijn gemeten (Bricolage 96,68%, Geist 102,01% en 99,36%, Geist Mono 99,98% `size-adjust`): met de lettertypen 1,5 seconde te laat is de CLS 0,0001 tot 0,0002, zonder die terugvallen 0,0020 tot 0,0021.
- **Gevonden en gerepareerd tijdens de controle:** het woordmerk in de footer liep buiten beeld (opsz-afhankelijke breedte; nu vaste `opsz` 96 en een maximum van 12rem); de nav-pil werd grijs boven het donkere podium (nu `data-dark` via een kleine scrollcontrole in `BaseV2`).
- **Keuzes die ik onderweg maakte en die je kunt omgooien:** het merk linkt naar `/` (de Engelse homepage bestaat, `Base.astro` linkt nog naar `/height/`); `hue` staat standaard op 262; de levenslijnknop ontbreekt tot er pagina's zijn (stap 10); `ha.css` bevat de paginasecties uit de mock (hero, podium, invultekst, bento, tabel, methode) als uitgangspunt, de klassenamen worden in stap 4 met de Astro-opmaak gelijkgetrokken.
- **Niet getest:** Safari, Firefox, een echte telefoon; en niet onderzocht of Vite de CSS zou herschrijven (daarom een statisch bestand).

### Stap 2. Bouwstenen, nieuwe Astro-onderdelen (M)

Zonder framework, elk met de tekst uit de bibliotheek. `StatHero` (reusachtig getal, lead, de hero-noot over middelpunt versus gemiddelde), `DotPlot` (stippengrafiek: de stapeling op de server uitgerekend, de labels als echte tekst zodat ze op elke breedte leesbaar zijn, de gekozen land gemarkeerd door een klein clientscript), `CompareForm` (de invultekst, dezelfde `data-compare-*` haken als nu), `ResultPanel`, `FactsBento`, `MethodBlock` (bron, maat, dekking, reeksbreuken, grenzen: de zichtbare methodologiesectie van CLAUDE.md). De bestaande `CountryMap` en `CountryTable` krijgen in stap 4 de nieuwe vorm op dezelfde plek; zij hebben maar één gebruiker.
- **Klaar als:** elk onderdeel rendert in een wegwerppagina met de echte `index.json`; geen enkel getal staat met de hand in een onderdeel (zoekopdracht op cijfers in de `.astro`-bestanden); contrast en toetsenbord gecontroleerd met de scripts uit de sessienotities.
- **Status 22 okt.: gedaan en gecommit (`7c3934a`, `0fe4fc6`, `263a2ea`).** Stap 2: `StatHero`, `DotPlot`, `CompareForm`, `ResultPanel`, `FactsBento` en `MethodBlock` in `src/components/`, plus `src/lib/dotplot.js` (indeling van de grafiek, getest op overlap bij 252 px), `src/lib/leaving-home-copy.js` (de zinnen, `clientData()` en `euChange()`) en `src/lib/parts.js` (zinsdelen zonder `innerHTML` in een element zetten); in `public/css/ha.css` is de SVG-grafiek van de mock vervangen door de HTML-versie (`.dp`). Bestaande bestanden zijn niet gewijzigd, behalve `ha.css`; `dist` verschilt nog steeds alleen in de stap-1-bestanden van de baseline (48 pagina's, 76 sitemap-URL's).
- **Controle op een wegwerppagina (verwijderd):** 16 gescripte controles slagen: de HTML bevat de eindwaarde, 31 stippen en de kop zonder JavaScript; de landkiezer in de kop, de stippen en het formulier lopen gelijk (ook bij een klik op een stip); ongeldige invoer geeft een foutmelding; het resultaat toont de zinnen uit de bibliotheek (bijvoorbeeld "before the midpoint in 29 of 31 countries"), de leeftijdsmarkering (ook buiten de as, en halve jaren) en het landlabel; de vijf feiten en de methode kloppen met `trend()` en `genderGap()` (EU 26,4 naar 26,3, kloof 12,1 naar 10,2, Bulgarije −2,1, Noord-Macedonië 6,0; 32 van 34 landen met een breuk in 2021). Contrast: 0 van 106 tekstelementen (licht en donker) en 0 van 101 (mobiel) onder AA; CLS 0,0000; geen horizontale scroll op 320 en 390 px; kopvolgorde H1, H2, H3; tabvolgorde logisch met een focusring van 2 px; het formulier werkt volledig met het toetsenbord (typen, Enter); zonder JavaScript blijft alles zichtbaar. Zoekopdracht naar cijfers in de zichtbare tekst van de componenten: geen treffers.
- **Het contract tussen de onderdelen** (gebeurtenissen op `document`, geen gedeelde staat): `ha:country` `{ code }` (kiezer, formulier en grafiek lopen gelijk), `ha:age` `{ age }` (live markering terwijl je typt), `ha:submit` `{ code, age }` (verstuurd met geldige invoer; `ResultPanel` toont het resultaat). De pagina rendert eenmalig `<script type="application/json" id="leaving-home-data">` met `clientData(index)`; dat bevat nu ook het Europese cijfer (`eu`), wat de huidige pagina nog niet meegeeft.
- **Afwijkingen van het plan, en dingen voor stap 4:** (1) de grafiek is HTML/CSS met plaats in procenten en vaste pixelgroottes, geen SVG: labels blijven echte tekst en op elke breedte leesbaar. (2) `CompareForm` zet de landen op alfabet; de huidige pagina sorteert ze op uitkomst, wat zoeken bemoeilijkt. (3) `ResultPanel` is een `div` met `role="status"`, geen `<output>`: een `<output>` mag alleen lopende tekst bevatten. (4) De zin onder het resultaat ("In the Netherlands, half had left by 23.4: you were 1.4 years before that point.") is door mij geformuleerd, de kopzin is die van de pagina met "You left home at …" ervoor; de eigenaar van de tekst van de pagina moet dit goedkeuren. (5) Nieuwe tekst is Amerikaans-Engels ("labeled", "reorganized") waar de pagina "labelled" en "reorganised" had. (6) De vierde feitentegel toont de grootste verschuiving in welke richting dan ook (nu Bulgarije, −2,1), niet de grootste stijger. (7) **Valkuil bij de overstap:** `writeProfile({ country, age })` in de huidige pagina overschrijft het hele profiel en wist daarmee de themakeuze uit `BaseV2`; het moet samenvoegen, net als `saveTheme()`. (8) De pagina moet het profiel bij laden terugzetten door `ha:country` en `ha:submit` te sturen nadat de componentscripts geladen zijn, en `value_submitted` en de bewaarstap aan `ha:submit` hangen. **Aangescherpt bij de voorbereiding van stap 4:** het terugzetten stuurt die gebeurtenissen met `source: 'restore'`, en het bewaren en meten negeren die bron. Anders telt elk bezoek van een terugkerende bezoeker als een ingevulde waarde (zie `research/migration-leaving-home-v2.md` §3).

### Stap 3. Controlepoort inrichten (S)

De headless-Chrome-scripts (schermafbeeldingen, interactie, contrast, CLS, overflow) wijzen nu naar mijn mock. Ze krijgen de URL's van `npm run preview` (poort 4321). Doel: elke volgende stap heeft dezelfde objectieve poort. Drempels: 0 tekstelementen onder WCAG AA, CLS onder 0,05 (de mock haalt 0,0002), geen horizontale scroll bij 320, 360, 390 en 1280, 20 interactiecontroles slagen.

### Stap 4. Pagina 1 overzetten (L)

- **Doen:** `src/pages/leaving-home/index.astro` gaat naar `BaseV2`; hero, kaart (`CountryMap` in de nieuwe vorm: stage, tint, legenda als balk met grenzen uit `BANDS`), invultekst, tabel (`CountryTable` met trendlijntjes die bij een breuk afbreken, uit `index.json`), feiten, methode. De scoped `<style>`-blokken verdwijnen. Het clientscript (`comparison()`, `humanaverage:profile`, de twee events) blijft inhoudelijk gelijk.
- **Raakt het werk van de andere sessie:** zij bouwt en onderhoudt deze pagina. Voorstel: pas beginnen als zij bevestigt dat ze `index.astro`, `CountryMap.astro` en `CountryTable.astro` niet tegelijk wijzigt, en per onderwerp committen met alleen eigen bestanden.
- **Klaar als:** de poort uit stap 3 slaagt; `npm run leaving:validate` slaagt; `view-source` bevat de eindwaarden (geen JS nodig voor het antwoord); de zichtbare methodologiesectie en de uitleg waarom er geen percentiel is staan er nog; de privacytekst noemt wat er in de key staat.
- **Commits:** `Move the leaving-home page to the v2 layout` · `Restyle the country map and table for the new design language` · `Show series breaks in the trend lines`.
- **Status 22 okt.: voorbereid en gecommit (`f93a218`, `976cb11`, `70086a3`), de pagina zelf is niet aangeraakt.** Voor stap 4 zijn er alleen nieuwe bestanden bijgekomen, naast de oude: `StageMap.astro` en `RankTable.astro` (in plaats van `CountryMap` en `CountryTable` op dezelfde plek te herschrijven, zodat er niets van de andere sessie verandert voordat zij akkoord is), de bibliotheken `leaving-home-map.js`, `sparkline.js` en `profile.js`, en een blok onderaan `ha.css`. Het migratieblad `research/migration-leaving-home-v2.md` beschrijft de doelopbouw van de pagina, de bedrading (samenvoegen in plaats van vervangen, terugzetten zonder te meten), wat verdwijnt, vijf besluiten die niet van mij zijn en wat gecontroleerd is: 66 gescripte controles in Chrome, 39 eenheidstests, nul tekstelementen onder AA, CLS 0,0000, geen verspringing van het paneel bij 105 toestanden, en een `dist` die alleen de uitvoer van stap 1 toevoegt. **Niet getest:** Safari, Firefox, een echte telefoon, een schermlezer, en de pagina zelf.
- **Afwijking van het plan:** de kaart en de tabel krijgen de nieuwe vorm als nieuwe onderdelen, niet door de oude te herschrijven. Bij de overstap verdwijnen de oude (één gebruiker). De labels op de kaart volgen het voorstel uit §2 rij 4: serverlabels blijven, per kaartbreedte kiest de stylesheet welke landen er een krijgen (op een telefoon de zeven grootste), de kleinste landen staan als knop.

### Stap 5. Het deelbeeld en de events (M)

Generator uit de mock (SVG naar PNG, drie formaten), lettertypen opgehaald bij de klik, Web Share met bestand, "Copy link" met `?c=` en `?age=`. Events: `result_shared` met `via` en `format`; geen nieuwe namen. De gedeelde link is dezelfde pagina met een querystring, dus de canonical blijft `/leaving-home/` en er is geen aparte pagina die `noindex` nodig heeft.
- **Klaar als:** PNG's op 1080×1920, 1080×1350 en 1200×630; getest in Chrome, Firefox en Safari (de mock is alleen in Chrome getest); alle tekst op de kaart komt uit de bibliotheek ("Half of young Europeans have left home by …", "before the midpoint in 29 of 31 countries").

### Stap 6. Reeksbreuk, en de vraag over man en vrouw (S, plus een keuze)

Met de totaalreeks werkt alles uit stap 4. De jaarschuif en de lens-per-jaar uit de mock vragen man/vrouw-reeksen die `index.json` niet heeft (alleen het laatste jaar). Keuze: **a)** de datapijplijn uitbreiden (`build-leaving-home.mjs` en de validatie, en `data/sources.md` bijwerken), of **b)** de jaarschuif weglaten en alleen de totaalreeks tonen. Aanbeveling b voor de eerste versie: het ontwerp verliest er weinig aan, en de breuk (32 van 34 landen in 2021) maakt een jaarschuif over 2000 tot 2025 sowieso een onbetrouwbaar speeltje.

### Stap 7. Browsers die ik niet kon testen (S)

Safari (macOS en iOS) en Firefox, plus een echte telefoon: `light-dark()`, popover, `backdrop-filter`, het ingesloten lettertype in de PNG, de terugvallen. Wat ik niet kan testen zeg ik, ik meld het niet als gedaan.

### Stap 8. Embed (S, na een besluit)

De mock biedt een iframe-code aan, maar `vercel.json` verbiedt framing op elke pagina. Opties: **a)** voor `/embed/…` alleen een `Content-Security-Policy: frame-ancestors *` toevoegen (volgens de specificatie gaat die boven `X-Frame-Options`; nog te testen in echte browsers; het staat in `vercel.json`, dus jouw akkoord), **b)** embedden als afbeelding met bronlink (geen framing nodig, maar een vooraf gemaakte PNG per weergave), **c)** embed schrappen. Aanbeveling a, op een eigen pagina met alleen kaart, legenda en bronregel. Dit is het backlinkmechanisme uit CLAUDE.md, dus niet vergeten, maar ook niet blokkerend.

### Stap 9. OG-afbeeldingen (S, na een besluit)

`Base.astro` heeft nu geen `og:image`. Zonder dependency kan het met de generator uit stap 5 en mijn headless-Chrome-script: per pagina één PNG offline maken en als statisch bestand committen. Dat past bij "Node, zonder dependencies" en vraagt alleen een lokaal geïnstalleerde Chrome bij degene die ze maakt. Alternatief is een renderer als dev-dependency (resvg of sharp), dat is jouw akkoord. Een persoonlijke OG per bezoeker kan niet zonder server.

### Stap 10. Levenslijn, volgende vragen en verzamelkaart (M, pas als er pagina's zijn)

De levenslijn heeft vijf stops, maar alleen "Leave home" bestaat. Zolang de volgende pagina's ontbreken blijft de levenslijnknop weg en bevat de nav alleen de bestaande pagina's. Vanaf drie metriekpagina's: de popover, de volgende-vraag-kaarten, de verzamelkaart en de plakkende pil. **Eerst beslissen:** de pil botst met anker-advertenties van AdSense (fase 6). Aanbeveling: de pil alleen op pagina's zonder anker-advertenties, of anker uitzetten.

### Stap 11. De overige Engelse pagina's en opruimen (L)

Eén pagina per commit naar `BaseV2` (home, wealth, play, height, weight, about, contact, privacy, method), elk met dezelfde poort. Als de laatste is omgezet: `Base.astro` en de Engelse onderdelen van `style.css` verwijderen (alleen wat het Nederlandse cluster niet gebruikt; `style.css` zelf blijft voor NL), en CLAUDE.md laten bijwerken (zie §6). Tot dan leven twee systemen naast elkaar, bewust.

## 5. Volgorde en samenwerking

Stap 1 en 3 hangen nergens van af en maken alleen nieuwe bestanden; die kan ik meteen doen. Stap 2 is ook nieuw werk. Stap 4 raakt bestanden van de andere sessie (zie boven). Stap 5 kan pas als stap 4 staat. Stap 6 tot 10 zijn onafhankelijk van elkaar, op de genoemde besluiten na. Er blijft steeds één tak (`feat/percentile-engine`); ik commit alleen eigen bestanden en alleen als je dat vraagt.

## 6. CLAUDE.md-regels waar dit tegenaan schuurt

- *"Hergebruik `css/style.css` … geen tweede designsysteem."* Optie B wijkt hier bewust van af voor het Engelse cluster. Voorstel voor de nieuwe tekst (jij of de bouwsessie voert hem door, ik niet): *"Engelse pagina's gebruiken `public/css/ha.css` en `BaseV2.astro`; het Nederlandse cluster blijft op `style.css`. Tokens staan in `ha.css`."*
- *"Geen nieuwe dependency zonder het te vragen."* Er komt er geen bij; de lettertypen zijn bestanden en worden apart gevraagd (§0).
- *Eventnamen vast, advertentiecode pas in fase 6, nooit tussen invoer en antwoord, `lang="en"`, Amerikaans-Engels, zichtbare methodologie, elk getal uit de data.* Staan als acceptatiecriteria in stap 2 tot 5.

## 7. Risico's en wat ik niet weet

| Risico | Stand |
|---|---|
| Lettertype-swap veroorzaakt layoutverschuiving | In de mock is CLS 0,0002, maar daar zitten de fonts in de pagina. Met losse bestanden moet `size-adjust` voor de terugvalfonts worden gemeten (stap 1) |
| Vite/esbuild herschrijft moderne CSS | Niet getest; daarom statisch bestand. Eventueel later onderzoeken |
| Safari 17.5 of ouder, Firefox zonder popover | Terugvallen zijn in de mock gesimuleerd in Chrome, niet in echte browsers (stap 7) |
| Twee sessies in één checkout | Botsing op `index.astro` en de twee onderdelen; opgelost door afspraak in stap 4 |
| Zonder JavaScript | Antwoord, kaart, tabel en methode staan in de HTML; thema-wissel, invultekst, deelbeeld en stippenmarkering hebben JS nodig |
| De mock is in Chrome headless getest | Geen echte telefoon, geen schermlezer, geen geforceerde-kleurenmodus bekeken |

## 8. Wat ik zodra je akkoord geeft als eerste doe

Stap 1, in deze volgorde: een baseline-build bewaren (`dist` vóór), de drie lettertypen met licenties naar `public/fonts/`, `ha.css` uit de stijlgids samenstellen, `favicon-ha.svg`, `src/lib/hue.js` en `BaseV2.astro` schrijven, bouwen, de poort draaien en het verschil met de baseline laten zien. Daarna stop ik en toon ik het resultaat voordat ik iets overzet. Commits alleen als je dat zegt.
