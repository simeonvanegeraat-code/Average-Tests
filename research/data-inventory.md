# Data-inventarisatie: wat er klaarligt voor de volgende pagina's

*Gemeten op 24 oktober 2026. Alles hieronder is op die dag zelf opgehaald en nageteld met
`scripts/lib/eurostat.mjs`, dezelfde lezer die de pipeline gebruikt — niet overgeschreven
uit documentatie. De kandidatenlijst komt uit [metric-shortlist.md](metric-shortlist.md);
dit blad voegt toe wat die niet had: werkt de toegang, en wat levert de dataset echt op.*

## In het kort

1. **Geen enkele bron vraagt een API-sleutel.** Acht bronnen getest, acht keer HTTP 200
   zonder authenticatie. Dit is geen beperking op wat we kunnen bouwen.
2. **De bindende beperking is de reeksbreuk, niet de beschikbaarheid.** Van de zeven
   gemeten Eurostat-kandidaten heeft er **één** een breukvrije reeks. Bij de rest ligt de
   laatste breuk in of vlak vóór het laatste jaar, en dan is er geen venster om een
   ontwikkeling in de tijd over te tonen — alleen een dwarsdoorsnede.
3. **Het echte open risico is de licentie**, en dat staat bij drie bronnen nog open.

## Toegang

| Bron | Sleutel | Vandaag getest |
|---|---|---|
| Eurostat dissemination API | **geen** | 200 op 7 datasets |
| OECD SDMX | **geen** | 200, 268 KB, 53 gebieden |
| ECB Data Portal | **geen** | 200 (al in gebruik voor `/wealth/`) |
| Wereldbank | **geen** | 200 |
| WHO GHO (OData) | **geen** | 200, 8,4 MB |
| VN-DESA, UNDP | geen — losse bestandsdownload | niet opnieuw getest |
| ~~US Census Bureau~~ | gratis sleutel nodig | Amerikaans, buiten de huidige richting |
| ~~IPUMS~~ | registratie, en de voorwaarden **verbieden commercieel gebruik** | onbruikbaar voor een advertentiesite |

## Wat elke kandidaat werkelijk oplevert

Gemeten: de reeks, het laatste jaar waarin minstens tien landen een waarde hebben, hoeveel
landen dat zijn, en in hoeveel jaren Eurostat een reeksbreuk (`b`) vlagt.

| Metriek | Code | Reeks | Laatste | Landen | Breukjaren | Bruikbaar voor |
|---|---|---|---|---|---|---|
| **Duur werkzaam leven** | `lfsi_dwl_a` | 2000–2025 | 2025 | 32 | **geen** | dwarsdoorsnede **én volledige trend** |
| Leeftijd uit huis | `yth_demo_030` | 2000–2025 | 2025 | 31 | 2021 als laatste | *gebouwd*: `/leaving-home/` |
| Huishoudgrootte | `ilc_lvph01` | 2003–2025 | 2025 | 31 | 11, laatste **2025** | alleen dwarsdoorsnede |
| Kamers per persoon | `ilc_lvho04` | 2003–2025 | 2025 | 31 | 14, laatste **2025** | alleen dwarsdoorsnede |
| Gezonde levensjaren | `hlth_hlye` (`hlth_hle=HLY_Y0`) | 2004–2024 | 2024 | 28 | 16, laatste **2024** | alleen dwarsdoorsnede |
| Werkuren | `lfsa_ewhuis` | 1983–2025 | 2025 | 34 | 27, laatste 2024 | alleen dwarsdoorsnede |
| Leeftijd eerste kind | `demo_find` (`indic_de=AGEMOTH1`) | 1960–2024 | 2024 | 39 | 13, laatste 2023 | dwarsdoorsnede + één jaar |
| Trouwleeftijd | `tps00014` | 2013–2024 | 2024 | 25 | 3, laatste 2023 | dwarsdoorsnede + één jaar |
| Pensioen | OECD `DSD_PAG@DF_PAG` | 2024–2084 | 2024/2025 | **53, incl. VS/VK/CA/AU** | n.v.t. | dwarsdoorsnede, buiten Europa |

