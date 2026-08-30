// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.humanaverage.com',

  // Statische output: elke pagina is een echt HTML-bestand. Geen server in de
  // keten, en zoekmachines krijgen de volledige inhoud bij het eerste verzoek.
  output: 'static',

  // Genereert /height/index.html, dus de URL is /height/ — hetzelfde patroon als
  // het bestaande Nederlandse cluster in public/.
  build: { format: 'directory' },

  // public/ bevat het bevroren Nederlandse cluster en wordt ongewijzigd
  // meegekopieerd. Maak hier geen pagina's aan die met die paden botsen.
  publicDir: 'public',
});
