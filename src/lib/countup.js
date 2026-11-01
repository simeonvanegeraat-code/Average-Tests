/**
 * Een getal van nul naar zijn echte waarde laten lopen.
 *
 * Clientcode. De echte waarde staat altijd al in de HTML — dit script leest hem
 * daaruit en zet hem na afloop exact terug. Zonder JavaScript, in een oudere
 * browser of met beperkte beweging staat het goede getal er dus gewoon.
 *
 * Twee dingen die niet vanzelf goed gaan:
 *
 * 1. De tekst wordt breder tijdens het tellen: "0.0" is drie tekens, "10.2" vier.
 *    Bij een kopcijfer van 232px is dat een zichtbare sprong. Daarom wordt de
 *    eindbreedte vooraf gemeten en als `min-width` vastgezet tijdens het tellen.
 *    Dat mag, want met tabular-nums is geen tussenwaarde breder dan de eindwaarde.
 * 2. Een element dat onder de vouw staat moet pas tellen als je er bent, anders
 *    heb je het gemist. Vandaar `countWhenVisible` in plaats van bij het laden.
 */

import { decimal, localeOfNumber } from './format.js';

/**
 * De taalgrens de andere kant op: dit script LEEST een getal terug uit de tekst die
 * de server schreef.
 *
 * Hier stond `[\d.]+` — cijfers en een punt — en dat is de Engelse notatie als vaste
 * regel. In het Nederlands schrijft de server `24,6`, en dan past het patroon niet
 * meer: de animatie valt stil uit. Erger bij een bedrag: `1.053` zou als 1,053 gaan
 * tellen, dus een kopcijfer dat 820 milliseconden iets heel anders zegt dan het
 * cijfer dat erna blijft staan.
 *
 * Het decimaalteken komt daarom uit `Intl` zelf in plaats van uit een aanname. Wat
 * het patroon WEL en NIET accepteert blijft gelijk: cijfers en het decimaalteken van
 * de taal, geen duizendscheiding. Dat laatste is geen omissie. Een getal mét
 * duizendscheiding viel ook vóór deze wijziging buiten het patroon en telde dus niet
 * mee; dat hier oprekken zou animaties aanzetten die er nooit waren, en dat is een
 * zichtbare wijziging die niemand heeft gevraagd.
 */
function shapeFor(locale) {
  const point =
    new Intl.NumberFormat(locale, { minimumFractionDigits: 1 })
      .formatToParts(1.5)
      .find((part) => part.type === 'decimal')?.value ?? '.';
  const escaped = point.replace(/[.*+?^${}()|[\]\\]/g, (hit) => `\\${hit}`);
  return { re: new RegExp(`^(\\D*)([\\d${escaped}]+)(\\D*)$`), point };
}

/**
 * Leest de waarde uit de tekst van een element. Geeft null als er geen getal in
 * staat — dan laat dit script het met rust in plaats van er iets van te maken.
 */
export function readCounter(node) {
  const final = node.textContent ?? '';
  const locale = localeOfNumber();
  const { re, point } = shapeFor(locale);
  const parts = re.exec(final.trim());
  if (!parts) return null;

  const target = Number(parts[2].replace(point, '.'));
  if (!Number.isFinite(target)) return null;

  return {
    node,
    final,
    locale,
    prefix: parts[1],
    suffix: parts[3],
    target,
    decimals: (parts[2].split(point)[1] ?? '').length,
  };
}

/** Terug naar de tekst die de server schreef, nooit naar een afgerond restje. */
export function settle(counters) {
  for (const counter of counters) {
    counter.node.textContent = counter.final;
    counter.node.style.minWidth = '';
  }
}

/**
 * Telt een set tellers tegelijk op. Geeft een functie terug die het afbreekt en
 * meteen op de echte waarde zet.
 */
export function animate(counters, duration = 820) {
  if (!counters.length) return () => {};

  // Eerst de eindbreedte vastzetten, anders springt de regel tijdens het tellen.
  for (const counter of counters) {
    const width = counter.node.getBoundingClientRect().width;
    if (width) counter.node.style.minWidth = `${Math.ceil(width)}px`;
  }

  let frame = requestAnimationFrame(function tick(now) {
    if (!tick.started) tick.started = now;
    const part = Math.min(1, (now - tick.started) / duration);
    const eased = 1 - (1 - part) ** 3;

    for (const counter of counters) {
      counter.node.textContent =
        counter.prefix +
        decimal(counter.target * eased, counter.decimals, { locale: counter.locale }) +
        counter.suffix;
    }

    if (part < 1) frame = requestAnimationFrame(tick);
    else settle(counters);
  });

  return () => {
    cancelAnimationFrame(frame);
    settle(counters);
  };
}

/**
 * Laat elk element tellen zodra het in beeld komt, één keer. Zonder
 * IntersectionObserver, of met beperkte beweging, blijft het getal staan zoals het
 * er al stond — dat is de goede uitkomst, niet een uitgeklede versie ervan.
 */
export function countWhenVisible(nodes, duration = 820) {
  const list = [...nodes];
  if (!list.length) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const counter = readCounter(entry.target);
        if (counter) animate([counter], duration);
      }
    },
    { threshold: 0.4 },
  );

  for (const node of list) observer.observe(node);
}
