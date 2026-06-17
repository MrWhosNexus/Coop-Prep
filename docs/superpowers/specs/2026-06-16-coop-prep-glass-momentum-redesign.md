# COOP Prep — Glassmorphism + Momentum Redesign

**Date:** 2026-06-16
**Status:** Approved design, pending implementation plan
**Project:** `C:\Users\yygbu\coop-prep` (Next.js 16, App Router, localStorage-only)

## Goal

Redesign the COOP Prep learning app into a **full glassmorphism** UI, reusing the
proven glass design language from **g-assist-pro**, and optimize the layout for
**momentum & rewards** by adding new gamification mechanics. The current solid
"fintech-dark" theme is replaced.

This supersedes the earlier design decision (recorded in the second-brain wiki)
that glassmorphism was rejected as "claustrophobic." The user has explicitly
reversed that decision and chosen full glass.

## Current state (verified 2026-06-16) — IMPORTANT correction

The wiki is wrong on two counts. The repo does **not** ship the solid
"fintech-dark" theme the wiki describes, and the app is **not** visually
complete. The actual state:

- `app/globals.css` defines a glassmorphism sheet (violet/blue radial gradient
  background; `.glass`, `.glass-md`, `.cta`, `.option-btn`, `.xp-pill`,
  `.step-card-*`; tokens `--violet`, `--blue`, `--text`, `--glass-*`).
- The three components (`Dashboard.js`, `LessonViewer.js`, `FlashcardDeck.js`)
  reference a **completely different vocabulary that `globals.css` never
  defines**: structural tokens `--bg`, `--card`, `--card-2`, `--card-hover`,
  `--sidebar`, `--sidebar-w`, `--border`, `--border-2`, radii `--r-sm/-md/-lg/-xl`,
  accent dims/rings `--gold-dim`, `--blue-dim`, `--blue-ring`, `--green-dim`,
  `--green-ring`, `--red-dim`, `--shadow-2`; and classes `.card`, `.card-2`,
  `.card-btn`, `.btn-primary`, `.btn-ghost`, `.nav-item`(+`.active`), `.nav-dot`,
  `.section-label`, `.divider`, `.progress-track`/`.progress-fill`, plus the
  `ring-fill` keyframe and the `.scalein` class.
- `layout.js` imports only `globals.css`. So those names resolve to nothing and
  the app renders **largely unstyled** (text colors only, no surfaces, no
  sidebar, no buttons). Only the color tokens `--blue(-2)`, `--gold(-2)`,
  `--green(-2)`, `--red`, `--text(-2/-3)` and the `.badge*`/`.fadein` classes
  overlap between the two systems.

**This mismatch is the unfinished work.** A glass stylesheet was dropped in but
the components were never migrated to it.

### Reconciliation decision (user-approved)

Rebuild `globals.css` to **define the vocabulary the components already
reference** (`--bg`, `--card`, `--sidebar`, `--border`, `--r-*`, `.card`,
`.nav-item`, `.btn-primary`, `.progress-track`, `ring-fill`, `.scalein`, …)
using **g-assist-pro's `dark-glass` values**. Because the components already
reference a complete, well-named vocabulary, defining it correctly makes them
render as glass with **near-zero JSX change**. The currently-unused classes
(`.glass`, `.cta`, `.option-btn`, `.step-card-*`, `.xp-pill`, `.streak-pill`)
are removed to leave one coherent system. This replaces the original spec's
assumption that the classes existed and merely needed restyling.

## Approach (chosen: B — extract a momentum engine, keep the shell)

- New mechanics live as **pure functions** in `lib/momentum.js` (independently
  unit-testable, no UI, no localStorage).
- State is shared through one thin `components/ProgressContext.js` provider,
  replacing the current prop-drilling of `progress` / `days` / `readiness`.
- The existing view shell (`home | module | lesson | flash`, React `useState`,
  no URL routing) is kept and restyled.
