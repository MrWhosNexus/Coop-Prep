# COOP Prep — Offline Single-File Mobile Build

**Date:** 2026-06-17
**Status:** Approved design, pending implementation plan
**Project:** `C:\Users\yygbu\coop-prep` (Next.js 16 app; this spec adds a separate mobile build)

## Goal

Produce a **single, self-contained `index.html`** the user can download to a
phone's Files and open in Safari/Chrome — **fully offline, no server, no
install** — that delivers the COOP Prep learning app (7 modules, momentum/rewards,
flashcards, glass UI) in a **touch-first layout with a bottom tab bar**.

The desktop Next.js app is unchanged. The mobile build is an additional artifact
that **reuses the existing business logic** and adds a mobile-only presentation
layer.

## Approach (chosen: A — Vite single-file build reusing the engine)

A dedicated `mobile/` Vite build inlines all JS+CSS into one HTML file via
`vite-plugin-singlefile`. It imports the **exact same** core modules as the
desktop app, so the gamification rules exist in exactly one place.

Rejected: (B) hand-built CDN/Babel or vanilla file — duplicates the momentum
logic or ships a slow in-browser transform; (C) Next.js static export — emits a
multi-file `out/` that is flaky to open via `file://` on mobile.

---

## Shared vs. new (the DRY boundary)

**Shared, imported as-is (single source of truth — never duplicated or forked):**
- `lib/momentum.js` — levels/tiers, streak multiplier, `awardXp`, daily goal,
  achievements, `formatDuration`.
- `lib/progress.js` — schema, migration, `loadProgress`/`saveProgress`,
  `markComplete`, `saveQuizScore`, `daysUntilFellowship`, `readinessScore`,
  `todayISO`. localStorage key stays `coop_prep_v1`.
- `data/curriculum.js` — `MODULES`, `FLASHCARDS`.
- `components/ProgressContext.js` — `ProgressProvider` + `useProgress()` (reward
  queue, derived momentum, all mutating actions).
- `components/RewardLayer.js` — fixed-overlay XP floats + level-up/achievement
  toasts (class-based, context-driven). Reused unchanged.

Imports resolve through a Vite `resolve.alias` mapping `@` → project root, the
same alias the desktop app uses (`jsconfig.json`). The `"use client"` string
literals at the top of these modules are inert under Vite (harmless no-ops).

**Progression parity:** because mobile and desktop share these modules, all
progress, XP, streak, daily, achievement, and **sequential-unlock** state follow
identical rules. (They are *separate localStorage stores* — desktop dev server
vs. the phone's browser — so values don't sync across devices, but the *logic*
is identical.)

**New, mobile-only (presentation layer — `mobile/src/`):**
- `mobile/index.html` + `mobile/src/main.jsx` — entry; mounts `<MobileApp/>` into
  `#root`, wrapped in `ProgressProvider`, with `<RewardLayer/>` mounted once.
- `MobileShell.jsx` — fixed bottom tab bar (Home · Modules · Flashcards) + the
  spinner gate (`if (!progress) return <spinner/>`) preserving the
  no-hydration/mount pattern; view state in React (`home | modules | module |
  lesson | flash`).
- `MobileHome.jsx` — momentum strip (level/tier bar, daily-goal ring, streak ×
  multiplier), the **Continue** card, a 2×2 stat grid, and the **focus timer**
  (relocated here from the desktop sidebar). Uses `useProgress()`.
- `MobileModules.jsx` / `MobileModuleView.jsx` — module list → lesson list with
  sequential-unlock lock icons.
- `MobileLesson.jsx` — full-screen Lesson / Quiz / Challenge tabs; **calls the
  same shared context actions** (`completeLesson`, `recordQuiz`) so XP and
  achievements fire identically to desktop.
- `MobileFlashcards.jsx` — full-screen 3D flip deck; "Got it" → `masterCard`.
- `mobile/src/styles.css` — hand-written glass design system (tokens + classes
  ported from `app/globals.css`), **no Tailwind import, no Google-Fonts link**.

Re-implementing the *view markup* for the four screens is intentional (touch
layout differs); the *business logic* is never re-implemented — it is imported.

---

## Behavior rules (pinned, matching desktop)

- **Continue → next lesson:** iterate `MODULES` in array order, then each
  module's `lessons` in order; the target is the **first lesson whose `id` is
  not present in `progress.completed`**. If every lesson is complete, the Home
  Continue card shows an "all lessons complete" state instead. (Identical to the
  desktop `nextLesson` selector.)
