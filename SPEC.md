# Build "Parlons": my speaking-first language learning app

> How to use: create an empty project folder, save this file in it as `SPEC.md`, open Claude Code in that folder, and send:
> "Read SPEC.md in full. Give me a short build plan and your questions, then wait for my go-ahead."

## 1. Who I am and what I need

I'm an English-speaking adult (also fluent in Russian) living in Moscow. I know some beginner French phrases, but my knowledge is patchy and unstructured. Over the next 12 weeks (October–December 2026) I'll study 30–60 minutes a day. My goal is to hold everyday conversations in French by the end of the year, roughly CEFR A2 in speaking, heading towards B1. Concretely: a 10–15 minute unscripted conversation about myself, my work, recent events, plans and simple opinions, without switching to English.

I learn best by speaking. The app must get me talking out loud every single day, not just tapping flashcards. It also needs to show me honestly whether I'm improving.

The app is called **Parlons** ("let's talk"). Keep the name in one config constant so I can change it.

**French is the first language, not the only one.** I plan to add other common languages later. Build the app language-agnostic from the start (see §4), but only build and seed French in version 1.

I'm not a professional developer. Explain decisions in plain language and give me clear instructions to run, install and back up the app.

## 2. Devices and constraints

- **Installable web app (PWA)** on my iPhone (Safari → Add to Home Screen), MacBook (Safari → Add to Dock, or Chrome), Android phone and any laptop. It must work fully offline once installed, because I'll use it on the Moscow metro.
- Add an in-app **"Install on this device"** page with the right steps for each browser. Include iOS splash screens, `apple-touch-icon`, maskable icons and safe-area handling.
- **Local-first.** Store everything on the device in IndexedDB (Dexie), including my voice recordings as audio blobs. Call `navigator.storage.persist()` and show storage usage.
- **No accounts, no backend, no paid services** in version 1. The only optional external call is the AI mode in §5 Phase 4, off by default.
- **Must work in Russia without a VPN.** No Google Fonts, analytics or runtime CDNs; bundle all assets. Any feature that depends on an external service (browser speech recognition, AI API) must fail gracefully and never block a session.
- **Backups and moving data between devices.**
    - Export everything to a single file: JSON plus audio in a zip.
    - Import it on another device, with a preview and a choice to merge or replace.
    - On iPhone, use the share sheet.
    - Remind me weekly to back up.
- **Stack:** Vite, React, TypeScript, Tailwind CSS, Dexie, React Router, vite-plugin-pwa, date-fns, Recharts, `ts-fsrs` for spaced repetition, Zod for validating imported and AI-generated data, and Vitest with React Testing Library. Keep dependencies minimal and explain any you add.
- **Deploy:** a static build on GitHub Pages; also runnable locally with one command.

## 3. Core learning method the app must support

Each daily session follows a fixed shape. I pick 30, 45 or 60 minutes when I open the app (default from onboarding), and a guided session timer walks me through the stages.

| Stage | 30 min | 45 min | 60 min | What happens |
|---|---|---|---|---|
| Review | 5 | 7 | 8 | Spaced-repetition review of phrases. Always answer **out loud first**, then reveal and self-grade |
| Structure | 10 | 12 | 15 | Today's lesson: one grammar pattern or function, with 5–10 model sentences. I log my external lesson here (e.g. Language Transfer track number) |
| Shadowing | 7 | 9 | 12 | Loop a short audio clip and repeat along with it (A-B repeat, 0.75× speed option), plus a short pronunciation drill |
| Speak | 8 | 10 | 15 | Answer 1–3 speaking prompts out loud while the app records; listen back and self-rate |
| Conversation | – | 7 | 10 | Log a tutor or language-exchange call, or do a self-talk / AI role-play task |

- Sessions must be flexible: let me skip or extend a stage. Log the actual minutes per stage.
- **Short-on-time mode (10 min):** Review (4) + Speak or self-talk (6). Counts toward the streak.
- If I miss days, don't pile up a punishing backlog: cap reviews per session and let FSRS reschedule the rest.
- On days with a real tutor or exchange call, logging the call can replace the Conversation stage.

