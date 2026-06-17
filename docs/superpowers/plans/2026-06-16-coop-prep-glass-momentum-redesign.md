# COOP Prep — Glassmorphism + Momentum Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the COOP Prep app render as a coherent glassmorphism UI (ported from g-assist-pro's `dark-glass`) and add a momentum/rewards layer (levels, daily goal, streak multiplier, achievements, focus timer, instant feedback).

**Architecture:** Approach B — rebuild `app/globals.css` to *define* the token/class vocabulary the components already reference (so they render as glass with near-zero JSX change); put all new gamification math in a pure, unit-tested `lib/momentum.js`; share state through one `components/ProgressContext.js` provider whose mutating actions return reward results that a centralized reward layer renders.

**Tech Stack:** Next.js 16 (App Router, JS, `"use client"`), Tailwind v4 (`@import "tailwindcss"`), Lucide React, `node:test` (new), localStorage only.

## Global Constraints

- localStorage only — no backend, no auth, no URL routing. Key stays `coop_prep_v1`.
- Tailwind v4: never put `@import url(...)` after `@import "tailwindcss"` in CSS — load web fonts via `<link>` in `app/layout.js` `<head>` only.
- This Next.js has breaking changes (`coop-prep/AGENTS.md`): read `node_modules/next/dist/docs/` before writing code that touches framework behavior.
- All animation must respect `@media (prefers-reduced-motion: reduce)`.
- Dev server: `npm run dev -- --port 3001` → `http://localhost:3001`. Verify visually there.
- `lib/momentum.js` is pure: no DOM, no `localStorage`, no React, no `Date.now()` inside (callers pass `todayISO`).
- Glass values are ported verbatim from `g-assist-pro/renderer/src/index.css` + `lib/theme-tokens.ts` `dark-glass` preset.
- Commit after every task. coop-prep is its own git repo (root `C:\Users\yygbu\coop-prep`).

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/globals.css` | Rewrite | Single glass design system: navy gradient bg, glass tokens, every class/var the components reference, `ring-fill` keyframe |
| `app/layout.js` | Modify | Add Barlow + Plus Jakarta Sans + DM Mono `<link>`s (keep Inter) |
| `lib/momentum.js` | Create | Pure gamification math: levels, streak multiplier, awardXp, daily progress, achievements, formatDuration |
| `test/momentum.test.js` | Create | Unit tests for `lib/momentum.js` |
| `lib/progress.js` | Modify | Schema additions + `loadProgress` migration; route XP through `awardXp`; daily/achievement bookkeeping |
| `test/progress.test.js` | Create | Migration + daily-rollover + streak tests |
| `components/ProgressContext.js` | Create | Provider: state, derived `momentum`, actions returning `{xpGained, leveledUp, newAchievements}`, reward queue |
| `components/RewardLayer.js` | Create | Renders XP floats, level-up celebration, achievement toasts from the reward queue |
| `components/MomentumStrip.js` | Create | Home: level/tier bar + daily-goal ring + streak-multiplier pill |
| `components/FocusTimer.js` | Create | Start/stop study timer; logs minutes via context |
| `components/Dashboard.js` | Modify | Wrap in provider; consume `useProgress()`; mount `MomentumStrip`, `RewardLayer`, `FocusTimer`; trigger feedback on actions |
| `components/LessonViewer.js` | Modify | Remove hardcoded `rgba(13,17,23,0.92)` header color (→ glass); call context actions for XP feedback |
| `package.json` | Modify | Add `"test": "node --test"` script |

`data/curriculum.js`, `components/FlashcardDeck.js` (markup), `components/ModuleCard.js` are unchanged in markup; they render correctly once `globals.css` defines the vocabulary. FlashcardDeck gets one wiring change (Task 7-adjacent) for mastery XP feedback, specified in Task 8.

---

## Task 1: Rebuild `globals.css` as one glass design system

**Files:**
- Modify: `app/globals.css` (full rewrite)
- Modify: `app/layout.js:11-15` (font links)

**Interfaces:**
- Produces (CSS custom properties consumed by all components): `--bg, --sidebar, --sidebar-w, --card, --card-2, --card-hover, --border, --border-2, --r-sm, --r-md, --r-lg, --r-xl, --blue, --blue-2, --blue-dim, --blue-ring, --gold, --gold-2, --gold-dim, --green, --green-2, --green-dim, --green-ring, --red, --red-dim, --violet, --violet-2, --text, --text-2, --text-3, --shadow-2`.
- Produces (classes): `.card, .card-2, .card-btn, .btn-primary, .btn-ghost, .nav-item, .nav-item.active, .nav-dot, .section-label, .divider, .progress-track, .progress-fill, .badge, .badge-blue, .badge-gold, .badge-green, .badge-muted, .badge-violet, .fadein, .scalein`.
- Produces (keyframes): `fadein, scalein, ring-fill`.

- [ ] **Step 1: Add the font `<link>`s in `app/layout.js`**

Replace the three existing font links (lines 12-14) so Barlow + Plus Jakarta Sans + DM Mono load alongside Inter:

```jsx
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Barlow:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
```

- [ ] **Step 2: Rewrite `app/globals.css`**

Full file (ports g-assist-pro `dark-glass`: navy gradient, glass-1/2/3 fills, blur 18px saturate 140%, cyan `#22d3ee` + violet `#8b5cf6`, white-12% borders, radius `0.875rem`):