- **Flashcards scope: global.** `FLASHCARDS` is one flat 20-card deck (not
  per-module); the Flashcards tab is a top-level deck over all terms, with the
  existing mastery/unseen behavior. Not scoped to a selected module.
- **Sequential unlock:** a lesson is locked until the prior lesson in its module
  is complete — same rule as desktop, derived from shared `progress.completed`.

---

## Mobile UX

- **Bottom tab bar** (fixed, safe-area-inset aware): Home · Modules · Flashcards.
  Module and Lesson are pushed views reached from the Modules tab (with a back
  affordance); the active tab highlights.
- **Home:** momentum strip → Continue card → 2×2 stats → focus timer. Full-width,
  vertical scroll.
- **Lesson:** full-screen; tab underline + submit use the module color; quiz
  options are large touch targets with A/B/C/D labels.
- **Flashcards:** full-screen flip card (perspective + `backfaceVisibility`),
  progress dots, "Got it" advances and masters.
- All new animations respect `prefers-reduced-motion` (reuse the guard).
- `<meta name="viewport" content="width=device-width, initial-scale=1,
  viewport-fit=cover">`; `env(safe-area-inset-*)` padding on the tab bar.

---

## Offline / self-contained (hard requirement)

- The built `mobile/dist/index.html` MUST NOT request **any** remote asset at
  runtime — no fonts, no icons, no CSS, no scripts, no analytics. Verifiable by
  opening it with networking disabled.
- Fonts: **system font stack** (e.g. `-apple-system, "Segoe UI", Roboto, …`).
  The glass look does not depend on the web fonts.
- Icons: Lucide React components are bundled into the inlined JS (tree-shaken);
  they render as inline SVG — no network.
- `vite-plugin-singlefile` inlines JS and CSS; `build.assetsInlineLimit` set high
  enough that any incidental asset is base64-inlined. Target a single emitted
  `index.html` with no sibling files required to run.

---

## Build & delivery

- Root `package.json` gains devDeps: `vite`, `@vitejs/plugin-react`,
  `vite-plugin-singlefile`, and script `"build:mobile": "vite build --config
  mobile/vite.config.js"`.
- `mobile/vite.config.js`: React plugin + singlefile plugin; `root: "mobile"`;
  `resolve.alias` `@` → project root; `build.outDir` → `mobile/dist`.
- Output: **`mobile/dist/index.html`** — the deliverable. It is a **rebuildable
  artifact, never hand-edited**; the source of truth is `mobile/src/` + the
  shared core modules in the repo. (`mobile/dist/` is gitignored.)
- Delivery: run `npm run build:mobile`; the user saves `index.html` to the phone
  and opens it in a mobile browser.

---

## Testing / verification

- The shared engine keeps its existing `node --test` units (unchanged).
- Build verification: `npm run build:mobile` succeeds and emits exactly one
  `index.html` with no sibling JS/CSS required.
- Offline verification: grep the built file for `http://` / `https://` asset
  references (fonts, CDNs) — there must be none in `<link>`/`<script>`/`@import`/
  `url(...)`; the only allowed external strings are inert (e.g. citations in
  bundled lesson text). Load it with the network disabled and confirm Home,
  a lesson + quiz (XP feedback), and a flashcard flip all work.
- Visual confirmation on a phone is the user's (no headless mobile browser here).

## Out of scope (YAGNI)

- No PWA / service worker, no add-to-home-screen manifest.
- No native packaging (Expo/Capacitor).
- No cross-device sync; no backend.
- No changes to the desktop app's behavior or files (only additive: `mobile/`,
  devDeps, one script, a `.gitignore` line).

## Success criteria

1. `npm run build:mobile` emits a single self-contained `mobile/dist/index.html`.
2. Opening that file offline on a phone runs the full app: bottom tabs
   (Home/Modules/Flashcards), glass UI, momentum strip, lessons/quizzes with XP +
   achievement feedback, flashcard mastery, focus timer.
3. No runtime network requests (fonts/icons/CSS/JS all inlined; system fonts).
4. Momentum/progress/unlock rules are byte-for-byte the shared modules — no
   duplicated gamification logic.
5. Desktop app unchanged; mobile logic stays presentation-only.
