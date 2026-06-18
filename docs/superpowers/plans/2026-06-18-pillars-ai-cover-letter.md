# Three-Pillar Foundation + AI Engine + Cover Letter Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a data-driven Head/Heart/Hustle pillar navigation, an offline-first AI engine (prebuilt prompt templates + single isolated LLM caller with graceful degradation), and a Cover Letter Builder as the first proving feature — on web/desktop only.

**Architecture:** Pure, unit-tested logic in `lib/` (AI engine + tool reducers), presentation in `components/`. Every AI feature has two layers behind one UI: a structured tool that works fully offline, and a prompt engine that fires once through an OpenAI-compatible endpoint when a user-supplied key is present. Navigation is driven by a node-testable data registry; React components are mapped to registry ids in the view layer (so the registry module stays importable under `node --test`).

**Tech Stack:** Next.js 16 (App Router, `.js`-with-JSX client components), React 19, plain ESM `lib/`, `node --test` for unit tests, localStorage for persistence.

## Global Constraints

- **Offline integrity:** structured tools work with zero network; AI code only executes behind `hasAIKey() && user action`. No dead-ends.
- **Key isolation:** the API key is read only at call time, only inside `lib/ai/client.js`; never hardcoded, never logged, sent only to the configured endpoint.
- **One call per action:** no streaming, no retries, no polling; input token budget ≤ 600 (`estimateTokens` ≈ `ceil(len/4)`).
- **Display-only responses:** LLM output passes through `sanitizeResponse` before any render.
- **Icons:** UI chrome uses Lucide SVG via the `ICONS` map in `Dashboard.js`; emoji only for `curriculum.js` subject labels. No emoji in pillar metadata.
- **No new XP/achievements this slice** — the momentum engine (`lib/momentum.js`) is untouched.
- **No mobile UI wiring this slice** — `mobile/src/MobileApp.jsx` is not modified; `build:mobile` must stay zero-network.
- **Return contract (verbatim):**
  - `{ ok: true, text }` — success.
  - `{ ok: true, text, warning: { type: 'TOKEN_LIMIT' } }` — success, prompt truncated (the ONLY case where `ok:true` carries a warning).
  - `{ ok: false, error: { type } }` where type ∈ `NO_KEY | NETWORK_ERROR | API_ERROR{status,message}`.
- **Build-time gates:** read `node_modules/next/dist/docs/` before any Next code; consult the `claude-api` skill before finalizing `lib/ai/client.js` defaults and before adding any Anthropic preset (request shape, `anthropic-dangerous-direct-browser-access` header, current model id).
- **Branch:** `feature/pillars-ai-foundation`. Commit after every task.

---

### Task 1: AI engine — pure prompt fill + sanitize

**Files:**
- Create: `lib/ai/fill-prompt.js`
- Create: `lib/ai/sanitize.js`
- Test: `test/ai-pure.test.js`

**Interfaces:**
- Produces:
  - `fillPrompt(template: string, values: object) -> string` — replaces every `{{key}}`; throws `Error` listing any slot whose key is absent from `values` (empty string is a valid value).
  - `estimateTokens(str: string) -> number` — `Math.ceil(str.length / 4)`.
  - `budgetPrompt({ template, values, truncatable = [], maxTokens = 600 }) -> { text, truncated }` — fills the template; if `estimateTokens(text) > maxTokens`, repeatedly truncates the longest `truncatable` slot value (appending `" […truncated for length]"`) and refills until within budget or no further reduction; returns `{ text, truncated }`.
  - `sanitizeResponse(raw: string) -> string` — removes `<script>`/`<style>` blocks (incl. unclosed) and control chars (`\x00-\x08\x0B\x0C\x0E-\x1F`), trims; preserves ordinary prose.

- [ ] **Step 1: Write the failing test**

```js
// test/ai-pure.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { fillPrompt, estimateTokens, budgetPrompt } from "../lib/ai/fill-prompt.js";
import { sanitizeResponse } from "../lib/ai/sanitize.js";

test("fillPrompt replaces all slots", () => {
  assert.equal(fillPrompt("Hi {{name}}, role {{role}}", { name: "Sam", role: "Analyst" }),
    "Hi Sam, role Analyst");
});

test("fillPrompt treats empty string as a valid value", () => {
  assert.equal(fillPrompt("a{{x}}b", { x: "" }), "ab");
});

test("fillPrompt throws listing missing slots", () => {
  assert.throws(() => fillPrompt("{{a}} {{b}}", { a: "1" }), /b/);
});

test("estimateTokens approximates len/4", () => {
  assert.equal(estimateTokens("abcd"), 1);
  assert.equal(estimateTokens("abcde"), 2);
});

test("budgetPrompt leaves short prompts untouched", () => {
  const r = budgetPrompt({ template: "hi {{x}}", values: { x: "there" } });
  assert.equal(r.truncated, false);
  assert.equal(r.text, "hi there");
});

test("budgetPrompt truncates the longest truncatable slot when over budget", () => {
  const big = "x".repeat(5000);
  const r = budgetPrompt({ template: "{{a}}", values: { a: big }, truncatable: ["a"], maxTokens: 50 });
  assert.equal(r.truncated, true);
  assert.ok(estimateTokens(r.text) <= 50 + 10); // within budget (+ marker slack)
  assert.match(r.text, /truncated for length/);
});

test("sanitizeResponse strips script blocks and control chars", () => {
  const out = sanitizeResponse("Hello<script>alert(1)</script>\x00 world");
  assert.equal(out, "Hello world");
});

test("sanitizeResponse preserves ordinary prose", () => {
  assert.equal(sanitizeResponse("Dear Hiring Team,\n\nI am writing."), "Dear Hiring Team,\n\nI am writing.");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/ai-pure.test.js`