```css
@import "tailwindcss";

* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* ── g-assist-pro dark-glass base ── */
  --gap-bg-from: oklch(0.11 0.018 260);
  --gap-bg-to:   oklch(0.05 0.012 250);
  --gap-glass-1: rgba(255,255,255,0.05);
  --gap-glass-2: rgba(255,255,255,0.09);
  --gap-glass-3: rgba(255,255,255,0.13);
  --gap-blur:    18px;
  --gap-border:  rgba(255,255,255,0.12);
  --gap-border-2:rgba(255,255,255,0.20);

  /* ── Structural tokens the components reference ── */
  --bg:          transparent;            /* surfaces sit on the body gradient */
  --sidebar:     rgba(255,255,255,0.04);
  --sidebar-w:   256px;
  --card:        var(--gap-glass-1);
  --card-2:      var(--gap-glass-2);
  --card-hover:  var(--gap-glass-3);
  --border:      var(--gap-border);
  --border-2:    var(--gap-border-2);

  /* ── Radii ── */
  --r-sm: 0.5rem;
  --r-md: 0.875rem;   /* == g-assist --gap-radius */
  --r-lg: 1.125rem;
  --r-xl: 1.5rem;

  /* ── Accents (cyan primary, violet secondary; warm/semantic kept) ── */
  --blue:    #22d3ee;  --blue-2: #67e8f9;
  --blue-dim: rgba(34,211,238,0.16);  --blue-ring: rgba(34,211,238,0.45);
  --violet:  #8b5cf6;  --violet-2: #a78bfa;
  --gold:    #f59e0b;  --gold-2: #fcd34d;  --gold-dim: rgba(245,158,11,0.16);
  --green:   #22c55e;  --green-2: #4ade80;
  --green-dim: rgba(34,197,94,0.16);  --green-ring: rgba(34,197,94,0.45);
  --red:     #f87171;  --red-dim: rgba(248,113,113,0.16);

  /* ── Text ── */
  --text:   oklch(0.95 0.01 240);
  --text-2: oklch(0.68 0.02 240);
  --text-3: oklch(0.48 0.02 240);

  /* ── Shadows ── */
  --shadow-2: 0 8px 32px rgba(0,0,0,0.40);

  --font-display: 'Barlow', 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:    'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  --font-mono:    'DM Mono', ui-monospace, monospace;
}

html { font-size: 16px; height: 100%; }

body {
  min-height: 100%;
  background: linear-gradient(135deg, var(--gap-bg-from), var(--gap-bg-to)) fixed;
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 { font-family: var(--font-display); }

/* numeric readouts use DM Mono via inline fontVariantNumeric already; expose helper */
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

/* ── Glass surfaces ── */
.card {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 45%),
    var(--card);
  backdrop-filter: blur(var(--gap-blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--gap-blur)) saturate(140%);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-2), inset 0 1px 0 rgba(255,255,255,0.10);
}
.card-2 {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 45%),
    var(--card-2);
  backdrop-filter: blur(var(--gap-blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--gap-blur)) saturate(140%);
  border: 1px solid var(--border-2);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-2), inset 0 1px 0 rgba(255,255,255,0.12);
}
.card-btn {
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), background 0.18s ease, border-color 0.18s ease, box-shadow 0.2s ease;
}
.card-btn:hover { transform: translateY(-2px); background-color: var(--card-hover); }
.card-btn:active { transform: translateY(0); }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: var(--r-md);
  font-size: 14px; font-weight: 600; color: #03121a;
  background: var(--blue); border: none; cursor: pointer;
  box-shadow: 0 4px 16px rgba(34,211,238,0.30);
  transition: opacity 0.15s, transform 0.15s;
}
.btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 14px; border-radius: var(--r-md);
  font-size: 13.5px; font-weight: 500; color: var(--text-2);
  background: var(--gap-glass-1); border: 1px solid var(--border); cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.btn-ghost:hover { background: var(--gap-glass-2); color: var(--text); border-color: var(--border-2); }

/* ── Sidebar nav ── */
.nav-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 10px; border-radius: var(--r-sm);
  font-size: 13.5px; font-weight: 500; color: var(--text-2);
  background: none; border: none; cursor: pointer; text-align: left;
  transition: background 0.14s, color 0.14s;
}
.nav-item:hover { background: var(--gap-glass-1); color: var(--text); }
.nav-item.active { background: var(--blue-dim); color: var(--blue-2); }
.nav-dot { transition: background 0.14s; }

/* ── Misc structural ── */
.section-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--text-3);
}
.divider { height: 1px; background: var(--border); }
.progress-track { height: 6px; width: 100%; background: rgba(255,255,255,0.10); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s cubic-bezier(0.16,1,0.3,1); }

/* ── Badges ── */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 100px;
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.02em;
}
.badge-blue   { background: var(--blue-dim);  color: var(--blue-2);   border: 1px solid var(--blue-ring); }
.badge-gold   { background: var(--gold-dim);  color: var(--gold-2);   border: 1px solid rgba(245,158,11,0.4); }
.badge-green  { background: var(--green-dim); color: var(--green-2);  border: 1px solid var(--green-ring); }
.badge-violet { background: rgba(139,92,246,0.18); color: var(--violet-2); border: 1px solid rgba(139,92,246,0.4); }
.badge-muted  { background: var(--gap-glass-1); color: var(--text-2);  border: 1px solid var(--border); }

/* ── Scrollbar / focus ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 2px; }
*:focus-visible { outline: 2px solid var(--blue-ring); outline-offset: 2px; border-radius: 8px; }

/* ── Animations ── */
@keyframes fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scalein { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
@keyframes ring-fill { from { stroke-dasharray: 0 264; } }
.fadein  { animation: fadein 0.35s cubic-bezier(0.16,1,0.3,1) both; }
.scalein { animation: scalein 0.3s cubic-bezier(0.16,1,0.3,1) both; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: Verify all four views render as glass**

Ensure dev server is running (`npm run dev -- --port 3001`). In a browser at `http://localhost:3001`, confirm:
- Home: navy gradient bg, frosted sidebar, frosted cards, readiness ring animates, stats row visible.
- Click a module → lesson list renders as glass cards with progress bars.
- Open a lesson → header/tabs/quiz cards are glass; no unstyled white blocks.
- Flashcards → glass deck.
Expected: no element is unstyled/transparent-with-no-surface; no console error about missing CSS.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.js
git commit -m "feat(ui): rebuild globals.css as one glass system (g-assist-pro dark-glass)"
```

---

## Task 2: Pure momentum engine + unit tests (TDD)

**Files:**
- Create: `lib/momentum.js`
- Create: `test/momentum.test.js`
- Modify: `package.json` (add test script)

**Interfaces:**
- Produces:
  - `XP_PER_LEVEL = 250`, `DAILY_GOAL_XP = 100`
  - `levelFromXp(xp: number) -> { level, tierName, xpInLevel, xpForNext, pct }`
  - `streakMultiplier(streakDays: number) -> number` (1.0–2.0)
  - `awardXp(baseXp: number, streakDays: number) -> number` (integer)
  - `dailyProgress(state, todayISO: string) -> { earned, goal, pct, met }`
  - `evaluateAchievements(state, modules) -> string[]` (earned IDs)
  - `ACHIEVEMENTS: { id, label, desc }[]`
  - `formatDuration(totalSeconds: number) -> string`

- [ ] **Step 1: Add the test script to `package.json`**

Add to the `"scripts"` block:

```json
    "test": "node --test"
