# HumanAverage — MVP (AI Quiz & Polls)

A minimal Next.js App Router project to launch AI-style quizzes and simple polls for AdSense + Discover.

## Quickstart

```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000 and try the quiz:
- `/quiz/focus-vs-distraction`

## Structure
- `app/` — App Router pages (home, quiz, polls, trust pages)
- `lib/` — quiz content and helpers
- `components/` — client-side quiz component + AdSense block
- `app/og/quiz/[slug]/route.ts` — dynamic shareable image (Open Graph)

## AdSense
Set `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` in `.env.local`. The script is injected in `app/layout.tsx`.
Place `<AdSenseBlock />` components where appropriate; avoid aggressive placements.

## Supabase (optional for MVP)
You can enable realtime results storage later. Suggested schema is in `supabase/schema.sql`.

## SEO / Discover basics
- Clear titles & descriptions; large OG images.
- People-first content; avoid misleading claims.
- Provide trust pages: About, Editorial Policy, Corrections, Contact.

## License
For your project use.
