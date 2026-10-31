/**
 * De generieke bouwer en poort voor elke Eurostat-metriek.
 *
 * Elke metriek beschrijft zichzelf in scripts/metrics.mjs; dit bestand doet het
 * werk. Zonder dit zou elke nieuwe pagina drie bijna identieke scripts kosten, en
 * zouden de regels die bij leaving-home geld hebben gekost (aggregaten scheiden,
 * eigen jaar per land, reeksbreuken) per metriek opnieuw gemaakt of vergeten worden.
 *
 * De uitvoer heeft voor elke metriek dezelfde vorm, want daar rekenen src/lib/metric.js
 * en de componenten op:
 *
 *   { source, latestYear, years[], lastBreak, comparableSince,
 *     countriesAtLatestYear, aggregates[], countries[] }
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { datasetUrl, reader, AGGREGATES, RAW_DIR } from './eurostat.mjs';

const DATA_DIR = new URL('../../data/', import.meta.url);

/**
 * Landen die niet op de site komen, met per stuk de reden.
 *
 * De eerste vijf vallen buiten wat Eurostat voor **commercieel** hergebruik toestaat.
 * Het copyrightbericht (gelezen op 24 oktober 2026,
 * https://ec.europa.eu/eurostat/en/help/copyright-notice) staat hergebruik toe, ook
 * commercieel en zonder schriftelijke licentie, met één uitzondering die ons raakt:
 * "Data for countries other than: Member States of the European Union (EU), Member
 * States of the European Free Trade Association (EFTA), official EU acceding and
 * candidate countries" mag niet commercieel worden hergebruikt, en "the user will
 * need to eliminate these data from the tables before reusing them commercially".
 *
 * Deze site draait vandaag zonder advertenties en is dus niet commercieel. We halen
 * ze er toch nu al uit: zodra AdSense aangaat verandert dat, en een regel die je op
 * precies dat moment moet onthouden is een regel die vergeten wordt. Alle zeven zijn
 * bovendien achterlopende rijen die al buiten elke vergelijking vielen, dus het kost
 * vrijwel niets.
 */
const EXCLUDED = new Map([
  ['UK', 'Verenigd Koninkrijk: geen EU, geen EFTA, geen kandidaat-land sinds de brexit'],
  ['US', 'Verenigde Staten: Eurostat levert ze mee in une_rt_m als vergelijking, maar ze vallen buiten EU, EFTA en de kandidaat-landen'],
  ['JP', 'Japan: zelfde reden als de VS, en om dezelfde dataset'],
  ['AM', 'Armenie: buiten EU, EFTA en de kandidaat-landen'],
  ['AZ', 'Azerbeidzjan: buiten EU, EFTA en de kandidaat-landen'],
  ['BY', 'Belarus: buiten EU, EFTA en de kandidaat-landen'],
  ['SM', 'San Marino: buiten EU, EFTA en de kandidaat-landen'],
  [
    'XK',
    'Kosovo: potentieel kandidaat-land, geen officieel kandidaat-land. Bovendien ' +
      'verouderd — Eurostat heeft 6,0 personen per huishouden uit 2018, terwijl de ' +
      'eigen volkstelling van 2024 op 4,3 uitkomt (5,9 in 2011).',
  ],
  [
    'FX',
    'Metropolitan France is geen land maar Frankrijk zonder de overzeese departementen; ' +
      'hij dubbelt met FR.',
  ],
]);

/** Leest het ruwe antwoord dat fetch-eurostat.mjs heeft weggeschreven. */
export async function readRaw(spec) {
  const json = JSON.parse(await readFile(new URL(`${spec.code}.json`, RAW_DIR), 'utf8'));
  const log = JSON.parse(await readFile(new URL('fetch-log.json', RAW_DIR), 'utf8'));
  return { json, log };
}

/**
 * Bouwt het databestand voor één metriek.
 *
 * `spec.split` zegt hoe mannen en vrouwen uit de data komen. Bij de meeste reeksen
 * is dat de dimensie `sex` met T/M/F, maar niet overal: de trouwleeftijd splitst via
 * `indic_de` en heeft daar helemaal geen totaal. Een metriek zonder gepubliceerd
 * totaal wordt geweigerd in plaats van dat we er een gemiddelde bij verzinnen.
 */