```

- [ ] **Step 2: Write the failing tests**

Create `test/momentum.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  XP_PER_LEVEL, DAILY_GOAL_XP,
  levelFromXp, streakMultiplier, awardXp,
  dailyProgress, evaluateAchievements, ACHIEVEMENTS, formatDuration,
} from "../lib/momentum.js";

test("levelFromXp: 0 XP is level 1 Novice", () => {
  const r = levelFromXp(0);
  assert.equal(r.level, 1);
  assert.equal(r.tierName, "Novice");
  assert.equal(r.xpInLevel, 0);
  assert.equal(r.xpForNext, XP_PER_LEVEL);
  assert.equal(r.pct, 0);
});

test("levelFromXp: crossing a level boundary", () => {
  const r = levelFromXp(260); // 250 per level → level 2, 10 into it
  assert.equal(r.level, 2);
  assert.equal(r.xpInLevel, 10);
  assert.equal(r.pct, Math.round((10 / 250) * 100));
});

test("levelFromXp: tier names by band", () => {
  assert.equal(levelFromXp(0).tierName, "Novice");        // L1
  assert.equal(levelFromXp(250 * 2).tierName, "Analyst");  // L3
  assert.equal(levelFromXp(250 * 4).tierName, "Associate");// L5
  assert.equal(levelFromXp(250 * 6).tierName, "Strategist");// L7
  assert.equal(levelFromXp(250 * 8).tierName, "Governance Lead"); // L9
});

test("streakMultiplier: scales then caps at 2.0", () => {
  assert.equal(streakMultiplier(0), 1.0);
  assert.equal(streakMultiplier(1), 1.0);
  assert.equal(streakMultiplier(3), 1.2);
  assert.equal(streakMultiplier(7), 1.6);
  assert.equal(streakMultiplier(20), 2.0); // capped
});

test("awardXp: applies multiplier and rounds", () => {
  assert.equal(awardXp(50, 0), 50);
  assert.equal(awardXp(50, 3), 60);  // 50 * 1.2
  assert.equal(awardXp(50, 20), 100); // capped 2.0
});

test("dailyProgress: same day accumulates", () => {
  const state = { daily: { date: "2026-06-16", xp: 60, lessons: 1, minutes: 0 } };
  const r = dailyProgress(state, "2026-06-16");
  assert.equal(r.earned, 60);
  assert.equal(r.goal, DAILY_GOAL_XP);
  assert.equal(r.pct, 60);
  assert.equal(r.met, false);
});

test("dailyProgress: rollover resets to 0", () => {
  const state = { daily: { date: "2026-06-15", xp: 999, lessons: 9, minutes: 0 } };
  const r = dailyProgress(state, "2026-06-16");
  assert.equal(r.earned, 0);
  assert.equal(r.met, false);
});

test("dailyProgress: met when >= goal", () => {
  const state = { daily: { date: "2026-06-16", xp: 120, lessons: 2, minutes: 0 } };
  assert.equal(dailyProgress(state, "2026-06-16").met, true);
});

test("evaluateAchievements: first-lesson + perfect-quiz", () => {
  const modules = [{ id: "m1", lessons: [{ id: "l1" }, { id: "l2" }] }];
  const state = {
    completed: { l1: true },
    quizScores: { l1: { correct: 3, total: 3 } },
    flashDone: {},
    streak: 0,
  };
  const earned = evaluateAchievements(state, modules);
  assert.ok(earned.includes("first-lesson"));
  assert.ok(earned.includes("perfect-quiz"));
  assert.ok(!earned.includes("module-master"));
});

test("evaluateAchievements: module-master + capstone + streak + cards", () => {
  const modules = [
    { id: "m1", lessons: [{ id: "l1" }] },
    { id: "m7", lessons: [{ id: "c1" }] }, // capstone is last module
  ];
  const state = {
    completed: { l1: true, c1: true },
    quizScores: {},
    flashDone: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, true])),
    streak: 7,
  };
  const earned = evaluateAchievements(state, modules);
  assert.ok(earned.includes("module-master"));
  assert.ok(earned.includes("capstone-complete"));
  assert.ok(earned.includes("streak-7"));
  assert.ok(earned.includes("cards-20"));
});

