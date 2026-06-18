# Design — Three-Pillar Foundation + AI Engine + Cover Letter Builder

- **Date:** 2026-06-18
- **Branch:** `feature/pillars-ai-foundation` (off `feature/study-tools`)
- **Status:** Approved (brainstorming complete) — ready for implementation plan
- **Sub-project:** 0 of the COOP three-pillar expansion (the foundation slice), bundled with the first proving AI feature.

---

## 1. Context & goal

The app is being expanded from a 7-module technical curriculum into the COOP Careers
**three-pillar framework — Head / Heart / Hustle** — plus a Capstone simulator and
certification tracking. That full vision is ~8 independent sub-projects, each with its
own spec → plan → build → test cycle. **This spec covers only sub-project 0:** the
shared foundation everything else depends on, proven end-to-end with one AI feature.

**This slice delivers:**
1. A **data-driven three-pillar navigation** (Head / Heart / Hustle) replacing the
   current `Curriculum / Practice / Study` sidebar grouping. Existing 7 modules → Head.
2. A **generic `tool` view** + tool registry so future features slot in with no nav rewrites.
3. The **AI engine** (`lib/ai/`): prebuilt prompt templates + slot-fill + a single
   isolated LLM caller + response sanitizer + key/config management, with graceful
   degradation to structured tools when offline / no key.
4. The **Cover Letter Builder** (Hustle pillar) as the proving vertical slice:
   a finished offline draft via a pure assembler, optionally AI-enhanced with a user key.

**Out of scope (later cycles):** other AI features (interview/pitch/job-search), new
Head/Heart content modules, Capstone simulator, certification tracking, PDF/slide export,
and **mobile UI wiring** (deferred to a fast-follow — see §9).

---

## 2. Architecture: Prebuilt Prompt Engine + graceful degradation

Every AI-touched feature has two layers behind one UI:

| Layer | Condition | Behaviour |
|---|---|---|
| **Structured tool** (always on) | no key / offline | finished deterministic output (assembled letter, rubric, checklist) |
| **Prompt engine** (key required) | key in localStorage **and** online | a static `{{SLOT}}` template auto-filled from local state, fired **once** through an OpenAI-compatible endpoint, sanitized, rendered into a pre-declared zone |

