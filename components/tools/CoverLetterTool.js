"use client";

import { useState } from "react";
import { setCoverLetterField, setCoverLetterAIResponse, clearCoverLetterAIResponse, assembleCoverLetter, defaultCoverLetterState } from "@/lib/tools/coverLetter";
import { callLLM } from "@/lib/ai/client";
import { hasAIKey } from "@/lib/ai/config";
import { fillPrompt } from "@/lib/ai/fill-prompt";
import { PROMPTS } from "@/lib/ai/prompts";

/* ─── shared input style ─── */
const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-fill)",
  color: "var(--text-1)",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: ".06em",
  marginBottom: 6,
};

export default function CoverLetterTool({ state, dispatch, onOpenSettings }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cl = state.tools?.coverLetter ?? defaultCoverLetterState;
  const fields = cl.fields;
  const aiResponse = cl.aiResponse;

  /* ─── field change helper ─── */
  function handleField(key, value) {
    dispatch((s) => setCoverLetterField(s, key, value));
  }

  /* ─── AI flow ─── */
  async function handleEnhance() {
    if (!hasAIKey()) {
      onOpenSettings();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const filled = fillPrompt(PROMPTS.coverLetter.user, fields);
      const result = await callLLM({ system: PROMPTS.coverLetter.system, user: filled });
      if (result.ok) {
        dispatch((s) => setCoverLetterAIResponse(s, result.text, !!result.warning));
        setError("");
      } else if (result.error.type === "API_ERROR") {
        setError(`Provider error ${result.error.status}. Check your AI Settings.`);
      } else if (result.error.type === "NETWORK_ERROR") {
        setError("Couldn't reach the AI endpoint — your offline draft is shown below.");
      } else if (result.error.type === "NO_KEY") {
        onOpenSettings();
      }
    } finally {
      setLoading(false);
    }
  }

  /* ─── download helper ─── */
  function handleDownload(text) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const hasKey = hasAIKey();
  const output = aiResponse || assembleCoverLetter(fields);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 48px" }}>

      {/* ── 1. Heading ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-1)",
            marginBottom: 6,
          }}
        >
          Cover Letter Builder
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5 }}>
          Fill in the fields below to generate a polished draft — or enhance it with AI.
        </p>
      </div>

      {/* ── 2. Form ── */}
      <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
          {/* name */}
          <div>
            <label style={labelStyle}>Your Name</label>
            <input
              type="text"
              value={fields.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="Jane Smith"
              style={inputStyle}
            />
          </div>
          {/* role */}
          <div>
            <label style={labelStyle}>Target Role</label>
            <input
              type="text"
              value={fields.role}
              onChange={(e) => handleField("role", e.target.value)}
              placeholder="Investment Banking Analyst"
              style={inputStyle}
            />
          </div>
          {/* company */}
          <div>
            <label style={labelStyle}>Company</label>
            <input
              type="text"
              value={fields.company}
              onChange={(e) => handleField("company", e.target.value)}
              placeholder="Goldman Sachs"
              style={inputStyle}
            />
          </div>
        </div>

        {/* connection */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Personal Connection to Finance</label>
          <textarea
            value={fields.connection}
            onChange={(e) => handleField("connection", e.target.value)}
            placeholder="Describe what draws you to finance — a moment, experience, or long-standing interest (in your own words)."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {/* skill1 */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Skill Evidence 1</label>
          <textarea
            value={fields.skill1}
            onChange={(e) => handleField("skill1", e.target.value)}
            placeholder="e.g. financial modeling in Excel — built a 3-statement model for a local startup"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {/* skill2 */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>
            Skill Evidence 2{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11, color: "var(--text-3)" }}>
              (optional)
            </span>
          </label>
          <textarea
            value={fields.skill2}
            onChange={(e) => handleField("skill2", e.target.value)}
            placeholder="e.g. Python data analysis — automated a weekly reporting process, saving 4 hrs/week"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {/* cta */}
        <div>
          <label style={labelStyle}>Call to Action</label>
          <select
            value={fields.cta}
            onChange={(e) => handleField("cta", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="request interview">Request interview</option>
            <option value="express interest">Express interest</option>
            <option value="follow up">Follow up</option>
          </select>
        </div>
      </div>

      {/* ── 3. Actions ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            disabled={loading}
            onClick={hasKey ? handleEnhance : onOpenSettings}
            style={{ opacity: loading ? 0.65 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading
              ? "Enhancing…"
              : hasKey
              ? "Enhance with AI"
              : "Enhance with AI · Add key in Settings"}
          </button>

          {aiResponse && (
            <button
              className="btn-ghost"
              onClick={() => dispatch((s) => clearCoverLetterAIResponse(s))}
            >
              Revert to draft
            </button>
          )}
        </div>

        {error && (
          <p
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "var(--red)",
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* ── 4. Output ── */}
      <div className="glass" style={{ padding: 28 }}>
        {/* header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {aiResponse ? (
            <>
              <span className="section-label">AI-enhanced letter</span>
              <span className="badge badge-green">AI Enhanced</span>
            </>
          ) : (
            <span className="section-label">Your draft</span>
          )}
        </div>

        {/* token warning */}
        {cl.tokenWarning && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            Trimmed for length.
          </p>
        )}

        {/* letter body */}
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            margin: 0,
            lineHeight: 1.6,
            color: "var(--text-1)",
            fontSize: 14,
          }}
        >
          {output}
        </pre>

        {/* copy + download */}
        <div style={{ display: "flex", gap: 10, marginTop: 20, borderTop: "1px solid var(--glass-border)", paddingTop: 16 }}>
          <button
            className="btn-ghost"
            onClick={() => navigator.clipboard?.writeText(output)}
          >
            Copy
          </button>
          <button
            className="btn-ghost"
            onClick={() => handleDownload(output)}
          >
            Download .txt
          </button>
        </div>
      </div>
    </div>
  );
}
