# Parlons

A speaking-first language app: a guided daily session gets you talking out loud, and your progress is shown honestly. It works offline, keeps all data on your device, and has no accounts. French is the first course.

---

## 1. Run it on your Mac

You need Node.js (you have it: version 24).

Open Terminal in the project folder and run:

```bash
npm install
```

(Only needed the first time, or after pulling new changes.)

```bash
npm run dev
```

Then open http://localhost:5173 in your browser. Press `Ctrl + C` in Terminal to stop it.

To test the real offline, installable version locally:

```bash
npm run build && npm run preview
```

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Runs the automated tests |
| `npm run seed-doc` | Rebuilds `docs/seed-review-fr.md` (the readable course) after editing course files |
| `npm run icons` | Rebuilds the app icons and iPhone splash screens |
| `npm run audio` | Rebuilds the bundled native audio from Tatoeba (after editing `audio-picks.json`) |

## 2. Put it online (GitHub Pages)

The app is a set of static files, so GitHub Pages hosts it for free. You set this up once:

1. On github.com, create a new **empty** repository called `parlons` (no README or licence).
2. In Terminal, in the project folder, replace `YOUR-USERNAME` and run these one at a time:

   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/parlons.git
   ```

   ```bash
   git push -u origin main
   ```

3. On GitHub, open the repository, then go to **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to show a green tick (about 1–2 minutes).
5. Your app is now at `https://YOUR-USERNAME.github.io/parlons/`.

After that, every `git push` publishes a new version automatically. Installed copies check for it whenever they're opened online and show an **Update now** banner. You can also go to **Settings → App version and updates → Check for updates** at any time; the version number there tells you which build you have.

> GitHub Pages is normally reachable from Russia. If it's ever blocked, the installed app keeps working offline; only updates wait.

## 3. Install it on each device

Open your app's web address on the device, then:

- **iPhone or iPad:** use Safari → **Share** button → **Add to Home Screen** → **Add**. Open it once while online so it saves itself for offline use.
- **Mac:** use Safari → **File → Add to Dock…** Or in Chrome, click the install icon in the address bar.
- **Android:** use Chrome → ⋮ menu → **Add to Home screen** → **Install**.
- **Windows or Linux laptop:** use Chrome or Edge → install icon in the address bar.

The app also has these steps built in: **Settings → Install Parlons on this device**.

## 4. Back up, and move data between devices

Each device keeps its own data, with no cloud sync. Backups are how you protect your data and move it between devices.

- **Back up:** go to **Settings → Export backup**. On iPhone, the share sheet opens; choose **Save to Files** (iCloud Drive is ideal). On a laptop, a `.zip` file downloads. The file contains everything, including your voice recordings.
- **Restore or move to another device:** on the new device, go to **Settings → Import a backup…** and pick the zip. You'll see a preview of what's inside, then choose:
  - **Merge:** keeps what's on this device and adds what's in the backup.
  - **Replace:** wipes this device and restores the backup exactly.
- The Today screen reminds you if your last backup is more than a week old.

## 5. Your daily session

On **Today**, pick 10, 30, 45 or 60 minutes and tap **Start session**. The app walks you through the stages:

- **Review:** see the English, **say the French out loud**, then tap *Show answer* to hear it and grade yourself (Again / Hard / Good / Easy). On a laptop: Space reveals, keys 1–4 grade.
- **Structure:** this week's grammar pattern, with model sentences to listen to and repeat. You can note an outside lesson, e.g. a Language Transfer track.
- **Shadowing:** speak along with the voice; *Loop ×5* leaves a pause after each play for you to repeat.
- **Speak:** answer prompts out loud; tap the red button to record, then listen back.
- **Conversation** (45 and 60 min): log a real call, or do a 60-second self-talk.

Skip or add 2 minutes to any stage; a soft chime tells you when a stage's time is up. To go back to an earlier stage, tap it in the row of stages at the top (or "← Back to …" under the stage title). Time counts towards whichever stage you're on, and **Next** returns you to where you left off. At the end you'll see exactly what you did. Any day with 10+ minutes keeps your streak.

The **10-minute** option is review plus speaking, for busy days.

Interrupted? Your progress saves as you go (and the moment you leave the app). Today then shows **Pick up where you left off**: tap **Resume** to continue at the same stage, or **Dismiss**. Time already spent always counts.

Missed a few days? Reviews are capped per session, so there is never a mountain waiting; the rest are rescheduled.

## 6. Speaking tools (the Speak tab)

