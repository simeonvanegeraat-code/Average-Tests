# HumanAverage

[humanaverage.com](https://www.humanaverage.com) answers one question per page: **where
does a country sit, and where do you sit inside it?** Each page takes a single published
statistic — the age at which half of young people have left home, household wealth — and
turns it into a map of Europe, a sortable table of every country, and a comparison with
whatever the reader enters about themselves.

Every figure comes from Eurostat, the OECD or the ECB. Nothing on the site is estimated
on top of what those sources publish, and no number is typed into a page by hand: the
text is calculated from the data at build time, so it cannot go stale when a source
updates.

## How it is built

Astro with static output, no client-side framework, and exactly one dependency. The data
pipeline is plain Node.

```
npm install
npm run dev                  # http://localhost:4321
npm run build                # static build into dist/, then the sitemap
npm run preview              # serve the build locally
```

Each data source has three steps — fetch into `data/raw/` (git-ignored), build a compact
JSON file that is committed, validate it:

```
npm run leaving              # Eurostat: leaving the parental home
npm run wealth               # ECB: household wealth
npm run geo:build            # Natural Earth: the map geometry
```

## The gate

Every dataset has a `scripts/validate-*.mjs` that must pass before anything is published.
It does not trust the built file: it recomputes each published figure from the raw API
response, checks that aggregates like EU27 were not counted as countries, that each
country carries its own reference year, and — for Eurostat — that no comparison spans a
break in the series.

That last one matters more than it sounds. Eurostat reorganised the Labour Force Survey
in 2021 and flags the break; the break year itself is transitional. Measured from 2005 the
spread between countries appears to grow, and measured across comparable years it shrinks.
The code refuses to calculate the first version rather than footnoting it.

Where each dataset comes from, what it covers and what its licence allows is recorded per
source in [`data/sources.md`](data/sources.md).

## What is where

| Path | |
|---|---|
| `src/pages/` | The English site |
| `src/components/`, `src/lib/` | Map, table, hero and the calculations behind them |
| `scripts/` | Fetch, build and validate, one set per source |
| `data/` | Committed JSON; `data/raw/` is ignored |
| `public/nl/`, `public/tools/`, `public/articles/` | A frozen Dutch set of browser-based reaction, typing and memory tests. Still served, no longer developed |
| `research/` | How the metrics were chosen and how the design was arrived at |

## Publishing

Push to `main`; Vercel builds and deploys. Before that: the data gate passes, `npm run
build` succeeds, and the page has been looked at in a browser.

No advertising code is on the site. When it is added, the consent banner and the privacy
policy go first.