### Wat dit betekent voor de bouwvolgorde

**`lfsi_dwl_a` is de enige met een volledig verhaal.** Zesentwintig jaar reeks, 32 landen,
nul breuken: daar kan een pagina laten zien hoe de duur van het werkzame leven *verschoven*
is, niet alleen waar hij nu ligt. Dat is precies wat `/leaving-home/` interessant maakte, en
bij de andere kandidaten kan het niet.

**De rest wordt een dwarsdoorsnedepagina.** Kaart, landentabel, jouw eigen plek — maar zonder
de "wat is er veranderd"-sectie, want `trend()` weigert terecht te rekenen over een breuk.
Dat is geen reden om ze niet te bouwen; het is wel een reden om er niet een trendverhaal bij
te verzinnen dat de data niet draagt.

**De OECD is de brug naar buiten Europa.** Eurostat stopt bij het VK in 2018–2019 en heeft
geen VS, Canada of Australië. De OECD-pensioenset heeft die wel, en zonder sleutel. Als
"average retirement age by country" ooit een doel wordt, is dat de bron.

### Twee parametervallen die ik vandaag in liep

- `hlth_hlye` gebruikt dimensie **`hlth_hle`**, niet `indic_he`. Een verkeerde dimensienaam
  geeft HTTP 400, geen lege uitkomst.
- `lfsa_ewhuis` heeft **`isco08`** en **`wstatus`**, geen `nace_r2`. Ongefilterd ophalen
  verbreekt de verbinding; filter altijd op minstens
  `isco08=TOTAL&wstatus=EMP&worktime=TOTAL&age=Y20-64&sex=T&unit=HR`.

## Licenties — hier zit het werkelijke risico

| Bron | Stand | Wat er moet gebeuren |
|---|---|---|
| **WHO** | De voorwaarden op who.int verbieden gebruik "for or in conjunction with the promotion of a commercial enterprise" | **Niet gebruiken** op een site met advertenties zonder schriftelijke bevestiging. Geen van de kandidaten hierboven hangt ervan af |
| **ECB** | **Nooit gelezen.** Staat nergens in de code of op de site, terwijl `/wealth/` er al sinds september op draait | Uitzoeken vóór AdSense. Dan wordt het gebruik commercieel |
| **Eurostat** | Hergebruik inclusief commercieel, met bronvermelding — maar uit samenvattingen, niet van de bron zelf (404 op de pagina die we probeerden) | Nalopen bij de bron |
| **OECD** | "for any purpose, even for commercial use" — uit een zoekresultaat; de pagina zelf gaf 403 | Nalopen bij de bron |
| Wereldbank | CC BY 4.0 voor eigen datasets. Indicatoren van derden kunnen afwijken | Per indicator controleren |
| VN-DESA, UNDP | CC BY 3.0 IGO | Bevestigd in het bestand zelf (VN) |

Dit is één taak, geen zes: drie pagina's lezen en de uitkomst in `data/sources.md` zetten.
Het hoort af te zijn vóór er advertentiecode op de site komt, niet erna.

## Wat hier niet in staat

- **Zoekvolume.** Er is geen keyword-tool gebruikt. Welke van deze metrieken verkeer trekt
  staat in [metric-shortlist.md](metric-shortlist.md), met de nadruk die daar hoort: dat
  zijn indicaties uit autocomplete en SERP's, geen volumes.
- **De geld-categorie.** Inkomen en vermogen staan op de later-lijst (CLAUDE.md, 24 oktober).
  Eurostat `earn_nt_net` en de OECD-loonreeks zijn niet doorgemeten.
- **Of een dataset een goede pagina máákt.** Dekking is een ondergrens, geen reden.
