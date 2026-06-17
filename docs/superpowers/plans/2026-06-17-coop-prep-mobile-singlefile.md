# COOP Prep — Offline Single-File Mobile Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a single, self-contained, fully-offline `mobile/dist/index.html` that runs the COOP Prep app on a phone with a bottom-tab touch UI, reusing the existing gamification engine unchanged.

**Architecture:** A dedicated `mobile/` Vite build (`@vitejs/plugin-react` + `vite-plugin-singlefile`) inlines all JS+CSS into one HTML file. It imports the *exact same* `lib/momentum.js`, `lib/progress.js`, `data/curriculum.js`, `components/ProgressContext.js`, and reuses `RewardLayer`/`MomentumStrip`/`FocusTimer` via a Vite `@`→repo-root alias. New code is presentation-only: a bottom-tab shell + fresh mobile views for Home, Modules, Lesson, Flashcards.

**Tech Stack:** Vite 5, React 19 (already a dep), `vite-plugin-singlefile`, Lucide React (already a dep). No Tailwind, no web fonts in the mobile build.

## Global Constraints

- The built `mobile/dist/index.html` MUST make **zero runtime network requests** — no fonts, icons, CSS, scripts, or analytics. System-font stack only; Lucide icons bundled as inline SVG.
- Output is **one** `index.html` with no sibling files required to run. `mobile/dist/` is gitignored and is a **rebuildable artifact, never hand-edited**.
- Business logic is **shared, never duplicated**: import `@/lib/momentum.js`, `@/lib/progress.js`, `@/data/curriculum.js`, `@/components/ProgressContext.js`. localStorage key stays `coop_prep_v1`.
- `useProgress()` API (from `@/components/ProgressContext`): `progress`, `days`, `readiness`, `momentum` (`{level,tierName,xpInLevel,xpForNext,pct,multiplier,daily}`), `completeLesson(id)`, `recordQuiz(id,correct,total)`, `masterCard(idx)`, `addFocusMinutes(min)`, `rewards`, `dismissReward(id)`. Mutating actions return `{xpGained,leveledUp,newAchievements}`.
- **Continue target** = first lesson, in `MODULES` order then `lessons` order, whose `id` is NOT in `progress.completed`; if none, show "all complete".
- **Flashcards = global** flat `FLASHCARDS` deck (`{term,def}`), mastery keyed by global index via `masterCard(gi)`.
- **Sequential unlock**: a lesson is locked until the previous lesson in its module is in `progress.completed`.
- Desktop app is unchanged (additive only: `mobile/`, devDeps, one script, one `.gitignore` line).
- All animation respects `prefers-reduced-motion` (inherited from the ported stylesheet).
- This is a presentation layer with **no React test harness** in the repo; per-task verification is `npm run build:mobile` compiling cleanly + targeted greps. The shared engine keeps its existing `node --test` units (untouched — do not modify `lib/` or `test/`).

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add devDeps (`vite`, `@vitejs/plugin-react`, `vite-plugin-singlefile`) + `"build:mobile"` script |
| `.gitignore` | Modify | Ignore `mobile/dist` |
| `mobile/vite.config.js` | Create | Vite config: react + singlefile plugins, `@`→repo root alias, root=`mobile`, outDir=`mobile/dist` |
| `mobile/index.html` | Create | HTML entry: viewport meta, `#root`, module script |
| `mobile/src/main.jsx` | Create | Mounts `<ProgressProvider><MobileApp/><RewardLayer/></ProgressProvider>` |
| `mobile/src/styles.css` | Create | Ported glass design system (no Tailwind, system fonts) + mobile classes |
| `mobile/src/MobileApp.jsx` | Create | Shell: spinner gate, view routing, bottom tab bar |
| `mobile/src/MobileHome.jsx` | Create | Momentum strip (reused) + Continue + 2×2 stats + focus timer (reused) |
| `mobile/src/MobileModules.jsx` | Create | Module list + module lesson list (with locks) |
| `mobile/src/MobileLesson.jsx` | Create | Lesson / Quiz / Challenge tabs; calls shared context actions |
| `mobile/src/MobileFlashcards.jsx` | Create | Global flip deck; `masterCard(gi)` |

Reused unchanged (imported, not copied): `@/components/RewardLayer`, `@/components/MomentumStrip`, `@/components/FocusTimer`, plus the shared logic modules.