test("ACHIEVEMENTS has metadata for every evaluated id", () => {
  const ids = ["first-lesson","module-master","perfect-quiz","streak-7","cards-20","capstone-complete"];
  for (const id of ids) assert.ok(ACHIEVEMENTS.find(a => a.id === id), `missing ${id}`);
});

test("formatDuration formats m:ss", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(65), "1:05");
  assert.equal(formatDuration(600), "10:00");
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/momentum.js'`.

- [ ] **Step 4: Implement `lib/momentum.js`**

```js
// Pure gamification math. No DOM, no localStorage, no React.
// Callers pass today's ISO date so functions stay deterministic/testable.

export const XP_PER_LEVEL = 250;
export const DAILY_GOAL_XP = 100;

const TIER_BANDS = [
  { minLevel: 1, name: "Novice" },
  { minLevel: 3, name: "Analyst" },
  { minLevel: 5, name: "Associate" },
  { minLevel: 7, name: "Strategist" },
  { minLevel: 9, name: "Governance Lead" },
];

export function levelFromXp(xp) {
  const safe = Math.max(0, xp | 0);
  const level = Math.floor(safe / XP_PER_LEVEL) + 1;
  const xpInLevel = safe % XP_PER_LEVEL;
  const tierName = TIER_BANDS.reduce(
    (acc, b) => (level >= b.minLevel ? b.name : acc),
    TIER_BANDS[0].name
  );
  return {
    level,
    tierName,
    xpInLevel,
    xpForNext: XP_PER_LEVEL,
    pct: Math.round((xpInLevel / XP_PER_LEVEL) * 100),
  };
}

export function streakMultiplier(streakDays) {
  const m = 1.0 + 0.1 * Math.max(0, (streakDays | 0) - 1 + (streakDays > 0 ? 1 : 0));
  // day 0/1 → 1.0, +0.1 per consecutive day, capped 2.0
  const stepped = streakDays <= 1 ? 1.0 : 1.0 + 0.1 * (streakDays - 1);
  return Math.min(2.0, Math.round(stepped * 10) / 10);
}

export function awardXp(baseXp, streakDays) {
  return Math.round(baseXp * streakMultiplier(streakDays));
}

export function dailyProgress(state, todayISO) {
  const d = state?.daily;
  const earned = d && d.date === todayISO ? d.xp : 0;
  const pct = Math.min(100, Math.round((earned / DAILY_GOAL_XP) * 100));
  return { earned, goal: DAILY_GOAL_XP, pct, met: earned >= DAILY_GOAL_XP };
}

export const ACHIEVEMENTS = [
  { id: "first-lesson",      label: "First Steps",      desc: "Complete your first lesson" },
  { id: "module-master",     label: "Module Master",    desc: "Finish an entire module" },
  { id: "perfect-quiz",      label: "Perfect Score",    desc: "Ace a quiz with no mistakes" },
  { id: "streak-7",          label: "On Fire",          desc: "Reach a 7-day streak" },
  { id: "cards-20",          label: "Deck Cleared",     desc: "Master 20 flashcards" },
  { id: "capstone-complete", label: "Fellowship Ready", desc: "Complete the Capstone module" },
];

export function evaluateAchievements(state, modules) {
  const completed = state?.completed ?? {};
  const quizzes = state?.quizScores ?? {};
  const flash = state?.flashDone ?? {};
  const earned = [];

  if (Object.values(completed).some(Boolean)) earned.push("first-lesson");

  const moduleDone = (m) => m.lessons.length > 0 && m.lessons.every((l) => completed[l.id]);
  if (modules.some(moduleDone)) earned.push("module-master");

  if (Object.values(quizzes).some((q) => q && q.total > 0 && q.correct >= q.total))
    earned.push("perfect-quiz");

  if ((state?.streak ?? 0) >= 7) earned.push("streak-7");

  if (Object.values(flash).filter(Boolean).length >= 20) earned.push("cards-20");

  const capstone = modules[modules.length - 1];
  if (capstone && moduleDone(capstone)) earned.push("capstone-complete");

  return earned;
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all momentum tests green. (If `streakMultiplier` fails, simplify its body to the `stepped`/`Math.min` lines only — the first `m` line is dead and may be deleted.)

- [ ] **Step 6: Clean up and commit**

Delete the dead `const m = ...` line in `streakMultiplier` (keep only `stepped` + return). Re-run `npm test` (PASS), then:

```bash
git add lib/momentum.js test/momentum.test.js package.json
git commit -m "feat(momentum): pure level/streak/daily/achievement engine + tests"
```

---

## Task 3: Extend progress schema + migration

**Files:**
- Modify: `lib/progress.js`
- Create: `test/progress.test.js`

**Interfaces:**
- Consumes: `lib/momentum.js` (`awardXp`, `evaluateAchievements`, `dailyProgress`).
- Produces:
  - `defaultState()` adds: `daily: { date: null, xp: 0, lessons: 0, minutes: 0 }`, `achievements: {}` (id → ISO), `lastDay` already exists.
  - `loadProgress()` backfills missing new fields on old saves.
  - `markComplete(state, lessonId, baseXp=50)` now applies `awardXp` with the streak and updates `daily`.
  - New `recordFlashMastered(state, idx)` (mastery already tracked in `flashDone`; this just adds daily/xp hooks if desired — keep XP additions in context).
  - `todayISO()` helper exported.

- [ ] **Step 1: Write failing tests**

Create `test/progress.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultState, markComplete, todayISO } from "../lib/progress.js";

test("defaultState includes daily + achievements", () => {
  const s = defaultState();
  assert.deepEqual(s.daily, { date: null, xp: 0, lessons: 0, minutes: 0 });
  assert.deepEqual(s.achievements, {});
});

