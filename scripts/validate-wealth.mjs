/**
 * Controleert de gegenereerde vermogensdata. Draait na build-wealth.mjs.
 *
 *   node scripts/validate-wealth.mjs
 *
 * Faalt met exitcode 1 als een controle niet slaagt. Dit is de poort tussen "de
 * pipeline heeft iets geproduceerd" en "we durven dit te publiceren".
 *
 * De belangrijkste controle is de schaal. DWA mengt eenheden: medianen in euro's,
 * bedragen per huishouden in duizenden, groepstotalen in miljoenen. Een factor 1000
 * fout is op een pagina volstrekt onzichtbaar en volstrekt fataal.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { OUT_DIR } from './lib/dwa.mjs';

const failures = [];
const check = (ok, label, detail) => {
  console.log(`  ${ok ? 'OK  ' : 'FOUT'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.json') && f !== 'index.json');
const areas = await Promise.all(
  files.map(async (f) => JSON.parse(await readFile(new URL(f, OUT_DIR), 'utf8'))),
);
const index = JSON.parse(await readFile(new URL('index.json', OUT_DIR), 'utf8'));
const countries = areas.filter((a) => !a.isAggregate);

console.log(`\nGecontroleerd: ${areas.length} gebieden, laatste kwartaal ${index.latestPeriod}`);

// --- 1. schaal: medianen moeten in euro's staan, niet in duizenden -----------
console.log('\n1. Schaal van de bedragen');
const outOfRange = countries.filter((a) => a.median < 10_000 || a.median > 3_000_000);
check(outOfRange.length === 0, 'mediaan tussen 10k en 3 mln euro',
  outOfRange.length ? outOfRange.map((a) => `${a.area}=${a.median}`).join(' ') : `${countries.length} landen`);

const groupsOutOfRange = countries.flatMap((a) =>
  a.groups.filter((g) => g.netWealth < -100_000 || g.netWealth > 20_000_000)
    .map((g) => `${a.area}/${g.code}=${g.netWealth}`));
check(groupsOutOfRange.length === 0, 'bedragen per huishouden plausibel',
  groupsOutOfRange.length ? groupsOutOfRange.slice(0, 4).join(' ') : 'alle groepen');

// --- 2. structuur: vermogen is scheef verdeeld ------------------------------
// Het gemiddelde hoort overal boven de mediaan te liggen. Ligt het eronder, dan is
// er een eenheid of een groep verwisseld.
console.log('\n2. Vorm van de verdeling');
const notSkewed = countries.filter((a) => a.mean != null && a.mean <= a.median);
check(notSkewed.length === 0, 'gemiddelde ligt boven de mediaan in elk land',
  notSkewed.length ? notSkewed.map((a) => a.area).join(' ') : `${countries.filter((a) => a.mean).length} landen`);

const ratios = countries.filter((a) => a.mean).map((a) => a.mean / a.median);
const worstRatio = Math.max(...ratios);
check(worstRatio < 12, 'verhouding gemiddelde/mediaan blijft onder 12',
  `hoogste ${worstRatio.toFixed(1)}x`);

// --- 3. monotonie: rijkere groepen bezitten meer ---------------------------
console.log('\n3. Groepen lopen op');
const brokenOrder = [];
for (const a of countries) {
  const byCode = Object.fromEntries(a.groups.map((g) => [g.code, g.netWealth]));
  const ladder = ['B50', 'Q3', 'D8', 'D9', 'D10'].filter((c) => c in byCode);
  for (let i = 1; i < ladder.length; i++) {
    if (byCode[ladder[i]] < byCode[ladder[i - 1]]) brokenOrder.push(`${a.area}:${ladder[i - 1]}>${ladder[i]}`);
  }
}
check(brokenOrder.length === 0, 'B50 < Q3 < D8 < D9 < D10 overal',
  brokenOrder.length ? brokenOrder.slice(0, 4).join(' ') : `${countries.length} landen`);

// --- 4. huiseigenaren bezitten meer dan huurders ---------------------------
console.log('\n4. Woonsituatie');
const withHousing = countries.filter((a) =>
  a.status.some((s) => s.code === 'HSO') && a.status.some((s) => s.code === 'HST'));
const inverted = withHousing.filter((a) => {
  const own = a.status.find((s) => s.code === 'HSO').netWealth;
  const rent = a.status.find((s) => s.code === 'HST').netWealth;
  return own <= rent;
});
check(inverted.length === 0, 'huiseigenaren bezitten meer dan huurders',
  inverted.length ? inverted.map((a) => a.area).join(' ') : `${withHousing.length} landen`);

// --- 5. de balans moet sluiten --------------------------------------------
// Dit is de scherpste controle die deze dataset toelaat: alle posten samen
// (schulden staan negatief) horen exact het gepubliceerde netto vermogen te geven.
// Klopt dat niet, dan mist er een post, telt er een optelpost dubbel, of zit er
// een schaalfout in. Alle drie zijn onzichtbaar op de pagina zelf.
console.log('\n5. Sluit de balans op het netto vermogen?');
let worstGap = 0;
let worstAt = '';
const broken = [];
for (const a of countries) {
  for (const [group, parts] of Object.entries(a.composition)) {
    const sum = parts.reduce((total, p) => total + p.value, 0);
    const net = a.groups.find((g) => g.code === group)?.netWealth;
    if (net == null || net === 0) continue;
    const gap = Math.abs(sum - net) / Math.abs(net);
    if (gap > worstGap) { worstGap = gap; worstAt = `${a.area}/${group}`; }
    if (gap > 0.01) broken.push(`${a.area}/${group} ${(gap * 100).toFixed(1)}%`);
  }
}
check(broken.length === 0, 'som van alle posten = netto vermogen (marge 1%)',
  broken.length ? broken.slice(0, 5).join(' ') : `grootste afwijking ${(worstGap * 100).toFixed(2)}% bij ${worstAt}`);

// --- 6. dekking -----------------------------------------------------------
console.log('\n6. Dekking');
check(countries.length >= 18, 'minstens 18 landen met een mediaan', `${countries.length} landen`);
const thinHistory = countries.filter((a) => a.medianHistory.length < 8);
check(thinHistory.length === 0, 'minstens 8 kwartalen historie per land',
  thinHistory.length ? thinHistory.map((a) => `${a.area}=${a.medianHistory.length}`).join(' ') : 'alle landen');

// --- resultaat -------------------------------------------------------------
if (failures.length === 0) {
  await writeFile(
    new URL('../data/wealth-validation.json', import.meta.url),
    JSON.stringify({
      checkedOn: new Date().toISOString().slice(0, 10),
      latestPeriod: index.latestPeriod,
      countries: countries.length,
      quarters: Math.max(...countries.map((a) => a.medianHistory.length)),
      meanToMedianRange: [Math.min(...ratios).toFixed(2), worstRatio.toFixed(2)],
    }, null, 2) + '\n',
  );
  console.log('\nAlle controles geslaagd. data/wealth-validation.json bijgewerkt.');
} else {
  console.log(`\n${failures.length} controle(s) gefaald: ${failures.join(', ')}`);
}
process.exit(failures.length === 0 ? 0 : 1);