---

## Task 1: Build scaffold — single-file pipeline boots

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `mobile/vite.config.js`, `mobile/index.html`, `mobile/src/main.jsx`, `mobile/src/styles.css`, `mobile/src/MobileApp.jsx` (placeholder)

**Interfaces:**
- Produces: `npm run build:mobile` → `mobile/dist/index.html`; `MobileApp` default export (placeholder this task).

- [ ] **Step 1: Add devDeps + script to `package.json`**

Add to `"scripts"`: `"build:mobile": "vite build --config mobile/vite.config.js"`. Add to `"devDependencies"`: `"vite": "^5.4.0"`, `"@vitejs/plugin-react": "^4.3.0"`, `"vite-plugin-singlefile": "^2.0.0"`. Then run `npm install`.

- [ ] **Step 2: Ignore the build artifact**

Append to `.gitignore`:
```
# mobile single-file build artifact (rebuildable)
/mobile/dist
```

- [ ] **Step 3: Create `mobile/vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url)); // mobile/
const root = path.resolve(dir, "..");                     // repo root

export default defineConfig({
  root: dir,
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { "@": root } },
  build: {
    outDir: path.resolve(dir, "dist"),
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 5000,
  },
});
```

- [ ] **Step 4: Create `mobile/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>COOP Prep</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `mobile/src/styles.css`**

Copy `app/globals.css` into `mobile/src/styles.css`, then make exactly these edits:
1. Delete the first line `@import "tailwindcss";`.
2. Replace the three font custom properties in `:root` with system stacks:
```css
  --font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
  --font-body:    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
  --font-mono:    ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```
3. Append the mobile shell classes at the end of the file:
```css
/* ── Mobile shell ── */
#root { min-height: 100dvh; }
.mobile-main { padding: 16px 16px calc(76px + env(safe-area-inset-bottom)); max-width: 560px; margin: 0 auto; }
.tab-bar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
  display: flex; padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
  background: rgba(9,14,24,0.85);
  backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%);
  border-top: 1px solid var(--border);
}
.tab-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 6px 0; background: none; border: none; cursor: pointer;
  color: var(--text-3); font-size: 11px; font-weight: 600;
}
.tab-btn.active { color: var(--blue-2); }
.mobile-topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
```

- [ ] **Step 6: Create placeholder `mobile/src/MobileApp.jsx`**

```jsx
export default function MobileApp() {
  return <div className="mobile-main"><div className="card" style={{ padding: 20 }}>COOP Prep mobile — scaffold OK</div></div>;
}
```

- [ ] **Step 7: Create `mobile/src/main.jsx`**

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { ProgressProvider } from "@/components/ProgressContext";
import RewardLayer from "@/components/RewardLayer";
import MobileApp from "./MobileApp";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProgressProvider>
      <MobileApp />
      <RewardLayer />
    </ProgressProvider>
  </React.StrictMode>
);
```

- [ ] **Step 8: Build and verify single-file output**

Run: `npm run build:mobile`
Expected: build succeeds; `mobile/dist/index.html` exists. Verify it is self-contained and references no sibling/remote assets:
```bash
ls mobile/dist                      # expect: index.html (no .js/.css siblings required)
grep -oE '(src|href)="[^"]+"' mobile/dist/index.html | grep -vE '="data:' || echo "no external src/href: OK"
grep -oE 'https?://[^")} ]+' mobile/dist/index.html | grep -iE 'font|cdn|css|js' || echo "no remote asset URLs: OK"
```
Expected: no external `src`/`href`, no remote font/CDN URLs. (Inert `https://` strings inside bundled lesson text are fine.)

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore mobile/vite.config.js mobile/index.html mobile/src/main.jsx mobile/src/styles.css mobile/src/MobileApp.jsx
git commit -m "feat(mobile): single-file Vite build scaffold (offline, glass styles)"
```

---

## Task 2: MobileApp shell — spinner gate, view routing, bottom tabs

**Files:**
- Modify: `mobile/src/MobileApp.jsx` (replace placeholder)

**Interfaces:**
- Consumes: `useProgress()`; child views (placeholders until Tasks 3–6): import them as they are created. This task renders simple per-tab placeholders.
- Produces: view state machine `home | modules | lesson | flash` + `activeModule`/`activeLesson`; bottom tab bar.

- [ ] **Step 1: Replace `mobile/src/MobileApp.jsx`**

```jsx
import { useState } from "react";
import { useProgress } from "@/components/ProgressContext";
import { LayoutDashboard, BookOpen, CreditCard } from "lucide-react";