test("markComplete adds multiplier-aware XP and updates daily", () => {
  const today = todayISO();
  let s = defaultState();
  s = markComplete(s, "l1", 50);          // streak becomes 1 → multiplier 1.0
  assert.equal(s.completed.l1, true);
  assert.equal(s.xp, 50);
  assert.equal(s.daily.date, today);
  assert.equal(s.daily.xp, 50);
  assert.equal(s.daily.lessons, 1);
});

test("markComplete is idempotent for an already-complete lesson", () => {
  let s = defaultState();
  s = markComplete(s, "l1", 50);
  const xpAfterFirst = s.xp;
  s = markComplete(s, "l1", 50);
  assert.equal(s.xp, xpAfterFirst);
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm test`
Expected: FAIL — `todayISO` not exported / `daily` undefined.

- [ ] **Step 3: Implement schema + migration**

In `lib/progress.js`: add the import, `todayISO`, extend `defaultState`, and rework `markComplete`. Replace the existing `defaultState` and `markComplete` with:

```js
import { awardXp } from "./momentum.js";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultState() {
  return {
    completed: {},
    quizScores: {},
    flashDone: {},
    notes: {},
    xp: 0,
    streak: 0,
    lastDay: null,
    daily: { date: null, xp: 0, lessons: 0, minutes: 0 },
    achievements: {},   // id → ISO unlockedAt
  };
}

export function markComplete(state, lessonId, baseXp = 50) {
  if (state.completed[lessonId]) return state;
  const today = todayISO();
  const isNewDay = state.lastDay !== today;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = isNewDay
    ? (state.lastDay === yesterday ? state.streak + 1 : 1)
    : state.streak;
  const gain = awardXp(baseXp, streak);
  const daily = state.daily?.date === today
    ? { ...state.daily, xp: state.daily.xp + gain, lessons: state.daily.lessons + 1 }
    : { date: today, xp: gain, lessons: 1, minutes: state.daily?.minutes ?? 0 };
  return {
    ...state,
    completed: { ...state.completed, [lessonId]: true },
    xp: state.xp + gain,
    streak,
    lastDay: today,
    daily,
  };
}
```

`loadProgress()` already spreads `{ ...defaultState(), ...JSON.parse(raw) }`, so old saves automatically gain `daily`/`achievements`. No change needed there — but verify the spread is shallow-safe: a pre-existing save without `daily` gets the default `daily`; a save *with* a partial `daily` keeps its own. That is acceptable.

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: PASS — momentum + progress suites green.

- [ ] **Step 5: Commit**

```bash
git add lib/progress.js test/progress.test.js
git commit -m "feat(progress): daily + achievements schema, multiplier-aware markComplete"
```

---

## Task 4: ProgressContext provider + reward queue

**Files:**
- Create: `components/ProgressContext.js`

**Interfaces:**
- Consumes: `lib/progress.js` (`loadProgress, saveProgress, markComplete, saveQuizScore, daysUntilFellowship, readinessScore, todayISO`), `lib/momentum.js` (`levelFromXp, streakMultiplier, dailyProgress, evaluateAchievements`), `data/curriculum.js` (`MODULES`).
- Produces hook `useProgress()` returning:
  - `progress` (or `null` while loading), `days`, `readiness`
  - `momentum: { level, tierName, xpInLevel, xpForNext, pct, multiplier, daily }`
  - actions: `completeLesson(id) -> reward`, `recordQuiz(id, correct, total) -> reward`, `masterCard(idx) -> reward`, `addFocusMinutes(min)`
  - `rewards` (array) + `dismissReward(id)` for the reward layer
  - where `reward = { xpGained, leveledUp, newAchievements: string[] }`

- [ ] **Step 1: Implement the provider**

```jsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  loadProgress, saveProgress, markComplete, saveQuizScore,
  daysUntilFellowship, readinessScore, todayISO,
} from "@/lib/progress";
import {
  levelFromXp, streakMultiplier, dailyProgress, evaluateAchievements,
} from "@/lib/momentum";
import { MODULES } from "@/data/curriculum";

const Ctx = createContext(null);
export function useProgress() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProgress must be used inside <ProgressProvider>");
  return v;
}

