/**
 * test/ai.test.js
 * Coverage for lib/ai/config.js, lib/ai/fill-prompt.js,
 * lib/ai/sanitize.js, and lib/ai/client.js.
 *
 * Uses Node built-in test runner: `node --test test/ai.test.js`
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  fillPrompt,
  estimateTokens,
  applyTokenGuard,
} from "../lib/ai/fill-prompt.js";

import { sanitizeResponse } from "../lib/ai/sanitize.js";

import {
  getAIConfig,
  setAIConfig,
  hasAIKey,
  AI_PRESETS,
  DEFAULT_CONFIG,
} from "../lib/ai/config.js";

import { callLLM } from "../lib/ai/client.js";

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

function installStorage() {
  const m = new Map();
  globalThis.localStorage = {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

function clearStorage() {
  // Replace with a fresh empty store so state never bleeds between tests.
  installStorage();
}

// ─────────────────────────────────────────────────────────────────────────────
// fillPrompt
// ─────────────────────────────────────────────────────────────────────────────

describe("fillPrompt", () => {
  test("all slots filled -> no {{ tokens remain", () => {
    const result = fillPrompt("Hello {{name}}, welcome to {{place}}!", {
      name: "Alice",
      place: "COOP",
    });
    assert.ok(!result.includes("{{"), "output should contain no {{ tokens");
    assert.ok(!result.includes("}}"), "output should contain no }} tokens");
    assert.equal(result, "Hello Alice, welcome to COOP!");
  });

  test("missing slot key -> '[not provided]', never 'undefined'", () => {
    const result = fillPrompt("Hello {{name}}, goal: {{goal}}", { name: "Bob" });
    assert.ok(
      result.includes("[not provided]"),
      "missing key should render as [not provided]"
    );
    assert.ok(
      !result.includes("undefined"),
      "undefined must never appear in output"
    );
  });

  test("empty-string slot -> '[not provided]'", () => {
    const result = fillPrompt("Value: {{val}}", { val: "" });
    assert.equal(result, "Value: [not provided]");
  });

  test("whitespace-only slot -> '[not provided]'", () => {
    const result = fillPrompt("Value: {{val}}", { val: "   " });
    assert.equal(result, "Value: [not provided]");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// estimateTokens
// ─────────────────────────────────────────────────────────────────────────────

describe("estimateTokens", () => {
  test("estimateTokens('abcd') === 1", () => {
    assert.equal(estimateTokens("abcd"), 1);
  });

  test("known longer string matches Math.ceil(len/4)", () => {
    const s = "Hello, world! This is a test string for token estimation.";
    assert.equal(estimateTokens(s), Math.ceil(s.length / 4));
  });

  test("empty string -> 0", () => {
    assert.equal(estimateTokens(""), 0);
  });

  test("exactly divisible by 4 -> no ceiling needed", () => {
    // 8 chars / 4 = 2 exactly
    assert.equal(estimateTokens("abcdefgh"), 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyTokenGuard
// ─────────────────────────────────────────────────────────────────────────────

describe("applyTokenGuard", () => {
  test("under budget -> truncated:false and prompt unchanged", () => {
    const short = "This is a short prompt.";
    const result = applyTokenGuard(short, 600);
    assert.equal(result.truncated, false);
    assert.equal(result.prompt, short);
  });

  test("over budget -> truncated:true, prompt contains '[truncated for length]'", () => {
    // ~5000 chars guarantees we're well over 600 tokens (600*4 = 2400 chars)
    const big = "x".repeat(5000);
    const result = applyTokenGuard(big, 600);
    assert.equal(result.truncated, true);
    assert.ok(
      result.prompt.includes("[truncated for length]"),
      "result.prompt must contain [truncated for length]"
    );
  });

  test("over budget -> estimateTokens(result.prompt) <= 600", () => {
    const big = "word ".repeat(1500); // ~7500 chars
    const result = applyTokenGuard(big, 600);
    assert.ok(
      estimateTokens(result.prompt) <= 600,
      `token count ${estimateTokens(result.prompt)} should be <= 600`
    );
  });

  test("at exactly budget boundary -> not truncated", () => {
    // 2400 chars = exactly 600 tokens
    const exact = "a".repeat(2400);
    const result = applyTokenGuard(exact, 600);
    assert.equal(result.truncated, false);
    assert.equal(result.prompt, exact);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeResponse
// ─────────────────────────────────────────────────────────────────────────────

describe("sanitizeResponse", () => {
  test("script tag is removed, surrounding text is kept", () => {
    const result = sanitizeResponse("<script>alert(1)</script>hello");
    assert.ok(!result.includes("<script"), "no <script in output");
    assert.ok(result.includes("hello"), "non-script content preserved");
  });

  test("executable ```js fenced block -> '[code block removed]'", () => {
    const result = sanitizeResponse("x\n```js\nconsole.log(1)\n```\ny");
    assert.ok(
      result.includes("[code block removed]"),
      "js fence should become [code block removed]"
    );
    assert.ok(!result.includes("console.log"), "code body must be stripped");
  });

  test("```json fenced block -> kept intact (output still contains '```json')", () => {
    const input = 'Here:\n```json\n{"x":1}\n```\nDone.';
    const result = sanitizeResponse(input);
    assert.ok(
      result.includes("```json"),
      "json fence should be preserved"
    );
    assert.ok(result.includes('{"x":1}'), "json content should be preserved");
  });

  test("on-event attribute is removed from HTML element", () => {
    const result = sanitizeResponse('<a onclick="x()">link</a>');
    assert.ok(
      !result.includes("onclick"),
      "onclick attribute must be removed"
    );
    assert.ok(result.includes("link"), "element text content preserved");
  });

  test("control character (\\x01) is stripped", () => {
    const result = sanitizeResponse("a\x01b");
    assert.equal(result, "ab");
  });

  test("plain prose with newlines is preserved", () => {
    const prose = "First line.\nSecond line.\nThird line.";
    const result = sanitizeResponse(prose);
    assert.equal(result, prose);
  });

  test("null/undefined -> empty string", () => {
    assert.equal(sanitizeResponse(null), "");
    assert.equal(sanitizeResponse(undefined), "");
    assert.equal(sanitizeResponse(""), "");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// config (with injected globalThis.localStorage)
// ─────────────────────────────────────────────────────────────────────────────

describe("config", () => {
  beforeEach(() => clearStorage());

  test("empty storage -> getAIConfig() deep-matches DEFAULT_CONFIG", () => {
    const cfg = getAIConfig();
    assert.deepEqual(cfg, DEFAULT_CONFIG);
  });

  test("setAIConfig merges correctly: apiKey set, other keys remain default", () => {
    setAIConfig({ apiKey: "sk-test" });
    const cfg = getAIConfig();
    assert.equal(cfg.apiKey, "sk-test");
    assert.equal(cfg.endpoint, DEFAULT_CONFIG.endpoint);
    assert.equal(cfg.model, DEFAULT_CONFIG.model);
  });

  test("hasAIKey() false when storage is empty", () => {
    assert.equal(hasAIKey(), false);
  });

  test("hasAIKey() false when key is whitespace only", () => {
    setAIConfig({ apiKey: "   " });
    assert.equal(hasAIKey(), false);
  });

  test("hasAIKey() true after setting a real non-empty key", () => {
    setAIConfig({ apiKey: "sk-realkey" });
    assert.equal(hasAIKey(), true);
  });

  test("corrupt JSON in storage -> getAIConfig() falls back to DEFAULT_CONFIG without throwing", () => {
    globalThis.localStorage.setItem("coop_ai_v1", "{not json");
    let cfg;
    assert.doesNotThrow(() => {
      cfg = getAIConfig();
    });
    assert.deepEqual(cfg, DEFAULT_CONFIG);
  });

  test("AI_PRESETS ids are exactly ollama/openai/custom", () => {
    const ids = AI_PRESETS.map((p) => p.id);
    assert.deepEqual(ids, ["ollama", "openai", "custom"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// callLLM (inject fetchFn; install a localStorage as needed)
// ─────────────────────────────────────────────────────────────────────────────

describe("callLLM", () => {
  beforeEach(() => clearStorage());

  test("NO_KEY: empty key storage -> { ok:false, error:{ type:'NO_KEY' } } and fetchFn NOT called", async () => {
    let fetchCalled = false;
    const guardedFetch = () => {
      fetchCalled = true;
      throw new Error("fetch should not be called");
    };

    const result = await callLLM({ system: "sys", user: "hello" }, guardedFetch);
    assert.equal(result.ok, false);
    assert.equal(result.error.type, "NO_KEY");
    assert.equal(fetchCalled, false, "fetchFn must not be called when there is no key");
  });

  test("Success: valid key + ok response -> { ok:true, text:'Dear Team,' } with no warning", async () => {
    setAIConfig({
      apiKey: "sk-x",
      endpoint: "https://api.test/v1/chat/completions",
      model: "m",
    });

    const fakeFetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Dear Team," } }],
      }),
    });

    const result = await callLLM({ system: "sys", user: "help me" }, fakeFetch);
    assert.equal(result.ok, true);
    assert.equal(result.text, "Dear Team,");
    assert.equal(result.warning, undefined, "no warning expected on clean success");
  });

  test("NETWORK_ERROR: fetchFn throws -> { ok:false, error:{ type:'NETWORK_ERROR' } }", async () => {
    setAIConfig({
      apiKey: "sk-x",
      endpoint: "https://api.test/v1/chat/completions",
      model: "m",
    });

    const throwingFetch = async () => {
      throw new Error("network down");
    };

    const result = await callLLM({ system: "sys", user: "hello" }, throwingFetch);
    assert.equal(result.ok, false);
    assert.equal(result.error.type, "NETWORK_ERROR");
  });

  test("API_ERROR: fetchFn resolves { ok:false, status:401 } -> { ok:false, error:{ type:'API_ERROR', status:401, message:'bad key' } }", async () => {
    setAIConfig({
      apiKey: "sk-x",
      endpoint: "https://api.test/v1/chat/completions",
      model: "m",
    });

    const fakeFetch = async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "bad key" } }),
    });

    const result = await callLLM({ system: "sys", user: "hello" }, fakeFetch);
    assert.equal(result.ok, false);
    assert.equal(result.error.type, "API_ERROR");
    assert.equal(result.error.status, 401);
    assert.equal(result.error.message, "bad key");
  });

  test("TOKEN_LIMIT: very long user input -> { ok:true, text:..., warning:{ type:'TOKEN_LIMIT' } }", async () => {
    setAIConfig({
      apiKey: "sk-x",
      endpoint: "https://api.test/v1/chat/completions",
      model: "m",
    });

    // ~5000 chars so the token guard fires (>600 tokens)
    const longUser = "word ".repeat(1500);

    const fakeFetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Response text." } }],
      }),
    });

    const result = await callLLM({ system: "sys", user: longUser }, fakeFetch);
    assert.equal(result.ok, true);
    assert.equal(typeof result.text, "string");
    assert.ok(result.warning, "warning should be present");
    assert.equal(result.warning.type, "TOKEN_LIMIT");
  });
});