- The glass look is centralized in `app/globals.css` tokens + utility classes.
- The curriculum/data layer (`data/curriculum.js`) is unchanged.

Rejected alternatives: (A) inline everything into the already-large
`Dashboard.js` — would tangle view-switching with gamification logic; (C) full
rebuild — needless regression risk, the data layer and shell already work.

---

## Section 1 — Visual system (ported from g-assist-pro `dark-glass`)

Source of truth: `g-assist-pro/renderer/src/index.css` and `lib/theme-tokens.ts`.
coop-prep uses Tailwind v4 + hand-written utility classes (NOT shadcn), so the
**values** are ported into `app/globals.css` as plain CSS custom properties and
two utility classes — not g-assist's `@apply`/`@theme` setup.

### Tokens (added to `:root` in `globals.css`)

```
--gap-bg-from:     oklch(0.11 0.018 260)   /* deep navy */
--gap-bg-to:       oklch(0.05 0.012 250)
--gap-glass-1:     rgba(255,255,255,0.05)
--gap-glass-2:     rgba(255,255,255,0.09)
--gap-glass-3:     rgba(255,255,255,0.13)
--gap-glass-blur:  18px
--gap-glass-border:rgba(255,255,255,0.12)
--gap-accent:      #22d3ee                 /* cyan — global primary */
--gap-accent-dim:  rgba(34,211,238,0.22)
--gap-accent2:     #8b5cf6                 /* violet — secondary */
--gap-text-1:      oklch(0.95 0.01 240)
--gap-text-2:      oklch(0.68 0.02 240)
--gap-text-3:      oklch(0.48 0.02 240)
--gap-ok:          oklch(0.75 0.18 160)
--gap-warn:        oklch(0.80 0.16 75)
--gap-crit:        oklch(0.68 0.22 25)
--gap-radius:      0.875rem
```

The existing 7 per-module colors are kept and used as a **per-screen accent
override** (`--mod-color`): a module/lesson screen tints the cyan primary toward
its module color, matching current `mod.color` behavior in `LessonViewer`.

### Utility classes (added to `globals.css`)

- `.gap-gradient-bg` — `linear-gradient(135deg, var(--gap-bg-from), var(--gap-bg-to))`,
  applied to the app root; optional fractal-noise grain overlay (ported
  `.gap-overlay-bg` SVG noise) at low opacity for premium feel.
- `.glass-panel` — sheen gradient + `--gap-glass-1` fill +
  `backdrop-filter: blur(var(--gap-glass-blur)) saturate(140%)` + `1px` border +
  `box-shadow: 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)`.
  Used for the sidebar and large containers.
- `.glass-card` — same recipe at `--gap-glass-2` (more opaque) + brighter inset
  highlight. Replaces the current `.card` / `.card-2`.

The full component vocabulary (`.card`, `.card-2`, `.card-btn`, `.btn-primary`,
`.btn-ghost`, `.nav-item`+`.active`, `.nav-dot`, `.section-label`, `.divider`,
`.progress-track`/`.progress-fill`, `.badge*`, `.fadein`, `.scalein`) and the
structural tokens (`--bg`, `--card`, `--card-2`, `--card-hover`, `--sidebar`,
`--sidebar-w`, `--border`, `--border-2`, `--r-sm/-md/-lg/-xl`, `--gold-dim`,
`--blue-dim`, `--blue-ring`, `--green-dim`, `--green-ring`, `--red-dim`,
`--shadow-2`) plus the `ring-fill` keyframe are **created** in `globals.css`
mapped to g-assist-pro glass values:
`--bg` → the navy gradient; `--card`/`--card-2`/`--card-hover` → glass-1/2/3
fills with backdrop-blur; `--sidebar` → darker navy glass; `--border`/`--border-2`
→ white-12% / white-20%; `--r-md` → `--gap-radius` (0.875rem). Because the JSX
already references these exact names, defining them is what makes the app render
as glass — JSX changes are limited to removing the one hardcoded
`rgba(13,17,23,0.92)` sticky-header color in `LessonViewer.js` (→ translucent
navy glass).

