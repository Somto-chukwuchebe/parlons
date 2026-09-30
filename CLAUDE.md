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
- Service worker: `registerSW` must use `immediate: true` (it's called after `load`; the default waits for
  `load` and silently never registers). `installUpdate` reloads when nothing is waiting. Test updates on the
  live site: open → push a version bump → Settings → Check for updates → Update now → version changes.
- Commit after each phase with a clear message.

## Status
- Phase 1 (foundation) done: PWA/install page, French pack, Dexie schema, seed review, backup, onboarding.
- Design pass done (own identity, desktop sidebar layout, streak logic in `lib/streak.ts`).
- Phase 2 done: guided session player (`routes/Session.tsx`, pure logic in `lib/session.ts`), speak-first
  FSRS review (`lib/srs.ts`, `components/ReviewDeck.tsx`), phrase bank + quick add, basic recorder
  (`lib/recorder.ts`, `components/Recorder.tsx`), end-of-session summary ("What you did").
- Decisions: no XP/levels (owner wants focus on real learning, not a Duolingo clone). Keep streak,
  minutes ring, can-do goals, metro line, celebrations + factual summary.
- Phase 3 done: recording self-review + mistake tagging → error cards (`components/RecordingReview.tsx`),
  Speak hub + recordings list, Then and now (`routes/ThenAndNow.tsx`, rounds 1/4/8/12 + weekly snapshot),
  shadowing player with A-B loop/speed/record/play-both (`components/ShadowPlayer.tsx`), imported clips,
  pronunciation check via Web Speech (`lib/speech.ts`, approximate, hidden when unsupported),
  native audio from Tatoeba (`scripts/build-audio.mjs` → `public/audio/fr/*.mp3` + `src/packs/fr/audio.json`;
  only CC BY-SA 4.0 / CC BY-NC 4.0; credits on /about). Review cards use native audio when the text matches.
- Speaking totals = recording durations + logged call minutes (`lib/stats.ts`), not stage time.
- Phase 4 (prompt-builder part) done: conversation log (`components/ConversationForm.tsx`, `routes/Conversations.tsx`),
  mistake journal with recurrence → extra error cards and 2-week trends (`lib/mistakes.ts`, `routes/Mistakes.tsx`),
  AI role-play prompt builder + paste-back with Zod validation and a review step (`lib/aiReport.ts`,
  `lib/template.ts`, `routes/RolePlay.tsx`; templates in `src/packs/fr/ai/*.md`). Session Conversation stage offers
  call / AI role-play / self-talk.
- Direct AI voice mode (16b): owner declined after the privacy/cost/security explanation. Don't build it unless asked.
- Phase 5 done: dashboard (`routes/Progress.tsx`, lazy-loaded with Recharts; numbers in `lib/progress.ts`),
  Sunday weekly review with can-do ticks and rule-based stage suggestion (`routes/WeeklyReview.tsx`, `lib/weekly.ts`),
  final fluency check with before/after self-assessment (`routes/FluencyCheck.tsx`), calendar reminder (`lib/ics.ts`).
  Phone nav: Today, Phrases, Speak, Progress, More (`routes/More.tsx`); sidebar shows everything.
- Extras after Phase 5: app-icon badge (`lib/badge.ts`, opt-in in Settings; iOS needs notification permission),
  resume-shadowing shortcut (`lib/lastShadow.ts`, localStorage), history-aware `BackButton` in `PageHeader`
  (falls back to the given path), update checks on foreground + hourly and a Settings "Check for updates" (`lib/pwa.ts`),
  version string `__APP_VERSION__` from vite.config.ts (bump `version` in package.json for notable releases).
- Chart colours: `--chart-1/2` and `--heat-0..4` in `index.css`, validated with the dataviz palette checker
  (light and dark). Single-series charts where possible; a table view exists for the weekly numbers.

## Agreed decisions (from chat with the owner)
- Logo: option D4 (navy tile, red stem, white speech-bubble "p"). Palette as in `src/index.css`.
- Start date 1 Oct 2026; programme is 90 days from the chosen start date.
- Streak: any session ≥10 min counts; the day ends at local midnight.
- Shadowing audio (Phase 3): owner wants natural native-speaker audio from open-licence sources
  (candidates: Tatoeba, Mozilla Common Voice, Lingua Libre). Verify each licence, bundle clips
  for offline use, credit them on an About page, and fall back to TTS where no clip exists.
- Interface English only for now (no Russian notes).
