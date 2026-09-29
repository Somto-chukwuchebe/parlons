# Parlons — project notes for Claude

Speaking-first language-learning PWA. Local-first, offline, no backend. The owner is not a
professional developer: explain decisions in plain language. SPEC.md is the brief — don't add
features beyond it without asking; suggest them at the end of a phase.

## Commands
- `npm run dev` — dev server on http://localhost:5173
- `npm test` — Vitest (unit + component tests)
- `npm run build` — type-check + production build into `dist/` (includes service worker)
- `npm run preview` — serve the production build locally (test offline/PWA here, not in dev)
- `npm run icons` — regenerate icons + iOS splash screens from `scripts/make-icons.mjs`
- `npm run seed-doc` — regenerate `docs/seed-review-fr.md` from the pack (do this after editing seed)

## Architecture
- `src/config.ts` — app name, programme length, review caps. Change the name here only.
- `src/packs/` — **everything language-specific**. `types.ts` = Zod schema; `index.ts` = registry
  + `loadPack()`; `fr/` = French (curriculum months 1–3, extras, AI templates in `fr/ai/*.md`).
  UI code must never hard-code French: take text, locale, voices, colours, typography,
  mistake categories and scenarios from the pack.
- `src/db/schema.ts` — Dexie (IndexedDB). Every learning row has `lang`. **Migrations: never edit a
  released `version(n)`; add `version(n+1)` with `.upgrade()`.** Add new tables to `TABLES` so backup covers them.
- `src/lib/program.ts` — 90-day calendar. Week 1 is short (start Tue–Wed) or long (start Thu–Sun) so
  weeks 2–12 run Mon–Sun and weekly reviews fall on Sundays. Leftover days = "final stretch".
- `src/lib/srs.ts` — cards appear as their week arrives (`ensureDeck`), ≤10 new/day, sessions capped
  (`REVIEW_CAP`); `order` field sets introduction order (learner cards first, clozes after their week).
- `src/lib/backup.ts` — zip export/import (fflate): `backup.json` with `$date`/`$blob` markers + `audio/*`.
- `src/app/` — providers, router (hash router for GitHub Pages), layout. `src/routes/` — screens.
- Seed edits by the learner live in `seedOverrides` (the pack stays untouched); `lib/seed.ts` merges them.

## Design system (Parlons' own identity — deliberately not Red Pen's)
- Friendly, lightly gamified. Font: Nunito (bundled via @fontsource-variable, cached offline).
  Icons: lucide-react. Headings are font-black; body font-semibold.
- Colours: pack accent (French blue) for actions/path; navy for brand panels; rouge for streak and
  recording; gold for earned goals; good/hard/again for grading. Tokens in `src/index.css`.
- Primary buttons are "pressable" (`.press` + `--lip`); cards are rounded-3xl with 2px borders.
- Signature element: the course as a metro line ("stations" = weeks, `components/MetroLine.tsx`).
- Layout: sidebar on md+, bottom tab bar on phones; pages use max-w-6xl and 2-column grids on lg.
- Shared pieces in `components/ui.tsx` (Button, LinkButton, Card, PageHeader, Eyebrow, fields,
  Toggle, Segmented, ProgressRing, StreakBadge, StatPill). Reuse them; don't restyle ad hoc.

## Conventions
- TypeScript strict, React function components, Tailwind v4 with colour tokens in `src/index.css`
  (`bg-accent`, `text-muted`, `bg-surface`, …). No hard-coded colours in components.
- Target-language text goes through `<TL>` (applies pack typography and `lang`).
- Anything external (speech recognition, AI) must fail gracefully and never block a session.
- No runtime CDNs, web fonts or analytics (must work in Russia without a VPN).
- Tests that store Blobs in fake-indexeddb need `// @vitest-environment node` (jsdom Blobs don't clone).
- Commit after each phase with a clear message.

## Status
- Phase 1 (foundation) done: PWA/install page, French pack, Dexie schema, seed review, backup, onboarding.
- Design pass done (own identity, desktop sidebar layout, streak logic in `lib/streak.ts`).
- Phase 2 done: guided session player (`routes/Session.tsx`, pure logic in `lib/session.ts`), speak-first
  FSRS review (`lib/srs.ts`, `components/ReviewDeck.tsx`), phrase bank + quick add, basic recorder
  (`lib/recorder.ts`, `components/Recorder.tsx`), end-of-session summary ("What you did").
- Decisions: no XP/levels (owner wants focus on real learning, not a Duolingo clone). Keep streak,
  minutes ring, can-do goals, metro line, celebrations + factual summary.
- Next: Phase 3 — recorder self-ratings and mistake tagging, Then and now, full shadowing player with
  open-licence native audio, pronunciation check.

## Agreed decisions (from chat with the owner)
- Logo: option D4 (navy tile, red stem, white speech-bubble "p"). Palette as in `src/index.css`.
- Start date 1 Oct 2026; programme is 90 days from the chosen start date.
- Streak: any session ≥10 min counts; the day ends at local midnight.
- Shadowing audio (Phase 3): owner wants natural native-speaker audio from open-licence sources
  (candidates: Tatoeba, Mozilla Common Voice, Lingua Libre). Verify each licence, bundle clips
  for offline use, credit them on an About page, and fall back to TTS where no clip exists.
- Interface English only for now (no Russian notes).