### Typography

Add via `<link>` tags in `app/layout.js` `<head>` (NOT CSS `@import` — avoids the
documented Tailwind-v4 PostCSS parse error when `@import url()` follows
`@import "tailwindcss"`):

- **Barlow** — headings / display (`--font-display`)
- **Plus Jakarta Sans** — body (`--font-body`)
- **DM Mono** — all numeric readouts: XP, streak, percentages, days, timer
  (`--font-mono`)

### Motion / a11y

Keep the existing `@media (prefers-reduced-motion: reduce)` guard (g-assist uses
the same). All new animations (XP float, level-up, toast) must respect it.

---

## Section 2 — Momentum systems (new, all logic in `lib/momentum.js`)

`lib/momentum.js` exports **pure functions** only. No DOM, no localStorage, no
React. Inputs are plain state objects; outputs are plain values. This is the
unit-tested core.

### Level tiers — `levelFromXp(xp)`

Returns `{ level, tierName, xpInLevel, xpForNext, pct }`.

- Linear band: **250 XP per level** (subject to tuning constant `XP_PER_LEVEL`).
- Tier names by level band (fellowship-themed):
  - L1–2 **Novice**, L3–4 **Analyst**, L5–6 **Associate**,
    L7–8 **Strategist**, L9+ **Governance Lead**.

### Streak multiplier — `streakMultiplier(streakDays)`

- `1.0×` at 0–1 days, `+0.1×` per consecutive day, **capped at 2.0×** (day 7+).
- Applied to every XP award.

### XP award — `awardXp(baseXp, streakDays)`

- Returns `round(baseXp * streakMultiplier(streakDays))`.
- Base values unchanged from today: lesson complete `50`, perfect quiz `+25`.

### Daily goal — `dailyProgress(state, todayISO)`

- Default target **100 XP/day** (constant `DAILY_GOAL_XP`).
- Reads `state.daily` (see schema); if `state.daily.date !== todayISO`, treat
  today's earned as `0`. Returns `{ earned, goal, pct, met }`.

### Achievements — `evaluateAchievements(state, modules)`

- Pure rule evaluation returning the set of currently-earned achievement IDs.
- Initial achievement set:
  - `first-lesson` — ≥1 lesson complete
  - `module-master` — any module fully complete
  - `perfect-quiz` — any quiz answered all-correct
  - `streak-7` — streak ≥ 7
  - `cards-20` — ≥20 flashcards mastered
  - `capstone-complete` — module 7 fully complete
- The caller diffs earned-now vs `state.achievements` to detect *newly* unlocked
  (for toasts) and records `unlockedAt`.

### Focus timer

- Lightweight start/stop study timer (UI state in context; not in `momentum.js`).
- On stop, adds elapsed minutes to `state.daily` study minutes via a context
  action. `momentum.js` only provides formatting helper `formatDuration(sec)`.

### Instant feedback (UI, Section 3)

Floating `+XP`, level-up celebration, completion checkmark, achievement toast —
implemented in components, driven by context action return values.

---

## Section 3 — Layout & screens

Keep the **256px glass sidebar + scrolling main** shell and the four views.
Restyle all surfaces to glass. Specific changes:

### Home (`home`)
- **Momentum strip** at top: level/tier progress bar (Barlow name + DM Mono
  `xp/next`), **daily-goal ring**, **streak pill** showing current multiplier.
- Large glass **"Continue → <next lesson>"** CTA as the primary action
  (low-friction start = the core ADHD-momentum requirement).
- Stats row (Lessons / Quiz passes / XP / Streak) in DM Mono on glass cards.
- Module list restyled to glass rows (unchanged structure).

### Module (`module`)
- Glass lesson list; sequential-unlock behavior unchanged (locked = `<Lock>` +
  reduced opacity). Module-complete fires achievement toast.

