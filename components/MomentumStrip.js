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
