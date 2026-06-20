"use client";

import { useState } from "react";
import { getAIConfig, setAIConfig, AI_PRESETS } from "@/lib/ai/config";

export default function Settings({ onClose, onSaved }) {
  const [config, setConfig] = useState(() => getAIConfig());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const { apiKey, endpoint, model } = config;

  function handlePresetChange(e) {
    const preset = AI_PRESETS.find((p) => p.id === e.target.value);
    if (!preset) return;
    setConfig((prev) => ({
      ...prev,
      presetId: preset.id,
      ...(preset.endpoint ? { endpoint: preset.endpoint, model: preset.model } : {}),
    }));
  }

  function handleSave() {
    setAIConfig({ apiKey, endpoint, model, presetId: config.presetId ?? AI_PRESETS[0].id });
    setSaved(true);
    onSaved?.();
    // Keep Settings mounted briefly so the "Saved ✓" confirmation is visible.
    // Closing in the same flush as setSaved(true) unmounts before it can render.
    setTimeout(() => {
      setSaved(false);
      onClose?.();
    }, 1200);
  }

  function handleClearKey() {
    setConfig((prev) => ({ ...prev, apiKey: "" }));
    setAIConfig({ apiKey: "" });
    onSaved?.();
  }

  const selectedPresetId = config.presetId || AI_PRESETS[0].id;
  const selectedPreset = AI_PRESETS.find((p) => p.id === selectedPresetId) || AI_PRESETS[0];

  return (
    <div
      className="glass"
      style={{ padding: 28, maxWidth: 640, margin: "32px auto" }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-1)",
          marginBottom: 22,
          letterSpacing: "-0.01em",
        }}
      >
        AI Settings
      </div>

      {/* Provider preset */}
      <div style={{ marginBottom: 18 }}>
        <label
          className="section-label"
          style={{ display: "block", marginBottom: 7 }}
        >
          Provider
        </label>
        <select
          value={selectedPresetId}
          onChange={handlePresetChange}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-fill)",
            color: "var(--text-1)",
            fontSize: 14,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
          }}
        >
          {AI_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        {selectedPreset.note && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-3)",
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            {selectedPreset.note}
          </div>
        )}
      </div>

      {/* Endpoint URL */}
      <div style={{ marginBottom: 18 }}>
        <label
          className="section-label"
          style={{ display: "block", marginBottom: 7 }}
        >
          Endpoint URL
        </label>
        <input
          type="text"
          value={endpoint}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, endpoint: e.target.value }))
          }
          placeholder="https://..."
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-fill)",
            color: "var(--text-1)",
            fontSize: 14,
            fontFamily: "var(--font-body)",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Model */}
      <div style={{ marginBottom: 18 }}>
        <label
          className="section-label"
          style={{ display: "block", marginBottom: 7 }}
        >
          Model
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, model: e.target.value }))
          }
          placeholder="e.g. llama3, gpt-4o"
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-fill)",
            color: "var(--text-1)",
            fontSize: 14,
            fontFamily: "var(--font-body)",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* API key */}
      <div style={{ marginBottom: 24 }}>
        <label
          className="section-label"
          style={{ display: "block", marginBottom: 7 }}
        >
          API Key
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
            }
            placeholder="sk-..."
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-fill)",
              color: "var(--text-1)",
              fontSize: 14,
              fontFamily: "var(--font-body)",
            }}
          />
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setShowKey((v) => !v)}
            style={{ flexShrink: 0 }}
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Privacy notice */}
      <div
        style={{
          fontSize: 13,
          color: "var(--text-3)",
          lineHeight: 1.6,
          marginBottom: 14,
          padding: "12px 14px",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-fill)",
        }}
      >
        Your key is stored only in this browser and sent only to the endpoint
        you choose. If your provider blocks browser requests (CORS), use a local
        Ollama endpoint or a proxy you control.
      </div>

      {/* Anthropic warning */}
      <div
        style={{
          fontSize: 13,
          color: "var(--text-3)",
          lineHeight: 1.6,
          marginBottom: 22,
        }}
      >
        ⚠ To use Anthropic/Claude directly, verify the{" "}
        <code style={{ fontSize: 12 }}>
          anthropic-dangerous-direct-browser-access
        </code>{" "}
        header requirement before adding your key.
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn-primary" type="button" onClick={handleSave}>
          Save
        </button>
        {saved && (
          <span
            style={{
              alignSelf: "center",
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--green)",
            }}
          >
            Saved ✓
          </span>
        )}
        <button className="btn-ghost" type="button" onClick={handleClearKey}>
          Clear key
        </button>
        <button
          className="btn-ghost"
          type="button"
          onClick={onClose}
          style={{ marginLeft: "auto" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