let _rid = 0;

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(null);
  const [days, setDays] = useState(0);
  const [rewards, setRewards] = useState([]);
  const prevXpRef = useRef(0);

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    prevXpRef.current = p.xp;
    setDays(daysUntilFellowship());
  }, []);

  const pushRewards = useCallback((before, after) => {
    const beforeLevel = levelFromXp(before.xp).level;
    const afterLevel = levelFromXp(after.xp).level;
    const xpGained = after.xp - before.xp;
    const earnedBefore = new Set(Object.keys(before.achievements ?? {}));
    const earnedNow = evaluateAchievements(after, MODULES);
    const newAchievements = earnedNow.filter((id) => !earnedBefore.has(id));
    const leveledUp = afterLevel > beforeLevel;

    const queued = [];
    if (xpGained > 0) queued.push({ id: ++_rid, type: "xp", amount: xpGained });
    if (leveledUp) queued.push({ id: ++_rid, type: "level", level: afterLevel });
    for (const id of newAchievements) queued.push({ id: ++_rid, type: "achievement", achId: id });
    if (queued.length) setRewards((r) => [...r, ...queued]);

    return { xpGained, leveledUp, newAchievements };
  }, []);

  // Persist achievements (unlockedAt) into state, then save.
  const commit = useCallback((next) => {
    const earned = evaluateAchievements(next, MODULES);
    const now = new Date().toISOString();
    const achievements = { ...(next.achievements ?? {}) };
    for (const id of earned) if (!achievements[id]) achievements[id] = now;
    const final = { ...next, achievements };
    setProgress(final);
    saveProgress(final);
    return final;
  }, []);

  const completeLesson = useCallback((id) => {
    let reward = { xpGained: 0, leveledUp: false, newAchievements: [] };
    setProgress((cur) => {
      const before = cur;
      const after = markComplete(before, id, 50);
      if (after === before) return before;        // already complete
      reward = pushRewards(before, after);
      return commit(after);
    });
    return reward;
  }, [pushRewards, commit]);

  const recordQuiz = useCallback((id, correct, total) => {
    let reward = { xpGained: 0, leveledUp: false, newAchievements: [] };
    setProgress((cur) => {
      const before = cur;
      let after = saveQuizScore(before, id, correct, total);
      if (correct === total) {
        const today = todayISO();
        const bonus = require("@/lib/momentum").awardXp(25, before.streak);
        const daily = after.daily?.date === today
          ? { ...after.daily, xp: after.daily.xp + bonus }
          : { date: today, xp: bonus, lessons: 0, minutes: after.daily?.minutes ?? 0 };
        after = { ...after, xp: after.xp + bonus, daily };
      }
      reward = pushRewards(before, after);
      return commit(after);
    });
    return reward;
  }, [pushRewards, commit]);

  const masterCard = useCallback((idx) => {
    let reward = { xpGained: 0, leveledUp: false, newAchievements: [] };
    setProgress((cur) => {
      const before = cur;
      if (before.flashDone?.[idx]) return before;
      const after = { ...before, flashDone: { ...before.flashDone, [idx]: true } };
      reward = pushRewards(before, after);
      return commit(after);
    });
    return reward;
  }, [pushRewards, commit]);

  const addFocusMinutes = useCallback((min) => {
    setProgress((cur) => {
      const today = todayISO();
      const daily = cur.daily?.date === today
        ? { ...cur.daily, minutes: cur.daily.minutes + min }
        : { date: today, xp: 0, lessons: 0, minutes: min };
      return commit({ ...cur, daily });
    });
  }, [commit]);

  const dismissReward = useCallback((id) => {
    setRewards((r) => r.filter((x) => x.id !== id));
  }, []);

  const momentum = progress ? (() => {
    const lvl = levelFromXp(progress.xp);
    return {
      ...lvl,
      multiplier: streakMultiplier(progress.streak),
      daily: dailyProgress(progress, todayISO()),
    };
  })() : null;

  const readiness = progress ? readinessScore(progress, MODULES) : 0;

  return (
    <Ctx.Provider value={{
      progress, days, readiness, momentum,
      completeLesson, recordQuiz, masterCard, addFocusMinutes,
      rewards, dismissReward,
    }}>
      {children}
    </Ctx.Provider>
  );
}
```

NOTE: replace the inline `require("@/lib/momentum")` with a top-level `import { awardXp } from "@/lib/momentum";` added to the import block (ESM has no `require`). The inline form above is a placeholder reminder — fix it to the named import.

- [ ] **Step 2: Smoke test the provider compiles**

Temporarily import `ProgressProvider` in `app/page.js` is not required yet (Task 5 wires it). Run `npm run build` is heavy; instead verify lint/parse: `node --check components/ProgressContext.js`.
Run: `node --check components/ProgressContext.js`
Expected: no output (syntax OK). Fix the `require` → `import awardXp` before this passes.

- [ ] **Step 3: Commit**

```bash
git add components/ProgressContext.js
git commit -m "feat(state): ProgressContext provider with reward queue + momentum derivation"
```

---

## Task 5: Wire provider into Dashboard + add MomentumStrip on Home

**Files:**
- Create: `components/MomentumStrip.js`
- Modify: `components/Dashboard.js` (wrap export in provider; consume `useProgress`; render strip)

**Interfaces:**
- Consumes: `useProgress()` (Task 4), glass classes (Task 1).
- Produces: `<MomentumStrip />` (no props — reads context).

- [ ] **Step 1: Implement `components/MomentumStrip.js`**

```jsx
"use client";

import { useProgress } from "./ProgressContext";
import { Flame, Zap } from "lucide-react";