Expected: FAIL — cannot find module `../lib/ai/fill-prompt.js`.

- [ ] **Step 3: Implement `lib/ai/fill-prompt.js`**

```js
const SLOT_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function fillPrompt(template, values) {
  const missing = [];
  const out = template.replace(SLOT_RE, (_, key) => {
    if (!(key in values)) { missing.push(key); return ""; }
    return String(values[key]);
  });
  if (missing.length) throw new Error(`fillPrompt: missing slots: ${missing.join(", ")}`);
  return out;
}

export function estimateTokens(str) {
  return Math.ceil((str || "").length / 4);
}

export function budgetPrompt({ template, values, truncatable = [], maxTokens = 600 }) {
  const MARKER = " […truncated for length]";
  let working = { ...values };
  let text = fillPrompt(template, working);
  let truncated = false;

  while (estimateTokens(text) > maxTokens) {
    // pick the longest truncatable slot that still has trimmable content
    let target = null;
    for (const k of truncatable) {
      const v = String(working[k] ?? "");
      if (!v.replace(MARKER, "").length) continue;
      if (!target || v.length > String(working[target]).length) target = k;
    }
    if (!target) break; // nothing left to cut
    const current = String(working[target]).replace(MARKER, "");
    const nextLen = Math.max(0, Math.floor(current.length * 0.6));
    working[target] = current.slice(0, nextLen) + MARKER;
    truncated = true;
    text = fillPrompt(template, working);
    if (nextLen === 0) break;
  }
  return { text, truncated };
}
```

- [ ] **Step 4: Implement `lib/ai/sanitize.js`**

```js
export function sanitizeResponse(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*$/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*$/gi, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim();
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/ai-pure.test.js`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/ai/fill-prompt.js lib/ai/sanitize.js test/ai-pure.test.js
git commit -m "feat(ai): pure prompt-fill, token budget, and response sanitizer"
```

---

### Task 2: AI engine — config, presets, prompts

**Files:**
- Create: `lib/ai/config.js`
- Create: `lib/ai/prompts.js`
- Test: `test/ai-config.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `getConfig() -> { apiKey, endpoint, model, preset }` (merges stored over `DEFAULT_CONFIG`).
  - `setConfig(partial: object) -> void` (merges + persists to localStorage key `coop_ai_v1`).
  - `hasAIKey() -> boolean` (stored `apiKey` is a non-empty trimmed string).
  - `DEFAULT_CONFIG`, `PRESETS` (array of `{ id, label, endpoint }`; `custom` has `endpoint: ""`).
  - `COVER_LETTER_PROMPT = { system, template, truncatable }` (from `prompts.js`).
- Note: config functions guard `typeof window === "undefined"` exactly like `lib/progress.js`. Tests inject a memory localStorage via `globalThis`.

- [ ] **Step 1: Write the failing test**

```js
// test/ai-config.test.js
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// memory localStorage shim (config.js guards on `window`)
function installStorage() {
  const map = new Map();
  globalThis.window = globalThis.window || {};
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

const { getConfig, setConfig, hasAIKey, DEFAULT_CONFIG, PRESETS } =
  await import("../lib/ai/config.js");

beforeEach(() => installStorage());

test("getConfig returns defaults when nothing stored", () => {
  assert.equal(getConfig().endpoint, DEFAULT_CONFIG.endpoint);
  assert.equal(getConfig().apiKey, "");
});

test("setConfig merges and persists", () => {
  setConfig({ apiKey: "sk-test", model: "m1" });
  const c = getConfig();
  assert.equal(c.apiKey, "sk-test");
  assert.equal(c.model, "m1");
  assert.equal(c.endpoint, DEFAULT_CONFIG.endpoint); // untouched key preserved
});

test("hasAIKey reflects a non-empty key", () => {
  assert.equal(hasAIKey(), false);
  setConfig({ apiKey: "  " });
  assert.equal(hasAIKey(), false);
  setConfig({ apiKey: "sk-real" });
  assert.equal(hasAIKey(), true);
});

test("PRESETS include ollama, openai, custom", () => {
  const ids = PRESETS.map((p) => p.id);
  assert.deepEqual(ids.sort(), ["custom", "ollama", "openai"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/ai-config.test.js`
Expected: FAIL — cannot find module `../lib/ai/config.js`.

- [ ] **Step 3: Implement `lib/ai/config.js`**

```js
const KEY = "coop_ai_v1";

export const DEFAULT_CONFIG = {
  apiKey: "",
  endpoint: "https://api.openai.com/v1/chat/completions",
  // Suggested model; user overrides in Settings. Verify Claude/Anthropic id + headers
  // via the claude-api skill before shipping an Anthropic preset (see plan Global Constraints).
  model: "claude-opus-4-8",
  preset: "openai",
};

export const PRESETS = [
  { id: "ollama", label: "Ollama (local, recommended)", endpoint: "http://localhost:11434/v1/chat/completions" },
  { id: "openai", label: "OpenAI", endpoint: "https://api.openai.com/v1/chat/completions" },
  { id: "custom", label: "Custom (OpenAI-compatible)", endpoint: "" },
];

function store() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage || globalThis.localStorage || null; }
  catch { return null; }
}

export function getConfig() {
  const s = store();
  if (!s) return { ...DEFAULT_CONFIG };
  try {
    const raw = s.getItem(KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG };
  } catch { return { ...DEFAULT_CONFIG }; }
}

export function setConfig(partial) {
  const s = store();
  if (!s) return;
  try { s.setItem(KEY, JSON.stringify({ ...getConfig(), ...partial })); } catch {}
}

export function hasAIKey() {
  return typeof getConfig().apiKey === "string" && getConfig().apiKey.trim().length > 0;
}
```

