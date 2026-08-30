/**
 * Gewogen kwantiel met lineaire interpolatie tussen waarnemingen.
 * `rows` moet oplopend op `value` gesorteerd zijn en positieve gewichten hebben.
 */
export function weightedQuantile(rows, p) {
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0].value;

  const total = rows.reduce((sum, r) => sum + r.weight, 0);
  const target = p * total;

  let cum = 0;
  for (let i = 0; i < rows.length; i++) {
    const lo = cum;
    const hi = cum + rows[i].weight;
    if (target <= hi) {
      if (i === 0) return rows[0].value;
      const span = hi - lo;
      const frac = span > 0 ? (target - lo) / span : 0;
      return rows[i - 1].value + frac * (rows[i].value - rows[i - 1].value);
    }
    cum = hi;
  }
  return rows[rows.length - 1].value;
}

/**
 * Tricube-kernel: 1 op afstand 0, glad aflopend naar 0 op de bandbreedte.
 * Buiten de bandbreedte telt een waarneming niet mee.
 */
export function tricube(distance, bandwidth) {
  const u = Math.abs(distance) / bandwidth;
  if (u >= 1) return 0;
  return (1 - u ** 3) ** 3;
}

/**
 * Percentielcurve over leeftijd, glad gemaakt met een kernel.
 *
 * Voor elke doelleeftijd tellen respondenten in de buurt mee, dichterbij zwaarder.
 * Het steekproefgewicht van de survey wordt vermenigvuldigd met het kernelgewicht;
 * daarna berekenen we gewone gewogen kwantielen over die verzameling.
 *
 * Dit is bewust geen parametrische fit: er valt niets te laten convergeren en het
 * is in één zin uit te leggen aan een bezoeker.
 */
export function smoothedQuantilesByAge({ observations, ages, levels, bandwidth }) {
  const sorted = [...observations].sort((a, b) => a.value - b.value);
  const out = new Map();

  for (const age of ages) {
    const near = [];
    let effectiveN = 0;

    for (const o of sorted) {
      const k = tricube(o.age - age, bandwidth);
      if (k === 0) continue;
      near.push({ value: o.value, weight: o.weight * k });
      effectiveN += k;
    }

    out.set(age, {
      // Som van de kernelgewichten: het aantal respondenten dat "meetelt" voor
      // deze leeftijd, waarbij iemand op de rand van het venster bijna niets bijdraagt.
      effectiveN: Math.round(effectiveN),
      rawN: near.length,
      quantiles: levels.map((p) => weightedQuantile(near, p / 100)),
    });
  }

  return out;
}