export default function MomentumStrip() {
  const { momentum, progress } = useProgress();
  if (!momentum) return null;
  const { level, tierName, xpInLevel, xpForNext, pct, multiplier, daily } = momentum;

  const ringC = 176; // 2π × 28
  const ringFill = (daily.pct / 100) * ringC;

  return (
    <div className="card fadein" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 24, alignItems: "center", padding: "20px 24px", marginBottom: 20 }}>
      {/* Level / tier */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span className="badge badge-blue">LVL {level}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{tierName}</span>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>{xpInLevel}/{xpForNext} XP</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--blue), var(--violet))" }} /></div>
      </div>

      {/* Daily goal ring */}
      <div style={{ position: "relative", width: 64, height: 64 }} title={`Daily goal: ${daily.earned}/${daily.goal} XP`}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-2)" strokeWidth="5" />
          {daily.earned > 0 && (
            <circle cx="32" cy="32" r="28" fill="none" stroke={daily.met ? "var(--green)" : "var(--blue)"} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${ringFill} ${ringC}`} />
          )}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{daily.pct}%</span>
        </div>
      </div>

      {/* Streak + multiplier */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
          <Flame size={15} style={{ color: "#fb923c" }} />
          <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{progress.streak}</span>
        </div>
        <div className="badge badge-gold" style={{ marginTop: 6 }}>
          <Zap size={10} /> {multiplier.toFixed(1)}× XP
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wrap Dashboard's default export in the provider**

In `components/Dashboard.js`, rename the current `export default function Dashboard()` to `function DashboardInner()`, and add at the bottom of the file:

```jsx
import { ProgressProvider } from "./ProgressContext";
import RewardLayer from "./RewardLayer";   // created in Task 6

export default function Dashboard() {
  return (
    <ProgressProvider>
      <DashboardInner />
      <RewardLayer />
    </ProgressProvider>
  );
}
```

(If executing Task 5 before Task 6, temporarily omit the `RewardLayer` import + element, then add them in Task 6.)

- [ ] **Step 3: Replace local progress state in `DashboardInner` with context**

In `DashboardInner`, delete the `useState`/`useEffect` block for `progress`/`days` and the `update`/`onComplete`/`onQuizDone` helpers (lines ~22-39), and replace with:

```jsx
  const { progress, days, readiness, completeLesson, recordQuiz } = useProgress();
  const [view, setView] = useState("home");
  const [activeModule, setActiveModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  const onComplete = (id) => completeLesson(id);
  const onQuizDone = (id, correct, total) => recordQuiz(id, correct, total);
```

Remove the now-unused `readinessScore`/`loadProgress`/`saveProgress`/`markComplete`/`saveQuizScore`/`daysUntilFellowship` imports and the local `readiness` computation. Keep the `if (!progress) return <spinner/>` gate exactly as-is (preserves no-hydration-mismatch behavior). For `FlashcardDeck`, pass `onUpdate` no longer needed — replace with context (Task 8); for now pass a no-op to avoid breakage if running tasks out of order.

- [ ] **Step 4: Render `MomentumStrip` at the top of HomeView**

In `HomeView`, immediately inside the outer `<div style={{ padding: "40px 48px"... }}>` (before the greeting header at line ~276), add:

```jsx
      <MomentumStrip />
```

And add the import at the top of `Dashboard.js`:

```jsx
import MomentumStrip from "./MomentumStrip";
```

- [ ] **Step 5: Verify on Home**

At `http://localhost:3001`: the momentum strip shows level/tier bar, daily-goal ring, and streak × multiplier. Complete a lesson → return Home → daily ring and streak update. No console errors.

- [ ] **Step 6: Commit**

```bash
git add components/MomentumStrip.js components/Dashboard.js
git commit -m "feat(home): momentum strip + ProgressContext wiring"
```

---

## Task 6: Instant feedback — RewardLayer (XP float, level-up, achievement toast)

**Files:**
- Create: `components/RewardLayer.js`
- Modify: `app/globals.css` (add `floatUp`, `celebrate`, `toastIn` keyframes/classes)

**Interfaces:**
- Consumes: `useProgress()` → `rewards`, `dismissReward`; `ACHIEVEMENTS` from `lib/momentum.js`.
- Produces: `<RewardLayer />` (no props).

- [ ] **Step 1: Add feedback animations to `globals.css`**

Append before the `prefers-reduced-motion` block:

```css
@keyframes floatUp { 0% { opacity: 0; transform: translateY(8px) scale(0.9); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-44px) scale(1); } }
@keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes celebrate { 0% { transform: scale(0); opacity: 0; } 55% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
.float-xp { animation: floatUp 1.4s cubic-bezier(0.16,1,0.3,1) both; }
.toast-in { animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
.celebrate { animation: celebrate 0.5s cubic-bezier(0.16,1,0.3,1) both; }
```

- [ ] **Step 2: Implement `components/RewardLayer.js`**

```jsx
"use client";

import { useEffect } from "react";
import { useProgress } from "./ProgressContext";
import { ACHIEVEMENTS } from "@/lib/momentum";
import { Award, Zap, TrendingUp } from "lucide-react";

export default function RewardLayer() {
  const { rewards, dismissReward } = useProgress();

  // Auto-dismiss each reward after its animation.
  useEffect(() => {
    const timers = rewards.map((r) => {
      const ttl = r.type === "xp" ? 1400 : 3200;
      return setTimeout(() => dismissReward(r.id), ttl);
    });
    return () => timers.forEach(clearTimeout);
  }, [rewards, dismissReward]);

  const toasts = rewards.filter((r) => r.type !== "xp");
  const xps = rewards.filter((r) => r.type === "xp");

  return (
    <>
      {/* XP floats — centered bottom */}
      <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 60, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {xps.map((r) => (
          <div key={r.id} className="float-xp mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--gold-2)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            +{r.amount} XP
          </div>
        ))}
      </div>

      {/* Toasts — top right */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 60, display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
        {toasts.map((r) => {
          if (r.type === "level") {
            return (
              <div key={r.id} className="card-2 toast-in" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <TrendingUp size={20} style={{ color: "var(--blue-2)" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)" }}>Level {r.level}!</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>Keep the momentum going.</div>
                </div>
              </div>
            );
          }
          const ach = ACHIEVEMENTS.find((a) => a.id === r.achId);
          return (
            <div key={r.id} className="card-2 toast-in" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <Award size={20} style={{ color: "var(--gold-2)" }} />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)" }}>{ach?.label ?? "Achievement"}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{ach?.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Ensure RewardLayer is mounted**

Confirm the `Dashboard` default export (Task 5 Step 2) imports and renders `<RewardLayer />` inside `<ProgressProvider>`.

- [ ] **Step 4: Verify feedback**

At `:3001`: complete a lesson → a `+XP` float appears and rises; if it crosses a 250-XP boundary a "Level N!" toast appears; first lesson shows the "First Steps" achievement toast. Toasts auto-dismiss. Toggle OS reduced-motion → animations collapse, content still appears/dismisses.

- [ ] **Step 5: Commit**

```bash
git add components/RewardLayer.js app/globals.css
git commit -m "feat(feedback): XP floats, level-up + achievement toasts"
```

---

## Task 7: Focus timer

**Files:**
- Create: `components/FocusTimer.js`
- Modify: `components/Dashboard.js` (mount in sidebar footer)

**Interfaces:**
- Consumes: `useProgress()` → `addFocusMinutes`; `formatDuration` from `lib/momentum.js`.
- Produces: `<FocusTimer />`.

- [ ] **Step 1: Implement `components/FocusTimer.js`**

```jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useProgress } from "./ProgressContext";
import { formatDuration } from "@/lib/momentum";
import { Play, Square } from "lucide-react";

export default function FocusTimer() {
  const { addFocusMinutes } = useProgress();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [running]);

  function stop() {
    setRunning(false);
    const mins = Math.floor(seconds / 60);
    if (mins > 0) addFocusMinutes(mins);
    setSeconds(0);
  }

  return (
    <button
      className="nav-item"
      onClick={() => (running ? stop() : setRunning(true))}
      style={{ justifyContent: "space-between", marginTop: 8 }}
      title={running ? "Stop focus session (logs minutes)" : "Start focus session"}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {running ? <Square size={13} style={{ color: "var(--red)" }} /> : <Play size={13} style={{ color: "var(--green)" }} />}
        Focus
      </span>
      <span className="mono" style={{ fontSize: 12, color: running ? "var(--text)" : "var(--text-3)" }}>{formatDuration(seconds)}</span>
    </button>
  );
}
```

- [ ] **Step 2: Mount in the sidebar footer**

In `Dashboard.js` `AppShell`, inside the sidebar footer `<div>` (after the XP+Streak row, ~line 231), add:

```jsx
          <FocusTimer />
```

Add import at top: `import FocusTimer from "./FocusTimer";`

- [ ] **Step 3: Verify**

At `:3001`: click Focus → timer counts up; click again → resets (and after ≥1 min, `daily.minutes` increases in localStorage). No errors.

- [ ] **Step 4: Commit**

```bash
git add components/FocusTimer.js components/Dashboard.js
git commit -m "feat(momentum): sidebar focus timer logging daily study minutes"
```

---

## Task 8: Flashcard mastery feedback + final verification

**Files:**
- Modify: `components/FlashcardDeck.js` (route mastery through context for XP feedback)
- Modify: `components/Dashboard.js` (pass nothing / use context in FlashcardDeck)

**Interfaces:**
- Consumes: `useProgress()` → `masterCard`.

- [ ] **Step 1: Route card mastery through context**

In `components/FlashcardDeck.js`, import and use the context instead of the `onUpdate` prop for marking mastered. Add at top:

```jsx
import { useProgress } from "./ProgressContext";
```

Inside the component: `const { masterCard } = useProgress();` and in the "Got it"/mastered handler, call `masterCard(currentIndex)` (in addition to or instead of the existing `flashDone` mutation). Remove reliance on the `onUpdate` prop. In `Dashboard.js`, drop the `onUpdate={update}` prop on `<FlashcardDeck>` (the `update` helper was removed in Task 5).

- [ ] **Step 2: Run the full unit suite**

Run: `npm test`
Expected: PASS — momentum + progress suites green (no UI tests).

- [ ] **Step 3: Full manual walkthrough at `:3001`**

Verify the success criteria from the spec:
1. Glass everywhere (navy gradient, frosted panels, cyan/violet accents, Barlow/Jakarta/DM-Mono fonts), no hydration error in console.
2. Home momentum strip: level/tier, daily ring, streak multiplier, prominent Continue CTA.
3. Lesson complete / perfect quiz / card mastery → XP float; level-ups celebrate; achievements toast.
4. Reload page → progress, daily, achievements persisted (localStorage migrated cleanly from any old save).
5. Reduced-motion respected.

- [ ] **Step 4: Commit**

```bash
git add components/FlashcardDeck.js components/Dashboard.js
git commit -m "feat(flashcards): mastery XP feedback via ProgressContext"
```

- [ ] **Step 5: Sync knowledge stores (per user CLAUDE.md)**

- Update `C:\Users\yygbu\second-brain\wiki\sources\coop-prep-app.md`: correct the design system to **glassmorphism (g-assist-pro dark-glass)**, document the momentum layer, and remove the stale "solid fintech-dark / Complete" claims. Append a dated entry to `wiki/log.md`.
- Run `/graphify C:\Users\yygbu\coop-prep --update` so the structural graph reflects the new files (`lib/momentum.js`, `components/ProgressContext.js`, `RewardLayer.js`, `MomentumStrip.js`, `FocusTimer.js`).

---

## Self-Review

**Spec coverage:**
- Visual system (glass, g-assist port, fonts) → Task 1. ✓
- Momentum: levels/tiers, streak multiplier, daily goal, achievements, focus timer → Tasks 2, 3, 5, 7. ✓
- Instant feedback (XP float, level-up, toast) → Task 6. ✓
- State model (schema, migration, ProgressContext, derived momentum) → Tasks 3, 4. ✓
- Layout/Home momentum-forward + Continue CTA → Task 5 (strip) + existing Continue card (Task 1 makes it render). ✓
- Tests-first on momentum.js → Task 2. ✓
- Current-state correction (components reference undefined vocabulary) → Task 1 defines the vocabulary. ✓

**Placeholder scan:** One intentional callout in Task 4 — the inline `require(...)` MUST be converted to a top-level `import { awardXp }`; flagged explicitly in the step and gated by `node --check`. No other TODO/placeholder steps.

**Type consistency:** `useProgress()` surface (`progress, days, readiness, momentum, completeLesson, recordQuiz, masterCard, addFocusMinutes, rewards, dismissReward`) is defined in Task 4 and consumed identically in Tasks 5–8. `momentum` shape matches `levelFromXp` output plus `multiplier`/`daily`. Reward shape `{ id, type, amount|level|achId }` produced in Task 4, consumed in Task 6. `formatDuration` signature consistent (Task 2 → Tasks 6/7).
