/**
 * De OECD-bron, los van de scripts die hem gebruiken — net als scripts/metrics.mjs.
 *
 * Eén maat: ELMEA, "Effective labour market exit age". Dat is de leeftijd waarop
 * mensen feitelijk de arbeidsmarkt verlaten, niet de wettelijke pensioenleeftijd en
 * niet de leeftijd waarop het pensioen begint.
 *
 * De OECD publiceert ELMEA **alleen per geslacht**; er is geen totaal in de dimensie
 * SEX. Zelf middelen zou een verzonnen statistiek zijn, dus de pagina zet mannen en
 * vrouwen naast elkaar en de poort weigert een bestand waarin ze zijn samengevat.
 *
 * Hergebruik mag, ook commercieel, mét een voorgeschreven bronvermelding. De
 * voorwaarden (gelezen op 25 oktober 2026) zeggen letterlijk: "you can extract from,
 * download, copy, adapt, print, distribute, share and embed Data for any purpose,
 * even for commercial use. You must give appropriate credit to the OECD by using the
 * citation associated with the relevant Data, or, if no specific citation is
 * available, you must cite the source information using the following format: OECD
 * (year), (dataset name),(data source) DOI or URL (accessed on (date))." Die vorm
 * staat daarom op de pagina, opgebouwd uit de data in plaats van ingetypt.
 */
export const PENSION = {
  key: 'exit-age',
  dataflow: 'OECD.ELS.SPD,DSD_PAG@DF_PAG,1.0',
  measure: 'ELMEA',
  // REF_AREA.FREQ.MEASURE.UNIT_MEASURE.SEX.AGE.OPTIONALITY — leeg is "alles".
  key_: '.A.ELMEA.....',
  label: 'Effective labour market exit age',
  /** Waar een lezer dezelfde tabel zelf kan openen, en waar de voorwaarden staan. */
  explorer: 'https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PAG%40DF_PAG',
  terms: 'https://www.oecd.org/en/about/terms-conditions.html',
};
