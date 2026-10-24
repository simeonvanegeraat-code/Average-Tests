# De menubalk in de header

Onderzoek van 24 oktober 2026, op verzoek van Simeon: het bolletje was weg, en de vraag
erna was wat er met de menubalk mogelijk is.

De vier varianten staan als klikbare artboards op een canvas buiten de repo. De
beslissing en de redenen staan hier, want een canvas is sessienotitie en dit niet.

## Het probleem is gemeten, niet aangevoeld

Bij een venster van 1280 px, de maat waarop de meeste bezoekers kijken:

| | px |
|---|---|
| Breedte van de pil (`.nav` heeft `max-width: 900px`) | 900 |
| Merk (teken + woordmerk) | 131 |
| De acht links samen | 687 |
| Thema- en menuknop | 96 |
| **Ruimte over** | **−15** |

De acht links passen er nu al niet in. Per link: Leaving home 84, Working life 88,
Working hours 88, Household size 105, Healthy years 83, First child 63, Wealth 79,
Method 83.

En acht is niet waar het stopt: `research/metric-shortlist.md` houdt **25** metrieken op
de lijst. Een platte rij links is dus niet een beetje te krap, hij is het verkeerde
patroon. Elke metriek die erbij komt maakt het erger, en bij 760 px verdwijnt de hele rij
al achter de hamburger — op mobiel is er vandaag feitelijk geen menu.

## Wat de site doet die dit probleem al heeft

Our World in Data staat in CLAUDE.md als een van de drie partijen die de hoofdzoekwoorden
bezetten. Gemeten op hun eigen pagina op 24 oktober 2026, venster 1440 px:

- Zichtbaar in de header: **8 ingangen** — merk, Browse by topic, Data, Latest, Resources,
  About, Subscribe, Donate.
- Achter die ene ingang "Browse by topic": **337 links**, verdeeld over ruim tien groepen
  van 4 tot 35.
- Geen enkele losse metriek staat in de header. Geen zoekveld in de header op de homepage.

Dat is het hele antwoord in één observatie: bij een catalogus hoort in de header de
*categorie*, niet de inhoud.

## Twee mechanismen staan al in de CSS en worden nergens gebruikt

Dit is de vondst die het meest oplevert. `public/css/ha.css` bevat af en klaar:

- **`.stagebtn`** (regel 226–228) — een knop met staafjes voor de levenslijn, met
  `aria-current="step"` en een bezocht-stand (`[data-v="1"]`). Ontworpen als
  header-element. Nergens aangeroepen.
- **`.nextgrid` / `.nextcard` / `.nextbar` / `.progress` / `.pips`** (regel 426–451 en
  504–507) — een rooster van kaarten voor de volgende metriek, met plek voor een icoon,
  het kopcijfer (`.val`), een vraag (`.q`) en een antwoord (`.a`), een bezocht-stand
  (`[data-visited="1"]` zet er "· explored" achter), plus een zwevende balk onderin die
  naar de volgende metriek wijst. Inclusief een mobiele carrousel-variant. Nergens
  aangeroepen.

Er is dus al een keer bedacht hoe een bezoeker van de ene metriek naar de volgende gaat,
en dat is nooit aangesloten. Dat raakt direct `second_metric_opened`, een van de vier
vastgelegde eventnamen.

## De vier varianten

Alle vier staan in de vormtaal van 2026, met de echte cijfers uit `data/*/index.json`.

| | Wat het is | Weegt mee |
|---|---|---|
| **A** | Eén ingang "Metrics" opent een paneel met vier kolommen, platte links | Schaalt oneindig, saai in de goede zin. Dicht bij wat OWID doet |
| **B** | Zelfde ingang, maar het paneel is een rooster van kaarten met per metriek het kopcijfer en de uitersten | Mooiste, en meteen een vindplek. Maar dit is precies wat `.nextcard` onderaan de pagina hoort te doen, en een breed paneel is winst op desktop terwijl zoekverkeer vooral mobiel is |
| **C** | De header ís een zoekveld, met ⌘K en live filteren | Schaalt het beste van alle vier en voelt het modernst. Bij zeven metrieken lost het een probleem op dat er nog niet is; bij vijfentwintig wel |
| **D** | De header zegt waar je bent: merk / **Leaving home ▾**, en die naam opent een smalle wisselaar met de zes andere metrieken en hun cijfers | Breedte staat vast, los van hoeveel metrieken er zijn. Antwoordt op de vraag van iemand die via Google binnenkomt: wat is dit, en wat staat er nog |