Non-negotiable invariants (the user's audit laws, condensed):
- **Offline integrity:** structured tools work 100% with zero network; no dead-ends.
- **Key isolation:** the API key is read only at call time, only inside `lib/ai/client.js`,
  never hardcoded, never logged, sent only to the configured endpoint.
- **One call per action:** no streaming retries, no background polling; token-budgeted.
- **Display-only responses:** LLM output is sanitized and rendered into a pre-existing
  zone; no DOM construction or code execution from response text.

---

## 3. Navigation & registry (data-driven, self-declaring)

**`data/pillars.js` — pillar metadata only:**
```js
export const PILLARS = [
  { id: 'head',   label: 'Head',   icon: 'brain',     description: 'Hard skills' },
  { id: 'heart',  label: 'Heart',  icon: 'heart',     description: 'Professional identity' },
  { id: 'hustle', label: 'Hustle', icon: 'briefcase', description: 'Job search' },
];
```
> Icons are **Lucide names resolved through the existing `ICONS` map in `Dashboard.js`**
> (`brain`, `heart`, `briefcase` will be added there). Project rule: UI chrome = Lucide SVG;
> emoji only for subject labels in `curriculum.js`. No emoji in pillar metadata.

**`data/registry.js` — aggregates items, each self-declaring `pillarId` + `order`:**
- All existing `MODULES` are mapped to `{ pillarId: 'head', kind: 'module', order: <curriculum index> }`.
- Tools self-declare, e.g. the Cover Letter tool exports
  `{ id: 'coverLetter', kind: 'tool', pillarId: 'hustle', order: 1, label: 'Cover Letter Builder', component: CoverLetterTool }`.
- Sidebar render per pillar: `registry.filter(x => x.pillarId === p.id).sort((a, b) => a.order - b.order)`
  (numeric comparator — never a lexicographic sort on a string key, which breaks at 10+ items).
- Empty pillars (Heart) render a quiet "Coming soon" stub.

**View routing:** add `view: 'tool'` + `activeToolId` to `Dashboard.js`. The tool branch
dispatches to `registry`'s component by id, wrapped in a `ToolErrorBoundary`:
```jsx
<ToolErrorBoundary toolId={activeToolId}>
  {ToolComponent ? <ToolComponent state={progress} dispatch={dispatchTool} /> : <ComingSoon />}
</ToolErrorBoundary>
```
A tool-level throw must not crater the dashboard or wipe progress/XP state.

---

## 4. State & persistence

`lib/progress.js` `defaultState()` gains a `tools` namespace. Each tool **owns its own
default shape** in its `lib/tools/<tool>.js` file; `defaultState()` only imports & spreads:

```js
// lib/tools/coverLetter.js
export const defaultCoverLetterState = {
  fields: { name: '', role: '', company: '', connection: '', skill1: '', skill2: '', cta: 'request interview' },
  aiResponse: null,
  lastSaved: null,
  tokenWarning: false,
};
// reducers (pure, immutable, operate on full progress state under state.tools.coverLetter):
//   setCoverLetterField(state, key, value)
//   setCoverLetterAIResponse(state, text)
//   clearCoverLetterAIResponse(state)
```
`loadProgress`'s existing `{ ...defaultState(), ...JSON.parse(raw) }` spread auto-migrates
old saves (the `tools` key simply appears with defaults). Drafts + last AI response persist
to localStorage and survive reload.

**No new XP / achievements this slice.** The momentum engine is untouched — Hustle
gamification is deferred until the pillar has more than one tool.

---

## 5. AI engine — `lib/ai/`

| File | Responsibility |
|---|---|
| `lib/ai/config.js` | get/set `{ apiKey, endpoint, model }` in localStorage key `coop_ai_v1`; `hasAIKey()`; preset list; sane defaults |
| `lib/ai/fill-prompt.js` | pure `fillPrompt(template, state)` (replace `{{SLOT}}`), `estimateTokens(str)`, token guard that truncates the longest user-text slot and appends `[truncated for length]` |
| `lib/ai/prompts.js` | prebuilt templates, one source of truth (Cover Letter now; others later) |
| `lib/ai/sanitize.js` | `sanitizeResponse(raw)` — strip `<script>`, executable code-fence content, and control characters before any DOM render (**in scope this slice**) |
| `lib/ai/client.js` | the **single** `callLLM({ system, user })` — reads config, builds OpenAI chat-completions request, fires `fetch` once, returns the typed contract below; `fetch` is injectable for tests |

### 5.1 Return contract (verbatim — tests and UI both target this)
```js
// success (no warning)
{ ok: true, text: string }
// success WITH a non-fatal warning (the ONLY case where ok:true carries a warning)
{ ok: true, text: string, warning: { type: 'TOKEN_LIMIT' } }   // prompt was truncated; text still valid
// failure
{ ok: false, error: { type, ...extra } }
//   type: 'NO_KEY'                       -> hasAIKey() false; render structured fallback silently
//   type: 'NETWORK_ERROR'                -> fetch threw; render structured fallback + offline note
//   type: 'API_ERROR', status, message   -> 4xx/5xx from provider; show inline error, never crash
```
`TOKEN_LIMIT` is **not** a failure: the call succeeded and `text` is returned, so it lives on
the `ok: true` shape as an optional `warning`, never under `ok: false`. Tools branch as:
`ok:false` + `NO_KEY`/`NETWORK_ERROR` → structured fallback silently; `ok:false` + `API_ERROR`
→ inline message; `ok:true` + `warning.type === 'TOKEN_LIMIT'` → render `text` with a subtle
"trimmed for length" note.

### 5.2 Settings (`components/Settings.js`, reachable via a gear in the sidebar footer)
- Inputs: **provider preset**, endpoint URL, model, API key (password field).
- Presets (all use one OpenAI chat-completions request shape):
  - **Ollama** — `http://localhost:11434/v1/chat/completions` (recommended: fully local, no CORS).
  - **OpenAI** — `https://api.openai.com/v1/chat/completions`.
  - **Custom** — any `/v1/chat/completions` endpoint.
- Copy: *"Your key is stored only in this browser and sent only to the endpoint you choose.
  If your provider blocks browser requests (CORS), use a local Ollama endpoint or a proxy you control."*
- Default suggested model: a current Claude model id (overridable). An **"AI Enhanced"**
  badge appears app-wide when `hasAIKey()` is true.

> ⚠️ **Build-time gate (not a design question):** `api.anthropic.com` direct-browser calls
> require the header `anthropic-dangerous-direct-browser-access: true`, and Anthropic's
> native request shape differs from OpenAI's. Before any Anthropic preset is added to
> `config.js`, **confirm the exact request shape + headers + current model id against the
> `claude-api` skill**. The OpenAI-compatible shape is the only one shipped in this slice;
> the Anthropic preset is documented but verified before wiring.

---

## 6. Cover Letter Builder

**Structured layer (always on, offline, zero-network):**
- 7-field guided form bound to `tools.coverLetter.fields`.
- Pure `assembleCoverLetter(fields)` produces a **finished, usable letter** from a fixed
  template: opening hook → finance connection → skill evidence → CTA.
- **Partial-field hardening:** the assembler must stay grammatical when optional fields are
  blank. If `skill2` is empty, drop its sentence (or fold `skill1` into a single stronger
  sentence) — never emit a dangling fragment like *"I also bring experience in ."*

**AI layer (key present):**
- "Enhance with AI" → `fillPrompt(prompts.coverLetter, fields)` → `client.callLLM` →
  `sanitizeResponse` → render into a pre-declared output zone; show "AI Enhanced" badge.
- **No key:** the button routes to Settings (discovery moment, not a dead-end).

**Output:** copy-to-clipboard + download `.txt`. (PDF/slides belong to the Capstone cycle.)

**UI:** `components/tools/CoverLetterTool.js`, wrapped in `ToolErrorBoundary`, receives
`(state, dispatch)`. Glass styling consistent with the Apple Liquid-Glass design system.

---

## 7. File tree

**New files:**
- `data/pillars.js` — pillar metadata
- `data/registry.js` — module + tool registry (self-declaring)
- `lib/ai/config.js`
- `lib/ai/fill-prompt.js`
- `lib/ai/prompts.js`
- `lib/ai/sanitize.js`
- `lib/ai/client.js`
- `lib/tools/coverLetter.js` — default shape + reducers + `assembleCoverLetter`
- `components/tools/CoverLetterTool.js`
- `components/ToolErrorBoundary.js`
- `components/Settings.js`
- `test/ai.test.js`
- `test/coverLetter.test.js`

**Modified files (narrow edits only):**
- `components/Dashboard.js` — add `tool` view branch + `activeToolId`; replace sidebar
  section rendering with pillar-driven render; add `brain`/`heart`/`briefcase` to `ICONS`;
  add Settings gear + "AI Enhanced" badge. No change to existing lesson/flash/search/saved logic.
- `lib/progress.js` — add `tools` namespace to `defaultState()` (import & spread tool defaults).
- `lib/coop-lib.js` — re-export new tool reducers + registry (barrel consistency).

---

## 8. Testing (`node --test`, matches existing pattern)

`test/ai.test.js`:
- `fillPrompt`: slot replacement; missing-slot guard (never `undefined`); `estimateTokens`;
  longest-slot truncation past the guard. When truncation fires, `callLLM` returns
  `{ ok: true, text, warning: { type: 'TOKEN_LIMIT' } }` (assert the `ok:true`+`warning` shape,
  not an `ok:false` error).
- `sanitizeResponse`: strips `<script>`, executable fences, control chars; preserves prose.
- `config`: get/set round-trip; `hasAIKey()` true/false (localStorage injected).
- `client.callLLM` (injected `fetch`): `NO_KEY` when no key; `NETWORK_ERROR` on throw;
  `API_ERROR` w/ status on non-ok; `{ ok:true, text }` on success.

`test/coverLetter.test.js`:
- Reducers: `setCoverLetterField` immutability; default shape; `loadProgress` migration of
  an old save (no `tools` key).
- **`assembleCoverLetter` partial-field matrix (enforces §6 hardening):**
  (a) all fields populated, (b) `skill2: ''`, (c) both skills blank — each must be
  grammatically coherent with no dangling sentence.

**Gates:** existing 26 tests stay green + new green; `next build` clean;
`npm run build:mobile` → single-file **offline grep still clean** (no remote/font refs).

---

## 9. Mobile offline contract (documented for the fast-follow)

Mobile UI wiring is **deferred**. `lib/ai/*` and `lib/tools/coverLetter.js` are written
share-ready, but `mobile/src/MobileApp.jsx` does **not** render the Cover Letter tool or
import the `callLLM` path in this slice. Guarantee: because the AI engine only fires behind
`hasAIKey() && userAction`, and mobile never mounts the tool, the mobile bundle never
executes network code — `build:mobile` stays zero-network. **The fast-follow mobile slice
must preserve this:** any mobile AI feature must keep the structured layer fully offline and
gate all network behind an explicit user action + key check.

---

## 10. Build-time gates

- Read `node_modules/next/dist/docs/` for the relevant Next.js 16 APIs **before** writing
  any Next code (per `AGENTS.md` — this Next version has breaking changes vs. training data).
- Consult the `claude-api` skill **before** writing `lib/ai/client.js` and before adding any
  Anthropic preset (request shape, headers, current model id) — see §5 ⚠️ callout.

---

## 11. Sequencing after this slice

1 — Hustle: Document suite (Resume, LinkedIn checklist; Cover Letter already done) ·
2 — Hustle: Interview + Pitch (AI) · 3 — Head: new content modules · 4 — Heart: reflection
tools · 5 — Job Search Guide (AI) · 6 — Capstone simulator · 7 — Certification tracking.
Each is its own spec → plan → build → test cycle. Mobile UI wiring of this slice is the
immediate fast-follow.