export async function buildMetric(spec) {
  const { json, log } = await readRaw(spec);
  const data = reader(json);
  const years = data.categories('time');

  const split = spec.split ?? null;
  if (split && !split.total) {
    throw new Error(
      `${spec.code} publiceert geen totaal, alleen ${[split.men, split.women].filter(Boolean).join(' en ')}.\n` +
        'Een totaal uit die twee middelen zou een verzonnen statistiek zijn. Kies een andere\n' +
        'dataset of bouw de pagina expliciet zonder totaal.',
    );
  }

  /** De dimensies die niet geo, time of de splitsing zijn, op hun eerste categorie. */
  const fixed = {};
  for (const dim of data.dimensions) {
    if (dim === 'geo' || dim === 'time') continue;
    if (split && dim === split.dim) continue;
    fixed[dim] = spec.fixed?.[dim] ?? data.categories(dim)[0];
  }

  const at = (geo, time, which = 'total') => {
    const selection = { ...fixed, geo, time };
    if (split) {
      const key = split[which];
      if (!key) return null;
      selection[split.dim] = key;
    }
    return data.at(selection);
  };

  const flagAt = (geo, time) => {
    const selection = { ...fixed, geo, time };
    if (split) selection[split.dim] = split.total;
    return data.statusAt(selection);
  };

  function entry(geo) {
    let year = null;
    for (let i = years.length - 1; i >= 0; i -= 1) {
      if (at(geo, years[i]) !== undefined) {
        year = years[i];
        break;
      }
    }
    if (!year) return null;

    const series = {};
    for (const time of years) {
      const value = at(geo, time);
      if (value !== undefined) series[time] = value;
    }

    return {
      code: geo,
      name: data.labelOf('geo', geo),
      year,
      total: at(geo, year),
      // Zonder splitsing bestaan mannen en vrouwen niet in deze dataset. Ze op het
      // totaal zetten zou een kolom opleveren die er is maar niets zegt, en een
      // "verschil tussen mannen en vrouwen" van nul dat als bevinding leest.
      men: split ? (at(geo, year, 'men') ?? null) : null,
      women: split ? (at(geo, year, 'women') ?? null) : null,
      breaks: years.filter((time) => flagAt(geo, time) === 'b'),
      series,
    };
  }

  const areas = data.categories('geo');

  /**
   * Een land heeft bij Eurostat een code van twee letters — EL, UK, XK en de rest.
   * Alles wat langer is, is een aggregaat of een samengesteld gebied, en hoort niet
   * in een landenlijst: `demo_find` leverde zo "European Free Trade Association" en
   * "Germany including former GDR" als land aan, naast de EU-aggregaten.
   */
  const isCountry = (code) => code.length === 2 && !AGGREGATES.has(code) && !EXCLUDED.has(code);

  const countries = areas.filter(isCountry).map(entry).filter(Boolean);
  const aggregates = areas.filter((g) => AGGREGATES.has(g)).map(entry).filter(Boolean);
  const dropped = areas.filter((g) => !isCountry(g) && !AGGREGATES.has(g));
  if (dropped.length) spec.dropped = dropped;

  if (countries.length === 0) throw new Error(`${spec.code} leverde geen enkel land op.`);

  /**
   * De periode waarop de kaart en de ranglijst staan.
   *
   * Bij een jaarreeks is dat gewoon de hoogste die enig land draagt: iedereen
   * publiceert op hetzelfde ritme. Bij een maandreeks niet. In `une_rt_m` had
   * september 2026 **4 van de 38 gebieden** en augustus 34 — zonder ondergrens zou de
   * kaart vier landen tonen.
   *
   * `minCoverage` in de spec zet die ondergrens. De telling gaat over de reeksen en
   * niet over de laatste waarneming per land, want anders zouden juist de vier landen
   * die al wél september hebben buiten het anker vallen en als achterlopend gelden.
   * Na de keuze wijst elk land dat een waarde op het anker heeft daarnaartoe; wie
   * verder achterloopt houdt zijn eigen laatste periode en wordt gearceerd.
   */
  if (spec.minCoverage) {
    const anchor = [...years]
      .reverse()
      .find((time) => countries.filter((c) => c.series[time] !== undefined).length >= spec.minCoverage);

    if (!anchor) {
      throw new Error(
        `${spec.code}: geen enkele periode haalt ${spec.minCoverage} landen.\n` +
          'Verlaag minCoverage of vraag een langer venster op.',
      );
    }

    for (const country of countries.concat(aggregates)) {
      if (country.series[anchor] === undefined) continue;
      country.year = anchor;
      country.total = country.series[anchor];
      country.men = split ? (at(country.code, anchor, 'men') ?? null) : null;
      country.women = split ? (at(country.code, anchor, 'women') ?? null) : null;
    }
  }

  const latestYear = countries.reduce((max, c) => (c.year > max ? c.year : max), '0');
  const current = countries.filter((c) => c.year === latestYear);

  // Het eerste jaar ná de laatste breuk. Het breukjaar zelf valt erbuiten, omdat de
  // waarde daarin de overgang nog in zich draagt — zie de Portugal-reeks bij leaving-home.
  const lastBreak = [...new Set(current.flatMap((c) => c.breaks))].sort().pop() ?? null;
  const comparableSince = lastBreak ? (years[years.indexOf(lastBreak) + 1] ?? null) : years[0];

  countries.sort((a, b) => a.total - b.total);

  const index = {
    source: {
      publisher: 'Eurostat',
      dataset: spec.code,
      label: data.label,
      definition: json.extension?.description ?? null,
      // De link naar Eurostats eigen toelichting zit als annotatie in het antwoord.
      // Hem hier uitlezen in plaats van hem per metriek over te typen: elke dataset
      // wijst naar een andere, en een verkeerd overgetypte link valt niemand op.
      metadata: (json.extension?.annotation ?? []).find((note) => note.type === 'ESMS_HTML')?.href ?? null,
      doi: `10.2908/${spec.code.toUpperCase()}`,
      url: datasetUrl(spec.code, spec.params ?? {}),
      eurostatUpdated: data.updated,
      fetchedOn: log.fetchedOn,
    },
    latestYear,
    years,
    countriesAtLatestYear: current.length,
    lastBreak,
    comparableSince,
    aggregates,
    countries,
  };

  const dir = new URL(`${spec.key}/`, DATA_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('index.json', dir), JSON.stringify(index) + '\n');

  return index;
}