> Note: the test shim sets `globalThis.localStorage` (not `window.localStorage`); the `store()` fallback to `globalThis.localStorage` makes both the browser and the test path work.

- [ ] **Step 4: Implement `lib/ai/prompts.js`**

```js
export const COVER_LETTER_PROMPT = {
  system:
    "You are a professional cover letter editor for early-career candidates entering " +
    "financial services. Write in a clear, confident, professional tone. Never invent " +
    "facts. Only work with what the user provides. Max 350 words total output.",
  template:
    'Candidate name: {{name}}\n' +
    'Target role: {{role}}\n' +
    'Target company: {{company}}\n' +
    'Personal connection to finance (their words): "{{connection}}"\n' +
    'Skill evidence 1: "{{skill1}}"\n' +
    'Skill evidence 2: "{{skill2}}"\n' +
    'Call to action preference: {{cta}}\n\n' +
    'Rewrite their cover letter using the inputs above. Structure: opening hook ' +
    '(2 sentences) -> finance connection (2 sentences) -> skill evidence (3 sentences) ' +
    '-> closing call to action (1 sentence). Do not add any information not provided above.',
  truncatable: ["connection", "skill1", "skill2"],
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/ai-config.test.js`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/ai/config.js lib/ai/prompts.js test/ai-config.test.js
git commit -m "feat(ai): localStorage config, provider presets, cover-letter prompt"
```

---

### Task 3: AI engine — the single LLM caller

**Files:**
- Create: `lib/ai/client.js`
- Test: `test/ai-client.test.js`

**Interfaces:**
- Consumes: `budgetPrompt` (Task 1), `sanitizeResponse` (Task 1), `getConfig` (Task 2).
- Produces:
  - `async callLLM({ system, template, values, truncatable = [], fetchImpl, config }) -> contract`
    where the contract is the verbatim shape in Global Constraints. `fetchImpl` defaults to
    `globalThis.fetch`; `config` defaults to `getConfig()` (both injectable for tests).
    Request body is OpenAI chat-completions shape:
    `{ model, messages: [{role:"system",content:system},{role:"user",content:user}] }`,
    header `Authorization: Bearer <apiKey>`.

- [ ] **Step 1: Write the failing test**

```js
// test/ai-client.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { callLLM } from "../lib/ai/client.js";

const baseCfg = { apiKey: "sk-x", endpoint: "https://api.test/v1/chat/completions", model: "m" };
const okFetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "Dear Team," } }] }) });

test("NO_KEY when apiKey is empty", async () => {
  const r = await callLLM({ system: "s", template: "{{x}}", values: { x: "a" }, config: { ...baseCfg, apiKey: "" }, fetchImpl: okFetch });
  assert.deepEqual(r, { ok: false, error: { type: "NO_KEY" } });
});

test("success returns ok + sanitized text", async () => {
  const r = await callLLM({ system: "s", template: "{{x}}", values: { x: "a" }, config: baseCfg, fetchImpl: okFetch });
  assert.equal(r.ok, true);
  assert.equal(r.text, "Dear Team,");
  assert.equal(r.warning, undefined);
});

test("NETWORK_ERROR when fetch throws", async () => {
  const r = await callLLM({ system: "s", template: "{{x}}", values: { x: "a" }, config: baseCfg, fetchImpl: async () => { throw new Error("down"); } });
  assert.deepEqual(r, { ok: false, error: { type: "NETWORK_ERROR" } });
});

test("API_ERROR carries status on non-ok response", async () => {
  const r = await callLLM({ system: "s", template: "{{x}}", values: { x: "a" }, config: baseCfg,
    fetchImpl: async () => ({ ok: false, status: 429, text: async () => "rate limit" }) });
  assert.equal(r.ok, false);
  assert.equal(r.error.type, "API_ERROR");
  assert.equal(r.error.status, 429);
});

