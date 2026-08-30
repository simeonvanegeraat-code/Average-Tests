# Databronnen

Elke dataset die de site gebruikt staat hier, met bron, periode, omvang, licentie en
ophaaldatum. Staat een dataset hier niet, dan mag er geen cijfer van op de site.

De ruwe bestanden staan niet in git (`.gitignore`). Reproduceerbaarheid komt van de
URL's en SHA-256-checksums in `scripts/lib/nhanes.mjs`: `node scripts/fetch-nhanes.mjs`
weigert te draaien als CDC een bestand heeft gewijzigd.

---

## NHANES — National Health and Nutrition Examination Survey

**Uitgever** CDC / National Center for Health Statistics (NCHS), Verenigde Staten
**Licentie** Publiek domein. Werk van de Amerikaanse federale overheid, vrij te
gebruiken en te herverdelen. NCHS vraagt om bronvermelding, geen toestemming.
**Opgehaald** 30 augustus 2026, van `https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/`
**Gebruikt voor** lengte- en gewichtspercentielen naar leeftijd en geslacht

### Bestanden

| Cyclus | Periode | Bestand | Records | Variabelen | Gewichtsvariabele |
|---|---|---|---|---|---|
| P | 2017 – maart 2020 (pre-pandemie) | `P_DEMO.xpt` | 15.560 | 29 | `WTMECPRP` |
| P | 2017 – maart 2020 (pre-pandemie) | `P_BMX.xpt` | 14.300 | 22 | — |
| L | augustus 2021 – augustus 2023 | `DEMO_L.xpt` | 11.933 | 27 | `WTMEC2YR` |
| L | augustus 2021 – augustus 2023 | `BMX_L.xpt` | 8.860 | 22 | — |

Na koppeling op respondentnummer, filtering op een geldig MEC-onderzoeksgewicht en
beperking tot leeftijd 18 t/m 79: **14.384 respondenten**, waarvan 14.198 met een
gemeten lengte en 14.191 met een gemeten gewicht.

### Waarom deze twee cycli

Verder terug poolen levert geen precisie meer op. Gewogen percentielen voor de lengte
van mannen van 20 jaar en ouder:

| Pool | n | p5 | p50 | p95 |
|---|---|---|---|---|
| alleen 2021–2023 | 2.690 | 162,2 | 175,2 | 187,3 |
| **2017–2023 (P+L, gekozen)** | **6.751** | **162,7** | **175,1** | **187,3** |
| 2013–2023 (+ H en I) | 11.985 | 162,8 | 175,4 | 187,5 |

Van 2.690 naar 6.751 respondenten verschuift de mediaan 0,1 cm; de schatting is dus al
stabiel. Nog eens verdubbelen voegt alleen tien jaar oudere data toe en verschuift de
percentielen ~0,25 cm omhoog. Recentheid weegt hier zwaarder dan steekproefomvang.

De cycli P en J (2017–2018) overlappen elkaar — P bevat J — en mogen daarom nooit samen
worden gebruikt.

### Bewerkingen

- **Weging.** Elke respondent telt mee met zijn MEC-onderzoeksgewicht. NHANES
  oversamplet bepaalde groepen; ongewogen rekenen is niet "iets minder precies" maar
  fout. Ter illustratie: het ongewogen gemiddelde voor mannen 20+ in 2017–2018 is
  173,4 cm, het gewogen gemiddelde 175,2 cm.
- **Cycli combineren.** P beslaat ~3,2 jaar, L beslaat 2 jaar. Elk gewicht wordt
  geschaald naar het aandeel van de totale periode. Bij even lange cycli is dat exact
  de gangbare NCHS-regel "deel door het aantal cycli".
- **Leeftijd 80 verwijderd.** NHANES top-codeert leeftijd: iedereen van 80 jaar en
  ouder krijgt de waarde 80. Die groep is dus geen leeftijdsjaar (bij mannen 427
  personen tegenover 66 op leeftijd 79) en zou de curve aan de bovenkant vervormen.
- **Gepubliceerd bereik 20 t/m 79.** Leeftijden 18 en 19 doen wel mee als
  ondersteuning voor de kernel aan de onderrand, maar krijgen geen eigen uitkomst.
  Percentielen voor tieners horen bij groeicurves, niet bij dit product.
- **Gladstrijken.** Per leeftijd tellen omliggende leeftijden mee via een
  tricube-kernel met bandbreedte 6 jaar; daarna gewogen kwantielen. Achter elke
  leeftijdscel zitten minimaal 254 effectieve respondenten.

### Validatie

`node scripts/validate-percentiles.mjs` moet slagen voordat er iets wordt gepubliceerd.
De externe controle vergelijkt met CDC/NCHS FastStats "Body Measurements"
(pagina gelezen op 30 augustus 2026), dat citeert uit *Anthropometric Reference Data
for Children and Adults: United States, August 2021–August 2023*, tabellen 4, 8 en 12.

| Grootheid | Berekend | Gepubliceerd |
|---|---|---|
| Lengte mannen 20+ | 68,92 → 68,9 inch | 68,9 |
| Gewicht mannen 20+ | 199,04 → 199,0 lb | 199,0 |
| Lengte vrouwen 20+ | 63,48 → 63,5 inch | 63,5 |
| Gewicht vrouwen 20+ | 171,77 → 171,8 lb | 171,8 |

Alle vier reproduceren de publicatie exact. Ter controle is ook de buikomtrek nagerekend
(mannen 40,55 → 40,6 tegen gepubliceerd 40,6; vrouwen 38,55 tegen gepubliceerd 38,5 — die
laatste valt precies op de afrondingsgrens). Buikomtrek gebruiken we verder niet.

Daarnaast draaien er twee interne controles die geen externe bron nodig hebben: de
gedecodeerde BMI komt overeen met gewicht gedeeld door lengte in het kwadraat (maximale
afwijking 0,0500, precies de afrondingsmarge), en de som van de steekproefgewichten komt
uit op de werkelijke Amerikaanse volwassenenpopulatie.

### Bronvermelding op de site

> Centers for Disease Control and Prevention (CDC), National Center for Health
> Statistics (NCHS). National Health and Nutrition Examination Survey, 2017–March 2020
> and August 2021–August 2023. U.S. Department of Health and Human Services.