### Lesson (`lesson`)
- Glass 3-tab viewer (Lesson / Quiz / Challenge), accent = `--mod-color`.
- On lesson complete and on perfect quiz: floating `+XP` animation + checkmark.

### Flashcards (`flash`)
- Glass 3D flip cards (existing perspective/`backfaceVisibility` technique kept).
- Mastering a card gives instant XP feedback; `cards-20` achievement check.

### Global
- Achievement **toast** layer (top-right), reduced-motion aware.
- **Level-up** celebration overlay when `levelFromXp` level increases.

---

## Section 4 — State & architecture

### `lib/progress.js` schema additions

Current: `{ completed, quizzes, xp, streak, ... }`. Add:

- `lastActiveDate` — ISO date string; drives streak continuation/reset.
- `daily` — `{ date: ISO, xp: number, lessons: number, minutes: number }`,
  reset when `date` rolls over.
- `achievements` — `{ [id]: unlockedAt ISO }`.

`level`, `tierName`, and `streakMultiplier` are **derived** (never stored).
A one-time migration in `loadProgress()` backfills the new fields on existing
saved state so current users don't break.

### `components/ProgressContext.js` (new)

- Provider loads progress in `useEffect` (preserves the current mount-gated
  pattern — server renders the spinner, client hydrates the spinner, then
  populates; this is why there is **no hydration mismatch** from `new Date()`,
  and the recently-added `suppressHydrationWarning` on `<body>` covers the
  unrelated browser-extension attribute injection).
- Exposes: `progress`, derived `momentum` (`level/tier/daily/multiplier`),
  `days`, `readiness`, and actions: `completeLesson(id)`, `recordQuiz(id, correct,
  total)`, `masterCard(id)`, `startFocus()/stopFocus()`.
- Each mutating action runs through `momentum.awardXp`, updates `daily`,
  re-evaluates achievements, persists via `saveProgress`, and returns a small
  result object (`{ xpGained, leveledUp, newAchievements }`) so the calling
  component can trigger feedback animations.
- `Dashboard` is wrapped in the provider; prop-drilling of `progress`/`days`/
  `readiness` through `AppShell` is removed in favor of `useProgress()`.

### Testing

- Add a minimal `node --test` setup (coop-prep currently has none): `npm test`
  → `node --test test/`.
- **TDD on `lib/momentum.js`**: write `test/momentum.test.js` first covering
  `levelFromXp` band boundaries, `streakMultiplier` cap, `awardXp` rounding,
  `dailyProgress` date rollover, and `evaluateAchievements` rules. Implement to
  green. (Per superpowers TDD discipline and g-assist-pro's test-first norm.)
- UI components are not unit-tested in this pass (no runner configured for
  React here); verification is manual against `http://localhost:3001`.

### Next.js gotcha (AGENTS.md)

`coop-prep/AGENTS.md` warns this Next.js has breaking changes — **read the
relevant guide in `node_modules/next/dist/docs/` before writing any affected
code** (already done for the hydration/`suppressHydrationWarning` fix).

---

## Out of scope (YAGNI)

- No URL routing, no auth, no backend — stays localStorage-only and fully local.
- No theme switcher / multiple presets (g-assist ships 5; coop-prep ships the
  single `dark-glass` look only).
- No React component unit tests this pass.
- No changes to curriculum content (`data/curriculum.js`).

## Success criteria

1. App renders full glassmorphism (navy gradient bg, frosted panels/cards,
   cyan/violet accents, Barlow/Jakarta/DM Mono type) at `:3001`, no hydration
   errors.
2. `lib/momentum.js` exists with passing `node --test` unit tests for all five
   pure functions.
3. Home shows level/tier, daily-goal ring, streak multiplier, and a prominent
   "Continue" CTA.
4. Completing a lesson/quiz/card shows instant XP feedback; multipliers apply;
   achievements unlock with a toast; level-ups celebrate.
5. Existing progress in localStorage is migrated without loss.
6. `prefers-reduced-motion` is respected by all new animation.