export default function MobileApp() {
  const { progress } = useProgress();
  const [view, setView] = useState("home");          // home | modules | lesson | flash
  const [activeModule, setActiveModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  if (!progress) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--blue)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Tab → top-level view. "modules" tab shows the module list (or a drilled-in module/lesson).
  const tab = view === "lesson" ? "modules" : view;

  let body;
  if (view === "home") body = <div className="card" style={{ padding: 20 }}>Home (Task 3)</div>;
  else if (view === "flash") body = <div className="card" style={{ padding: 20 }}>Flashcards (Task 6)</div>;
  else body = <div className="card" style={{ padding: 20 }}>Modules (Task 4/5)</div>;

  const TABS = [
    { id: "home",   label: "Home",       icon: LayoutDashboard },
    { id: "modules",label: "Modules",    icon: BookOpen },
    { id: "flash",  label: "Flashcards", icon: CreditCard },
  ];

  return (
    <>
      <div className="mobile-main">{body}</div>
      <nav className="tab-bar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`tab-btn ${tab === id ? "active" : ""}`}
            onClick={() => { setView(id); setActiveModule(null); setActiveLesson(null); }}>
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build:mobile`
Expected: build succeeds. Then open `mobile/dist/index.html` in the desktop browser (or `start mobile/dist/index.html`) and confirm: spinner flashes then the tab bar shows Home/Modules/Flashcards and tapping switches the placeholder panels. (Manual; no automated DOM test.)

- [ ] **Step 3: Commit**

```bash
git add mobile/src/MobileApp.jsx
git commit -m "feat(mobile): bottom-tab shell with spinner gate + view routing"
```

---

## Task 3: MobileHome — momentum strip + Continue + stats + focus timer

**Files:**
- Create: `mobile/src/MobileHome.jsx`
- Modify: `mobile/src/MobileApp.jsx` (render `<MobileHome onOpenLesson=… onGoModules=…/>` for `view==="home"`)

**Interfaces:**
- Consumes: `useProgress()` (`progress`, `days`, `readiness`, `momentum`), `@/components/MomentumStrip` (default export, reused), `@/components/FocusTimer` (default export, reused), `@/data/curriculum` (`MODULES`).
- Produces: `MobileHome({ onOpenLesson(mod, lesson), onGoModules() })`.

- [ ] **Step 1: Create `mobile/src/MobileHome.jsx`**

```jsx
import { useProgress } from "@/components/ProgressContext";
import MomentumStrip from "@/components/MomentumStrip";
import FocusTimer from "@/components/FocusTimer";
import { MODULES } from "@/data/curriculum";
import { BookOpen, Target, Zap, Flame, ChevronRight, Clock } from "lucide-react";

export default function MobileHome({ onOpenLesson, onGoModules }) {
  const { progress, days, readiness } = useProgress();
  const allLessons = MODULES.flatMap(m => m.lessons);
  const doneLessons = allLessons.filter(l => progress.completed[l.id]).length;
  const quizPasses = Object.values(progress.quizScores).filter(s => s.correct === s.total).length;

  // Continue target: first incomplete lesson in module/lesson order.
  let next = null;
  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      if (!progress.completed[lesson.id]) { next = { mod, lesson }; break; }
    }
    if (next) break;
  }

  const stats = [
    { icon: <BookOpen size={15} />, value: doneLessons, sub: `/ ${allLessons.length}`, label: "Lessons", color: "var(--blue-2)" },
    { icon: <Target size={15} />, value: quizPasses, sub: " passed", label: "Quizzes", color: "var(--green)" },
    { icon: <Zap size={15} />, value: progress.xp, sub: " XP", label: "Earned", color: "var(--gold)" },
    { icon: <Flame size={15} />, value: progress.streak, sub: " days", label: "Streak", color: "#fb923c" },
  ];

  return (
    <div className="fadein">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>COOP Prep</h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{days} days to the fellowship</p>
      </div>

      <MomentumStrip />

      {/* Continue */}
      {next ? (
        <button onClick={() => onOpenLesson(next.mod, next.lesson)} className="card card-btn"
          style={{ display: "block", width: "100%", textAlign: "left", padding: 18, marginBottom: 16,
            borderColor: `${next.mod.color}40`, background: `linear-gradient(135deg, var(--card) 0%, ${next.mod.color}10 100%)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span className="badge" style={{ background: `${next.mod.color}20`, color: next.mod.color, borderColor: `${next.mod.color}40` }}>Continue</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{next.mod.title}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", lineHeight: 1.25, marginBottom: 8 }}>{next.lesson.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, color: "var(--text-3)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{next.lesson.minutes} min</span>
            <span style={{ color: "var(--gold)", fontWeight: 600 }}>+50 XP</span>
            <ChevronRight size={15} style={{ marginLeft: "auto", color: "var(--blue-2)" }} />
          </div>
        </button>
      ) : (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>All lessons complete 🎉</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Review flashcards and practice your pitch.</div>
        </div>
      )}

      {/* 2×2 stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {stats.map(({ icon, value, sub, label, color }) => (
          <div key={label} className="card" style={{ padding: 14, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ color, display: "flex", alignItems: "center" }}>{icon}</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{value}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Focus timer (reused widget) */}
      <div className="card" style={{ padding: "6px 10px" }}><FocusTimer /></div>

      <button onClick={onGoModules} className="btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
        Browse all modules <ChevronRight size={15} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `MobileApp.jsx`**

Add `import MobileHome from "./MobileHome";`. Replace the `view === "home"` body line with:
```jsx
  if (view === "home") body = <MobileHome onOpenLesson={(m, l) => { setActiveModule(m); setActiveLesson(l); setView("lesson"); }} onGoModules={() => setView("modules")} />;
```

- [ ] **Step 3: Build + manual verify**

Run: `npm run build:mobile` (succeeds). Open `mobile/dist/index.html`: Home shows the momentum strip, a Continue card (first lesson), 2×2 stats in mono, and a Focus row.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/MobileHome.jsx mobile/src/MobileApp.jsx
git commit -m "feat(mobile): Home view (momentum strip + continue + stats + focus timer)"
```

---

## Task 4: MobileModules — module list + lesson list with sequential locks

**Files:**
- Create: `mobile/src/MobileModules.jsx`
- Modify: `mobile/src/MobileApp.jsx` (render for `view==="modules"`)

**Interfaces:**
- Consumes: `useProgress()` (`progress`), `@/data/curriculum` (`MODULES`).
- Produces: `MobileModules({ activeModule, onOpenModule(mod), onOpenLesson(mod, lesson), onBack() })`. When `activeModule` is null → module list; else → that module's lesson list.

- [ ] **Step 1: Create `mobile/src/MobileModules.jsx`**

```jsx
import { MODULES } from "@/data/curriculum";
import { useProgress } from "@/components/ProgressContext";
import { ChevronRight, ChevronLeft, Lock, CheckCircle2 } from "lucide-react";

export default function MobileModules({ activeModule, onOpenModule, onOpenLesson, onBack }) {
  const { progress } = useProgress();

  if (!activeModule) {
    return (
      <div className="fadein">
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>Modules</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MODULES.map(mod => {
            const total = mod.lessons.length;
            const done = mod.lessons.filter(l => progress.completed[l.id]).length;
            const pct = Math.round((done / total) * 100);
            const allDone = done === total;
            return (
              <button key={mod.id} onClick={() => onOpenModule(mod)} className="card card-btn"
                style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, textAlign: "left", width: "100%" }}>
                <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${mod.color}18`, border: `1px solid ${mod.color}30`, fontSize: 18 }}>{mod.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{mod.title}</span>
                    {allDone && <span className="badge badge-green">Done</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${pct}%`, background: allDone ? "var(--green)" : mod.color }} /></div>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)", flexShrink: 0 }}>{done}/{total}</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const mod = activeModule;
  return (
    <div className="fadein">
      <div className="mobile-topbar">
        <button onClick={onBack} className="btn-ghost"><ChevronLeft size={15} /> Modules</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "center", background: `${mod.color}18`, border: `1px solid ${mod.color}30`, fontSize: 16 }}>{mod.icon}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{mod.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>{mod.description}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mod.lessons.map((lesson, i) => {
          const done = !!progress.completed[lesson.id];
          const locked = i > 0 && !progress.completed[mod.lessons[i - 1].id];
          return (
            <button key={lesson.id} disabled={locked}
              onClick={() => !locked && onOpenLesson(mod, lesson)}
              className="card card-btn"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, textAlign: "left", width: "100%", opacity: locked ? 0.4 : 1, cursor: locked ? "not-allowed" : "pointer" }}>
              <div style={{ flexShrink: 0 }}>
                {locked ? <Lock size={15} style={{ color: "var(--text-3)" }} /> : done ? <CheckCircle2 size={15} style={{ color: "var(--green)" }} /> : <div style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid ${mod.color}` }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{lesson.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{lesson.minutes} min · {lesson.quiz?.length || 0} questions</div>
              </div>
              {!locked && <ChevronRight size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `MobileApp.jsx`**

Add `import MobileModules from "./MobileModules";`. Replace the `else` (modules) body with:
```jsx
  else body = <MobileModules
    activeModule={view === "modules" ? activeModule : null}
    onOpenModule={(m) => setActiveModule(m)}
    onOpenLesson={(m, l) => { setActiveModule(m); setActiveLesson(l); setView("lesson"); }}
    onBack={() => setActiveModule(null)} />;
```
(The `modules` tab with `activeModule` set shows the lesson list; tapping a lesson sets `view="lesson"`, handled in Task 5.)

- [ ] **Step 3: Build + manual verify**

Run `npm run build:mobile` (succeeds). Open it: Modules tab lists 7 modules → tap one → lesson list; lesson 2+ shows a lock until the prior is complete.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/MobileModules.jsx mobile/src/MobileApp.jsx
git commit -m "feat(mobile): module list + lesson list with sequential locks"
```

---

## Task 5: MobileLesson — Lesson/Quiz/Challenge wired to shared actions

**Files:**
- Create: `mobile/src/MobileLesson.jsx`
- Modify: `mobile/src/MobileApp.jsx` (render for `view==="lesson"`)

**Interfaces:**
- Consumes: `useProgress()` (`completeLesson`, `recordQuiz`, `progress`), lesson/module objects.
- Produces: `MobileLesson({ mod, lesson, onBack() })`. Calls `completeLesson(lesson.id)` and `recordQuiz(lesson.id, correct, total)` — the SAME shared pathways as desktop (no local XP logic).

- [ ] **Step 1: Create `mobile/src/MobileLesson.jsx`**

```jsx
import { useState } from "react";
import { useProgress } from "@/components/ProgressContext";
import { ChevronLeft, CheckCircle2, Clock, HelpCircle, Lightbulb } from "lucide-react";

export default function MobileLesson({ mod, lesson, onBack }) {
  const { progress, completeLesson, recordQuiz } = useProgress();
  const [tab, setTab] = useState("read");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const done = !!progress.completed[lesson.id];
  const allAnswered = lesson.quiz?.every((_, i) => answers[i] !== undefined);
  const correct = submitted ? lesson.quiz.filter((q, i) => answers[i] === q.a).length : 0;

  function submit() {
    if (!lesson.quiz?.length) return;
    const c = lesson.quiz.filter((q, i) => answers[i] === q.a).length;
    setSubmitted(true);
    recordQuiz(lesson.id, c, lesson.quiz.length);  // shared pathway → XP + achievements
  }

  const TABS = [
    { id: "read", label: "Lesson", icon: <Clock size={13} /> },
    { id: "quiz", label: `Quiz (${lesson.quiz?.length || 0})`, icon: <HelpCircle size={13} /> },
    { id: "challenge", label: "Challenge", icon: <Lightbulb size={13} /> },
  ];

  return (
    <div className="fadein">
      <div className="mobile-topbar">
        <button onClick={onBack} className="btn-ghost"><ChevronLeft size={15} /> Back</button>
        {done && <span className="badge badge-green" style={{ marginLeft: "auto" }}><CheckCircle2 size={10} /> Done</span>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: mod.color }}>{mod.title}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>{lesson.title}</div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", fontSize: 12.5, fontWeight: 600,
              borderRadius: "var(--r-sm)", cursor: "pointer",
              background: tab === t.id ? "var(--card-2)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-3)",
              border: tab === t.id ? `1px solid ${mod.color}55` : "1px solid var(--border)" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "read" && (
        <div className="fadein">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {lesson.body.map((p, i) => <p key={i} style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-2)" }}>{p}</p>)}
          </div>
          {!done ? (
            <button onClick={() => completeLesson(lesson.id)} className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: 14, background: mod.color, color: "#03121a" }}>
              <CheckCircle2 size={16} /> Mark Complete · +50 XP
            </button>
          ) : (
            <div className="card" style={{ padding: 14, textAlign: "center", color: "var(--green)", background: "var(--green-dim)", border: "1px solid var(--green-ring)" }}>✓ Lesson complete</div>
          )}
        </div>
      )}

      {tab === "quiz" && (
        <div className="fadein" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!lesson.quiz?.length ? <div className="card" style={{ padding: 20, textAlign: "center", color: "var(--text-2)" }}>No questions.</div> : (
            <>
              {lesson.quiz.map((q, qi) => (
                <div key={qi} className="card" style={{ padding: 16, borderLeft: `3px solid ${mod.color}60` }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}><span style={{ color: "var(--text-3)", marginRight: 6 }}>{qi + 1}.</span>{q.q}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt, oi) => {
                      const selected = answers[qi] === opt;
                      const isCorrect = opt === q.a;
                      let bg = "var(--card-2)", border = "var(--border-2)", color = "var(--text-2)";
                      if (submitted) {
                        if (isCorrect) { bg = "var(--green-dim)"; border = "var(--green-ring)"; color = "var(--green)"; }
                        else if (selected) { bg = "var(--red-dim)"; border = "rgba(248,113,113,0.4)"; color = "var(--red)"; }
                      } else if (selected) { bg = "var(--blue-dim)"; border = "var(--blue-ring)"; color = "var(--blue-2)"; }
                      return (
                        <button key={opt} disabled={submitted} onClick={() => setAnswers(p => ({ ...p, [qi]: opt }))}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: "var(--r-md)", background: bg, border: `1px solid ${border}`, color, fontSize: 14, fontWeight: 500, textAlign: "left", cursor: submitted ? "default" : "pointer" }}>
                          <span className="mono" style={{ fontSize: 11, fontWeight: 700, opacity: 0.5 }}>{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {submitted ? (
                <>
                  <div className="card" style={{ padding: 18, textAlign: "center", background: correct === lesson.quiz.length ? "var(--green-dim)" : "var(--gold-dim)" }}>
                    <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: correct === lesson.quiz.length ? "var(--green)" : "var(--gold-2)" }}>{correct}/{lesson.quiz.length}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{correct === lesson.quiz.length ? "Perfect! +25 XP" : "Review the highlighted answers."}</div>
                  </div>
                  <button onClick={() => { setAnswers({}); setSubmitted(false); }} className="btn-ghost" style={{ width: "100%", justifyContent: "center" }}>Retry</button>
                </>
              ) : (
                <button onClick={submit} disabled={!allAnswered} className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: 14, background: allAnswered ? mod.color : "var(--card-2)", color: allAnswered ? "#03121a" : "var(--text-3)", cursor: allAnswered ? "pointer" : "not-allowed" }}>
                  {allAnswered ? "Submit Quiz" : `Answer all ${lesson.quiz.length}`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {tab === "challenge" && (
        <div className="fadein">
          <div className="card-2" style={{ padding: 18, borderLeft: `3px solid ${mod.color}` }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: mod.color, marginBottom: 10 }}>Apply Your Knowledge</div>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-2)" }}>{lesson.challenge}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `MobileApp.jsx`**

Add `import MobileLesson from "./MobileLesson";`. Before the modules `else`, add a branch:
```jsx
  else if (view === "lesson" && activeLesson) body = <MobileLesson mod={activeModule} lesson={activeLesson} onBack={() => setView("modules")} />;
```
(Ensure this branch precedes the generic modules `else`.)

- [ ] **Step 3: Build + manual verify**

Run `npm run build:mobile` (succeeds). Open it: open a lesson → Mark Complete fires an XP float (RewardLayer) and "First Steps" toast on the first; Quiz submit shows score and perfect-score bonus.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/MobileLesson.jsx mobile/src/MobileApp.jsx
git commit -m "feat(mobile): lesson/quiz/challenge view via shared context actions"
```

---

## Task 6: MobileFlashcards — global flip deck

**Files:**
- Create: `mobile/src/MobileFlashcards.jsx`
- Modify: `mobile/src/MobileApp.jsx` (render for `view==="flash"`)

**Interfaces:**
- Consumes: `useProgress()` (`progress`, `masterCard`), `@/data/curriculum` (`FLASHCARDS`).
- Produces: `MobileFlashcards()`. Mastery keyed by GLOBAL index: `masterCard(FLASHCARDS.indexOf(card))`.

- [ ] **Step 1: Create `mobile/src/MobileFlashcards.jsx`**

```jsx
import { useState } from "react";
import { useProgress } from "@/components/ProgressContext";
import { FLASHCARDS } from "@/data/curriculum";
import { ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";

export default function MobileFlashcards() {
  const { progress, masterCard } = useProgress();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState({ ...progress.flashDone });
  const [mode, setMode] = useState("all");

  const deck = mode === "unseen" ? FLASHCARDS.filter((_, i) => !known[i]) : FLASHCARDS;
  const mastered = Object.keys(known).length;

  if (!deck.length) {
    return (
      <div className="scalein" style={{ textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>All {FLASHCARDS.length} mastered!</div>
        <button onClick={() => { setMode("all"); setIdx(0); }} className="btn-primary" style={{ justifyContent: "center" }}><RotateCcw size={14} /> Review all</button>
      </div>
    );
  }

  const pos = idx % deck.length;
  const card = deck[pos];

  function markKnown() {
    const gi = FLASHCARDS.indexOf(card);
    setKnown(k => ({ ...k, [gi]: true }));
    masterCard(gi);
    setFlipped(false);
    setIdx(i => (i >= deck.length - 1 ? 0 : i + 1));
  }
  function navigate(d) { setFlipped(false); setTimeout(() => setIdx(i => (i + d + deck.length) % deck.length), 60); }

  return (
    <div className="fadein">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Flashcards</h2>
        <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
          {[["all", `All ${FLASHCARDS.length}`], ["unseen", `Unseen ${FLASHCARDS.length - mastered}`]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setIdx(0); setFlipped(false); }}
              style={{ padding: "6px 12px", borderRadius: "var(--r-sm)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: mode === m ? "var(--card-2)" : "transparent", color: mode === m ? "var(--text)" : "var(--text-3)", border: mode === m ? "1px solid var(--border-2)" : "1px solid transparent" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-3)", marginBottom: 12 }} className="mono">{pos + 1} of {deck.length} · {mastered} mastered</div>

      <div style={{ perspective: "1200px", cursor: "pointer", userSelect: "none", marginBottom: 20 }}
        onClick={() => setFlipped(f => !f)} role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && setFlipped(f => !f)}>
        <div style={{ position: "relative", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)", height: 280 }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "var(--card-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
            <span className="badge badge-blue" style={{ marginBottom: 16 }}>TERM</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{card.term}</div>
            <div style={{ marginTop: 18, fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}><RotateCcw size={11} /> Tap to flip</div>
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--card-2)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
            <span className="badge badge-gold" style={{ marginBottom: 16 }}>DEFINITION</span>
            <div style={{ fontSize: 15.5, color: "var(--text-2)", lineHeight: 1.7 }}>{card.def}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button onClick={() => navigate(-1)} className="btn-ghost"><ChevronLeft size={15} /> Prev</button>
        {flipped ? (
          <button onClick={markKnown} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: "var(--r-md)", background: "var(--green-dim)", color: "var(--green)", border: "1px solid var(--green-ring)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}><Check size={14} /> Got it</button>
        ) : <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>Flip to mark</span>}
        <button onClick={() => navigate(1)} className="btn-ghost">Next <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `MobileApp.jsx`**

Add `import MobileFlashcards from "./MobileFlashcards";`. Replace the `view === "flash"` body with:
```jsx
  else if (view === "flash") body = <MobileFlashcards />;
```

- [ ] **Step 3: Build + manual verify**

Run `npm run build:mobile` (succeeds). Open it: Flashcards tab flips a card; "Got it" advances and (first 20th mastery) can fire the `cards-20` achievement; mastery persists on reload.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/MobileFlashcards.jsx mobile/src/MobileApp.jsx
git commit -m "feat(mobile): global flashcard flip deck via masterCard"
```

---

## Task 7: Offline hardening + final verification

**Files:** none new (verification + any fix found).

- [ ] **Step 1: Production build**

Run: `npm run build:mobile`
Expected: succeeds; `mobile/dist/index.html` is the only file needed.

- [ ] **Step 2: Assert zero remote runtime assets**

```bash
echo "--- external link/script src (expect none) ---"
grep -oE '<(link|script)[^>]*>' mobile/dist/index.html | grep -E 'href="https?:|src="https?:' || echo "OK: no remote link/script"
echo "--- @import / url() remote (expect none) ---"
grep -oE '@import[^;]+https?:|url\(https?:' mobile/dist/index.html || echo "OK: no remote css"
echo "--- google fonts (expect none) ---"
grep -i 'fonts.googleapis\|fonts.gstatic' mobile/dist/index.html || echo "OK: no google fonts"
```
Expected: all three print OK. If any remote reference appears, trace it (e.g., a stray `<link>` or a CSS `url()`), remove it, rebuild, and re-run.

- [ ] **Step 3: Confirm single-file self-sufficiency**

```bash
ls mobile/dist
```
Expected: `index.html` (a `.vite`/manifest file is fine; no `.js`/`.css` that the HTML loads via `src`/`href`). Confirm Step 2 already showed no local `src=`/`href=` to sibling assets.

- [ ] **Step 4: Offline smoke (manual, controller/user)**

Open `mobile/dist/index.html` with the network disabled (DevTools → Network → Offline, or airplane mode on the phone). Confirm: Home renders with glass + momentum strip; open a lesson → Mark Complete → XP float; submit a quiz; flip a flashcard → Got it; reload → progress persisted. No console request errors.

- [ ] **Step 5: Final commit (if any fix was needed)**

```bash
git add -A
git commit -m "chore(mobile): verify offline self-containment of single-file build"
```
(If Steps 2–3 passed with no change, skip the commit.)

- [ ] **Step 6: Knowledge sync (controller)**

Update `~/second-brain/wiki/sources/coop-prep-app.md` with a "Mobile build" section (single-file Vite artifact, bottom-tab UI, shared engine, offline) + append to `wiki/log.md`; run `/graphify C:\Users\yygbu\coop-prep --update` so the new `mobile/` files enter the graph.

---

## Self-Review

**Spec coverage:**
- Single self-contained offline HTML → Tasks 1, 7. ✓
- Vite single-file build + `build:mobile` + `@`-alias reuse → Task 1. ✓
- Shared engine (momentum/progress/curriculum/context) imported, not duplicated → Tasks 3–6 import from `@/`. ✓
- RewardLayer reused → Task 1 (`main.jsx`). ✓
- Bottom tabs Home/Modules/Flashcards → Task 2. ✓
- Home: momentum strip + Continue + stats + focus timer → Task 3. ✓
- Continue rule (first incomplete in order) → Task 3. ✓
- Modules + sequential locks → Task 4. ✓
- Lesson tabs via shared `completeLesson`/`recordQuiz` → Task 5. ✓
- Flashcards global, `masterCard(gi)` → Task 6. ✓
- No runtime remote assets / system fonts → Task 1 (styles), Task 7 (assert). ✓
- Rebuildable artifact, gitignored → Task 1. ✓
- Desktop unchanged; presentation-only → no task touches `lib/`, `app/`, `data/`, or desktop components. ✓

**Placeholder scan:** Task 1/2 use intentional, labeled placeholders ("Home (Task 3)") that later tasks replace — each is removed by a named step. No "TBD"/"add error handling"/missing-code steps.

**Type consistency:** `useProgress()` fields and action names (`completeLesson`, `recordQuiz`, `masterCard`, `addFocusMinutes`, `momentum`, `progress`, `days`, `readiness`) match the shared `ProgressContext` API and are used identically across Tasks 3–6. `MobileApp` view ids (`home|modules|lesson|flash`) and the child component prop names (`onOpenLesson`, `onOpenModule`, `onBack`, `onGoModules`, `mod`, `lesson`, `activeModule`) are consistent between MobileApp wiring and each component's signature. Curriculum shapes (`mod.{id,title,color,icon,description,lessons}`, `lesson.{id,title,minutes,body,quiz:[{q,options,a}],challenge}`, card `{term,def}`) match the desktop components.
