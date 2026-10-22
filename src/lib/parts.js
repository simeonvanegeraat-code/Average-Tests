/**
 * Zet zinsdelen (zie src/lib/leaving-home-copy.js) in een element.
 *
 * Een zinsdeel is een gewone tekst of een object met `strong` of `em`. We bouwen er
 * elementen van met textContent en nooit met innerHTML: de gegevens komen uit onze
 * eigen bestanden, maar een zin hoort niet de plek te zijn waar markup binnenkomt.
 * Alleen in de browser te gebruiken.
 */
export function fillParts(target, parts) {
  const nodes = parts.map((part) => {
    if (typeof part === 'string') return document.createTextNode(part);
    const element = document.createElement('strong' in part ? 'b' : 'em');
    element.textContent = part.strong ?? part.em;
    return element;
  });
  target.replaceChildren(...nodes);
}

/** Laat een element opnieuw zijn korte intree-animatie afspelen (de klasse `swapin` in public/css/ha.css). */
export function replay(element) {
  element.classList.remove('swapin');
  void element.offsetWidth;
  element.classList.add('swapin');
}
