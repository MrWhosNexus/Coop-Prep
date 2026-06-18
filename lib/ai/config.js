// lib/ai/config.js
// AI provider configuration — no side effects on import, no hardcoded secrets.

const KEY = "coop_ai_v1";

export const AI_PRESETS = [
  {
    id: "ollama",
    label: "Ollama (local)",
    endpoint: "http://localhost:11434/v1/chat/completions",
    model: "llama3",
    note: "Recommended: fully local, no CORS",
  },
  {
    id: "openai",
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
    note: "",
  },
  {
    id: "custom",
    label: "Custom endpoint",
    endpoint: "",
    model: "",
    note: "",
  },
];

export const DEFAULT_CONFIG = {
  apiKey: "",
  endpoint: AI_PRESETS[0].endpoint,
  model: AI_PRESETS[0].model,
};

/** Resolve the available storage object, or null when running in Node without a shim. */
function getStorage() {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  // Test environments may inject globalThis.localStorage without setting window.
  if (typeof globalThis !== "undefined" && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

/**
 * Read the stored AI config and merge it over DEFAULT_CONFIG.
 * Never throws — returns DEFAULT_CONFIG on any error or missing storage.
 */
export function getAIConfig() {
  const storage = getStorage();
  if (!storage) return { ...DEFAULT_CONFIG };
  try {
    const raw = storage.getItem(KEY);
    return raw
      ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
      : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Merge a partial config object into the current config and persist it.
 * No-op when storage is unavailable.
 */
export function setAIConfig(obj) {
  const storage = getStorage();
  if (!storage) return;
  try {
    const current = getAIConfig();
    storage.setItem(KEY, JSON.stringify({ ...current, ...obj }));
  } catch {}
}

/**
 * Returns true iff a non-empty API key is stored.
 */
export function hasAIKey() {
  return typeof getAIConfig().apiKey === "string" &&
    getAIConfig().apiKey.trim().length > 0;
}