test("TOKEN_LIMIT warning rides on ok:true when truncation fires", async () => {
  const big = "y".repeat(5000);
  const r = await callLLM({ system: "s", template: "{{a}}", values: { a: big }, truncatable: ["a"],
    config: baseCfg, fetchImpl: okFetch });
  assert.equal(r.ok, true);
  assert.deepEqual(r.warning, { type: "TOKEN_LIMIT" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/ai-client.test.js`
Expected: FAIL — cannot find module `../lib/ai/client.js`.

- [ ] **Step 3: Implement `lib/ai/client.js`**

```js
import { budgetPrompt } from "./fill-prompt.js";
import { sanitizeResponse } from "./sanitize.js";
import { getConfig } from "./config.js";

export async function callLLM({ system, template, values, truncatable = [], fetchImpl, config } = {}) {
  const cfg = config ?? getConfig();
  const doFetch = fetchImpl ?? globalThis.fetch;
  if (!cfg || typeof cfg.apiKey !== "string" || !cfg.apiKey.trim()) {
    return { ok: false, error: { type: "NO_KEY" } };
  }

  const { text: user, truncated } = budgetPrompt({ template, values, truncatable });

  const body = {
    model: cfg.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  let res;
  try {
    res = await doFetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: { type: "NETWORK_ERROR" } };
  }

  if (!res.ok) {
    let message = "";
    try { message = await res.text(); } catch {}
    return { ok: false, error: { type: "API_ERROR", status: res.status, message } };
  }

  let data;
  try { data = await res.json(); } catch {
    return { ok: false, error: { type: "API_ERROR", status: res.status, message: "invalid JSON" } };
  }

  const text = sanitizeResponse(data?.choices?.[0]?.message?.content ?? "");
  return truncated ? { ok: true, text, warning: { type: "TOKEN_LIMIT" } } : { ok: true, text };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/ai-client.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/ai/client.js test/ai-client.test.js
git commit -m "feat(ai): single isolated callLLM with typed error contract"
```

---

### Task 4: Cover Letter logic + tools state namespace

**Files:**
- Create: `lib/tools/coverLetter.js`
- Modify: `lib/progress.js` (add `tools` to `defaultState()`)
- Test: `test/coverLetter.test.js`

**Interfaces:**
- Consumes: `defaultState` (existing).
- Produces:
  - `defaultCoverLetterState` — `{ fields:{name,role,company,connection,skill1,skill2,cta}, aiResponse:null, lastSaved:null }`.
  - `setCoverLetterField(state, key, value) -> state` (immutable; updates `state.tools.coverLetter.fields[key]`).
  - `setCoverLetterAIResponse(state, text) -> state` and `clearCoverLetterAIResponse(state) -> state`.
  - `assembleCoverLetter(fields) -> string` (partial-field hardened — no dangling fragments).

- [ ] **Step 1: Write the failing test**

```js
// test/coverLetter.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "../lib/progress.js";
import {
  defaultCoverLetterState, setCoverLetterField,
  setCoverLetterAIResponse, clearCoverLetterAIResponse, assembleCoverLetter,
} from "../lib/tools/coverLetter.js";

test("defaultState includes a coverLetter tool namespace", () => {
  assert.deepEqual(defaultState().tools.coverLetter, defaultCoverLetterState);
});

test("loadProgress-style spread migrates an old save with no tools key", () => {
  const old = { completed: { "excel-1": true }, xp: 10 }; // pre-tools shape
  const migrated = { ...defaultState(), ...old };
  assert.deepEqual(migrated.tools.coverLetter, defaultCoverLetterState);
  assert.equal(migrated.xp, 10);
});

test("setCoverLetterField updates immutably", () => {
  const s = defaultState();
  const next = setCoverLetterField(s, "company", "Acme Bank");
  assert.equal(next.tools.coverLetter.fields.company, "Acme Bank");
  assert.equal(s.tools.coverLetter.fields.company, ""); // original untouched
  assert.notEqual(s, next);
});

test("setCoverLetterAIResponse / clear round-trips", () => {
  let s = setCoverLetterAIResponse(defaultState(), "AI letter");
  assert.equal(s.tools.coverLetter.aiResponse, "AI letter");
  s = clearCoverLetterAIResponse(s);
  assert.equal(s.tools.coverLetter.aiResponse, null);
});

test("assembleCoverLetter — all fields produce both skills", () => {
  const out = assembleCoverLetter({ name: "Sam Lee", role: "Data Analyst", company: "Acme Bank",
    connection: "Markets have fascinated me since college", skill1: "SQL", skill2: "Tableau", cta: "request interview" });
  assert.match(out, /Acme Bank/);
  assert.match(out, /SQL/);
  assert.match(out, /Tableau/);
  assert.match(out, /Sam Lee/);
});

test("assembleCoverLetter — blank skill2 leaves no dangling fragment", () => {
  const out = assembleCoverLetter({ name: "Sam", role: "Analyst", company: "Acme",
    connection: "I love finance", skill1: "SQL", skill2: "", cta: "express interest" });
  assert.match(out, /SQL/);
  assert.doesNotMatch(out, /as well as\s*[.,]/);
  assert.doesNotMatch(out, /experience in\s*[.,]/);
});

test("assembleCoverLetter — both skills blank omits the skill sentence cleanly", () => {
  const out = assembleCoverLetter({ name: "Sam", role: "Analyst", company: "Acme",
    connection: "I love finance", skill1: "", skill2: "", cta: "follow up" });
  assert.doesNotMatch(out, /experience in\s*[.,]/);
  assert.doesNotMatch(out, /undefined/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/coverLetter.test.js`
Expected: FAIL — cannot find module `../lib/tools/coverLetter.js`.

- [ ] **Step 3: Implement `lib/tools/coverLetter.js`**

```js
export const defaultCoverLetterState = {
  fields: { name: "", role: "", company: "", connection: "", skill1: "", skill2: "", cta: "request interview" },
  aiResponse: null,
  lastSaved: null,
};

function withCL(state, clPatch) {
  const cl = state.tools?.coverLetter ?? defaultCoverLetterState;
  return { ...state, tools: { ...state.tools, coverLetter: { ...cl, ...clPatch } } };
}

export function setCoverLetterField(state, key, value) {
  const cl = state.tools?.coverLetter ?? defaultCoverLetterState;
  return withCL(state, { fields: { ...cl.fields, [key]: value }, lastSaved: new Date().toISOString() });
}

export function setCoverLetterAIResponse(state, text) {
  return withCL(state, { aiResponse: text });
}

export function clearCoverLetterAIResponse(state) {
  return withCL(state, { aiResponse: null });
}

const CTA_LINES = {
  "request interview": "I would welcome the chance to discuss how I can contribute — may we schedule a brief conversation?",
  "express interest": "I am genuinely excited about this opportunity and would be glad to share more about how I can contribute.",
  "follow up": "Thank you for your consideration; I will follow up shortly and welcome any questions in the meantime.",
};

export function assembleCoverLetter(fields) {
  const f = fields || {};
  const name = (f.name || "").trim() || "[Your Name]";
  const role = (f.role || "").trim() || "the role";
  const company = (f.company || "").trim() || "your organization";
  const connection = (f.connection || "").trim();
  const s1 = (f.skill1 || "").trim();
  const s2 = (f.skill2 || "").trim();
  const cta = CTA_LINES[f.cta] || CTA_LINES["request interview"];

  const paras = [`Dear Hiring Team at ${company},`];
  paras.push(`I am writing to express my strong interest in ${role} at ${company}.`);
  if (connection) paras.push(/[.!?]$/.test(connection) ? connection : connection + ".");
  if (s1 && s2) paras.push(`I bring proven experience in ${s1}, as well as ${s2} — both of which map directly to the demands of this role.`);
  else if (s1) paras.push(`I bring proven experience in ${s1}, which maps directly to the demands of this role.`);
  else if (s2) paras.push(`I bring proven experience in ${s2}, which maps directly to the demands of this role.`);
  paras.push(cta);
  paras.push(`Sincerely,\n${name}`);
  return paras.join("\n\n");
}
```

- [ ] **Step 4: Modify `lib/progress.js` — add `tools` to `defaultState()`**

Add the import at the top (after the existing `import { awardXp } ...`):

```js
import { defaultCoverLetterState } from "./tools/coverLetter.js";
```

In `defaultState()`, add a `tools` key to the returned object (place it after `achievements: {},`):

```js
    achievements: {},   // id → ISO unlockedAt
    tools: { coverLetter: defaultCoverLetterState },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test test/coverLetter.test.js`
Expected: PASS (7 tests).
Run: `node --test` (full suite)
Expected: all existing + new tests PASS (was 26 → now 26 + new).

- [ ] **Step 6: Commit**

```bash
git add lib/tools/coverLetter.js lib/progress.js test/coverLetter.test.js
git commit -m "feat(tools): cover letter reducers + assembler; tools state namespace"
```

---

### Task 5: Pillar metadata + item registry

**Files:**
- Create: `data/pillars.js`
- Create: `data/registry.js`
- Modify: `lib/coop-lib.js` (barrel re-exports)
- Test: `test/registry.test.js`

**Interfaces:**
- Consumes: `MODULES` (existing `data/curriculum.js`).
- Produces:
  - `PILLARS = [{ id, label, icon, description }]` for `head`, `heart`, `hustle` (icons are Lucide names).
  - `TOOLS = [{ id:"coverLetter", kind:"tool", pillarId:"hustle", order:1, label:"Cover Letter Builder" }]` (no React component — components are mapped in the view layer).
  - `buildRegistry() -> Array<{ id, kind, pillarId, order, label, color? }>` (modules mapped to `head` with `order = curriculum index`).
  - `itemsForPillar(pillarId) -> sorted items` (numeric sort `(a,b)=>a.order-b.order`).

- [ ] **Step 1: Write the failing test**

```js
// test/registry.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { PILLARS } from "../data/pillars.js";
import { buildRegistry, itemsForPillar, TOOLS } from "../data/registry.js";
import { MODULES } from "../data/curriculum.js";

test("PILLARS are head, heart, hustle with Lucide (non-emoji) icons", () => {
  assert.deepEqual(PILLARS.map((p) => p.id), ["head", "heart", "hustle"]);
  for (const p of PILLARS) assert.match(p.icon, /^[a-z]+$/); // lucide name, not emoji
});

test("buildRegistry maps every module to head in curriculum order", () => {
  const head = itemsForPillar("head");
  assert.equal(head.length, MODULES.length);
  assert.deepEqual(head.map((x) => x.id), MODULES.map((m) => m.id));
  assert.ok(head.every((x) => x.kind === "module" && x.pillarId === "head"));
});

test("hustle pillar contains the cover letter tool", () => {
  const hustle = itemsForPillar("hustle");
  assert.equal(hustle.length, 1);
  assert.equal(hustle[0].id, "coverLetter");
  assert.equal(hustle[0].kind, "tool");
});

test("heart pillar is empty in this slice", () => {
  assert.deepEqual(itemsForPillar("heart"), []);
});

test("itemsForPillar sorts numerically by order", () => {
  const orders = itemsForPillar("head").map((x) => x.order);
  const sorted = [...orders].sort((a, b) => a - b);
  assert.deepEqual(orders, sorted);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/registry.test.js`
Expected: FAIL — cannot find module `../data/pillars.js`.

- [ ] **Step 3: Implement `data/pillars.js`**

```js
// Pillar metadata only. Icons are Lucide names resolved via the ICONS map in Dashboard.js.
export const PILLARS = [
  { id: "head", label: "Head", icon: "brain", description: "Hard skills" },
  { id: "heart", label: "Heart", icon: "heart", description: "Professional identity" },
  { id: "hustle", label: "Hustle", icon: "briefcase", description: "Job search" },
];
```

- [ ] **Step 4: Implement `data/registry.js`**

```js
import { MODULES } from "./curriculum.js";

// Tools self-declare their pillar + order (no React component here — kept node-testable;
// the id→component map lives in the view layer, Dashboard.js TOOL_COMPONENTS).
export const TOOLS = [
  { id: "coverLetter", kind: "tool", pillarId: "hustle", order: 1, label: "Cover Letter Builder" },
];

export function buildRegistry() {
  const mods = MODULES.map((m, i) => ({
    id: m.id, kind: "module", pillarId: "head", order: i, label: m.title, color: m.color,
  }));
  return [...mods, ...TOOLS];
}

export function itemsForPillar(pillarId) {
  return buildRegistry().filter((x) => x.pillarId === pillarId).sort((a, b) => a.order - b.order);
}
```

- [ ] **Step 5: Modify `lib/coop-lib.js` — barrel re-exports**

Append these exports to `lib/coop-lib.js` (after the existing `export { searchCurriculum } ...` line):

```js
export { PILLARS } from "../data/pillars.js";
export { buildRegistry, itemsForPillar, TOOLS } from "../data/registry.js";
export {
  defaultCoverLetterState, setCoverLetterField, setCoverLetterAIResponse,
  clearCoverLetterAIResponse, assembleCoverLetter,
} from "./tools/coverLetter.js";
export { getConfig, setConfig, hasAIKey, PRESETS } from "./ai/config.js";
export { callLLM } from "./ai/client.js";
export { COVER_LETTER_PROMPT } from "./ai/prompts.js";
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test test/registry.test.js`
Expected: PASS (5 tests).
Run: `node --test`
Expected: full suite PASS.

- [ ] **Step 7: Commit**

```bash
git add data/pillars.js data/registry.js lib/coop-lib.js test/registry.test.js
git commit -m "feat(nav): pillar metadata + node-testable item registry"
```

---

### Task 6: ToolErrorBoundary + Settings UI

**Files:**
- Create: `components/ToolErrorBoundary.js`
- Create: `components/Settings.js`

**Interfaces:**
- Consumes: `getConfig`, `setConfig`, `PRESETS` (Task 2).
- Produces:
  - `<ToolErrorBoundary toolId={string}>{children}</ToolErrorBoundary>` — resets its error when `toolId` changes.
  - `<Settings onClose={fn} onSaved={fn} />` — edits + persists AI config.
- This task has no `node --test` (React UI); verification is `next build` + manual.

- [ ] **Step 1: Implement `components/ToolErrorBoundary.js`**

```jsx
"use client";
import { Component } from "react";

export default class ToolErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) {
    if (prev.toolId !== this.props.toolId && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ padding: 24, maxWidth: 720, margin: "40px auto" }}>
          <h3 style={{ margin: "0 0 8px" }}>Something went wrong in this tool.</h3>
          <p style={{ color: "var(--text-3)", margin: 0 }}>
            Your progress and XP are safe. Switch to another section, or reload the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Implement `components/Settings.js`**

```jsx
"use client";
import { useState } from "react";
import { getConfig, setConfig, PRESETS } from "@/lib/ai/config";

export default function Settings({ onClose, onSaved }) {
  const [cfg, setCfg] = useState(() => getConfig());
  const [saved, setSaved] = useState(false);

  function update(patch) { setCfg((c) => ({ ...c, ...patch })); setSaved(false); }
  function applyPreset(id) {
    const p = PRESETS.find((x) => x.id === id);
    update({ preset: id, ...(p && p.endpoint ? { endpoint: p.endpoint } : {}) });
  }
  function save() { setConfig(cfg); setSaved(true); onSaved?.(); }

  const input = { width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1px solid var(--glass-border)", background: "var(--glass-fill)", color: "var(--text-1)", marginTop: 6 };
  const label = { fontSize: 13, color: "var(--text-2)", marginTop: 14, display: "block" };

  return (
    <div className="card" style={{ padding: 28, maxWidth: 640, margin: "32px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>AI Settings</h2>
        {onClose && <button className="btn-ghost" onClick={onClose}>Close</button>}
      </div>
      <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>
        Your key is stored only in this browser and sent only to the endpoint you choose. If your
        provider blocks browser requests (CORS), use a local Ollama endpoint or a proxy you control.
      </p>

      <label style={label}>Provider preset</label>
      <select style={input} value={cfg.preset} onChange={(e) => applyPreset(e.target.value)}>
        {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>

      <label style={label}>Endpoint URL</label>
      <input style={input} value={cfg.endpoint} onChange={(e) => update({ endpoint: e.target.value })}
        placeholder="https://.../v1/chat/completions" />

      <label style={label}>Model</label>
      <input style={input} value={cfg.model} onChange={(e) => update({ model: e.target.value })} />

      <label style={label}>API key</label>
      <input style={input} type="password" value={cfg.apiKey}
        onChange={(e) => update({ apiKey: e.target.value })} placeholder="stored locally only" />

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20 }}>
        <button className="btn-primary" onClick={save}>Save</button>
        {saved && <span style={{ color: "var(--green)", fontSize: 13 }}>Saved ✓</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: compiles cleanly (no import/type errors from the two new files).

- [ ] **Step 4: Commit**

```bash
git add components/ToolErrorBoundary.js components/Settings.js
git commit -m "feat(ui): tool error boundary + AI settings panel"
```

---

### Task 7: Cover Letter Builder UI

**Files:**
- Create: `components/tools/CoverLetterTool.js`

**Interfaces:**
- Consumes: `assembleCoverLetter`, `setCoverLetterField`, `setCoverLetterAIResponse`, `clearCoverLetterAIResponse` (Task 4); `hasAIKey` (Task 2); `callLLM` (Task 3); `COVER_LETTER_PROMPT` (Task 2).
- Props: `{ state, dispatch, onOpenSettings }` where `dispatch(updater)` applies `updater(state) -> state` and persists (provided by Dashboard in Task 8).
- This task has no `node --test`; verification is `next build` + manual.

- [ ] **Step 1: Implement `components/tools/CoverLetterTool.js`**

```jsx
"use client";
import { useState } from "react";
import {
  assembleCoverLetter, setCoverLetterField,
  setCoverLetterAIResponse, clearCoverLetterAIResponse,
} from "@/lib/tools/coverLetter";
import { hasAIKey } from "@/lib/ai/config";
import { callLLM } from "@/lib/ai/client";
import { COVER_LETTER_PROMPT } from "@/lib/ai/prompts";

const FIELDS = [
  ["name", "Your name"], ["role", "Target role"], ["company", "Target company"],
  ["connection", "Your connection to finance"], ["skill1", "Skill / evidence 1"],
  ["skill2", "Skill / evidence 2 (optional)"],
];

export default function CoverLetterTool({ state, dispatch, onOpenSettings }) {
  const cl = state.tools.coverLetter;
  const fields = cl.fields;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [trimmed, setTrimmed] = useState(false);

  const draft = assembleCoverLetter(fields);
  const output = cl.aiResponse || draft;

  function set(key, value) { dispatch((s) => setCoverLetterField(s, key, value)); }

  async function enhance() {
    if (!hasAIKey()) { onOpenSettings(); return; }
    setBusy(true); setError(null); setTrimmed(false);
    const res = await callLLM({
      system: COVER_LETTER_PROMPT.system,
      template: COVER_LETTER_PROMPT.template,
      values: fields,
      truncatable: COVER_LETTER_PROMPT.truncatable,
    });
    setBusy(false);
    if (res.ok) {
      dispatch((s) => setCoverLetterAIResponse(s, res.text));
      if (res.warning?.type === "TOKEN_LIMIT") setTrimmed(true);
    } else if (res.error.type === "API_ERROR") {
      setError(`Provider error ${res.error.status}. Check your Settings.`);
    } else if (res.error.type === "NETWORK_ERROR") {
      setError("Couldn't reach the AI endpoint — your offline draft is shown below.");
    } else if (res.error.type === "NO_KEY") {
      onOpenSettings();
    }
  }

  function copy() { navigator.clipboard?.writeText(output); }
  function download() {
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const input = { width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1px solid var(--glass-border)", background: "var(--glass-fill)", color: "var(--text-1)", marginTop: 6 };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "8px 4px" }}>
      <h1 style={{ marginTop: 0 }}>Cover Letter Builder</h1>
      <p style={{ color: "var(--text-3)" }}>
        Fill the fields for a ready-to-use draft. Add an API key in Settings to enhance it with AI.
      </p>

      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        {FIELDS.map(([key, lbl]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: "var(--text-2)" }}>{lbl}</label>
            {key === "connection" ? (
              <textarea style={{ ...input, minHeight: 70 }} value={fields[key]} onChange={(e) => set(key, e.target.value)} />
            ) : (
              <input style={input} value={fields[key]} onChange={(e) => set(key, e.target.value)} />
            )}
          </div>
        ))}
        <label style={{ fontSize: 13, color: "var(--text-2)" }}>Call to action</label>
        <select style={input} value={fields.cta} onChange={(e) => set("cta", e.target.value)}>
          <option value="request interview">Request an interview</option>
          <option value="express interest">Express interest</option>
          <option value="follow up">Follow up</option>
        </select>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={enhance} disabled={busy}>
            {busy ? "Enhancing…" : "Enhance with AI"}
          </button>
          {cl.aiResponse && (
            <button className="btn-ghost" onClick={() => dispatch((s) => clearCoverLetterAIResponse(s))}>
              Revert to draft
            </button>
          )}
        </div>
        {error && <p style={{ color: "var(--orange-2, #f59e0b)", fontSize: 13, marginTop: 10 }}>{error}</p>}
        {trimmed && <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 10 }}>Inputs were trimmed for length.</p>}
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span className="section-label">{cl.aiResponse ? "AI-enhanced letter" : "Your draft"}</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-ghost" onClick={copy}>Copy</button>
            <button className="btn-ghost" onClick={download}>Download .txt</button>
          </div>
        </div>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, lineHeight: 1.6 }}>{output}</pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: compiles cleanly.

- [ ] **Step 3: Commit**

```bash
git add components/tools/CoverLetterTool.js
git commit -m "feat(tools): Cover Letter Builder UI (offline draft + AI enhance)"
```

---

### Task 8: Wire pillars, tool view, Settings, and AI badge into Dashboard

**Files:**
- Modify: `components/Dashboard.js`

**Interfaces:**
- Consumes: `PILLARS`, `itemsForPillar` (Task 5); `hasAIKey` (Task 2); `ToolErrorBoundary`, `Settings` (Task 6); `CoverLetterTool` (Task 7).
- Produces: a `tool` view + `settings` view; pillar-driven sidebar; `dispatchTool(updater)`; an "AI Enhanced" badge.
- This task has no `node --test`; verification is `next build` + manual on the dev server.

- [ ] **Step 1: Add imports + icons + the tool component map**

At the top of `components/Dashboard.js`, after `import * as lib from "@/lib/coop-lib";`, add:

```js
import ToolErrorBoundary from "@/components/ToolErrorBoundary";
import Settings from "@/components/Settings";
import CoverLetterTool from "@/components/tools/CoverLetterTool";

const TOOL_COMPONENTS = { coverLetter: CoverLetterTool };
```

Inside the `ICONS` object, add these four entries (Lucide paths):

```js
  brain: '<path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
```

- [ ] **Step 2: Add state, the tool dispatcher, and navigation handlers**

In the component body, near the other `useState` calls, add:

```js
  const [activeToolId, setActiveToolId] = useState(null);
  const [aiOn, setAiOn] = useState(false);
```

In the mount `useEffect` (where `setProgress(lib.loadProgress())` runs), add after it:

```js
    setAiOn(lib.hasAIKey());
```

Add these handlers near `openModule`/`openLesson`:

```js
  function openTool(id) { setView("tool"); setActiveToolId(id); }
  function dispatchTool(updater) {
    setProgress((prev) => { const next = updater(prev); lib.saveProgress(next); return next; });
  }
```

- [ ] **Step 3: Replace the sidebar sections (Curriculum/Practice/Study) with pillar-driven nav**

Find the sidebar block that renders the `Curriculum` section-label + the `MODULES.map(...)` nav buttons (around lines 301–319). Replace the **Curriculum section only** (leave the existing `Practice` and `Study` sections below it intact) with:

```jsx
              {lib.PILLARS.map((p) => {
                const items = lib.itemsForPillar(p.id);
                return (
                  <div key={p.id}>
                    <div style={{ margin: "16px 0 6px", padding: "0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name={p.icon} size={13} color="var(--text-3)" />
                      <span className="section-label">{p.label}</span>
                    </div>
                    {items.length === 0 && (
                      <div style={{ padding: "4px 11px", fontSize: 12, color: "var(--text-3)" }}>Coming soon</div>
                    )}
                    {items.map((it) => {
                      if (it.kind === "module") {
                        const mod = MODULES.find((m) => m.id === it.id);
                        const active = (view === "module" || view === "lesson") && activeModuleId === it.id;
                        return (
                          <button key={it.id} className={active ? "nav-item active" : "nav-item"} onClick={() => openModule(it.id)} style={{ paddingLeft: 11 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 4, background: it.color, flexShrink: 0 }} />
                            <span>{it.label}</span>
                          </button>
                        );
                      }
                      const active = view === "tool" && activeToolId === it.id;
                      return (
                        <button key={it.id} className={active ? "nav-item active" : "nav-item"} onClick={() => openTool(it.id)} style={{ paddingLeft: 11 }}>
                          <Icon name="note" size={15} />
                          <span>{it.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
```

- [ ] **Step 4: Add the Settings gear + AI badge to the sidebar footer**

In the sidebar footer area (near the existing focus-timer / progress block), add a settings button and the AI badge:

```jsx
              <button className="nav-item" onClick={() => setView("settings")} style={{ marginTop: 8 }}>
                <Icon name="settings" size={15} />
                <span>AI Settings</span>
                {aiOn && (
                  <span className="badge badge-green" style={{ marginLeft: "auto" }}>AI</span>
                )}
              </button>
```

- [ ] **Step 5: Add the `tool` and `settings` view branches in `<main>`**

After the existing `{view === "saved" && (...)}` branch, add:

```jsx
          {view === "tool" && (
            <ToolErrorBoundary toolId={activeToolId}>
              {TOOL_COMPONENTS[activeToolId]
                ? (() => { const T = TOOL_COMPONENTS[activeToolId];
                    return <T state={progress} dispatch={dispatchTool} onOpenSettings={() => setView("settings")} />; })()
                : <div className="card" style={{ padding: 24, maxWidth: 720, margin: "40px auto" }}>Coming soon.</div>}
            </ToolErrorBoundary>
          )}
          {view === "settings" && (
            <Settings onClose={() => setView("home")} onSaved={() => setAiOn(lib.hasAIKey())} />
          )}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: compiles cleanly; static pages generate.

- [ ] **Step 7: Commit**

```bash
git add components/Dashboard.js
git commit -m "feat(nav): pillar sidebar, tool/settings views, AI badge in Dashboard"
```

---

### Task 9: Final verification — tests, build, offline mobile, manual

**Files:** none (verification only).

- [ ] **Step 1: Full unit suite**

Run: `node --test`
Expected: all tests PASS — the original 26 plus the new files (`ai-pure`, `ai-config`, `ai-client`, `coverLetter`, `registry`). Record the new total.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: compiles, static pages generated, no errors.

- [ ] **Step 3: Mobile offline integrity (contract from spec §9)**

Run: `npm run build:mobile`
Then verify the built single file makes zero network/font references:

Run: `grep -iE "https?://|@import|googleapis|fonts\\.|api\\.openai|anthropic|11434" mobile/dist/index.html || echo "OFFLINE-CLEAN"`
Expected: `OFFLINE-CLEAN` (no remote refs; AI code is never mounted on mobile this slice).

- [ ] **Step 4: Manual smoke (web/desktop)**

Start dev (a server may already run on :3001; use another port if so):
Run: `npm run dev -- --port 3005`
Then manually confirm:
1. Sidebar shows **Head** (7 modules), **Heart** ("Coming soon"), **Hustle** (Cover Letter Builder), plus Practice + Study.
2. Existing lesson/flashcard/search/saved flows still work and XP/streak unaffected.
3. Cover Letter Builder: filling fields updates the draft live; **blank skill2 yields no dangling sentence**; Copy + Download work.
4. With no key, "Enhance with AI" opens **AI Settings**; saving a key shows the **AI** badge.
5. Reload the page — cover letter fields persist (localStorage).

- [ ] **Step 5: Commit any fixes from manual testing**

```bash
git add -A
git commit -m "test: verification fixes for pillars + AI cover letter slice"
```

---

## Self-Review

**Spec coverage:** §2 two-layer architecture → Tasks 1–3, 7. §3 nav/registry/tool view → Tasks 5, 8. §4 state/persistence/no-XP → Task 4 + `dispatchTool` (Task 8). §5 `lib/ai/` (config/fill-prompt/prompts/sanitize/client) + Settings + badge → Tasks 1–3, 6, 8. §6 Cover Letter two layers + partial hardening + copy/download → Tasks 4, 7. §7 file tree → all files covered (every new file has a creating task; every modified file edited in Tasks 4/5/8). §8 testing matrix → Tasks 1–5 tests + Task 9 gates. §9 mobile offline contract → Task 9 Step 3. §10 build-time gates → Global Constraints + noted in `config.js`/`client.js` tasks. No uncovered spec requirement.

**Placeholder scan:** no TBD/TODO/"handle edge cases"; every code step shows full code; every test step shows assertions.

**Type consistency:** the return contract (`{ok,text,warning}` / `{ok:false,error:{type,status,message}}`) is identical across `client.js` (Task 3), its test, and `CoverLetterTool` (Task 7). `setCoverLetterField/AIResponse/clear` + `assembleCoverLetter` names match across Tasks 4, 5 (barrel), 7. `itemsForPillar`/`PILLARS`/`buildRegistry` match across Tasks 5, 8. `dispatchTool(updater)` signature matches the `dispatch` prop consumed in Task 7.

**Deviation from spec (intentional, noted):** the registry holds tool *metadata only*; React components are mapped to ids via `TOOL_COMPONENTS` in `Dashboard.js` rather than a `component` field on the registry entry (spec §3 example). This keeps `data/registry.js` importable under `node --test`. Behavior is identical.