- **Recordings:** after recording an answer, rate yourself (fluency, accuracy, pronunciation, 1–5), optionally type what you said (for words per minute), and **tag mistakes**. Each tagged mistake can become a "fix it" card: you'll see what you said and must say the correct version.
- **Shadowing:** 12 real native-speaker sentences per week, plus model sentences and any audio you import (podcast or lesson clips). Set A and B points to loop a section, slow it to 0.5×–1.25×, record yourself, then **Play both** to compare.
- **Then and now:** record the same three prompts in weeks 1, 4, 8 and 12, then play week 1 and your latest back to back. There's also an optional 2-minute weekly snapshot.
- **Pronunciation check (optional):** shows what your device heard, highlighting words that differ, plus words per minute. It's approximate, needs internet, and only appears where the browser supports it (Safari on iPhone, Chrome/Edge on laptops).

The native audio comes from [Tatoeba](https://tatoeba.org), used under each speaker's Creative Commons licence (CC BY-SA 4.0 or CC BY-NC 4.0); see **Settings → About and credits**. To change the clips, edit `src/packs/fr/audio-picks.json` and run `npm run audio`.

## 7. Conversations, mistakes and AI role-play (also on the Speak tab)

- **Conversations:** log each tutor or language-exchange call: date, partner, minutes, topics and how confident you felt. Add new words as you go; one tap on **Add to phrases** turns each into a card. Add the mistakes you made, too.
- **Mistake journal:** your mistakes grouped by type (gender and agreement, verb forms, tense choice, prepositions, word order, pronunciation, vocabulary). Each type shows whether it's going up or down over the last two weeks. **Recurring** mistakes (the same correction logged again) automatically get an extra "fix it" card.
- **AI role-play:** pick a scenario and a correction style (*Flow*: corrections at the end; *Coach*: after every turn). Tap **Copy prompt** (or **Share to an app** on iPhone) and paste it into any AI chat assistant. Have the conversation; type *help* for a hint and *fin* to finish. Copy the AI's final reply, including the ```json block, and paste it back into Parlons. You'll see its mistakes and useful phrases, can edit or untick any of them, then save: mistakes go to your journal as "fix it" cards and phrases go to your bank. If the reply can't be read, fill the same form in by hand.
- **Self-talk:** a random everyday prompt with a 60-second recording, on the Speak tab and in the session's Conversation stage.

## 8. Progress, weekly review and the final check

- **Progress tab:**
  - your streak, and a heatmap of all 90 days;
  - minutes by stage, with speaking highlighted;
  - speaking per week, and your weekly self-ratings;
  - words per minute, calls with people, and longest conversation;
  - phrases learned and review retention (how often you remember a card when it comes back);
  - mistakes by type over time, and can-do goals ticked per week.
  A "Show the weekly numbers as a table" option gives the same data in plain rows.
- **Weekly review (Sundays; the Today screen reminds you):**
  - the week's numbers and your top recurring mistakes;
  - tick the can-do goals you've really reached;
  - what felt easier or harder, confidence, and an overall rating;
  - a suggestion for which stage to give more time next week, with the reason;
  - an optional AI-coach prompt to copy;
  - a reminder to record your weekly snapshot and to back up.
- **Final fluency check (week 12):** a recorded 10-minute self-test in five parts: introduce yourself, last weekend, plans, an opinion, a short story. Then play your week 1 recording against today's, and redo the day-one self-assessment to compare levels.
- **Number on the app icon:** Settings → *Number on the app icon* shows how many phrases are waiting today. On iPhone, allow notifications when asked (Apple requires it for icon numbers; Parlons never sends any). The number refreshes whenever you open the app.
- **Resume shadowing:** Today and the Speak tab show a shortcut back to the last clip you shadowed.
- **Daily reminder:** Settings → *Add to my calendar* creates a calendar file with a daily study event at your chosen time for all 90 days. On iPhone choose Calendar; it alerts you at the start time. This works without any server.

## 9. Reviewing and editing the course

The whole 12-week French course is in `docs/seed-review-fr.md` (readable on GitHub). In the app, open the **Course** tab: tap **Edit** on any phrase to fix or hide it. Items marked ⚑ are ones worth double-checking.

To change the course for everyone, edit the files in `src/packs/fr/`, then run `npm run seed-doc`.

## 10. Optional AI voice mode

Not built, by choice: the prompt builder (section 7) works with any AI chat app for free, including their voice modes. A direct voice mode would need your own paid Anthropic API key stored on the device, may not be reachable from Russia, and adds privacy and security trade-offs.

## 11. How the 90-day programme is laid out

- The programme runs for 90 days from your start date.
- Weekly reviews are always on Sunday, so weeks 2–12 run Monday to Sunday.
- Week 1 absorbs the difference:
  - **Start on a Monday:** a normal 7-day week 1.
  - **Start on a Tuesday or Wednesday:** a short week 1.
  - **Start Thursday to Sunday:** a long week 1 (8–11 days).
- The 2–8 days left after week 12 are the **final stretch**: catch-up and conversation practice.