## 4. Language-pack architecture

Everything language-specific lives in a **language pack** (e.g. `src/packs/fr/`), loaded by a language code stored in settings. The rest of the app must not hard-code French. A pack contains:

- curriculum seed (weeks, themes, grammar focus, can-do goals, phrases, prompts);
- speech settings: TTS and recognition locale (`fr-FR`), preferred voice names;
- pronunciation drills (for French: nasal vowels an/on/in, u vs ou, é/è, the French R, liaison and silent letters);
- typography rules (for French: non-breaking spaces before ? ! : ;);
- AI role-play templates and scenario list;
- mistake categories that are language-specific (e.g. gender and agreement).

Card, recording, session and progress data is tagged with the language code, so a second language later gets its own streak, deck and dashboard. In v1, show no language switcher beyond a disabled "More languages coming" note in settings.

## 5. 12-week French curriculum (seed data; editable)

Seed these weeks with a theme, a grammar focus, 3–5 "I can…" speaking goals, about 30 key phrases, and 6+ speaking prompts each. Write the phrases and prompts in natural, everyday French with English translations. Show me the full seed for review before the app uses it, and flag anything you're unsure about.

**Month 1 (weeks 1–4): foundations and pronunciation**

| Week | Theme | Grammar focus |
|---|---|---|
| 1 | Sounds of French and introducing myself | nasal vowels, silent letters, liaison; être, s'appeler; greetings; where I live and what I do |
| 2 | My day | present tense of common -er verbs; avoir, faire; time and days; daily routine |
| 3 | Food, cafés and shops | vouloir, pouvoir; je voudrais…; numbers and prices; ordering and asking politely |
| 4 | Questions and getting around | est-ce que, inversion basics, question words; aller; directions and transport |

**Month 2 (weeks 5–8): past, future and opinions**

| Week | Theme | Grammar focus |
|---|---|---|
| 5 | Last weekend | passé composé with avoir |
| 6 | Where I went | passé composé with être; common irregular past participles |
| 7 | Plans | futur proche (je vais + infinitive); invitations, accepting and declining |
| 8 | Opinions | je pense que, je trouve que, j'aime / je préfère… parce que; describing people and places |

**Month 3 (weeks 9–12): real conversation**