/**
 * De vangrail tegen schaalfouten, voor metrieken in jaren of personen: leeftijden,
 * jaren en huishoudgroottes liggen daar allemaal ruim binnen.
 *
 * Een metriek in een andere eenheid zet zijn eigen band met  in de spec.
 * Woninggrootte in m² liep hier tegenaan: Cyprus staat op 149,4 en dat is geen fout.
 */
const ABSURD = { min: 0, max: 120 };

/**
 * De poort. Rekent elk gepubliceerd cijfer en elke breukvlag terug naar het ruwe
 * antwoord, in plaats van het gebouwde bestand te geloven.
 */
export async function validateMetric(spec) {
  const index = JSON.parse(await readFile(new URL(`${spec.key}/index.json`, DATA_DIR), 'utf8'));
  const { json } = await readRaw(spec);
  const data = reader(json);

  const failures = [];
  const notes = [];
  const check = (ok, message) => {
    if (!ok) failures.push(message);
  };

  const split = spec.split ?? null;
  const fixed = {};
  for (const dim of data.dimensions) {
    if (dim === 'geo' || dim === 'time') continue;
    if (split && dim === split.dim) continue;
    fixed[dim] = spec.fixed?.[dim] ?? data.categories(dim)[0];
  }
  const selectionFor = (geo, time) => {
    const selection = { ...fixed, geo, time };
    if (split) selection[split.dim] = split.total;
    return selection;
  };

  check(index.source.dataset === spec.code, `Datasetcode is ${index.source.dataset}, verwacht ${spec.code}.`);
  check(data.label === index.source.label, 'Het label van de bron wijkt af van het gebouwde bestand.');
  check(data.updated === index.source.eurostatUpdated, 'De updatestempel is veranderd. Draai de build opnieuw.');

  const grens = spec.absurd ?? ABSURD;
  for (const country of index.countries) {
    const where = `${country.code} (${country.name})`;
    check(!AGGREGATES.has(country.code), `${country.code} is een aggregaat maar staat bij de landen.`);
    check(typeof country.total === 'number', `${where} heeft geen totaal.`);
    check(
      typeof country.total === 'number' && country.total > grens.min && country.total < grens.max,
      `${where} heeft een onmogelijke waarde: ${country.total}.`,
    );
    check(index.years.includes(country.year), `${where} staat op jaar ${country.year}, buiten de reeks.`);
    if (spec.plausible) {
      check(
        country.total >= spec.plausible.min && country.total <= spec.plausible.max,
        `${where} valt buiten het verwachte bereik ${spec.plausible.min}–${spec.plausible.max}: ${country.total}.`,
      );
    }
  }

  const maxYear = index.countries.reduce((max, c) => (c.year > max ? c.year : max), '0');
  check(index.latestYear === maxYear, `latestYear is ${index.latestYear}, hoogste landjaar is ${maxYear}.`);

  const atLatest = index.countries.filter((c) => c.year === index.latestYear);
  check(
    index.countriesAtLatestYear === atLatest.length,
    `countriesAtLatestYear zegt ${index.countriesAtLatestYear}, geteld ${atLatest.length}.`,
  );
  check(
    atLatest.length >= (spec.minCountries ?? 20),
    `Maar ${atLatest.length} landen op ${index.latestYear}; onder de grens van ${spec.minCountries ?? 20}.`,
  );

  // Reeksbreuken: bestaat het vergelijkbare venster, en is het echt breukvrij?
  const breaksAmongCurrent = [...new Set(atLatest.flatMap((c) => c.breaks ?? []))].sort();
  const expectedLastBreak = breaksAmongCurrent[breaksAmongCurrent.length - 1] ?? null;
  check(index.lastBreak === expectedLastBreak, `lastBreak is ${index.lastBreak}, verwacht ${expectedLastBreak}.`);

  if (index.comparableSince) {
    for (const country of atLatest) {
      const inside = (country.breaks ?? []).filter(
        (year) => year > index.comparableSince && year <= index.latestYear,
      );
      check(inside.length === 0, `${country.code} heeft een breuk in ${inside.join(', ')} binnen het venster.`);
    }
  }

  const window = index.comparableSince && index.comparableSince < index.latestYear;
  notes.push(
    window
      ? `Vergelijkbaar venster: ${index.comparableSince}–${index.latestYear}.`
      : `Geen vergelijkbaar venster (laatste breuk ${index.lastBreak}). De pagina hoort geen trendsectie te hebben.`,
  );

  const stale = index.countries.filter((c) => c.year !== index.latestYear);
  if (stale.length) notes.push(`Ouder dan ${index.latestYear}: ${stale.map((c) => `${c.code} ${c.year}`).join(', ')}.`);

  let compared = 0;
  for (const area of [...index.countries, ...index.aggregates]) {
    const fromRaw = data.at(selectionFor(area.code, area.year));
    check(fromRaw === area.total, `${area.code} ${area.year}: gebouwd ${area.total}, ruw ${fromRaw}.`);

    const flags = index.years.filter((time) => data.statusAt(selectionFor(area.code, time)) === 'b');
    check(
      flags.join(',') === (area.breaks ?? []).join(','),
      `${area.code}: breuken gebouwd [${(area.breaks ?? []).join(',')}], ruw [${flags.join(',')}].`,
    );
    compared += 1;
  }

  const codes = index.countries.map((c) => c.code);
  check(new Set(codes).size === codes.length, 'Dubbele landcodes.');

  return { index, failures, notes, compared, atLatest: atLatest.length, window };
}
