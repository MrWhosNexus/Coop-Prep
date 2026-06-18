// lib/ai/client.js
// Single isolated LLM caller — the ONLY place the API key is read at call time
// and the ONLY place fetch happens. Key isolation is enforced: the key NEVER
// appears in logs, errors, or returned objects.

import { getAIConfig, hasAIKey } from './config.js';
import { applyTokenGuard } from './fill-prompt.js';
import { sanitizeResponse } from './sanitize.js';

/**
 * callLLM({ system, user }, fetchFn?) -> Promise<Result>
 *
 * Result shapes:
 *   Success:        { ok: true,  text: string }
 *   Success + warn: { ok: true,  text: string, warning: { type: 'TOKEN_LIMIT' } }
 *   No key:         { ok: false, error: { type: 'NO_KEY' } }
 *   Network fail:   { ok: false, error: { type: 'NETWORK_ERROR' } }
 *   API error:      { ok: false, error: { type: 'API_ERROR', status: number, message: string } }
 *
 * @param {{ system: string, user: string }} messages
 * @param {typeof fetch} [fetchFn] - injectable for tests; defaults to global fetch
 * @returns {Promise<Result>}
 */
export async function callLLM({ system, user }, fetchFn = fetch) {
  // Step 1: Guard against missing API key before touching fetch.
  if (!hasAIKey()) {
    return { ok: false, error: { type: 'NO_KEY' } };
  }

  // Step 2: Apply token guard to the user content.
  const { prompt: guardedUser, truncated } = applyTokenGuard(user);

  // Step 3: Read config (contains the key — never log or expose it).
  const { apiKey, endpoint, model } = getAIConfig();

  // Step 4: Build the request body.
  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: guardedUser },
    ],
    max_tokens: 500,
    temperature: 0.7,
  };

  // Step 5: Make the HTTP call — key stays in headers only, never in result.
  let response;
  try {
    response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Network-level failure (DNS, timeout, CORS, etc.). Do NOT include the
    // raw error — it could theoretically contain the key in a stack trace.
    return { ok: false, error: { type: 'NETWORK_ERROR' } };
  }

  // Step 6: Handle HTTP-level errors.
  if (!response.ok) {
    let message = '';
    try {
      const data = await response.json();
      // Safely extract a short message. Do NOT propagate the full object.
      const candidate = data?.error?.message;
      if (typeof candidate === 'string') {
        message = candidate;
      }
    } catch {
      // JSON parse failed — fall back to empty message.
    }
    return { ok: false, error: { type: 'API_ERROR', status: response.status, message } };
  }

  // Step 7: Parse the successful response defensively.
  let rawContent = '';
  try {
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
      rawContent = content;
    }
  } catch {
    // JSON parse failure on an ok response — treat as empty content, do not crash.
    rawContent = '';
  }

  // Step 8: Sanitize.
  const text = sanitizeResponse(rawContent);

  // Step 9: Return with or without TOKEN_LIMIT warning.
  if (truncated) {
    return { ok: true, text, warning: { type: 'TOKEN_LIMIT' } };
  }
  return { ok: true, text };
}