## Advies, eerste ronde — achterhaald

**D in de header, en de `.nextcard`-kaarten eindelijk onderaan elke pagina.**

De redenering: de bezoeker komt uit organische search en landt midden op de site, niet op
de homepage. De header hoeft daarom niet de catalogus te zijn — hij moet zeggen waar je
bent, dat er meer is, en op elke breedte passen. Dat is D, en D is als enige van de vier
net zo breed bij vijfentwintig metrieken als bij zeven.

Het doorklikken naar een tweede metriek hoort onderaan, op het moment dat de bezoeker zijn
antwoord net heeft gehad — niet in een menu dat hij nooit opent. Daar staat het CSS-werk al
voor klaar.

**C is de versie voor later**, als de catalogus groot genoeg is dat zoeken sneller is dan
kijken. B zou ik niet in de header bouwen maar als onderste sectie, want dat is wat het is.

## Nog niet besloten

- Wat er gebeurt onder 760 px. D past daar wel, maar de hamburger en `.sheet` blijven nodig
  voor Method en de rest.
- Of `/wealth/` meedoet zolang die pagina nog op de oude vormgeving staat.
- Of de levenslijn-groepering (`.stagebtn`) terugkomt of definitief vervalt.

## Ronde 2: wat Apple, Adidas en Samsung werkelijk doen

Simeon was niet overtuigd en wees naar deze drie. Gemeten op 24 oktober 2026, venster
1440 px:

| Site | In de balk | Daarachter |
|---|---|---|
| Apple | 11 woorden plus zoek, balk 44 px hoog | Per woord een mega-menu in kolommen "Ontdek / Shop / Meer", ~176 links in totaal |
| Samsung | 8 woorden plus zoek, winkelwagen en account | Mega-menu per woord |
| Adidas | Twee rijen, header 121 px hoog, zoekveld in de balk | 298 links in de header |

Alle drie doen dus wat variant A en B doen: een platte rij van een handvol
*categoriewoorden*, met achter elk een paneel. Geen van drieën is opvallend geanimeerd —
de beweging is een korte fade met een kleine verschuiving. Wat ze duur laat voelen is
niet de rij maar het paneel: daar staan beelden en productkaarten, geen lijstje links.

En het verschil dat telt: **zij hebben categorieën om in de balk te zetten.** Apple heeft
elf productlijnen, Samsung acht, Adidas heren/dames/kids. Wij hebben zeven metrieken en
geen categorieën. Variant E neemt de structuur toch over en laat zien wat er dan gebeurt:
vier categoriewoorden, en daarachter een paneel van 1160 px met twee kaarten erin.

## Advies, herzien

Het eerste advies koos de zuinigste oplossing voor een vraag die niet over zuinigheid
ging. D is stil; deze drie sites zijn royaal, en dat is wat er gevraagd werd.

**F: één ingang "Metrics", daarachter een paneel over de volle breedte met een kaart per
metriek** — kopcijfer, de twee uiterste landen, en een balk die laat zien waar het
Europese cijfer tussen die twee ligt. Dat is de Apple-structuur zonder de categorieën die
we niet hebben, en het paneel krijgt de aandacht in plaats van de balk.

De beweging, en waarom deze wel mag:

- paneel: fade plus 10 px omhoog, 340 ms
- kaarten: 42 ms na elkaar
- het cijfer telt in 820 ms op naar de echte waarde
- de balk groeit naar de echte positie van het Europese cijfer

Een getal dat optelt naar zijn werkelijke waarde en een balk die naar zijn werkelijke
positie groeit zijn samen een grafiek die zich opbouwt. Dat is beweging die iets zegt,
en het verschil met versiering — het bolletje dat we net hebben weggehaald — is dat je
er na afloop iets aan hebt overgehouden.

Wat blijft staan uit ronde 1: de `.nextcard`-kaarten horen alsnog onderaan elke pagina.
Het menu en de voet doen verschillend werk.