| Week | Theme | Grammar focus |
|---|---|---|
| 9 | Stories | imparfait for background vs passé composé for events (basics); telling a short story |
| 10 | Wishes and politeness | conditionnel (je voudrais, j'aimerais, ce serait); making suggestions |
| 11 | Keeping a conversation going | fillers and connectors (alors, en fait, du coup, bon, d'ailleurs); asking someone to repeat or slow down; rephrasing when stuck |
| 12 | Final review and fluency check | mixed practice; my 10-minute conversation test |

Also seed a set of **repair phrases** available from week 1 (Comment dit-on… ? Vous pouvez répéter ? Plus lentement, s'il vous plaît. Je veux dire…) and a **"personal script"** section in weeks 1–2 where I write and record short texts about myself that become phrase cards.

## 6. Features, in build order

### Phase 1: foundation

1. Project setup; PWA with iOS, macOS and Android install support; the "Install on this device" page.
2. Language-pack structure (§4) with the French pack.
3. Dexie schema with migrations; all learning data tagged by language.
4. Seed curriculum review screen.
5. Export and import, including audio.
6. Onboarding:
    - my start date (default Monday 5 Oct 2026) and end date (31 Dec 2026);
    - daily target (30 / 45 / 60 min) and preferred study time;
    - TTS voice choice from available French voices, with playback speed (0.7×–1.2×);
    - a quick self-assessment using CEFR A1–B1 speaking can-do statements, to set my starting point.

### Phase 2: daily session (the heart of the app)

7. **Today screen.**
    - This week's theme and goals, and one big "Start today's session" button (with 30/45/60 and 10-minute options).
    - My streak and minutes today.
    - How many phrases are due.
8. **Guided session player.**
    - Stage timer with gentle chimes.
    - Next/skip/extend controls.
    - Summary at the end, including minutes spoken.
9. **Phrase bank with spaced repetition (FSRS).**
    - Card types: phrase cards (French ↔ English, notes, audio source), cloze cards, and **error cards** (my wrong sentence → say the corrected version). Prefer full sentences over single words.
    - Audio can be a French text-to-speech voice (Web Speech API; offline voices on Apple devices), my own recording, or an imported clip.
    - Review is speak-first: prompt, I say it aloud, then reveal and grade (Again / Hard / Good / Easy).
    - Add phrases fast from anywhere in the app. Cards also arrive automatically from conversation logs, the mistake journal and AI feedback.

### Phase 3: speaking tools

10. **Speaking recorder.**
    - Record answers to prompts (MediaRecorder; test that the format plays back on iOS Safari), and play them back.
    - Self-rate fluency, accuracy and pronunciation on a 1–5 scale.
    - Tag mistakes, and add a corrected version that goes to the phrase bank.
    - Track total speaking minutes.
11. **Then and now.** The same benchmark prompts ("Présente-toi et raconte ta semaine" plus 2–3 others) get re-recorded in weeks 1, 4, 8 and 12. I can play week 1 next to later weeks to hear my progress. Offer an optional 2-minute weekly snapshot on the same prompt as part of the Sunday review.
12. **Shadowing player.**
    - Import audio files (podcast or lesson clips I've downloaded), or use TTS for seeded sentences.
    - Set A-B loop points, change speed (0.5–1.25×) and add a transcript.
    - Listen → record myself → play both back-to-back → self-rate.
    - Save clips per week. Include the pack's minimal-pair pronunciation drills.
13. **Optional pronunciation check.** Use browser speech recognition (fr-FR) where available to show what the device heard me say, highlighting words that differ from the target sentence. Where a transcript is available, also calculate words per minute. It must be clearly labelled as approximate, degrade gracefully when unavailable or offline, and never block a session.

### Phase 4: conversation practice

14. **Conversation log** for tutor and language-exchange calls:
    - date, partner, duration and topics;
    - new words (one tap to add to the phrase bank);
    - mistakes I made;
    - a confidence rating.
15. **Mistake journal.** Recurring mistakes, grouped by type (gender and agreement, verb forms, tense choice, prepositions, word order, pronunciation), each with correct examples. Recurring ones generate extra error cards. Show whether each category is going up or down over time.
16. **AI role-play, two modes.**

    **a) Prompt builder (default, works anywhere).** Pick a scenario (café, meeting a colleague, asking directions, weekend chat, job interview, making plans, complaining politely at a hotel, discussing a film, or "surprise me") and the app writes a ready-to-copy prompt for any AI chat assistant. The prompt asks the AI to:
    - play the role at my current level, using this week's grammar and phrases;
    - keep replies to 1–3 sentences and always end with a question, so I speak more;
    - offer a hint in English if I write "help";
    - by default correct me only at the end ("flow mode"), or, if I choose "coach mode", give a brief correction after each of my turns;
    - finish with a feedback report containing what I did well, my top 3 recurring mistakes (my version → correct version → one-line explanation), 5 phrases I could have used, an estimated level for the conversation and one focus for tomorrow — **plus the same report as a fenced JSON block** in a schema the app defines.

    Then I paste the AI's reply back into the app. The app validates the JSON with Zod (falling back to a manual form if parsing fails), saves the report, adds mistakes to the journal and turns corrections and useful phrases into cards (with a review step before they're added).

    **b) Direct voice mode (optional; off by default).** A setting where I enter my own Anthropic API key, stored locally only, with the model name configurable (default `claude-sonnet-5-5`). Before building it, explain in plain language the privacy trade-offs, the cost (API usage is billed separately), the security risk of calling the API from the browser with my own key, and that availability from Russia may depend on network conditions. If enabled, it runs the same role-play as a voice loop:
    - push-to-talk → speech recognition (fr-FR) → AI reply → shown on screen and read aloud with TTS, with a typed-input fallback;
    - flow/coach correction toggle and a "help" button that suggests 2–3 phrases I could say next;
    - saves the transcript, tracks my number of turns and average words per turn;
    - ends with the same structured feedback report as mode (a), processed the same way.

    Keep all AI prompts as editable template files inside the language pack.
17. **Self-talk mode.** A random everyday prompt ("Describe what you see out the window", "Plan tomorrow out loud") with a 60-second timer and recording.

### Phase 5: progress

18. **Progress dashboard.**
    - Streak and a daily minutes heatmap.
    - Minutes by stage, with speaking minutes highlighted.
    - Speaking metrics: total minutes spoken (recordings + logged calls + AI sessions), words per minute and words per turn where transcripts exist, longest conversation.
    - Phrases learned vs. due, and review retention rate.
    - Mistake categories over time.
    - Can-do statements ticked per week.
    - Weekly self-rating trend.
    - Conversation-log totals: calls and minutes spoken with real people.
19. **Weekly review** (Sunday). A short check-in:
    - what felt easier, what felt hard, and my confidence rating;
    - a summary of the week's numbers and top recurring mistakes;
    - the app suggests which stage to give more time next week (rule-based; optionally generate an "AI weekly review" prompt I can copy, like §16a);
    - backup reminder.
20. **Final fluency check** (week 12). A structured 10-minute self-test, recorded:
    - introduce yourself;
    - describe your last weekend;
    - talk about plans;
    - give an opinion;
    - tell a short story.

    Show it alongside my week 1 recording, with a simple A1–B1 self-assessment summary.
21. **Reminders.** Generate an `.ics` file with a recurring daily study event at my chosen time, which I can import into my phone's calendar. This works reliably on iPhone without a server.

## 7. Design and usability

- Friendly and focused, with a clean look and a French-blue accent (make the accent colour part of the language pack, so each language can have its own). The design should make a 30-minute session feel doable, not overwhelming.
- Mobile-first: big buttons for recording and grading; usable one-handed on a phone; a large push-to-talk button.
- Interface in English. Learning content in the target language, with a toggle to show or hide the English.
- Correct typography per language pack (French: non-breaking spaces before ? ! : ;).
- Light and dark mode; accessible contrast, keyboard navigation and visible focus states.
- Clear, friendly error messages for no microphone permission, unsupported speech features, being offline, full storage and AI failures.

## 8. How I want you to work

1. Read this whole brief first. Give me a short build plan (phases, key files, data model) and any questions, then wait for my go-ahead.
2. Create a `CLAUDE.md` with project conventions, commands and architecture notes, and keep it updated.
3. Build one phase at a time. After each phase:
    - run the tests and the dev server, and fix any errors;
    - commit to git with a clear message;
    - tell me in plain language what I can now try, on my phone and on my laptop.
4. Write tests for:
    - the spaced-repetition scheduling;
    - session timing (including the 10-minute mode and skipped/extended stages);
    - export/import round trip, including audio;
    - streak calculation;
    - parsing and validating the AI feedback JSON;
    - language-pack loading.
5. Keep a `README.md` covering how to run, install on each device, back up, move data between devices, deploy, and (if built) set up the optional AI mode.
6. Don't add features beyond this brief without asking; suggest them at the end of a phase.

## 9. Definition of done

- Parlons is installed on my iPhone, MacBook and Android phone and works offline.
- Every day I can open it, run a 10-, 30-, 45- or 60-minute guided session, speak and record, and review phrases out loud.
- I can run AI role-plays through the prompt builder, paste back the feedback, and have mistakes and phrases turned into cards automatically.
- I can log conversations, and turn mistakes into cards.
- I can see honest progress: speaking minutes, mistake trends, can-do goals, and my week 1 vs. week 12 recordings.
- All data, including recordings, can be exported and restored without loss.
- Adding a second language later means adding a new language pack, not rewriting the app.
